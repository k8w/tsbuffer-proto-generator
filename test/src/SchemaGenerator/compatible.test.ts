import * as assert from 'assert';
import SchemaGenerator from '../../../src/SchemaGenerator';
import * as path from "path";
import { GenerateResult } from '../../../src/SchemaGenerator';

describe('SchemaGenerator.compatible', function () {
    it('simple enum', async function () {
        let generator = new SchemaGenerator({
            baseDir: path.resolve(__dirname, 'sources')
        });

        let cp: GenerateResult = {
            "SimpleEnum": {
                "TestEnum": {
                    "type": "Enum",
                    "members": [
                        {
                            "id": 2,
                            "value": 1
                        },
                        {
                            "id": 50,
                            "value": 100
                        }
                    ]
                }
            }
        };

        let schemas = await generator.generate('SimpleEnum.ts', {
            compatibleResult: cp
        });

        console.log(JSON.stringify(schemas, null, 2));
    })
})