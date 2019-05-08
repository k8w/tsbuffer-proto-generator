import * as assert from 'assert';
import { SchemaGenerator } from '../../../src/SchemaGenerator';
import * as path from "path";

describe('SchemaGenerator.generate', function () {
    it('specific filter', async function () {
        let generator = new SchemaGenerator({
            baseDir: path.resolve(__dirname)
        });

        let schemas = await generator.generate('sources/Student.ts');
        process.chdir(path.resolve(__dirname, '../../'));
        let schemas2 = await generator.generate('sources/Student.ts');

        // 无关pwd的事
        assert.deepStrictEqual(JSON.stringify(schemas, null, 2), JSON.stringify(schemas2, null, 2));

        let rightAnswer = {
            "sources/Student": {
                "default": {
                    "type": "Reference",
                    "targetName": "Student"
                },
                "Student": {
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
                                    "path": "sources/NSPerson",
                                    "targetName": "default.Person"
                                }
                            }
                        }
                    ]
                },
                "Unused1": {
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
            "sources/NSPerson": {
                "default.Person": {
                    "type": "Reference",
                    "targetName": "NSPerson.Person"
                },
                "NSPerson.Person": {
                    "type": "Union",
                    "members": [
                        {
                            "id": 0,
                            "type": {
                                "type": "Reference",
                                "targetName": "NSPerson.Male"
                            }
                        },
                        {
                            "id": 1,
                            "type": {
                                "type": "Reference",
                                "targetName": "NSPerson.Female"
                            }
                        }
                    ]
                },
                "NSPerson.Male": {
                    "type": "Interface",
                    "extends": [
                        {
                            "type": "Reference",
                            "path": "sources/Animal",
                            "targetName": "default"
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
                "NSPerson.Female": {
                    "type": "Interface",
                    "extends": [
                        {
                            "type": "Reference",
                            "path": "sources/Animal",
                            "targetName": "default"
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
                }
            },
            "sources/Animal": {
                "default": {
                    "type": "Reference",
                    "targetName": "Animal"
                },
                "Animal": {
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
            }
        };

        assert.deepStrictEqual(schemas, rightAnswer)
    })

    it('node_modules', async function () {
        let generator = new SchemaGenerator({
            baseDir: path.resolve(__dirname, 'sources', 'nodeModule')
        });

        let schemas = await generator.generate('Test.ts');

        assert.deepStrictEqual(schemas, {
            'Test': {
                'Test': {
                    type: 'Interface',
                    extends: [
                        {
                            type: 'Reference',
                            path: 'node_modules/test-nm/index',
                            targetName: 'TestNodeModule'
                        }
                    ]
                }
            },
            'node_modules/test-nm/index': {
                'TestNodeModule': {
                    type: 'Interface',
                    properties: [{
                        id: 0,
                        name: 'base',
                        type: { type: 'String' }
                    }]
                }
            }
        })
    })
})