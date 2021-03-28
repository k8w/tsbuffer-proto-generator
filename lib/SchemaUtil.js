"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaUtil = void 0;
var SchemaUtil = /** @class */ (function () {
    function SchemaUtil() {
    }
    /**
     * 解析一个Schema引用到的其它类型
     * @param schema
     */
    SchemaUtil.getUsedReferences = function (schemas) {
        if (!Array.isArray(schemas)) {
            schemas = [schemas];
        }
        var output = [];
        for (var _i = 0, schemas_1 = schemas; _i < schemas_1.length; _i++) {
            var schema = schemas_1[_i];
            switch (schema.type) {
                case 'Array':
                    output = output.concat(this.getUsedReferences(schema.elementType));
                    break;
                case 'Tuple':
                    output = output.concat(this.getUsedReferences(schema.elementTypes));
                    break;
                case 'Interface':
                    if (schema.extends) {
                        output = output.concat(this.getUsedReferences(schema.extends.map(function (v) { return v.type; })));
                    }
                    if (schema.properties) {
                        output = output.concat(this.getUsedReferences(schema.properties.map(function (v) { return v.type; })));
                    }
                    if (schema.indexSignature) {
                        output = output.concat(this.getUsedReferences(schema.indexSignature.type));
                    }
                    break;
                case 'IndexedAccess':
                    output = output.concat(this.getUsedReferences(schema.objectType));
                    break;
                case 'Reference':
                    output.push(schema);
                    break;
                case 'Union':
                case 'Intersection':
                    output = output.concat(this.getUsedReferences(schema.members.map(function (v) { return v.type; })));
                    break;
                case 'Pick':
                case 'Omit':
                case 'Partial':
                    output = output.concat(this.getUsedReferences(schema.target));
                    break;
                case 'Overwrite':
                    output = output.concat(this.getUsedReferences(schema.target));
                    output = output.concat(this.getUsedReferences(schema.overwrite));
                    break;
                default:
                    break;
            }
        }
        return output;
    };
    return SchemaUtil;
}());
exports.SchemaUtil = SchemaUtil;
