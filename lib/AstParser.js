"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AstParser = void 0;
var typescript_1 = __importDefault(require("typescript"));
var SCALAR_TYPES = [
    'int',
    'uint',
    'double',
    'bigint',
    'bigint64',
    'biguint64',
].sort();
var BUFFER_TYPES = [
    'ArrayBuffer',
    'Int8Array',
    'Int16Array',
    'Int32Array',
    'BigInt64Array',
    'Uint8Array',
    'Uint16Array',
    'Uint32Array',
    'BigUint64Array',
    'Float32Array',
    'Float64Array',
].sort();
/**
 * 提取出有用的AST
 */
var AstParser = /** @class */ (function () {
    function AstParser() {
    }
    /**
     * 解析整个文件
     * @param content
     */
    AstParser.parseScript = function (content) {
        var output = {};
        // 1. get flatten nodes
        var src = typescript_1.default.createSourceFile('', content, typescript_1.default.ScriptTarget.ES3, true, typescript_1.default.ScriptKind.TS);
        var nodes = this.getFlattenNodes(src, true);
        // 2. parse imports
        var imports = this.getScriptImports(src);
        // 3. node2schema
        for (var name_1 in nodes) {
            output[name_1] = {
                isExport: nodes[name_1].isExport,
                schema: this.node2schema(nodes[name_1].node, imports)
            };
        }
        return output;
    };
    /** 解析顶层imports */
    AstParser.getScriptImports = function (src) {
        var output = {};
        src.forEachChild(function (v) {
            if (v.kind !== typescript_1.default.SyntaxKind.ImportDeclaration) {
                return;
            }
            var node = v;
            // 仅支持从字符串路径import
            if (node.moduleSpecifier.kind !== typescript_1.default.SyntaxKind.StringLiteral) {
                return;
            }
            var importPath = node.moduleSpecifier.text;
            // import from 'xxx'
            if (!node.importClause) {
                return;
            }
            // default: import A from 'xxx'
            if (node.importClause.name) {
                output[node.importClause.name.text] = {
                    path: importPath,
                    targetName: 'default'
                };
            }
            // elements
            if (node.importClause.namedBindings && node.importClause.namedBindings.kind === typescript_1.default.SyntaxKind.NamedImports && node.importClause.namedBindings.elements) {
                node.importClause.namedBindings.elements.forEach(function (elem) {
                    // import { A as B } from 'xxx'
                    if (elem.propertyName) {
                        output[elem.name.text] = {
                            path: importPath,
                            targetName: elem.propertyName.text
                        };
                    }
                    // import { A } from 'xxx'
                    else {
                        output[elem.name.text] = {
                            path: importPath,
                            targetName: elem.name.text
                        };
                    }
                });
                // 暂不支持：import * as A from 'xxx'
            }
        });
        return output;
    };
    /**
     * 将Node展平（包括Namespace里的）
     * @param node
     * @param isExport 当node是Namespace时，其外层是否处于export
     */
    AstParser.getFlattenNodes = function (node, isExport) {
        if (isExport === void 0) { isExport = false; }
        var output = {};
        // 检测到ExportDeclaration的项目，会在最后统一设为isExport
        var exportNames = {};
        // 检测到的顶级Modules（namespace）
        var namespaceExports = {};
        node.forEachChild(function (v) {
            // 类型定义
            if (typescript_1.default.isInterfaceDeclaration(v) || typescript_1.default.isTypeAliasDeclaration(v) || typescript_1.default.isEnumDeclaration(v)) {
                // 外层允许export，且自身有被export
                var _isExport = Boolean(isExport && v.modifiers && v.modifiers.findIndex(function (v1) { return v1.kind === typescript_1.default.SyntaxKind.ExportKeyword; }) > -1);
                // 是否为export default
                var _isExportDefault = _isExport && v.modifiers.findIndex(function (v1) { return v1.kind === typescript_1.default.SyntaxKind.DefaultKeyword; }) > -1;
                output[v.name.text] = {
                    node: v.kind === typescript_1.default.SyntaxKind.TypeAliasDeclaration ? v.type : v,
                    // export default的情况，本体作为不isExport，取而代之生成一个名为default的TypeReference来export
                    isExport: _isExport && !_isExportDefault
                };
                // 生成TypeReference
                if (_isExportDefault) {
                    output['default'] = {
                        node: typescript_1.default.createTypeReferenceNode(v.name, undefined),
                        isExport: true
                    };
                }
            }
            // namespace
            else if (typescript_1.default.isModuleDeclaration(v) && (v.flags & typescript_1.default.NodeFlags.Namespace)) {
                if (v.body && v.body.kind === typescript_1.default.SyntaxKind.ModuleBlock) {
                    // 外层允许export，且自身有被export
                    var _isExport = Boolean(isExport && v.modifiers && v.modifiers.findIndex(function (v1) { return v1.kind === typescript_1.default.SyntaxKind.ExportKeyword; }) > -1);
                    // 递归生成子树
                    var children = AstParser.getFlattenNodes(v.body, true);
                    namespaceExports[v.name.text] = {};
                    for (var _i = 0, _a = Object.entries(children); _i < _a.length; _i++) {
                        var item = _a[_i];
                        // 临时存储内部export
                        namespaceExports[v.name.text][item[0]] = item[1].isExport;
                        // 实际export还要考虑外部(_isExport)
                        item[1].isExport = item[1].isExport && _isExport;
                    }
                    // 展平子树
                    Object.entries(children).forEach(function (v1) {
                        // 转换name为 A.B.C 的形式
                        output[v.name.text + '.' + v1[0]] = v1[1];
                    });
                }
            }
            // export
            else if (typescript_1.default.isExportDeclaration(v)) {
                if (!v.exportClause) {
                    return;
                }
                if ('elements' in v.exportClause) {
                    v.exportClause && v.exportClause.elements.forEach(function (elem) {
                        // export { A as B }
                        if (elem.propertyName) {
                            output[elem.name.text] = {
                                node: typescript_1.default.createTypeReferenceNode(elem.propertyName.text, undefined),
                                isExport: true
                            };
                        }
                        // export { A }
                        else {
                            exportNames[elem.name.text] = true;
                        }
                    });
                }
            }
            // export default
            else if (typescript_1.default.isExportAssignment(v)) {
                // 暂不支持 export = XXX
                if (v.isExportEquals) {
                    return;
                }
                output['default'] = {
                    node: typescript_1.default.createTypeReferenceNode(v.expression.getText(), undefined),
                    isExport: true
                };
            }
        });
        // exportNames
        // 后续export declaration的
        Object.keys(exportNames).forEach(function (v) {
            if (output[v]) {
                output[v].isExport = true;
            }
        });
        // export default namespace 的情况
        if (output['default'] && typescript_1.default.isTypeReferenceNode(output['default'].node)) {
            var typeName = this._typeNameToString(output['default'].node.typeName);
            // 确实是export default namespace
            if (namespaceExports[typeName]) {
                delete output['default'];
                // 遍历所有 typeName.XXX
                for (var key in namespaceExports[typeName]) {
                    // 内部也export的
                    if (namespaceExports[typeName][key]) {
                        // 增加 default.XXX 到 typeName.XXX 的引用
                        output['default.' + key] = {
                            node: typescript_1.default.createTypeReferenceNode(typeName + '.' + key, undefined),
                            isExport: true
                        };
                    }
                }
            }
        }
        return output;
    };
    AstParser.node2schema = function (node, imports) {
        var _this = this;
        // 去除外层括弧
        while (typescript_1.default.isParenthesizedTypeNode(node)) {
            node = node.type;
        }
        // AnyType
        if (node.kind === typescript_1.default.SyntaxKind.AnyKeyword) {
            return {
                type: 'Any'
            };
        }
        // BufferType
        if (typescript_1.default.isTypeReferenceNode(node)) {
            var ref = this._getReferenceTypeSchema(node.typeName, imports);
            if (BUFFER_TYPES.binarySearch(ref.target) > -1) {
                var output = {
                    type: 'Buffer'
                };
                var target = ref.target;
                if (target !== 'ArrayBuffer') {
                    output.arrayType = target;
                }
                return output;
            }
        }
        // BooleanType
        if (node.kind === typescript_1.default.SyntaxKind.BooleanKeyword) {
            return {
                type: 'Boolean'
            };
        }
        // NonPrimitiveType
        if (node.kind === typescript_1.default.SyntaxKind.ObjectKeyword) {
            return {
                type: 'NonPrimitive'
            };
        }
        // NumberType
        if (node.kind === typescript_1.default.SyntaxKind.NumberKeyword) {
            return {
                type: 'Number'
            };
        }
        else if (node.kind === typescript_1.default.SyntaxKind.BigIntKeyword) {
            return {
                type: 'Number',
                scalarType: 'bigint'
            };
        }
        // Scalar value types
        if (typescript_1.default.isTypeReferenceNode(node) && typescript_1.default.isIdentifier(node.typeName) && SCALAR_TYPES.binarySearch(node.typeName.text) > -1) {
            return {
                type: 'Number',
                scalarType: node.typeName.text
            };
        }
        // StringType
        if (node.kind === typescript_1.default.SyntaxKind.StringKeyword) {
            return { type: 'String' };
        }
        // ArrayType: xxx[]
        if (typescript_1.default.isArrayTypeNode(node)) {
            return {
                type: 'Array',
                elementType: this.node2schema(node.elementType, imports)
            };
        }
        // ArrayType: Array<T>
        if (this._isLocalReference(node, imports, 'Array') && node.typeArguments) {
            return {
                type: 'Array',
                elementType: this.node2schema(node.typeArguments[0], imports)
            };
        }
        // TupleType
        if (typescript_1.default.isTupleTypeNode(node)) {
            var optionalStartIndex_1;
            var output = {
                type: 'Tuple',
                elementTypes: node.elements.map(function (v, i) {
                    if (v.kind === typescript_1.default.SyntaxKind.OptionalType) {
                        if (optionalStartIndex_1 === undefined) {
                            optionalStartIndex_1 = i;
                        }
                        return _this.node2schema(v.type, imports);
                    }
                    else {
                        return _this.node2schema(v, imports);
                    }
                })
            };
            if (optionalStartIndex_1 !== undefined) {
                output.optionalStartIndex = optionalStartIndex_1;
            }
            return output;
        }
        // LiteralType
        // LiteralType: string | number | boolean
        if (typescript_1.default.isLiteralTypeNode(node)) {
            if (typescript_1.default.isStringLiteral(node.literal)) {
                return {
                    type: 'Literal',
                    literal: node.literal.text
                };
            }
            else if (typescript_1.default.isNumericLiteral(node.literal)) {
                return {
                    type: 'Literal',
                    literal: parseFloat(node.literal.text)
                };
            }
            else if (node.literal.kind === typescript_1.default.SyntaxKind.TrueKeyword) {
                return {
                    type: 'Literal',
                    literal: true
                };
            }
            else if (node.literal.kind === typescript_1.default.SyntaxKind.FalseKeyword) {
                return {
                    type: 'Literal',
                    literal: false
                };
            }
            else if (node.literal.kind === typescript_1.default.SyntaxKind.NullKeyword) {
                return {
                    type: 'Literal',
                    literal: null
                };
            }
        }
        // Literal: undefined
        else if (node.kind === typescript_1.default.SyntaxKind.UndefinedKeyword) {
            return {
                type: 'Literal',
                literal: undefined
            };
        }
        // EnumType
        if (typescript_1.default.isEnumDeclaration(node)) {
            var initializer_1 = 0;
            return {
                type: 'Enum',
                members: node.members.map(function (v, i) {
                    if (v.initializer) {
                        if (typescript_1.default.isStringLiteral(v.initializer)) {
                            initializer_1 = NaN;
                            return {
                                id: i,
                                value: v.initializer.text
                            };
                        }
                        else if (typescript_1.default.isNumericLiteral(v.initializer)) {
                            initializer_1 = parseFloat(v.initializer.text);
                            return {
                                id: i,
                                value: initializer_1++
                            };
                        }
                        // 负数
                        else if (typescript_1.default.isPrefixUnaryExpression(v.initializer) && v.initializer.operator === typescript_1.default.SyntaxKind.MinusToken) {
                            initializer_1 = parseFloat(v.initializer.operand.getText()) * -1;
                            return {
                                id: i,
                                value: initializer_1++
                            };
                        }
                        else {
                            console.log('initializer', v.initializer);
                            throw new Error('Enum initializer type error: ' + typescript_1.default.SyntaxKind[v.initializer.kind]);
                        }
                    }
                    else {
                        return {
                            id: i,
                            value: initializer_1++
                        };
                    }
                })
            };
        }
        // InterfaceType
        if (typescript_1.default.isInterfaceDeclaration(node) || typescript_1.default.isTypeLiteralNode(node)) {
            // extends
            var extendsInterface_1;
            if (typescript_1.default.isInterfaceDeclaration(node) && node.heritageClauses) {
                extendsInterface_1 = [];
                node.heritageClauses.forEach(function (v) {
                    v.types.forEach(function (type) {
                        extendsInterface_1.push(_this._getReferenceTypeSchema(type.getText(), imports));
                    });
                });
            }
            var properties_1 = [];
            var indexSignature_1;
            node.members.forEach(function (member, i) {
                // properties
                if (typescript_1.default.isPropertySignature(member)) {
                    if (typescript_1.default.isComputedPropertyName(member.name)) {
                        throw new Error('ComputedPropertyName is not supported at now');
                    }
                    if (!member.type) {
                        throw new Error("Field must have a type: " + member.name.text);
                    }
                    var property = {
                        id: i,
                        name: member.name.text,
                        type: _this.node2schema(member.type, imports)
                    };
                    // optional
                    if (member.questionToken) {
                        property.optional = true;
                    }
                    properties_1.push(property);
                }
                // indexSignature
                else if (typescript_1.default.isIndexSignatureDeclaration(member)) {
                    if (!member.type || !member.parameters[0].type) {
                        throw new Error('Error index signature: ' + member.getText());
                    }
                    var keyType = void 0;
                    if (member.parameters[0].type.kind === typescript_1.default.SyntaxKind.NumberKeyword) {
                        keyType = 'Number';
                    }
                    else {
                        keyType = 'String';
                    }
                    indexSignature_1 = {
                        keyType: keyType,
                        type: _this.node2schema(member.type, imports)
                    };
                }
            });
            // output
            var output = {
                type: 'Interface'
            };
            if (extendsInterface_1) {
                output.extends = extendsInterface_1.map(function (v, i) { return ({
                    id: i,
                    type: v
                }); });
            }
            if (properties_1.length) {
                output.properties = properties_1;
            }
            if (indexSignature_1) {
                output.indexSignature = indexSignature_1;
            }
            return output;
        }
        // IndexedAccessType
        if (typescript_1.default.isIndexedAccessTypeNode(node)) {
            // A['a']
            if (typescript_1.default.isLiteralTypeNode(node.indexType)) {
                var index = void 0;
                if (typescript_1.default.isStringLiteral(node.indexType.literal) || typescript_1.default.isNumericLiteral(node.indexType.literal)) {
                    index = node.indexType.literal.text;
                }
                else if (node.indexType.literal.kind === typescript_1.default.SyntaxKind.TrueKeyword
                    || node.indexType.literal.kind === typescript_1.default.SyntaxKind.FalseKeyword
                    || node.indexType.literal.kind === typescript_1.default.SyntaxKind.NullKeyword
                    || node.indexType.literal.kind === typescript_1.default.SyntaxKind.UndefinedKeyword) {
                    index = node.indexType.literal.getText();
                }
                else {
                    throw new Error("Error indexType literal: " + node.getText());
                }
                var objectType = this.node2schema(node.objectType, imports);
                if (!this._isInterfaceReference(objectType)) {
                    throw new Error("ObjectType for IndexedAccess must be interface or interface reference");
                }
                return {
                    type: 'IndexedAccess',
                    index: index,
                    objectType: objectType
                };
            }
            // A['a' | 'b']
            else if (typescript_1.default.isUnionTypeNode(node.indexType)) {
                // TODO UnionType
            }
            else {
                throw new Error("Error IndexedAccessType indexType: " + node.getText());
            }
        }
        // UnionType
        if (typescript_1.default.isUnionTypeNode(node)) {
            return {
                type: 'Union',
                members: node.types.map(function (v, i) { return ({
                    id: i,
                    type: _this.node2schema(v, imports)
                }); })
            };
        }
        // IntersectionType
        if (typescript_1.default.isIntersectionTypeNode(node)) {
            return {
                type: 'Intersection',
                members: node.types.map(function (v, i) { return ({
                    id: i,
                    type: _this.node2schema(v, imports)
                }); })
            };
        }
        // PickType & OmitType
        if (this._isLocalReference(node, imports, ['Pick', 'Omit'])) {
            var nodeName = node.typeName.getText();
            if (!node.typeArguments || node.typeArguments.length != 2) {
                throw new Error("Illeagle " + nodeName + "Type: " + node.getText());
            }
            var target = this.node2schema(node.typeArguments[0], imports);
            if (!this._isInterfaceReference(target)) {
                throw new Error("Illeagle " + nodeName + "Type: " + node.getText());
            }
            var output = Object.assign({
                target: target,
                keys: this._getPickKeys(this.node2schema(node.typeArguments[1], imports))
            }, nodeName === 'Pick' ? { type: 'Pick' } : { type: 'Omit' });
            return output;
        }
        // PartialType
        if (this._isLocalReference(node, imports, 'Partial')) {
            if (!node.typeArguments || node.typeArguments.length != 1) {
                throw new Error('Illeagle PartialType: ' + node.getText());
            }
            var target = this.node2schema(node.typeArguments[0], imports);
            if (!this._isInterfaceReference(target)) {
                throw new Error('Illeagle PartialType: ' + node.getText());
            }
            return {
                type: 'Partial',
                target: target
            };
        }
        // OverwriteType
        if (typescript_1.default.isTypeReferenceNode(node) && this._typeNameToString(node.typeName) === 'Overwrite') {
            if (!node.typeArguments || node.typeArguments.length != 2) {
                throw new Error("Illeagle OverwriteType: " + node.getText());
            }
            var target = this.node2schema(node.typeArguments[0], imports);
            if (!this._isInterfaceReference(target)) {
                throw new Error("Illeagle OverwriteType: " + node.getText());
            }
            var overwrite = this.node2schema(node.typeArguments[1], imports);
            if (!this._isInterfaceReference(overwrite)) {
                throw new Error("Illeagle OverwriteType: " + node.getText());
            }
            return {
                type: 'Overwrite',
                target: target,
                overwrite: overwrite
            };
        }
        // ReferenceType放最后（因为很多其它类型，如Pick等，都解析为ReferenceNode）
        if (typescript_1.default.isTypeReferenceNode(node)) {
            return this._getReferenceTypeSchema(node.typeName, imports);
        }
        console.debug(node);
        throw new Error('Cannot resolve type: ' + node.getText());
    };
    /**
     * A -> A
     * A.B -> A.B
     * @param name
     */
    AstParser._typeNameToString = function (name) {
        if (typescript_1.default.isIdentifier(name)) {
            return name.text;
        }
        else {
            var left = typescript_1.default.isIdentifier(name.left) ? name.left.text : this._typeNameToString(name.left);
            return left + '.' + name.right.text;
        }
    };
    AstParser._getReferenceTypeSchema = function (name, imports) {
        if (typeof name !== 'string') {
            name = this._typeNameToString(name);
        }
        var arrName = name.split('.');
        var importItem = imports[arrName[0]];
        if (importItem) {
            var importName = arrName.slice();
            importName[0] = importItem.targetName;
            return {
                type: 'Reference',
                target: importItem.path + '/' + importName.join('.')
            };
        }
        else {
            var ref = {
                type: 'Reference',
                target: name
            };
            return ref;
        }
    };
    AstParser._isLocalReference = function (node, imports, referenceName) {
        if (!typescript_1.default.isTypeReferenceNode(node)) {
            return false;
        }
        if (typeof referenceName === 'string') {
            referenceName = [referenceName];
        }
        var ref = this._getReferenceTypeSchema(node.typeName, imports);
        for (var _i = 0, referenceName_1 = referenceName; _i < referenceName_1.length; _i++) {
            var name_2 = referenceName_1[_i];
            if (ref.target.indexOf('/') === -1 && ref.target === name_2) {
                return name_2;
            }
        }
        return false;
    };
    AstParser._getPickKeys = function (schema) {
        var _this = this;
        if (schema.type === 'Union') {
            return schema.members.map(function (v) { return _this._getPickKeys(v.type); }).reduce(function (prev, next) { return prev.concat(next); }, []).distinct();
        }
        else if (schema.type === 'Intersection') {
            return schema.members.map(function (v) { return _this._getPickKeys(v.type); }).reduce(function (prev, next) { return prev.filter(function (v) { return next.indexOf(v) > -1; }); });
        }
        else if (schema.type === 'Literal') {
            return ['' + schema.literal];
        }
        else {
            console.log('Illeagle Pick keys:', schema);
            throw new Error('Illeagle Pick keys: ' + JSON.stringify(schema, null, 2));
        }
    };
    AstParser._isInterfaceReference = function (schema) {
        return this._isTypeReference(schema) ||
            schema.type === 'Interface' ||
            schema.type === 'Pick' ||
            schema.type === 'Partial' ||
            schema.type === 'Omit' ||
            schema.type === 'Overwrite';
    };
    AstParser._isTypeReference = function (schema) {
        return schema.type === 'Reference' || schema.type === 'IndexedAccess';
    };
    return AstParser;
}());
exports.AstParser = AstParser;
