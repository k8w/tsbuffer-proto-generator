import TSBufferSchema from "tsbuffer-schema";
import * as ts from "typescript";
import ReferenceTypeSchema from "tsbuffer-schema/src/schemas/ReferenceTypeSchema";
import InterfaceTypeSchema from 'tsbuffer-schema/src/schemas/InterfaceTypeSchema';
import BufferTypeSchema from 'tsbuffer-schema/src/schemas/BufferTypeSchema';
import PickTypeSchema from 'tsbuffer-schema/src/schemas/PickTypeSchema';
import OmitTypeSchema from 'tsbuffer-schema/src/schemas/OmitTypeSchema';

const SCALAR_TYPES = [
    'int32' as const,
    'int64' as const,
    'uint32' as const,
    'uint64' as const,
    'sint32' as const,
    'sint64' as const,
    'fixed32' as const,
    'fixed64' as const,
    'sfixed32' as const,
    'sfixed64' as const,
    'float' as const,
    'double' as const
].sort();

const BUFFER_TYPES = [
    'ArrayBuffer' as const,
    'Int8Array' as const,
    'Int16Array' as const,
    'Int32Array' as const,
    'BigInt64Array' as const,
    'Uint8Array' as const,
    'Uint16Array' as const,
    'Uint32Array' as const,
    'BigUint64Array' as const,
    'Float32Array' as const,
    'Float64Array' as const,
].sort();

/**
 * 提取出有用的AST
 */
export default class AstParser {

    /**
     * 解析整个文件
     * @param content 
     */
    static parseScript(content: string): AstParserResult {
        let output: AstParserResult = {};

        // 1. get flatten nodes
        let src = ts.createSourceFile(
            '',
            content,
            ts.ScriptTarget.ES3,
            true,
            ts.ScriptKind.TS
        );
        let nodes = this.getFlattenNodes(src, true);

        // 2. parse imports
        let imports = this.getScriptImports(src);

        // 3. node2schema
        for (let name in nodes) {
            output[name] = {
                isExport: nodes[name].isExport,
                schema: this.node2schema(nodes[name].node, imports)
            }
        }

        return output;
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
        let exportNames: { [name: string]: true } = {};

        // 检测到的顶级Modules（namespace）
        let namespaceExports: {
            [nsname: string]: {
                // 在Namespace内是否export
                [symbolName: string]: boolean
            }
        } = {};

        node.forEachChild(v => {
            // 类型定义
            if (ts.isInterfaceDeclaration(v) || ts.isTypeAliasDeclaration(v) || ts.isEnumDeclaration(v)) {
                // 外层允许export，且自身有被export
                let _isExport = Boolean(isExport && v.modifiers && v.modifiers.findIndex(v1 => v1.kind === ts.SyntaxKind.ExportKeyword) > -1);

                // 是否为export default
                let _isExportDefault = _isExport && v.modifiers!.findIndex(v1 => v1.kind === ts.SyntaxKind.DefaultKeyword) > -1

                output[v.name.text] = {
                    node: v.kind === ts.SyntaxKind.TypeAliasDeclaration ? (v as ts.TypeAliasDeclaration).type : v,
                    // export default的情况，本体作为不isExport，取而代之生成一个名为default的TypeReference来export
                    isExport: _isExport && !_isExportDefault
                };

                // 生成TypeReference
                if (_isExportDefault) {
                    output['default'] = {
                        node: ts.createTypeReferenceNode(v.name, undefined),
                        isExport: true
                    };
                }
            }
            // namespace
            else if (ts.isModuleDeclaration(v) && (v.flags & ts.NodeFlags.Namespace)) {
                if (v.body && v.body.kind === ts.SyntaxKind.ModuleBlock) {
                    // 外层允许export，且自身有被export
                    let _isExport = Boolean(isExport && v.modifiers && v.modifiers.findIndex(v1 => v1.kind === ts.SyntaxKind.ExportKeyword) > -1);

                    // 递归生成子树
                    let children = AstParser.getFlattenNodes(v.body, true);

                    namespaceExports[v.name.text] = {};
                    for (let item of Object.entries(children)) {
                        // 临时存储内部export
                        namespaceExports[v.name.text][item[0]] = item[1].isExport;
                        // 实际export还要考虑外部(_isExport)
                        item[1].isExport = item[1].isExport && _isExport;
                    }

                    // 展平子树
                    Object.entries(children).forEach(v1 => {
                        // 转换name为 A.B.C 的形式
                        output[v.name.text + '.' + v1[0]] = v1[1];
                    })
                }
            }
            // export
            else if (ts.isExportDeclaration(v)) {
                v.exportClause && v.exportClause.elements.forEach(elem => {
                    // export { A as B }
                    if (elem.propertyName) {
                        output[elem.name.text] = {
                            node: ts.createTypeReferenceNode(elem.propertyName.text, undefined),
                            isExport: true
                        };
                    }
                    // export { A }
                    else {
                        exportNames[elem.name.text] = true;
                    }
                })
            }
            // export default
            else if (ts.isExportAssignment(v)) {
                // 暂不支持 export = XXX
                if (v.isExportEquals) {
                    return;
                }

                output['default'] = {
                    node: ts.createTypeReferenceNode(v.expression.getText(), undefined),
                    isExport: true
                };
            }
        });

        // exportNames
        // 后续export declaration的
        Object.keys(exportNames).forEach(v => {
            if (output[v]) {
                output[v].isExport = true
            }
        });

        // export default namespace 的情况
        if (output['default'] && ts.isTypeReferenceNode(output['default'].node)) {
            let typeName = this._typeNameToString(output['default'].node.typeName);
            // 确实是export default namespace
            if (namespaceExports[typeName]) {
                delete output['default'];
                // 遍历所有 typeName.XXX
                for (let key in namespaceExports[typeName]) {
                    // 内部也export的
                    if (namespaceExports[typeName][key]) {
                        // 增加 default.XXX 到 typeName.XXX 的引用
                        output['default.' + key] = {
                            node: ts.createTypeReferenceNode(typeName + '.' + key, undefined),
                            isExport: true
                        }
                    }
                }
            }
        }

        return output;
    }

    static node2schema(node: ts.Node, imports: ScriptImports): TSBufferSchema {
        // 去除外层括弧
        while (ts.isParenthesizedTypeNode(node)) {
            node = node.type;
        }

        // AnyType
        if (node.kind === ts.SyntaxKind.AnyKeyword) {
            return {
                type: 'Any'
            }
        }

        // BufferType
        if (ts.isTypeReferenceNode(node)) {
            let ref = this._getReferenceTypeSchema(node.typeName, imports);
            if (!ref.path && BUFFER_TYPES.binarySearch(ref.targetName) > -1) {
                let output: BufferTypeSchema = {
                    type: 'Buffer'
                };

                let targetName = ref.targetName as (typeof BUFFER_TYPES)[number];
                if (targetName !== 'ArrayBuffer') {
                    output.arrayType = targetName;
                }

                return output;
            }
        }

        // BooleanType
        if (node.kind === ts.SyntaxKind.BooleanKeyword) {
            return {
                type: 'Boolean'
            }
        }

        // NonPrimitiveType
        if (node.kind === ts.SyntaxKind.ObjectKeyword) {
            return {
                type: 'NonPrimitive'
            }
        }

        // NumberType
        if (node.kind === ts.SyntaxKind.NumberKeyword) {
            return {
                type: 'Number'
            }
        }
        // Scalar value types
        if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName) && SCALAR_TYPES.binarySearch(node.typeName.text) > -1) {
            return {
                type: 'Number',
                scalarType: node.typeName.text as typeof SCALAR_TYPES[number]
            }
        }

        // StringType
        if (node.kind === ts.SyntaxKind.StringKeyword) {
            return { type: 'String' }
        }

        // ArrayType: xxx[]
        if (ts.isArrayTypeNode(node)) {
            return {
                type: 'Array',
                elementType: this.node2schema(node.elementType, imports)
            }
        }
        // ArrayType: Array<T>
        if (this._isLocalReference(node, imports, 'Array') && node.typeArguments) {
            return {
                type: 'Array',
                elementType: this.node2schema(node.typeArguments[0], imports)
            }
        }

        // TupleType
        if (ts.isTupleTypeNode(node)) {
            return {
                type: 'Tuple',
                elementTypes: node.elementTypes.map(v => this.node2schema(v, imports))
            }
        }

        // LiteralType
        // LiteralType: string | number | boolean
        if (ts.isLiteralTypeNode(node)) {
            if (ts.isStringLiteral(node.literal)) {
                return {
                    type: 'Literal',
                    literal: node.literal.text
                }
            }
            else if (ts.isNumericLiteral(node.literal)) {
                return {
                    type: 'Literal',
                    literal: parseFloat(node.literal.text)
                }
            }
            else if (node.literal.kind === ts.SyntaxKind.TrueKeyword) {
                return {
                    type: 'Literal',
                    literal: true
                }
            }
            else if (node.literal.kind === ts.SyntaxKind.FalseKeyword) {
                return {
                    type: 'Literal',
                    literal: false
                }
            }
        }
        // Literal: null
        else if (node.kind === ts.SyntaxKind.NullKeyword) {
            return {
                type: 'Literal',
                literal: null
            }
        }
        // Literal: undefined
        else if (node.kind === ts.SyntaxKind.UndefinedKeyword) {
            return {
                type: 'Literal',
                literal: undefined
            }
        }

        // EnumType
        if (ts.isEnumDeclaration(node)) {
            let initializer = 0;
            return {
                type: 'Enum',
                members: node.members.map((v, i) => {
                    if (v.initializer) {
                        if (ts.isStringLiteral(v.initializer)) {
                            initializer = NaN;
                            return {
                                id: i,
                                value: v.initializer.text
                            }
                        }
                        else if (ts.isNumericLiteral(v.initializer)) {
                            initializer = parseFloat(v.initializer.text);
                            return {
                                id: i,
                                value: initializer++
                            }
                        }
                        else {
                            console.log('initializer', v.initializer);
                            throw new Error('Enum initializer type error: ' + ts.SyntaxKind[v.initializer.kind]);
                        }
                    }
                    else {
                        return {
                            id: i,
                            value: initializer++
                        }
                    }
                })
            }
        }

        // InterfaceType
        if (ts.isInterfaceDeclaration(node) || ts.isTypeLiteralNode(node)) {
            // extends
            let extendsInterface: ReferenceTypeSchema[] | undefined;
            if (ts.isInterfaceDeclaration(node) && node.heritageClauses) {
                extendsInterface = [];
                node.heritageClauses.forEach(v => {
                    v.types.forEach(type => {
                        extendsInterface!.push(this._getReferenceTypeSchema(type.getText(), imports));
                    })
                })
            }

            let properties: NonNullable<InterfaceTypeSchema['properties']>[number][] = [];
            let indexSignature: InterfaceTypeSchema['indexSignature'];

            node.members.forEach((member, i) => {
                // properties
                if (ts.isPropertySignature(member)) {
                    if (ts.isComputedPropertyName(member.name)) {
                        throw new Error('ComputedPropertyName is not supported at now')
                    }
                    if (!member.type) {
                        throw new Error(`Field must have a type: ${member.name.text}`);
                    }

                    let property: NonNullable<InterfaceTypeSchema['properties']>[number] = {
                        id: i,
                        name: member.name.text,
                        type: this.node2schema(member.type, imports)
                    }

                    // optional
                    if (member.questionToken) {
                        property.optional = true;
                    }

                    properties.push(property)
                }
                // indexSignature
                else if (ts.isIndexSignatureDeclaration(member)) {
                    if (!member.type || !member.parameters[0].type) {
                        throw new Error('Error index signature: ' + member.getText())
                    }

                    let keyType: NonNullable<InterfaceTypeSchema['indexSignature']>['keyType'];
                    if (member.parameters[0].type.kind === ts.SyntaxKind.NumberKeyword) {
                        keyType = 'Number';
                    }
                    else {
                        keyType = 'String';
                    }

                    indexSignature = {
                        keyType: keyType,
                        type: this.node2schema(member.type, imports)
                    }
                }
            })

            // output
            let output: InterfaceTypeSchema = {
                type: 'Interface'
            };
            if (extendsInterface) {
                output.extends = extendsInterface;
            }
            if (properties.length) {
                output.properties = properties;
            }
            if (indexSignature) {
                output.indexSignature = indexSignature;
            }
            return output;
        }

        // IndexedAccessType
        if (ts.isIndexedAccessTypeNode(node)) {
            // A['a']
            if (ts.isLiteralTypeNode(node.indexType)) {
                let index: string;
                if (ts.isStringLiteral(node.indexType.literal) || ts.isNumericLiteral(node.indexType.literal)) {
                    index = node.indexType.literal.text;
                }
                else if (node.indexType.literal.kind === ts.SyntaxKind.TrueKeyword
                    || node.indexType.literal.kind === ts.SyntaxKind.FalseKeyword
                    || node.indexType.literal.kind === ts.SyntaxKind.NullKeyword
                    || node.indexType.literal.kind === ts.SyntaxKind.UndefinedKeyword
                ) {
                    index = node.indexType.literal.getText();
                }
                else {
                    throw new Error(`Error indexType literal: ${node.getText()}`)
                }

                return {
                    type: 'IndexedAccess',
                    index: index,
                    objectType: this.node2schema(node.objectType, imports)
                }
            }
            // A['a' | 'b']
            else if (ts.isUnionTypeNode(node.indexType)) {
                // TODO UnionType
            }
            else {
                throw new Error(`Error IndexedAccessType indexType: ${node.getText()}`);
            }
        }

        // UnionType
        if (ts.isUnionTypeNode(node)) {
            return {
                type: 'Union',
                members: node.types.map((v, i) => ({
                    id: i,
                    type: this.node2schema(v, imports)
                }))
            }
        }

        // IntersectionType
        if (ts.isIntersectionTypeNode(node)) {
            return {
                type: 'Intersection',
                members: node.types.map((v, i) => ({
                    id: i,
                    type: this.node2schema(v, imports)
                }))
            }
        }

        // PickType & OmitType
        if (this._isLocalReference(node, imports, ['Pick', 'Omit'])) {
            let nodeName = node.typeName.getText();

            if (!node.typeArguments || node.typeArguments.length != 2) {
                throw new Error(`Illeagle ${nodeName}Type: ` + node.getText());
            }

            let target = this.node2schema(node.typeArguments[0], imports);
            if (target.type !== 'Interface' && target.type !== 'Reference') {
                throw new Error(`Illeagle ${nodeName}Type: ` + node.getText())
            }

            let output: PickTypeSchema | OmitTypeSchema = Object.assign({
                target: target,
                keys: this._getPickKeys(this.node2schema(node.typeArguments[1], imports))
            }, nodeName === 'Pick' ? { type: 'Pick' } : { type: 'Omit' })

            return output;
        }

        // PartialType
        if (this._isLocalReference(node, imports, 'Partial')) {
            if (!node.typeArguments || node.typeArguments.length != 1) {
                throw new Error('Illeagle PartialType: ' + node.getText());
            }

            let target = this.node2schema(node.typeArguments[0], imports);
            if (target.type !== 'Interface' && target.type !== 'Reference') {
                throw new Error('Illeagle PartialType: ' + node.getText())
            }

            return {
                type: 'Partial',
                target: target
            }
        }

        // OverwriteType
        if (this._isLocalReference(node, imports, 'Overwrite')) {
            if (!node.typeArguments || node.typeArguments.length != 2) {
                throw new Error(`Illeagle OverwriteType: ` + node.getText());
            }

            let target = this.node2schema(node.typeArguments[0], imports);
            if (target.type !== 'Interface' && target.type !== 'Reference') {
                throw new Error(`Illeagle OverwriteType: ` + node.getText())
            }

            let overwrite = this.node2schema(node.typeArguments[1], imports);
            if (overwrite.type !== 'Interface' && overwrite.type !== 'Reference') {
                throw new Error(`Illeagle OverwriteType: ` + node.getText())
            }

            return {
                type: 'Overwrite',
                target: target,
                overwrite: overwrite
            };
        }

        // ReferenceType放最后（因为很多其它类型，如Pick等，都解析为ReferenceNode）
        if (ts.isTypeReferenceNode(node)) {
            return this._getReferenceTypeSchema(node.typeName, imports);
        }

        console.debug(node)
        throw new Error('Cannot resolve type: ' + node.getText());
    }

    /**
     * A -> A
     * A.B -> A.B
     * @param name 
     */
    private static _typeNameToString(name: ts.Identifier | ts.QualifiedName): string {
        if (ts.isIdentifier(name)) {
            return name.text;
        }
        else {
            let left = ts.isIdentifier(name.left) ? name.left.text : this._typeNameToString(name.left);
            return left + '.' + name.right.text;
        }
    }

    private static _getReferenceTypeSchema(name: string | ts.Identifier | ts.QualifiedName, imports: ScriptImports): ReferenceTypeSchema {
        if (typeof name !== 'string') {
            name = this._typeNameToString(name);
        }

        let arrName = name.split('.');
        let importItem = imports[arrName[0]];
        if (importItem) {
            let importName = arrName.slice();
            importName[0] = importItem.targetName;
            return {
                type: 'Reference',
                path: importItem.path,
                targetName: importName.join('.')
            }
        }
        else {
            return {
                type: 'Reference',
                targetName: name
            }
        }
    }

    private static _isLocalReference(node: ts.Node, imports: ScriptImports, referenceName: string | string[]): node is ts.TypeReferenceNode {
        if (!ts.isTypeReferenceNode(node)) {
            return false;
        }

        if (typeof referenceName === 'string') {
            referenceName = [referenceName];
        }

        let ref = this._getReferenceTypeSchema(node.typeName, imports);
        for (let name of referenceName) {
            if (!ref.path && ref.targetName === name) {
                return name as any;
            }
        }

        return false;
    }

    private static _getPickKeys(schema: TSBufferSchema): string[] {
        if (schema.type === 'Union') {
            return schema.members.map(v => this._getPickKeys(v.type)).reduce((prev, next) => prev.concat(next), []).distinct();
        }
        else if (schema.type === 'Intersection') {
            return schema.members.map(v => this._getPickKeys(v.type)).reduce((prev, next) => prev.filter(v => next.indexOf(v) > -1));
        }
        else if (schema.type === 'Literal') {
            return ['' + schema.literal];
        }
        else {
            console.log('Illeagle Pick keys:', schema);
            throw new Error('Illeagle Pick keys: ' + JSON.stringify(schema, null, 2));
        }
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

export interface AstParserResult {
    [name: string]: {
        isExport: boolean,
        schema: TSBufferSchema
    }
}