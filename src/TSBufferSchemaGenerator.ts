import { TSBufferSchema } from 'tsbuffer-schema';

export interface TSBufferSchemaGeneratorOptions {
    loadFileFunc?: (path: string) => Promise<string> | string;
}

export default class TSBufferSchemaGenerator {

    constructor(options: TSBufferSchemaGeneratorOptions = {}) {

    }

    private _fileCache: {
        [filepath: string]: {
            [name: string]: {
                isExport: boolean,
                isUsed: boolean,
                schema: TSBufferSchema
            }
        }
    } = {};

    getSchemas(filepath: string, options: GetSchemasOptions = {}): {
        [symbolName: string]: TSBufferSchema
    } {
        return {}
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