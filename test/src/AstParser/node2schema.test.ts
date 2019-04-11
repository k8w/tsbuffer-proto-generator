import * as assert from 'assert';
import * as ts from "typescript";
import AstParser from '../../../src/AstParser';
import { CreateSource } from './GetSourceFile';
import InterfaceTypeSchema from 'tsbuffer-schema/src/schemas/InterfaceTypeSchema';

describe('AstParser.node2schema', function () {
    it('AnyType', function () {
        let src = CreateSource(`type Test = any;`);
        let nodes = AstParser.getFlattenNodes(src);
        let schema = AstParser.node2schema(nodes['Test'].node, {});
        assert.deepStrictEqual(schema, {
            type: 'Any'
        })
    });

    it('BufferType', function () {
        [
            'ArrayBuffer',
            'Int8Array',
            'Int16Array',
            'Int32Array',
            'BigInt64Array',
            'Uint8Array',
            'Uint16Array',
            'Uint32Array',
            'BigUint64Array',
            'Float32Array',
            'Float64Array',
        ].forEach(v => {
            let src = CreateSource(`type Test = ${v};`);
            let nodes = AstParser.getFlattenNodes(src);
            let schema = AstParser.node2schema(nodes['Test'].node, {});
            if (v === 'ArrayBuffer') {
                assert.deepStrictEqual(schema, {
                    type: 'Buffer'
                })
            }
            else {
                assert.deepStrictEqual(schema, {
                    type: 'Buffer',
                    arrayType: v
                })
            }
        })
    });

    it('BooleanType', function () {
        let src = CreateSource(`type Test = boolean;`);
        let nodes = AstParser.getFlattenNodes(src);
        let schema = AstParser.node2schema(nodes['Test'].node, {});
        assert.deepStrictEqual(schema, {
            type: 'Boolean'
        })
    });

    it('NonPrimitiveType', function () {
        let src = CreateSource(`type Test = object;`);
        let nodes = AstParser.getFlattenNodes(src);
        let schema = AstParser.node2schema(nodes['Test'].node, {});
        assert.deepStrictEqual(schema, {
            type: 'NonPrimitive'
        })
    });

    it('NumberType: number', function () {
        let src = CreateSource(`type Test = number;`);
        let nodes = AstParser.getFlattenNodes(src);
        let schema = AstParser.node2schema(nodes['Test'].node, {});
        assert.deepStrictEqual(schema, {
            type: 'Number'
        })
    })

    it('NumberType: ScalarValueType', function () {
        ['int8', 'int16', 'int32', 'int64', 'uint8', 'uint16', 'uint32', 'uint64', 'float32', 'float64'].forEach(v => {
            let src = CreateSource(`type Test = ${v};`);
            let nodes = AstParser.getFlattenNodes(src);
            let schema = AstParser.node2schema(nodes['Test'].node, {});
            assert.deepStrictEqual(schema, {
                type: 'Number',
                scalarType: v
            })
        })
    })

    it('StringType', function () {
        let src = CreateSource(`type Test = string;`);
        let nodes = AstParser.getFlattenNodes(src);
        let schema = AstParser.node2schema(nodes['Test'].node, {});
        assert.deepStrictEqual(schema, {
            type: 'String'
        })
    })

    it('ArrayType: string[]', function () {
        let src = CreateSource(`type Test = string[];`);
        let nodes = AstParser.getFlattenNodes(src);
        let schema = AstParser.node2schema(nodes['Test'].node, {});
        assert.deepStrictEqual(schema, {
            type: 'Array',
            elementType: {
                type: 'String'
            }
        })
    })

    it('ArrayType: Array<uint64>', function () {
        let src = CreateSource(`type Test = Array<uint64>;`);
        let nodes = AstParser.getFlattenNodes(src);
        let schema = AstParser.node2schema(nodes['Test'].node, {});
        assert.deepStrictEqual(schema, {
            type: 'Array',
            elementType: {
                type: 'Number',
                scalarType: 'uint64'
            }
        })
    })

    it('TupleType', function () {
        let src = CreateSource(`type Test = [number,  boolean[], Array<string[]>, [number, number]]`);
        assert.deepStrictEqual(AstParser.node2schema(
            AstParser.getFlattenNodes(src)['Test'].node, {}
        ), {
                type: 'Tuple',
                elementTypes: [
                    { type: 'Number' },
                    {
                        type: 'Array',
                        elementType: {
                            type: 'Boolean'
                        }
                    },
                    {
                        type: 'Array',
                        elementType: {
                            type: 'Array',
                            elementType: {
                                type: 'String'
                            }
                        }
                    },
                    {
                        type: 'Tuple',
                        elementTypes: [
                            { type: 'Number' },
                            { type: 'Number' }
                        ]
                    }
                ]
            })
    })

    it('LiteralType: String', function () {
        let src = CreateSource(`type Test = 'Hahaha';
        type Test1 = "haha111";`);
        let nodes = AstParser.getFlattenNodes(src);

        assert.deepStrictEqual(AstParser.node2schema(nodes['Test'].node, {}), {
            type: 'Literal',
            literal: 'Hahaha'
        })
        assert.deepStrictEqual(AstParser.node2schema(nodes['Test1'].node, {}), {
            type: 'Literal',
            literal: 'haha111'
        })
    })

    it('LiteralType: Number', function () {
        let src = CreateSource(`type Test = 123;
        type Test1 = 1.234;
        type Test2 = 1e23`);
        let nodes = AstParser.getFlattenNodes(src);

        assert.deepStrictEqual(AstParser.node2schema(nodes['Test'].node, {}), {
            type: 'Literal',
            literal: 123
        })
        assert.deepStrictEqual(AstParser.node2schema(nodes['Test1'].node, {}), {
            type: 'Literal',
            literal: 1.234
        })
        assert.deepStrictEqual(AstParser.node2schema(nodes['Test2'].node, {}), {
            type: 'Literal',
            literal: 1e23
        })
    })

    it('LiteralType: Boolean', function () {
        let src = CreateSource(`type Test = true;
        type Test1 = false;`);
        let nodes = AstParser.getFlattenNodes(src);

        assert.deepStrictEqual(AstParser.node2schema(nodes['Test'].node, {}), {
            type: 'Literal',
            literal: true
        })
        assert.deepStrictEqual(AstParser.node2schema(nodes['Test1'].node, {}), {
            type: 'Literal',
            literal: false
        })
    })

    it('LiteralType: null/undefined', function () {
        let src = CreateSource(`type Test = null;
        type Test1 = undefined;`);
        let nodes = AstParser.getFlattenNodes(src);

        assert.deepStrictEqual(AstParser.node2schema(nodes['Test'].node, {}), {
            type: 'Literal',
            literal: null
        })
        assert.deepStrictEqual(AstParser.node2schema(nodes['Test1'].node, {}), {
            type: 'Literal',
            literal: undefined
        })
    })

    it('EnumType', function () {
        let src = CreateSource(`
enum Test1 { a,b,c}
enum Test2 {a='AA',b='BB',c='CC'}
enum Test3 {a=1,b,c,d=100,e,f}
        `);
        let nodes = AstParser.getFlattenNodes(src);

        assert.deepStrictEqual(AstParser.node2schema(nodes['Test1'].node, {}), {
            type: 'Enum',
            members: [
                { id: 0, value: 0 },
                { id: 1, value: 1 },
                { id: 2, value: 2 },
            ]
        });
        assert.deepStrictEqual(AstParser.node2schema(nodes['Test2'].node, {}), {
            type: 'Enum',
            members: [
                { id: 0, value: 'AA' },
                { id: 1, value: 'BB' },
                { id: 2, value: 'CC' },
            ]
        });
        assert.deepStrictEqual(AstParser.node2schema(nodes['Test3'].node, {}), {
            type: 'Enum',
            members: [
                { id: 0, value: 1 },
                { id: 1, value: 2 },
                { id: 2, value: 3 },
                { id: 3, value: 100 },
                { id: 4, value: 101 },
                { id: 5, value: 102 },
            ]
        });
    })

    it('ReferenceType', function () {
        let src = CreateSource(`
        import A, {B, C as D} from 'abcd';
        import { E } from './eee';
        type TestA = A;
        type TestAA = A.A;
        type TestB = B;
        type TestD = D;
        type TestDD = D.D;
        type Inside = TestA;
        type Inside2 = TestA.TestB;
        `);
        let imports = AstParser.getScriptImports(src);
        let nodes = AstParser.getFlattenNodes(src);

        assert.deepStrictEqual(AstParser.node2schema(nodes['TestA'].node, imports), {
            type: 'Reference',
            path: 'abcd',
            targetName: 'default'
        });
        assert.deepStrictEqual(AstParser.node2schema(nodes['TestAA'].node, imports), {
            type: 'Reference',
            path: 'abcd',
            targetName: 'default.A'
        });
        assert.deepStrictEqual(AstParser.node2schema(nodes['TestB'].node, imports), {
            type: 'Reference',
            path: 'abcd',
            targetName: 'B'
        });
        assert.deepStrictEqual(AstParser.node2schema(nodes['TestD'].node, imports), {
            type: 'Reference',
            path: 'abcd',
            targetName: 'C'
        });
        assert.deepStrictEqual(AstParser.node2schema(nodes['TestDD'].node, imports), {
            type: 'Reference',
            path: 'abcd',
            targetName: 'C.D'
        });
        assert.deepStrictEqual(AstParser.node2schema(nodes['Inside'].node, imports), {
            type: 'Reference',
            targetName: 'TestA'
        });
        assert.deepStrictEqual(AstParser.node2schema(nodes['Inside2'].node, imports), {
            type: 'Reference',
            targetName: 'TestA.TestB'
        });
    })

    it('InterfaceType: interface', function () {
        let src = CreateSource(`
        import Ptl, {Req,FuckReq} from 'proto';

        export interface XXPtl extends Ptl {

        }

        interface BaseReq extends Req, FuckReq{
            url: string
        }

        export interface XXReq extends BaseReq{
            a: string,
            b?: number,
            c: {
                c1: {value: string}[],
                c2: [number, boolean]
            }
        }

        interface Empty{};

        type Empty2 = {};
        `);
        let imports = AstParser.getScriptImports(src);
        let nodes = AstParser.getFlattenNodes(src);

        assert.deepStrictEqual(AstParser.node2schema(nodes['XXPtl'].node, imports), {
            type: 'Interface',
            extends: [{
                type: 'Reference',
                path: 'proto',
                targetName: 'default'
            }]
        });

        assert.deepStrictEqual(AstParser.node2schema(nodes['BaseReq'].node, imports), {
            type: 'Interface',
            extends: [{
                type: 'Reference',
                path: 'proto',
                targetName: 'Req'
            },
            {
                type: 'Reference',
                path: 'proto',
                targetName: 'FuckReq'
            }],
            properties: [{
                id: 0,
                name: 'url',
                type: {
                    type: 'String'
                }
            }]
        });

        assert.deepStrictEqual(AstParser.node2schema(nodes['XXReq'].node, imports), {
            type: 'Interface',
            extends: [{
                type: 'Reference',
                targetName: 'BaseReq'
            }],
            properties: [{
                id: 0,
                name: 'a',
                type: {
                    type: 'String'
                }
            }, {
                id: 1,
                name: 'b',
                optional: true,
                type: {
                    type: 'Number'
                }
            }, {
                id: 2,
                name: 'c',
                type: {
                    type: 'Interface',
                    properties: [{
                        id: 0,
                        name: 'c1',
                        type: {
                            type: 'Array',
                            elementType: {
                                type: 'Interface',
                                properties: [{
                                    id: 0,
                                    name: 'value',
                                    type: {
                                        type: 'String'
                                    }
                                }]
                            }
                        }
                    }, {
                        id: 1,
                        name: 'c2',
                        type: {
                            type: 'Tuple',
                            elementTypes: [{
                                type: 'Number'
                            }, {
                                type: 'Boolean'
                            }]
                        }
                    }]
                }
            }]
        });

        assert.deepStrictEqual(AstParser.node2schema(nodes['Empty'].node, imports), {
            type: 'Interface'
        });

        assert.deepStrictEqual(AstParser.node2schema(nodes['Empty2'].node, imports), {
            type: 'Interface'
        });
    })

    it('InterfaceType: TypeLiteral', function () {
        let src = CreateSource(`
        type Test = {
            a: string,
            b?: {
                value: string
            }
        };
        `);
        let imports = AstParser.getScriptImports(src);
        let nodes = AstParser.getFlattenNodes(src);

        assert.deepStrictEqual(AstParser.node2schema(nodes['Test'].node, imports), {
            type: 'Interface',
            properties: [{
                id: 0,
                name: 'a',
                type: {
                    type: 'String'
                }
            }, {
                id: 1,
                name: 'b',
                optional: true,
                type: {
                    type: 'Interface',
                    properties: [{
                        id: 0,
                        name: 'value',
                        type: {
                            type: 'String'
                        }
                    }]
                }
            }]
        });
    })

    it('Interface: IndexSignature', function () {
        let src = CreateSource(`
        type Test = {
            [key: string]: number;
        }

        interface Test2 {
            a: {valueA: string},
            b?: {valueB: string},
            [key: string]: {valueA?: string, valueB?: string}
        }
        `);
        let imports = AstParser.getScriptImports(src);
        let nodes = AstParser.getFlattenNodes(src);

        assert.deepStrictEqual(AstParser.node2schema(nodes['Test'].node, imports), <InterfaceTypeSchema>{
            type: 'Interface',
            indexSignature: {
                keyType: 'String',
                type: {
                    type: 'Number'
                }
            }
        });

        assert.deepStrictEqual(AstParser.node2schema(nodes['Test2'].node, imports), <InterfaceTypeSchema>{
            type: 'Interface',
            properties: [{
                id: 0,
                name: 'a',
                type: {
                    type: 'Interface',
                    properties: [{
                        id: 0,
                        name: 'valueA',
                        type: {
                            type: 'String'
                        }
                    }]
                }
            }, {
                id: 1,
                name: 'b',
                optional: true,
                type: {
                    type: 'Interface',
                    properties: [{
                        id: 0,
                        name: 'valueB',
                        type: {
                            type: 'String'
                        }
                    }]
                }
            }],
            indexSignature: {
                keyType: 'String',
                type: {
                    type: 'Interface',
                    properties: [{
                        id: 0,
                        name: 'valueA',
                        optional: true,
                        type: {
                            type: 'String'
                        }
                    }, {
                        id: 1,
                        name: 'valueB',
                        optional: true,
                        type: {
                            type: 'String'
                        }
                    }]
                }
            }
        });
    });
})