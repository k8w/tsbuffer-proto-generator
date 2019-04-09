import * as assert from 'assert';
import AstParser from '../../../src/AstParser';
import GetSourceFile from './GetSourceFile';

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
})