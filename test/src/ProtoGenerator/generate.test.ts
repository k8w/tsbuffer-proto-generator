import * as assert from 'assert';
import * as path from "path";
import { ProtoGenerator } from '../../../src/ProtoGenerator';

describe('ProtoGenerator.generate', function () {
    it('specific filter', async function () {
        let generator = new ProtoGenerator({
            baseDir: path.resolve(__dirname)
        });

        let schemas = await generator.generate('sources/Student.ts');
        process.chdir(path.resolve(__dirname, '../../'));
        let schemas2 = await generator.generate('sources/Student.ts');

        // 无关pwd的事
        assert.deepStrictEqual(JSON.stringify(schemas, null, 2), JSON.stringify(schemas2, null, 2));

        let rightAnswer = {
            "sources/Student/default": {
                "type": "Reference",
                "target": "sources/Student/Student"
            },
            "sources/Student/Student": {
                "type": "Interface",
                "properties": [
                    {
                        "id": 0,
                        "name": "name",
                        "type": {
                            "type": "String"
                        }
                    },
                    {
                        "id": 1,
                        "name": "age",
                        "type": {
                            "type": "Number"
                        }
                    },
                    {
                        "id": 2,
                        "name": "class",
                        "type": {
                            "type": "Array",
                            "elementType": {
                                "type": "String"
                            }
                        }
                    },
                    {
                        "id": 3,
                        "name": "sex",
                        "type": {
                            "type": "IndexedAccess",
                            "index": "sex",
                            "objectType": {
                                "type": "Reference",
                                "target": "sources/NSPerson/default.Person"
                            }
                        }
                    }
                ]
            },
            "sources/Student/Unused1": {
                "type": "Interface",
                "properties": [
                    {
                        "id": 0,
                        "name": "value",
                        "type": {
                            "type": "String"
                        }
                    }
                ]
            },
            "sources/NSPerson/default.Person": {
                "type": "Reference",
                "target": "sources/NSPerson/NSPerson.Person"
            },
            "sources/NSPerson/NSPerson.Person": {
                "type": "Union",
                "members": [
                    {
                        "id": 0,
                        "type": {
                            "type": "Reference",
                            "target": "sources/NSPerson/NSPerson.Male"
                        }
                    },
                    {
                        "id": 1,
                        "type": {
                            "type": "Reference",
                            "target": "sources/NSPerson/NSPerson.Female"
                        }
                    }
                ]
            },
            "sources/NSPerson/NSPerson.Male": {
                "type": "Interface",
                "extends": [
                    {
                        id: 0,
                        type: {
                            "type": "Reference",
                            "target": "sources/Animal/default"
                        }
                    }
                ],
                "properties": [
                    {
                        "id": 0,
                        "name": "maleXXX",
                        "type": {
                            "type": "Interface",
                            "properties": [
                                {
                                    "id": 0,
                                    "name": "value",
                                    "type": {
                                        "type": "String"
                                    }
                                }
                            ]
                        }
                    },
                    {
                        "id": 1,
                        "name": "sex",
                        "type": {
                            "type": "Literal",
                            "literal": "m"
                        }
                    }
                ]
            },
            "sources/NSPerson/NSPerson.Female": {
                "type": "Interface",
                "extends": [
                    {
                        id: 0,
                        type: {
                            "type": "Reference",
                            "target": "sources/Animal/default"
                        }
                    }
                ],
                "properties": [
                    {
                        "id": 0,
                        "name": "femaleXXX",
                        "type": {
                            "type": "Interface",
                            "properties": [
                                {
                                    "id": 0,
                                    "name": "value",
                                    "type": {
                                        "type": "String"
                                    }
                                }
                            ]
                        }
                    },
                    {
                        "id": 1,
                        "name": "sex",
                        "type": {
                            "type": "Literal",
                            "literal": "f"
                        }
                    }
                ]
            },
            "sources/Animal/default": {
                "type": "Reference",
                "target": "sources/Animal/Animal"
            },
            "sources/Animal/Animal": {
                "type": "Interface",
                "properties": [
                    {
                        "id": 0,
                        "name": "name",
                        "type": {
                            "type": "String"
                        }
                    },
                    {
                        "id": 1,
                        "name": "age",
                        "type": {
                            "type": "Number"
                        },
                        "optional": true
                    }
                ]
            }
        };

        assert.deepStrictEqual(schemas, rightAnswer)
    })

    it('dts', async function () {
        let generator = new ProtoGenerator({
            baseDir: path.resolve(__dirname)
        });

        let schemas = await generator.generate('sources/Student.d.ts');
        process.chdir(path.resolve(__dirname, '../../'));
        let schemas2 = await generator.generate('sources/Student.d.ts');

        // 无关pwd的事
        assert.deepStrictEqual(JSON.stringify(schemas, null, 2), JSON.stringify(schemas2, null, 2));

        let rightAnswer = {
            "sources/Student/default": {
                "type": "Reference",
                "target": "sources/Student/Student"
            },
            "sources/Student/Student": {
                "type": "Interface",
                "properties": [
                    {
                        "id": 0,
                        "name": "name",
                        "type": {
                            "type": "String"
                        }
                    },
                    {
                        "id": 1,
                        "name": "age",
                        "type": {
                            "type": "Number"
                        }
                    },
                    {
                        "id": 2,
                        "name": "class",
                        "type": {
                            "type": "Array",
                            "elementType": {
                                "type": "String"
                            }
                        }
                    },
                    {
                        "id": 3,
                        "name": "sex",
                        "type": {
                            "type": "IndexedAccess",
                            "index": "sex",
                            "objectType": {
                                "type": "Reference",
                                "target": "sources/NSPerson/default.Person"
                            }
                        }
                    }
                ]
            },
            "sources/Student/Unused1": {
                "type": "Interface",
                "properties": [
                    {
                        "id": 0,
                        "name": "value",
                        "type": {
                            "type": "String"
                        }
                    }
                ]
            },
            "sources/NSPerson/default.Person": {
                "type": "Reference",
                "target": "sources/NSPerson/NSPerson.Person"
            },
            "sources/NSPerson/NSPerson.Person": {
                "type": "Union",
                "members": [
                    {
                        "id": 0,
                        "type": {
                            "type": "Reference",
                            "target": "sources/NSPerson/NSPerson.Male"
                        }
                    },
                    {
                        "id": 1,
                        "type": {
                            "type": "Reference",
                            "target": "sources/NSPerson/NSPerson.Female"
                        }
                    }
                ]
            },
            "sources/NSPerson/NSPerson.Male": {
                "type": "Interface",
                "extends": [
                    {
                        id: 0,
                        type: {
                            "type": "Reference",
                            "target": "sources/Animal/default"
                        }
                    }
                ],
                "properties": [
                    {
                        "id": 0,
                        "name": "maleXXX",
                        "type": {
                            "type": "Interface",
                            "properties": [
                                {
                                    "id": 0,
                                    "name": "value",
                                    "type": {
                                        "type": "String"
                                    }
                                }
                            ]
                        }
                    },
                    {
                        "id": 1,
                        "name": "sex",
                        "type": {
                            "type": "Literal",
                            "literal": "m"
                        }
                    }
                ]
            },
            "sources/NSPerson/NSPerson.Female": {
                "type": "Interface",
                "extends": [
                    {
                        id: 0,
                        type: {
                            "type": "Reference",
                            "target": "sources/Animal/default"
                        }
                    }
                ],
                "properties": [
                    {
                        "id": 0,
                        "name": "femaleXXX",
                        "type": {
                            "type": "Interface",
                            "properties": [
                                {
                                    "id": 0,
                                    "name": "value",
                                    "type": {
                                        "type": "String"
                                    }
                                }
                            ]
                        }
                    },
                    {
                        "id": 1,
                        "name": "sex",
                        "type": {
                            "type": "Literal",
                            "literal": "f"
                        }
                    }
                ]
            },
            "sources/Animal/default": {
                "type": "Reference",
                "target": "sources/Animal/Animal"
            },
            "sources/Animal/Animal": {
                "type": "Interface",
                "properties": [
                    {
                        "id": 0,
                        "name": "name",
                        "type": {
                            "type": "String"
                        }
                    },
                    {
                        "id": 1,
                        "name": "age",
                        "type": {
                            "type": "Number"
                        },
                        "optional": true
                    }
                ]
            }
        };

        assert.deepStrictEqual(schemas, rightAnswer)
    })

    it('node_modules', async function () {
        let generator = new ProtoGenerator({
            baseDir: path.resolve(__dirname, 'sources', 'nodeModule')
        });

        let schemas = await generator.generate('Test.ts');

        assert.deepStrictEqual(schemas, {
            'Test/Test': {
                type: 'Interface',
                extends: [
                    {
                        id: 0,
                        type: {
                            type: 'Reference',
                            target: 'node_modules/test-nm/index/TestNodeModule'
                        }
                    }
                ]
            },
            'node_modules/test-nm/index/TestNodeModule': {
                type: 'Interface',
                properties: [{
                    id: 0,
                    name: 'base',
                    type: { type: 'String' }
                }]
            }
        })
    })

    it('custom astCache', async function () {
        let generator = new ProtoGenerator({
            baseDir: path.resolve(__dirname, 'sources', 'nodeModule'),
            resolveModule: (importPath, baseDir) => {
                console.log('asdfasdf', importPath);
                if (importPath === 'test-nm') {
                    return '##aabbcc';
                }
                else {
                    throw new Error('xxx')
                    // return defaultResolveModule(importPath, baseDir);
                }
            }
        });

        let schemas = await generator.generate('Test.ts', {
            astCache: {
                '##aabbcc': {
                    'TestNodeModule': {
                        isExport: true,
                        schema: {
                            type: 'Interface',
                            properties: [{
                                id: 0,
                                name: 'aaaaa',
                                type: {
                                    type: 'String'
                                }
                            }]
                        }
                    }
                }
            }
        });

        assert.deepStrictEqual(schemas, {
            'Test/Test': {
                type: 'Interface',
                extends: [
                    {
                        id: 0,
                        type: {
                            type: 'Reference',
                            target: '##aabbcc/TestNodeModule'
                        }
                    }
                ]
            },
            '##aabbcc/TestNodeModule': {
                type: 'Interface',
                properties: [{
                    id: 0,
                    name: 'aaaaa',
                    type: {
                        type: 'String'
                    }
                }]
            }
        })
    })

    it('empty', async function () {
        let generator = new ProtoGenerator({
            baseDir: path.resolve(__dirname)
        });

        let schemas = await generator.generate('sources/empty.d.ts');
        assert.deepStrictEqual(schemas, {});
    })

    it('NonNullable', async function () {
        let generator = new ProtoGenerator({
            baseDir: path.resolve(__dirname)
        });

        let schemas = await generator.generate('sources/NonNullable.ts');
        assert.deepStrictEqual(schemas, {
            "sources/NonNullable/Wrapper": {
                "type": "Interface",
                "properties": [
                    {
                        "id": 0,
                        "name": "value1",
                        "type": {
                            "type": "String"
                        },
                        "optional": true
                    },
                    {
                        "id": 1,
                        "name": "value2",
                        "type": {
                            "type": "Union",
                            "members": [
                                {
                                    "id": 0,
                                    "type": {
                                        "type": "Literal",
                                        "literal": null
                                    }
                                },
                                {
                                    "id": 1,
                                    "type": {
                                        "type": "String"
                                    }
                                },
                                {
                                    "id": 2,
                                    "type": {
                                        "type": "Literal",
                                        literal: undefined
                                    }
                                }
                            ]
                        }
                    }
                ]
            },
            "sources/NonNullable/Value3": {
                "type": "Union",
                "members": [
                    {
                        "id": 0,
                        "type": {
                            "type": "String"
                        }
                    },
                    {
                        "id": 1,
                        "type": {
                            "type": "Literal",
                            "literal": null
                        }
                    },
                    {
                        "id": 2,
                        "type": {
                            "type": "Literal",
                            literal: undefined
                        }
                    }
                ]
            },
            "sources/NonNullable/NonNullable1": {
                "type": "NonNullable",
                "target": {
                    "type": "IndexedAccess",
                    "index": "value1",
                    "objectType": {
                        "type": "Reference",
                        "target": "sources/NonNullable/Wrapper"
                    }
                }
            },
            "sources/NonNullable/NonNullable2": {
                "type": "NonNullable",
                "target": {
                    "type": "IndexedAccess",
                    "index": "value2",
                    "objectType": {
                        "type": "Reference",
                        "target": "sources/NonNullable/Wrapper"
                    }
                }
            },
            "sources/NonNullable/NonNullable3": {
                "type": "NonNullable",
                "target": {
                    "type": "Reference",
                    "target": "sources/NonNullable/Value3"
                }
            }
        });
    })
})