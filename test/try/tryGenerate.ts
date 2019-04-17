import 'k8w-extend-native';
import SchemaGenerator from '../../src/SchemaGenerator';
import * as path from "path";

let generator = new SchemaGenerator();

// generator.generate(path.resolve(__dirname, 'DemoFile.ts')).then(v => {
//     console.log(JSON.stringify(v, null, 2));
// })

generator.generate(path.resolve(__dirname, '../src/SchemaGenerator/sources/NSPerson.ts')).then(v => {
    console.log(JSON.stringify(v, null, 2));
})