import * as assert from 'assert';
import AstParser from '../../../src/AstParser';
import GetSourceFile from './GetSourceFile';
import * as ts from "typescript";
import { isExport } from '../../../src/AstParser';

describe('AstParser.getFlattenNodes', function () {
    it('normal', function () {
        let res = AstParser.getFlattenNodes(GetSourceFile('normal.ts'), true);
        assert.deepStrictEqual(Object.entries(res).map(v => ({
            name: v[0],
            isExport: v[1].isExport
        })), [
                {
                    name: 'Test1',
                    isExport: true
                },
                {
                    name: 'Test2',
                    isExport: false
                },
                {
                    name: 'Test3',
                    isExport: true
                },
                {
                    name: 'Test4',
                    isExport: false
                },
                {
                    name: 'default',
                    isExport: true
                }
            ]);
    })

    it('normal top non export', function () {
        let res = AstParser.getFlattenNodes(GetSourceFile('normal.ts'), false);
        assert.deepStrictEqual(Object.entries(res).map(v => ({
            name: v[0],
            isExport: v[1].isExport
        })), [
                {
                    name: 'Test1',
                    isExport: false
                },
                {
                    name: 'Test2',
                    isExport: false
                },
                {
                    name: 'Test3',
                    isExport: false
                },
                {
                    name: 'Test4',
                    isExport: false
                },
            ]);
    })

    it('export default', function () {
        let src = ts.createSourceFile(
            'xxx.ts',
            `
interface TestName {}
export default TestName;
            `,
            ts.ScriptTarget.ES3,
            true,
            ts.ScriptKind.TS
        );

        let res = AstParser.getFlattenNodes(src, true);
        assert.deepStrictEqual(Object.entries(res).map(v => ({
            name: v[0],
            isExport: v[1].isExport
        })), [
                {
                    name: 'TestName',
                    isExport: false
                },
                {
                    name: 'default',
                    isExport: true
                }
            ])
    })

        it('export { XXX }', function () {
            let src = ts.createSourceFile(
                'xxx.ts',
                `
    interface TestName {}
    export { TestName };
                `,
                ts.ScriptTarget.ES3,
                true,
                ts.ScriptKind.TS
            );

            let res = AstParser.getFlattenNodes(src, true);
            assert.deepStrictEqual(Object.entries(res).map(v => ({
                name: v[0],
                isExport: v[1].isExport
            })), [
                    {
                        name: 'TestName',
                        isExport: true
                    }
                ])
        })

        it('export { A as B }', function () {
            let src = ts.createSourceFile(
                'xxx.ts',
                `
    interface TestName {}
    export { TestName as FuckU };
                `,
                ts.ScriptTarget.ES3,
                true,
                ts.ScriptKind.TS
            );

            let res = AstParser.getFlattenNodes(src, true);
            assert.deepStrictEqual(Object.entries(res).map(v => ({
                name: v[0],
                isExport: v[1].isExport
            })), [
                    {
                        name: 'TestName',
                        isExport: false
                    },
                    {
                        name: 'FuckU',
                        isExport: true
                    }
                ])
        })
})