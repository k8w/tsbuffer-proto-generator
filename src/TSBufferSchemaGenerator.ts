import { TSBufferSchema } from 'tsbuffer-schema';
import * as fs from "fs";

export interface TSBufferSchemaGeneratorOptions {
    baseDir: string;
    readFile: (path: string) => Promise<string> | string;
}

export default class TSBufferSchemaGenerator {

    protected readonly options: TSBufferSchemaGeneratorOptions;

    constructor(options: Partial<TSBufferSchemaGeneratorOptions> = {}) {
        this.options = {
            baseDir: options.baseDir || process.cwd(),
            readFile: options.readFile || (v => fs.readFileSync(v).toString())
        };
    }

    // private _fileCache: {
    //     [filepath: string]: FileSchema
    // } = {};

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
     * 从一个文件路径中，解析指定的Schema
     * @param filepath 
     * @param symbollName 
     */
    // async getSchema(filepath: string, symbollName: string): Promise<TSBufferSchema> {
    //     throw new Error('TODO');
    // }

}

export interface FileSchema {
    [name: string]: {
        isExport: boolean,
        isUsed: boolean,
        schema: TSBufferSchema
    }
}

export interface GetSchemasOptions {
    /** @default true */
    exportOnly?: boolean,

    /** 优先级低 */
    blacklist?: string[],

    /** 优先级高 */
    whitelist?: string[]
}