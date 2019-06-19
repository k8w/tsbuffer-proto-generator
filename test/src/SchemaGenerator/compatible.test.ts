import * as assert from 'assert';
import { SchemaGenerator } from '../../../src/SchemaGenerator';
import * as path from "path";
import { InterfaceTypeSchema } from 'tsbuffer-schema/src/schemas/InterfaceTypeSchema';
import { EnumTypeSchema } from 'tsbuffer-schema/src/schemas/EnumTypeSchema';
import { IntersectionTypeSchema } from 'tsbuffer-schema/src/schemas/IntersectionTypeSchema';
import { UnionTypeSchema } from 'tsbuffer-schema/src/schemas/UnionTypeSchema';
import { TSBufferProto } from 'tsbuffer-schema';

describe('SchemaGenerator.compatible', function () {
    it('simple enum', async function () {
        let generator = new SchemaGenerator({
            baseDir: path.resolve(__dirname, 'sources')
        });

        let cp: TSBufferProto = {
            "SimpleEnum/TestEnum": {
                "type": "Enum",
                "members": [
                    {
                        "id": 2,
                        "value": '1'
                    },
                    {
                        "id": 50,
                        "value": '100'
                    }
                ]
            }
        };

        let schemas = await generator.generate('SimpleEnum.ts', {
            compatibleResult: cp
        });

        let sc = schemas['SimpleEnum/TestEnum'] as EnumTypeSchema;
        assert.deepStrictEqual(sc.members.map(v => [v.value, v.id]), [
            [0, 0],
            [1, 2],
            [2, 1],
            [100, 50],
            [101, 3],
            [102, 4],
            ['GGG', 5],
            ['HHH', 6]
        ]);
    })

    it('interface add/del fields', async function () {
        let result1 = (await new SchemaGenerator({
            baseDir: path.resolve(__dirname, 'sources/encId1')
        }).generate('EncodeId.ts'));

        let result2 = await new SchemaGenerator({
            baseDir: path.resolve(__dirname, 'sources/encId2')
        }).generate('EncodeId.ts', {
            compatibleResult: result1
        });

        assert.strictEqual(result1['EncodeId/Test1'].type, 'Interface');

        let if1 = result1['EncodeId/Test1'] as InterfaceTypeSchema;
        assert.deepStrictEqual(if1.properties!.map(v => [v.name, v.id]), [
            ['f0', 0],
            ['f1', 1],
            ['f2', 2]
        ])

        let if2 = result2['EncodeId/Test1'] as InterfaceTypeSchema;
        assert.deepStrictEqual(if2.properties!.map(v => [v.name, v.id]), [
            ['f0', 0],
            // ['f1', 1],
            ['f2', 2],
            ['f3', 3],
            ['f4', 4],
            ['f5', 5]
        ])

        let result3 = await new SchemaGenerator({
            baseDir: path.resolve(__dirname, 'sources/encId2')
        }).generate('EncodeId.ts');
        let if3 = result3['EncodeId/Test1'] as InterfaceTypeSchema;
        assert.deepStrictEqual(if3.properties!.map(v => [v.name, v.id]), [
            ['f0', 0],
            ['f2', 1],
            ['f3', 2],
            ['f4', 3],
            ['f5', 4]
        ])
    })

    it('interface nest add/del', async function () {
        let result1 = (await new SchemaGenerator({
            baseDir: path.resolve(__dirname, 'sources/encId2')
        }).generate('EncodeId.ts'));
        let if1 = (result1['EncodeId/Test1'] as InterfaceTypeSchema).properties!.find(v => v.name === 'f3')!.type as InterfaceTypeSchema;

        let result2 = await new SchemaGenerator({
            baseDir: path.resolve(__dirname, 'sources/encId3')
        }).generate('EncodeId.ts', {
            compatibleResult: result1
        });
        let if2 = (result2['EncodeId/Test1'] as InterfaceTypeSchema).properties!.find(v => v.name === 'f3')!.type as InterfaceTypeSchema;

        assert.deepStrictEqual(if1.properties!.map(v => [v.name, v.id]), [
            ['f30', 0],
            ['f31', 1],
            ['f32', 2]
        ])

        assert.deepStrictEqual(if2.properties!.map(v => [v.name, v.id]), [
            ['f30', 0],
            ['f32', 2],
            ['f33', 3]
        ])
    })

    it('interface change extends', async function () {
        let result1 = (await new SchemaGenerator({
            baseDir: path.resolve(__dirname, 'sources/encId1')
        }).generate('EncodeId.ts'));

        let result2 = (await new SchemaGenerator({
            baseDir: path.resolve(__dirname, 'sources/encId2')
        }).generate('EncodeId.ts', {
            compatibleResult: result1
        }));

        let result3 = (await new SchemaGenerator({
            baseDir: path.resolve(__dirname, 'sources/encId3')
        }).generate('EncodeId.ts', {
            compatibleResult: result1
        }));

        let e1 = (result1['EncodeId/Extend1'] as InterfaceTypeSchema).extends!;
        let e2 = (result2['EncodeId/Extend1'] as InterfaceTypeSchema).extends!;
        let e3 = (result3['EncodeId/Extend1'] as InterfaceTypeSchema).extends!;

        assert.deepStrictEqual(e1, [
            {
                id: 0,
                type: {
                    type: 'Reference',
                    target: 'EncodeId/EA'
                }
            },
            {
                id: 1,
                type: {
                    type: 'Reference',
                    target: 'EncodeId/EB'
                }
            }
        ])

        assert.deepStrictEqual(e2, [
            {
                id: 1,
                type: {
                    type: 'Reference',
                    target: 'EncodeId/EB'
                }
            },
            {
                id: 0,
                type: {
                    type: 'Reference',
                    target: 'EncodeId/EA'
                }
            }
        ]);

        assert.deepStrictEqual(e3, [
            {
                id: 2,
                type: {
                    type: 'Reference',
                    target: 'ext/EB'
                }
            },
            {
                id: 3,
                type: {
                    type: 'Reference',
                    target: 'EncodeId/EC'
                }
            },
            {
                id: 0,
                type: {
                    type: 'Reference',
                    target: 'EncodeId/EA'
                }
            }
        ])
    })

    it('Intersection add/del', async function () {
        let result1 = (await new SchemaGenerator({
            baseDir: path.resolve(__dirname, 'sources/encId2')
        }).generate('EncodeId.ts'));
        let is1 = (result1['EncodeId/Test1'] as InterfaceTypeSchema).properties!.find(v => v.name === 'f5')!.type as IntersectionTypeSchema;

        let result2 = await new SchemaGenerator({
            baseDir: path.resolve(__dirname, 'sources/encId3')
        }).generate('EncodeId.ts', {
            compatibleResult: result1
        });
        let is2 = (result2['EncodeId/Test1'] as InterfaceTypeSchema).properties!.find(v => v.name === 'f5')!.type as IntersectionTypeSchema;

        assert.deepStrictEqual(is1.members.map(v => v.id), [0, 1, 0]);

        assert.deepStrictEqual(is2.members.map(v => v.id), [2, 1]);
    });

    it('Union add/del', async function () {
        let result1 = (await new SchemaGenerator({
            baseDir: path.resolve(__dirname, 'sources/encId2')
        }).generate('EncodeId.ts'));
        let is1 = (result1['EncodeId/Test1'] as InterfaceTypeSchema).properties!.find(v => v.name === 'f4')!.type as UnionTypeSchema;

        let result2 = await new SchemaGenerator({
            baseDir: path.resolve(__dirname, 'sources/encId3')
        }).generate('EncodeId.ts', {
            compatibleResult: result1
        });
        let is2 = (result2['EncodeId/Test1'] as InterfaceTypeSchema).properties!.find(v => v.name === 'f4')!.type as UnionTypeSchema;

        assert.deepStrictEqual(is1.members.map(v => v.id), [0, 1, 0]);

        assert.deepStrictEqual(is2.members.map(v => v.id), [1, 2]);
    });
})