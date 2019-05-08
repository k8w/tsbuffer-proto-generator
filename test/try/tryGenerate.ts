import 'k8w-extend-native';
import { SchemaGenerator } from '../../src/SchemaGenerator';
import * as path from "path";

new SchemaGenerator({
    baseDir: path.resolve(__dirname, '../src/SchemaGenerator'),
    verbose: true
}).generate(['sources/Student.ts'])
    .then(v => {
        console.log(JSON.stringify(v, null, 2));
    })