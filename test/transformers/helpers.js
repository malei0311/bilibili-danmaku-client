const { describe, it } = require('mocha');
const assert = require('assert');
const { toString, isObject } = require('lodash');

const compile = require('../../src/transformers/compile');
const { asFlag, on, onExist, convertNames, spread, spreadObj } = require('../../src/transformers/helpers');

describe('helpers', () => {
    describe('#asFlag()', () => {
        it('should return true on true', () => {
            assert.equal(asFlag(true), true);
        });
        it('should return false on false', () => {
            assert.equal(asFlag(false), false);
        });
        it('should return true on 1', () => {
            assert.equal(asFlag(1), true);
        });
        it('should return false on 0', () => {
            assert.equal(asFlag(0), false);
        });
    });

    describe('#on()', () => {
        it('should compile source on element of object', () => {
            const fn = compile(on(o => o.foo, {
                bar: f => f.bar,
                baz: f => f.baz,
            }));
            const obj = {
                foo: {
                    bar: 1,
                    baz: 2,
                },
            };
            const result = {
                bar: 1,
                baz: 2,
            };
            assert.deepStrictEqual(fn(obj), result);
        });
        it('should compile source on element of array', () => {
            const fn = compile(on(a => a[0], [a => a[1], a => a[0]]));
            const arr = [[1, 2], 3];
            const result = [2, 1];
            assert.deepStrictEqual(fn(arr), result);
        });
    });

    describe('#onExist()', () => {
        const fn = compile({
            data: onExist(o => o.arr, {
                first: arr => arr[0],
                second: arr => arr[1],
            }),
        });
        it('should return null when not exist', () => {
            const obj = {
                data: 1,
            };
            const result = {
                data: null,
            };
            assert.deepStrictEqual(fn(obj), result);
        });
        it('should run compiled when exist', () => {
            const obj = {
                arr: [1, 2],
            };
            const result = {
                data: {
                    first: 1,
                    second: 2,
                },
            };
            assert.deepStrictEqual(fn(obj), result);
        });
    });

    describe('#convertNames()', () => {
        it('should accept strings', () => {
            const source = ['foo', 'bar'];
            const converted = convertNames(...source);
            const obj = { qux: 123 };
            converted.forEach(({ name, mapVal }, index) => {
                assert.equal(name, source[index]);
                assert.equal(mapVal(obj), obj);
            });
        });
        it('should accept functions', () => {
            const source = [['foo', parseInt, '123', 123], ['bar', toString, 456, '456']];
            const converted = convertNames(...source);
            converted.filter(isObject).forEach(({ name, mapVal } = {}, index) => {
                const [sName,, sTest, sResult] = source[index];
                assert.equal(name, sName);
                assert.equal(mapVal(sTest), sResult);
            });
        });
        it('should ignore non-string primitives', () => {
            assert.deepStrictEqual(
                convertNames(1, 0.1, true, undefined, null),
                [null, null, null, null, null],
            );
        });
        it('should ignore invalid arrays', () => {
            assert.deepStrictEqual(
                convertNames([], ['foo', 'bar'], ['foo', {}], ['foo', 1]),
                [null, null, null, null],
            );
        });
    });

    describe('#spread()', () => {
        it('should accept strings', () => {
            const fn = compile(spread('foo', 'bar'));
            const arr = [1, 2];
            const result = { foo: 1, bar: 2 };
            assert.deepStrictEqual(fn(arr), result);
        });
        it('should accept functions', () => {
            const fn = compile(spread(['foo', parseInt], ['bar', parseInt]));
            const arr = ['1', '2'];
            const result = { foo: 1, bar: 2 };
            assert.deepStrictEqual(fn(arr), result);
        });
        it('should skip other things', () => {
            const fn = compile(spread(
                'foo', // okay
                1, // skipped
                undefined, // skipped
                parseInt, // skipped
                ['bar'], // invalid array, skipped
                ['bar', parseInt], // okay
            ));
            const arr = ['1', '2', '3', '4', '5', '6'];
            const result = { foo: '1', bar: 6 };
            assert.deepStrictEqual(fn(arr), result);
        });
    });

    describe('#spreadObj()', () => {
        it('should accept strings', () => {
            const fn = compile(spreadObj('foo', 'bar'));
            const obj = { foo: 1, bar: 2 };
            const result = { foo: 1, bar: 2 };
            assert.deepStrictEqual(fn(obj), result);
        });
        it('should accept functions', () => {
            const fn = compile(spreadObj(['foo', parseInt], ['bar', parseInt]));
            const obj = { foo: '1', bar: '2' };
            const result = { foo: 1, bar: 2 };
            assert.deepStrictEqual(fn(obj), result);
        });
    });
});