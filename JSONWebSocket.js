const WebSocket = require('ws');
const EventEmitter = require('events');
const { encode, decode } = require('./encoding');

class JSONWebSocket extends EventEmitter {
    constructor(url) {
        super();

        const ws = new WebSocket(url);
        this.ws = ws;
        ws.on('message', this.onMessage.bind(this));
        ['open', 'close', 'error'].forEach((eventName) => {
            ws.on(eventName, (...args) => this.emit(eventName, ...args));
        });
    }

    // Event related
    onMessage(data) {
        if (data instanceof Buffer) this.onBuffer(data);
        else if (data instanceof Array) {
            data.filter(el => el instanceof Buffer)
                .forEach(this.onBuffer.bind(this));
        }
    }

    onBuffer(buf) {
        decode(buf).forEach((str) => {
            try {
                this.emit('message', JSON.parse(str));
            } catch (e) {
                this.emit('non-json', str);
            }
        });
    }

    // Sending
    sendStr(str, ...args) {
        this.ws.send(encode(str), ...args);
    }

    sendJSON(obj, ...args) {
        this.sendStr(JSON.stringify(obj), ...args);
    }
}

module.exports = JSONWebSocket;