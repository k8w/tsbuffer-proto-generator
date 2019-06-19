import * as assert from 'assert';
import { ProtoGenerator } from '../../../src/ProtoGenerator';
import * as path from "path";

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
})