import * as assert from 'assert';
import * as ts from "typescript";
import AstParser from '../../../src/AstParser';

describe('AstParser.node2schema', function () {
    it('BooleanType', function () {
        let src = ts.createSourceFile(
            'xxx.ts',
            `type Test = boolean;`,
            ts.ScriptTarget.ES3,
            true,
            ts.ScriptKind.TS
        );

        let nodes = AstParser.getFlattenNodes(src);
        let schema = AstParser.node2schema(nodes['Test'].node, {});
        assert.deepStrictEqual(schema, {
            type: 'Boolean'
        })
    });

    it('NumberType', function () {
        let src = ts.createSourceFile(
            'xxx.ts',
            `type Test = number;`,
            ts.ScriptTarget.ES3,
            true,
            ts.ScriptKind.TS
        );

        let nodes = AstParser.getFlattenNodes(src);
        let schema = AstParser.node2schema(nodes['Test'].node, {});
        assert.deepStrictEqual(schema, {
            type: 'Number'
        })
    })

    it('NumberType: ScalarValueType', function () {
        ['int8', 'int16', 'int32', 'int64', 'uint8', 'uint16', 'uint32', 'uint64', 'float32', 'float64'].forEach(v => {
            let src = ts.createSourceFile(
                'xxx.ts',
                `type Test = ${v};`,
                ts.ScriptTarget.ES3,
                true,
                ts.ScriptKind.TS
            );

            let nodes = AstParser.getFlattenNodes(src);
            let schema = AstParser.node2schema(nodes['Test'].node, {});
            assert.deepStrictEqual(schema, {
                type: 'Number',
                scalarType: v
            })
        })
    })
})