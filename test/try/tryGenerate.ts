import 'k8w-extend-native';
import SchemaGenerator from '../../src/SchemaGenerator';
let generator = new SchemaGenerator();
generator.generate('DemoFile.ts').then(v => {
    console.log(JSON.stringify(v, null, 2));
})