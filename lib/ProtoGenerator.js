"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtoGenerator = void 0;
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var AstParser_1 = require("./AstParser");
var SchemaUtil_1 = require("./SchemaUtil");
var EncodeIdUtil_1 = require("./EncodeIdUtil");
var ProtoGenerator = /** @class */ (function () {
    function ProtoGenerator(options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        this.options = {
            baseDir: '.',
            verbose: false,
            readFile: (function (v) { return fs_1.default.readFileSync(path_1.default.resolve(_this.options.baseDir, v)).toString(); }),
            /** 默认将module解析为baseDir下的node_modules */
            resolveModule: function (importPath) { return path_1.default.join('node_modules', importPath); }
        };
        Object.assign(this.options, options);
    }
    /**
     * 生成FileSchema
     * 对modules（例如node_modules）的引用，也会全部转为相对路径引用
     * @param paths 于baseDir的相对路径
     * @param options
     */
    ProtoGenerator.prototype.generate = function (paths, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var output, astCache, filter, exports, _i, paths_1, filepath, _a, ast, astKey, _b, _c, _d, name_1;
            var _this = this;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        output = {};
                        if (typeof paths === 'string') {
                            paths = [paths];
                        }
                        // 确保路径安全，再次将paths转为相对路径
                        paths = paths.map(function (v) { return path_1.default.relative(_this.options.baseDir, path_1.default.resolve(_this.options.baseDir, v)); });
                        if (this.options.verbose) {
                            console.debug('[TSBuffer Schema Generator]', 'generate', "Ready to generate " + paths.length + " file");
                            console.debug('[TSBuffer Schema Generator]', 'generate', 'BaseDir=' + this.options.baseDir);
                        }
                        astCache = {};
                        filter = options.filter || (function (v) { return v.isExport; });
                        exports = {};
                        _i = 0, paths_1 = paths;
                        _e.label = 1;
                    case 1:
                        if (!(_i < paths_1.length)) return [3 /*break*/, 8];
                        filepath = paths_1[_i];
                        if (this.options.verbose) {
                            console.debug('[TSBuffer Schema Generator]', 'generate', 'FilePath=' + filepath);
                        }
                        return [4 /*yield*/, this._getAst(filepath, astCache)];
                    case 2:
                        _a = _e.sent(), ast = _a.ast, astKey = _a.astKey;
                        if (this.options.verbose) {
                            console.debug('[TSBuffer Schema Generator]', 'generate', 'AstLoaded Key=' + astKey);
                        }
                        _b = [];
                        for (_c in ast)
                            _b.push(_c);
                        _d = 0;
                        _e.label = 3;
                    case 3:
                        if (!(_d < _b.length)) return [3 /*break*/, 7];
                        name_1 = _b[_d];
                        if (!filter({
                            path: filepath,
                            name: name_1,
                            isExport: ast[name_1].isExport
                        })) return [3 /*break*/, 5];
                        if (this.options.verbose) {
                            console.debug('[TSBuffer Schema Generator]', 'generate', "filter passed: " + name_1 + " at " + filepath);
                        }
                        // 记入exports
                        if (!exports[filepath]) {
                            exports[filepath] = [];
                        }
                        exports[filepath].push(name_1);
                        // 加入output
                        return [4 /*yield*/, this._addToOutput(astKey, name_1, ast[name_1].schema, output, astCache)];
                    case 4:
                        // 加入output
                        _e.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        if (this.options.verbose) {
                            console.debug('[TSBuffer Schema Generator]', 'generate', "filter not passed: " + name_1 + " at " + filepath);
                        }
                        _e.label = 6;
                    case 6:
                        _d++;
                        return [3 /*break*/, 3];
                    case 7:
                        _i++;
                        return [3 /*break*/, 1];
                    case 8:
                        // flatten
                        // 重新生成EncodeId
                        this._regenResultEncodeIds(output, options.compatibleResult);
                        return [2 /*return*/, output];
                }
            });
        });
    };
    /**
     * 重新生成EncodeId
     * @param output
     * @param compatibleResult
     */
    ProtoGenerator.prototype._regenResultEncodeIds = function (output, compatibleResult) {
        for (var schemaId in output) {
            this._regenSchemaEncodeIds(output[schemaId], compatibleResult && compatibleResult[schemaId]);
        }
    };
    ProtoGenerator.prototype._regenSchemaEncodeIds = function (schema, compatibleSchema) {
        // 不仅要有 还要是同类型才行
        if (compatibleSchema && compatibleSchema.type !== schema.type) {
            compatibleSchema = undefined;
        }
        switch (schema.type) {
            case 'Enum': {
                var cpIds_1 = EncodeIdUtil_1.EncodeIdUtil.getSchemaEncodeIds(compatibleSchema);
                var ids_1 = EncodeIdUtil_1.EncodeIdUtil.genEncodeIds(EncodeIdUtil_1.EncodeIdUtil.getSchemaEncodeKeys(schema), cpIds_1);
                for (var i = 0; i < ids_1.length; ++i) {
                    schema.members[i].id = ids_1[i].id;
                }
                break;
            }
            case 'Interface': {
                // extends
                if (schema.extends) {
                    var cpExtends = compatibleSchema && compatibleSchema.extends;
                    var cpIds_2 = cpExtends && cpExtends.map(function (v) { return ({
                        key: JSON.stringify(v.type),
                        id: v.id
                    }); });
                    var ids_2 = EncodeIdUtil_1.EncodeIdUtil.genEncodeIds(schema.extends.map(function (v) { return JSON.stringify(v.type); }), cpIds_2);
                    for (var i = 0; i < ids_2.length; ++i) {
                        schema.extends[i].id = ids_2[i].id;
                    }
                }
                // properties
                if (schema.properties) {
                    var cpIds_3 = EncodeIdUtil_1.EncodeIdUtil.getSchemaEncodeIds(compatibleSchema);
                    var ids_3 = EncodeIdUtil_1.EncodeIdUtil.genEncodeIds(EncodeIdUtil_1.EncodeIdUtil.getSchemaEncodeKeys(schema), cpIds_3);
                    var cpSchemaProps = compatibleSchema && compatibleSchema.properties;
                    var _loop_1 = function (i) {
                        // 更新ID
                        schema.properties[i].id = ids_3[i].id;
                        // 递归子项
                        var subCpProp = cpSchemaProps && cpSchemaProps.find(function (v) { return v.name === schema.properties[i].name; });
                        this_1._regenSchemaEncodeIds(schema.properties[i].type, subCpProp ? subCpProp.type : undefined);
                    };
                    var this_1 = this;
                    for (var i = 0; i < ids_3.length; ++i) {
                        _loop_1(i);
                    }
                }
                // indexSignature
                if (schema.indexSignature) {
                    var cpIndexSignature = compatibleSchema
                        && compatibleSchema.indexSignature
                        && compatibleSchema.indexSignature.type || undefined;
                    this._regenSchemaEncodeIds(schema.indexSignature.type, cpIndexSignature);
                }
                break;
            }
            case 'Intersection':
            case 'Union':
                var cpIds = EncodeIdUtil_1.EncodeIdUtil.getSchemaEncodeIds(compatibleSchema);
                var ids_4 = EncodeIdUtil_1.EncodeIdUtil.genEncodeIds(EncodeIdUtil_1.EncodeIdUtil.getSchemaEncodeKeys(schema), cpIds);
                var _loop_2 = function (i) {
                    schema.members[i].id = ids_4[i].id;
                    // 递归子项
                    var subCpMember = compatibleSchema
                        && compatibleSchema.members.find(function (v) { return v.id === ids_4[i].id; });
                    var subCpSchema = subCpMember && subCpMember.type;
                    this_2._regenSchemaEncodeIds(schema.members[i].type, subCpSchema);
                };
                var this_2 = this;
                for (var i = 0; i < ids_4.length; ++i) {
                    _loop_2(i);
                }
                break;
            case 'Array':
                // TODO elementType
                this._regenSchemaEncodeIds(schema.elementType, compatibleSchema && compatibleSchema.elementType);
                break;
            case 'IndexedAccess':
                this._regenSchemaEncodeIds(schema.objectType, compatibleSchema && compatibleSchema.objectType);
                break;
            case 'Tuple':
                for (var i = 0; i < schema.elementTypes.length; ++i) {
                    this._regenSchemaEncodeIds(schema.elementTypes[i], compatibleSchema && compatibleSchema.elementTypes[i]);
                }
                break;
        }
    };
    ProtoGenerator.prototype._getAst = function (pathOrKey, astCache) {
        return __awaiter(this, void 0, void 0, function () {
            var astKey, fileContent, postfixs, _i, postfixs_1, postfix, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        astKey = pathOrKey.replace(/\\/g, '/').replace(/(\.d)?\.ts$/, '');
                        if (!!astCache[astKey]) return [3 /*break*/, 8];
                        fileContent = void 0;
                        postfixs = ['.ts', '.d.ts', '/index.ts', '/index.d.ts'];
                        _i = 0, postfixs_1 = postfixs;
                        _b.label = 1;
                    case 1:
                        if (!(_i < postfixs_1.length)) return [3 /*break*/, 7];
                        postfix = postfixs_1[_i];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.options.readFile(astKey + postfix)];
                    case 3:
                        fileContent = _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        _a = _b.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        // 未出错 说明解析到文件
                        if (postfix.startsWith('/')) {
                            astKey = astKey + '/index';
                        }
                        return [3 /*break*/, 7];
                    case 6:
                        _i++;
                        return [3 /*break*/, 1];
                    case 7:
                        // 找不到文件，报错
                        if (fileContent === undefined) {
                            throw new Error("Cannot resolve file: " + path_1.default.resolve(this.options.baseDir, astKey));
                        }
                        astCache[astKey] = AstParser_1.AstParser.parseScript(fileContent);
                        _b.label = 8;
                    case 8: return [2 /*return*/, {
                            ast: astCache[astKey],
                            astKey: astKey
                        }];
                }
            });
        });
    };
    ProtoGenerator.prototype._addToOutput = function (astKey, name, schema, output, astCache) {
        return __awaiter(this, void 0, void 0, function () {
            var schemaId, refs, _i, refs_1, ref, refPath, pathMatch, refAst, refTargetNames, nameArr, i, refName, j, refTargetName, certainRefTargetName, _a, refTargetNames_1, refTargetName_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this.options.verbose) {
                            console.debug('[TSBuffer Schema Generator]', "addToOutput(" + astKey + ", " + name + "})");
                        }
                        schemaId = astKey + '/' + name;
                        if (output[schemaId]) {
                            // Already added
                            return [2 /*return*/];
                        }
                        output[schemaId] = schema;
                        refs = SchemaUtil_1.SchemaUtil.getUsedReferences(schema);
                        if (this.options.verbose) {
                            console.debug('[TSBuffer Schema Generator]', "addToOutput(" + astKey + ", " + name + "})", "refs.length=" + refs.length);
                        }
                        _i = 0, refs_1 = refs;
                        _b.label = 1;
                    case 1:
                        if (!(_i < refs_1.length)) return [3 /*break*/, 6];
                        ref = refs_1[_i];
                        if (this.options.verbose) {
                            console.debug('[TSBuffer Schema Generator]', "addToOutput(" + astKey + ", " + name + "})", "target=" + ref.target);
                        }
                        refPath = void 0;
                        pathMatch = ref.target.match(/(.*)\/(.*)$/);
                        if (pathMatch) {
                            // 相对路径引用
                            if (ref.target.startsWith('.')) {
                                refPath = path_1.default.join(astKey, '..', pathMatch[1]);
                            }
                            // 绝对路径引用 resolveModule
                            else {
                                if (!this.options.resolveModule) {
                                    throw new Error("Must specific a resolveModule handler for resolve \"" + pathMatch[1] + "\"");
                                }
                                refPath = this.options.resolveModule(pathMatch[1], this.options.baseDir);
                            }
                        }
                        // 当前文件内引用
                        else {
                            refPath = astKey;
                        }
                        if (this.options.verbose) {
                            console.debug('[TSBuffer Schema Generator]', "addToOutput(" + astKey + ", " + name + "})", "AST \"" + refPath + "\" loading");
                        }
                        return [4 /*yield*/, this._getAst(refPath, astCache)];
                    case 2:
                        refAst = _b.sent();
                        if (this.options.verbose) {
                            console.debug('[TSBuffer Schema Generator]', "addToOutput(" + astKey + ", " + name + "})", "AST \"" + refPath + "\" loaded");
                        }
                        refTargetNames = [];
                        // 文件内&Namespace内引用，从Namespace向外部 逐级寻找
                        if (!pathMatch && name.indexOf('.') > 0) {
                            nameArr = name.split('.');
                            for (i = nameArr.length - 1; i >= 1; --i) {
                                refName = '';
                                for (j = 0; j < i; ++j) {
                                    refName += nameArr[j] + ".";
                                }
                                refTargetNames.push(refName + ref.target);
                            }
                        }
                        refTargetName = pathMatch ? pathMatch[2] : ref.target;
                        refTargetNames.push(refTargetName);
                        certainRefTargetName = void 0;
                        for (_a = 0, refTargetNames_1 = refTargetNames; _a < refTargetNames_1.length; _a++) {
                            refTargetName_1 = refTargetNames_1[_a];
                            if (refAst.ast[refTargetName_1]) {
                                certainRefTargetName = refTargetName_1;
                                break;
                            }
                        }
                        if (this.options.verbose) {
                            console.debug('[TSBuffer Schema Generator]', "addToOutput(" + astKey + ", " + name + "})", "refTargetName=" + certainRefTargetName);
                        }
                        if (!certainRefTargetName) return [3 /*break*/, 4];
                        // 修改源reference的target
                        ref.target = refAst.astKey + '/' + certainRefTargetName;
                        // 将ref加入output
                        return [4 /*yield*/, this._addToOutput(refAst.astKey, certainRefTargetName, refAst.ast[certainRefTargetName].schema, output, astCache)];
                    case 3:
                        // 将ref加入output
                        _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        console.debug('current', astKey, name);
                        console.debug('ref', ref);
                        console.debug('schema', schema);
                        throw new Error("Cannot find reference target \"" + ref.target + "\"");
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    return ProtoGenerator;
}());
exports.ProtoGenerator = ProtoGenerator;
