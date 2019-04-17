import * as assert from 'assert';
import SchemaGenerator from '../../../src/SchemaGenerator';
import * as path from "path";

describe('SchemaGenerator.generate', function () {
    it('specific filter', function () {
        let generator = new SchemaGenerator({
            baseDir: path.resolve(__dirname)
        });

        // let schemas = generator.generate('.\\sources\\Student.ts', {
        //     filter: v => v.name === 'Student'
        // })

        // assert.deepStrictEqual(schemas, {
        //     'sources/Student': {

        //     }
        // })
    })
})