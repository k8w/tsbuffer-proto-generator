import { TSBufferSchema } from 'tsbuffer-schema';
import * as fs from "fs";
import * as path from "path";
import AstParser from './AstParser';
import ReferenceTypeSchema from 'tsbuffer-schema/src/schemas/ReferenceTypeSchema';
import { ScriptSchema } from './AstParser';

export interface SchemaGeneratorOptions {
    /** Schema的根目录（路径在根目录以前的字符串会被相对掉） */
    baseDir: string;

    /** 读取文件的方法（用于扩展自定义文件系统） */
    readFile: (path: string) => Promise<string> | string;

    /** 解析全局Module的路径，从前到后 */
    resolveModules: string[]
}

export default class SchemaGenerator {

    protected readonly options: SchemaGeneratorOptions = {
        baseDir: process.cwd(),
        readFile: (v => fs.readFileSync(path.resolve(this.options.baseDir, v)).toString()),
        resolveModules: ['node_modules']
    };

    constructor(options: Partial<SchemaGeneratorOptions> = {}) {
        Object.assign(this.options, options);
    }

    /**
     * 生成FileSchema
     * @param paths 相对于baseDir的相对路径
     * @param options 
     */
    async generate(paths: string | string[], options: GenerateFileSchemaOptions = {}): Promise<FileSchema> {
        let output: FileSchema = {};

        if (typeof paths === 'string') {
            paths = [paths];
        }

        // AST CACHE
        let astCache: AstCache = {};

        // 生成这几个文件的AST CACHE
        let filter = options.filter || (v => v.isExport);
        for (let filepath of paths) {
            // 生成该文件的AST
            let ast = await this._getAst(filepath, astCache);

            // Filter出要被导出的
            for (let name in ast) {
                if (filter({
                    path: filepath,
                    name: name,
                    isExport: ast[name].isExport
                })) {
                    // 加入output
                    await this._addToOutput(filepath, name, ast[name].schema, output, astCache);
                }
            }
        }

        return output;
    }

    private async _getAst(filepath: string, astCache: AstCache) {
        if (!astCache[filepath]) {
            astCache[filepath] = AstParser.parseScript(await this.options.readFile(filepath));
        }
        return astCache[filepath];
    }

    private async _addToOutput(filepath: string, name: string, schema: TSBufferSchema, output: FileSchema, astCache: AstCache) {
        if (!output[filepath]) {
            output[filepath] = {};
        }

        if (!output[filepath][name]) {
            output[filepath][name] = schema;

            // TODO flatten 解引用

            // 将引用的也加入进来
            let refs = this.getUsedReference(schema);
            for (let ref of refs) {
                let ast = await this._getAst(ref.path ? ref.path : filepath, astCache);
                if (!ast[ref.targetName]) {
                    console.debug('schema', schema);
                    throw new Error(`Cannot find reference ${ref.targetName} at: ${filepath}`);
                }
                this._addToOutput(filepath, ref.targetName, ast[ref.targetName].schema, output, astCache);
            }
        }
    }

    /**
     * 解析一个Schema引用到的其它类型
     * @param schema 
     */
    getUsedReference(schemas: TSBufferSchema | TSBufferSchema[]): ReferenceTypeSchema[] {
        if (!Array.isArray(schemas)) {
            schemas = [schemas];
        }

        let output: ReferenceTypeSchema[] = [];

        for (let schema of schemas) {
            switch (schema.type) {
                case 'Array':
                    output = output.concat(this.getUsedReference(schema.elementType));
                    break;
                case 'Tuple':
                    output = output.concat(this.getUsedReference(schema.elementTypes));
                    break;
                case 'Interface':
                    if (schema.properties) {
                        output = output.concat(this.getUsedReference(schema.properties.map(v => v.type)));
                    }
                    if (schema.indexSignature) {
                        output = output.concat(this.getUsedReference(schema.indexSignature.type));
                    }
                    break;
                case 'IndexedAccess':
                    output = output.concat(this.getUsedReference(schema.objectType));
                    break;
                case 'Reference':
                    output.push(schema);
                    break;
                case 'Union':
                case 'Intersection':
                    output = output.concat(this.getUsedReference(schema.members.map(v => v.type)));
                    break;
                case 'Pick':
                case 'Omit':
                case 'Partial':
                    output = output.concat(this.getUsedReference(schema.target));
                    break;
                case 'Overwrite':
                    output = output.concat(this.getUsedReference(schema.target));
                    output = output.concat(this.getUsedReference(schema.overwrite));
                    break;
                default:
                    break;
            }
        }

        return output;
    }

    // private async _getAst(filepath: string, astCache: AstCache) {
    //     let relativePath = path.relative(this.options.baseDir, filepath).replace(/\\/g, '/');

    //     if (!astCache[relativePath]) {
    //         let fileContent = await this.options.readFile(filepath);
    //         astCache[relativePath] = AstParser.parseScript(fileContent);
    //     }

    //     let output: { [name: string]: ScriptSchema[string] & { isUsed: boolean } } = {};
    //     for (let key in astCache[relativePath]) {
    //         output[key] = {
    //             ...astCache[relativePath][key],
    //             isUsed: false
    //         }
    //     }

    //     return output;
    // }

    /**
     * 读取一个文件，并解析内部所有类型定义
     * @param filepath 
     * @param options 
     */
    // async parseFile(filepath: string, options: GetSchemasOptions = {}): Promise<FileSchema> {
    //     // typescript.createSourceFile
    //     throw new Error('TODO')
    // }

    /**
     * 从一个文件路径中，解析指定的Schema，追加到结果集中
     * @param filepath 
     * @param symbollName 
     */
    // async getSchema(filepath: string, symbollName: string): Promise<TSBufferSchema> {
    //     throw new Error('TODO');
    // }

}

export interface AstCache {
    [relativePath: string]: ScriptSchema;
}

export interface GenerateFileSchemaOptions {
    /** 是否解除引用（生成出不包含ReferenceType的Schema），默认为false */
    flatten?: boolean;

    /** 决定该field是否被导出，默认为导出所有export及其引用的字段
     * isUsed为true的字段，无论如何都会被导出
     */
    filter?: (info: { path: string, name: string, isExport: boolean }) => boolean;

    /** 默认导出所有export的 */
    // include?: string[],

    /** *代表所有, exclude优先级更高 */
    // exclude?: string[]
}

export interface FileSchema {
    [filepath: string]: {
        [name: string]: TSBufferSchema
    };
}