import * as assert from 'assert';
import SchemaGenerator from '../../../src/SchemaGenerator';

describe('SchemaGenerator.genValueUidMap', function () {
    it('non compatible', function () {
        let result = SchemaGenerator.genValueUidMap(['d', 'e', 'f', 'a', 'b', 'c']);
        assert.deepStrictEqual(result, {
            d: 0,
            e: 1,
            f: 2,
            a: 3,
            b: 4,
            c: 5
        })
    })

    it('compatible', function () {
        let result = SchemaGenerator.genValueUidMap(['d', 'e', 'f', 'a', 'b', 'c', 'h', 'i', 'j'], {
            d: 1,
            a: 4,
            b: 5
        });
        assert.deepStrictEqual(result, {
            d: 1,
            e: 0,
            f: 2,
            a: 4,
            b: 5,
            c: 3,
            h: 6,
            i: 7,
            j: 8
        })
    })
})