import { TSBufferSchema } from "tsbuffer-schema";
import ts from "typescript";
/**
 * 提取出有用的AST
 */
export declare class AstParser {
    /**
     * 解析整个文件
     * @param content
     */
    static parseScript(content: string): AstParserResult;
    /** 解析顶层imports */
    static getScriptImports(src: ts.SourceFile): ScriptImports;
    /**
     * 将Node展平（包括Namespace里的）
     * @param node
     * @param isExport 当node是Namespace时，其外层是否处于export
     */
    static getFlattenNodes(node: ts.Node, isExport?: boolean): {
        [name: string]: {
            node: ts.Node;
            isExport: boolean;
        };
    };
    static node2schema(node: ts.Node, imports: ScriptImports): TSBufferSchema;
    /**
     * A -> A
     * A.B -> A.B
     * @param name
     */
    private static _typeNameToString;
    private static _getReferenceTypeSchema;
    private static _isLocalReference;
    private static _getPickKeys;
    private static _isInterfaceReference;
    private static _isTypeReference;
}
export interface ScriptImports {
    [asName: string]: {
        path: string;
        targetName: string;
    };
}
export interface AstParserResult {
    [name: string]: {
        isExport: boolean;
        schema: TSBufferSchema;
    };
}
//# sourceMappingURL=AstParser.d.ts.map