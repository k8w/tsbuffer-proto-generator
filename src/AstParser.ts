import { TSBufferSchema } from "tsbuffer-schema";
import * as ts from "typescript";
/**
 * 提取出有用的AST
 */
export default class AstParser {

    static parseSourceFile(path: string, content: string): {
        [name: string]: TSBufferSchema
    } {
        throw new Error('TODO');
        // 1. get flatten nodes
        // 2. parse imports
        // 3. node2schema
    }

    /** 解析顶层imports */
    static parseImports(src: ts.SourceFile) {
        // TODO
    }

    /**
     * 将Node展平（包括Namespace里的）
     * @param node 
     * @param isExport 当node是Namespace时，其外层是否处于export
     */
    static getFlattenNodes(node: ts.Node, isExport: boolean = false): {
        [name: string]: {
            node: ts.Node,
            isExport: boolean
        }
    } {
        let output: ReturnType<typeof AstParser.getFlattenNodes> = {};

        node.forEachChild(v => {
            // 类型定义
            if (
                v.kind === ts.SyntaxKind.InterfaceDeclaration
                || v.kind === ts.SyntaxKind.TypeAliasDeclaration
                || v.kind === ts.SyntaxKind.EnumDeclaration
            ) {
                let _v = v as (ts.InterfaceDeclaration | ts.TypeAliasDeclaration | ts.EnumDeclaration);

                // 外层允许export，且自身有被export
                let _isExport = Boolean(isExport && _v.modifiers && _v.modifiers.findIndex(v1 => v1.kind === ts.SyntaxKind.ExportKeyword) > -1);

                // 是否为export default
                let _isExportDefault = _isExport && _v.modifiers!.findIndex(v1 => v1.kind === ts.SyntaxKind.DefaultKeyword) > -1

                output[_v.name.text] = {
                    node: _v,
                    // export default的情况，本体作为不isExport，取而代之生成一个名为default的TypeReference来export
                    isExport: _isExport && !_isExportDefault
                };

                // 生成TypeReference
                if (_isExportDefault) {
                    output['default'] = {
                        node: ts.createTypeReferenceNode('default', undefined),
                        isExport: true
                    };
                }
            }
            // namespace
            else if (v.kind === ts.SyntaxKind.ModuleDeclaration && (v.flags & ts.NodeFlags.Namespace)) {
                let _v = v as ts.ModuleDeclaration;
                if (_v.body && _v.body.kind === ts.SyntaxKind.ModuleBlock) {
                    // 外层允许export，且自身有被export
                    let _isExport = Boolean(isExport && _v.modifiers && _v.modifiers.findIndex(v1 => v1.kind === ts.SyntaxKind.ExportKeyword) > -1);

                    // 递归生成子树
                    let children = AstParser.getFlattenNodes(_v.body, _isExport);

                    // 展平子树
                    Object.entries(children).forEach(v1 => {
                        // 转换name为 A.B.C 的形式
                        output[_v.name.text + '.' + v1[0]] = v1[1];
                    })
                }
            }
            // export
            else if (v.kind === ts.SyntaxKind.ExportDeclaration) {
                // TODO
            }
            // export default
            else if (v.kind === ts.SyntaxKind.ExportAssignment) {
                // TODO
            }
        });

        return output;
    }

    static node2schema(node: ts.Node): TSBufferSchema {
        throw new Error('TODO')
    }

}