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
    static getScriptImports(src: ts.SourceFile): ScriptImports {
        let output: ScriptImports = {};

        src.forEachChild(v => {
            if (v.kind !== ts.SyntaxKind.ImportDeclaration) {
                return;
            }

            let node = v as ts.ImportDeclaration;

            // 仅支持从字符串路径import
            if (node.moduleSpecifier.kind !== ts.SyntaxKind.StringLiteral) {
                return;
            }
            let importPath = (node.moduleSpecifier as ts.StringLiteral).text;

            // import from 'xxx'
            if (!node.importClause) {
                return;
            }

            // default: import A from 'xxx'
            if (node.importClause.name) {
                output[node.importClause.name.text] = {
                    path: importPath,
                    targetName: 'default'
                }
            }

            // elements
            if (node.importClause.namedBindings && node.importClause.namedBindings.kind === ts.SyntaxKind.NamedImports && node.importClause.namedBindings.elements) {
                node.importClause.namedBindings.elements.forEach(elem => {
                    // import { A as B } from 'xxx'
                    if (elem.propertyName) {
                        output[elem.name.text] = {
                            path: importPath,
                            targetName: elem.propertyName.text
                        }
                    }
                    // import { A } from 'xxx'
                    else {
                        output[elem.name.text] = {
                            path: importPath,
                            targetName: elem.name.text
                        }
                    }
                })
                // 暂不支持：import * as A from 'xxx'
            }
        })

        return output;
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

        // 检测到ExportDeclaration的项目，会在最后统一设为isExport
        let exportNames: { [name: string]: null } = {};

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
                        node: ts.createTypeAliasDeclaration(undefined, undefined, 'default', undefined,
                            ts.createTypeReferenceNode(_v.name, undefined)
                        ),
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
                let _v = v as ts.ExportDeclaration;
                _v.exportClause && _v.exportClause.elements.forEach(elem => {
                    // export { A as B }
                    if (elem.propertyName) {
                        output[elem.name.text] = {
                            node: ts.createTypeAliasDeclaration(undefined, undefined, elem.name.text, undefined,
                                ts.createTypeReferenceNode(elem.propertyName.text, undefined)
                            ),
                            isExport: true
                        };
                    }
                    // export { A }
                    else {
                        exportNames[elem.name.text] = null;
                    }
                })
            }
            // export default
            else if (v.kind === ts.SyntaxKind.ExportAssignment) {
                let _v = v as ts.ExportAssignment;

                // 暂不支持 export = XXX
                if (_v.isExportEquals) {
                    return;
                }

                output['default'] = {
                    node: ts.createTypeAliasDeclaration(undefined, undefined, 'default', undefined,
                        ts.createTypeReferenceNode(_v.name ? _v.name.text : '', undefined)
                    ),
                    isExport: true
                };
            }
        });

        // exportNames
        Object.keys(exportNames).forEach(v => {
            if (output[v]) {
                output[v].isExport = true
            }
        });

        return output;
    }

    static node2schema(node: ts.Node, imports: ScriptImports): TSBufferSchema {
        throw new Error('TODO')
    }

}

export interface ScriptImports {
    // import { A as B } A为asName
    [asName: string]: {
        path: string,
        // import { A as B } A为targetName
        targetName: string
    }
}