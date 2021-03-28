import { TSBufferProto } from 'tsbuffer-schema';
import { AstParserResult } from './AstParser';
export interface ProtoGeneratorOptions {
    /** Schema的根目录（路径在根目录以前的字符串会被相对掉） */
    baseDir: string;
    /** console.debug 打印调试信息 */
    verbose: boolean;
    /**
     * 读取文件的方法（用于扩展自定义文件系统）
     * @param path 于baseDir的相对路径
     */
    readFile: (path: string) => Promise<string> | string;
    /**
     * 解析Module的路径
     * @param importPath 例如 import xx from 'abcd/efg' 则 importPath 为 'abcd/efg'
import SchemaUtil from './SchemaUtil';
     * @return 返回于baseDir的相对路径
     */
    resolveModule?: (importPath: string, baseDir: string) => string;
}
export declare class ProtoGenerator {
    protected readonly options: ProtoGeneratorOptions;
    constructor(options?: Partial<ProtoGeneratorOptions>);
    /**
     * 生成FileSchema
     * 对modules（例如node_modules）的引用，也会全部转为相对路径引用
     * @param paths 于baseDir的相对路径
     * @param options
     */
    generate(paths: string | string[], options?: GenerateFileSchemaOptions): Promise<TSBufferProto>;
    /**
     * 重新生成EncodeId
     * @param output
     * @param compatibleResult
     */
    private _regenResultEncodeIds;
    private _regenSchemaEncodeIds;
    private _getAst;
    private _addToOutput;
}
export interface AstCache {
    [relativePath: string]: AstParserResult;
}
export interface GenerateFileSchemaOptions {
    /** 是否解除引用（生成出不包含ReferenceType的Schema），默认为false */
    flatten?: boolean;
    /** 决定该field是否被导出，默认为导出所有export及其引用的字段
     * isUsed为true的字段，无论如何都会被导出
     */
    filter?: (info: {
        path: string;
        name: string;
        isExport: boolean;
    }) => boolean;
    /**
     * 需要向后兼容的Result
     * 生成结果：全兼容、部分兼容、完全不兼容
     * 兼容方式：旧字段ID不变，新字段换新ID
     */
    compatibleResult?: TSBufferProto;
}
//# sourceMappingURL=ProtoGenerator.d.ts.map