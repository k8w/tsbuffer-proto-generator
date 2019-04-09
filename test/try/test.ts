import AstParser from '../../src/AstParser';
import * as ts from "typescript";
import * as fs from "fs";

let src = ts.createSourceFile(
    'DemoFile.ts',
    fs.readFileSync('DemoFile.ts').toString(),
    ts.ScriptTarget.ES3,
    true,
    ts.ScriptKind.TS
);

let res = AstParser.getFlattenNodes(src);

console.log(Object.keys(res))