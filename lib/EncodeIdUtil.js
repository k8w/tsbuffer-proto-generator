"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncodeIdUtil = void 0;
var k8w_crypto_1 = require("k8w-crypto");
var EncodeIdUtil = /** @class */ (function () {
    function EncodeIdUtil() {
    }
    /**
    * 将字符串映射为从0开始的自增数字，支持向后兼容
    * @param values object将视为 md5(JSON.stringify(obj))
    * @param compatible 需要向后兼容的结果集（新字段用新数字，旧字段ID不变）
    * @return 返回的顺序必定与values传入的顺序相同
    */
    EncodeIdUtil.genEncodeIds = function (values, compatible) {
        var _this = this;
        var strs = values.map(function (v) { return _this.getKey(v); });
        // 无compatible 按传入顺序生成
        if (!compatible) {
            var keyId_1 = {};
            var output = [];
            var id = 0;
            for (var _i = 0, strs_1 = strs; _i < strs_1.length; _i++) {
                var str = strs_1[_i];
                // 已有这个key
                if (keyId_1[str] === undefined) {
                    keyId_1[str] = id++;
                }
                output.push({ key: str, id: keyId_1[str] });
            }
            return output;
        }
        // 有compatible
        // 先生成可用最小ID列表
        var existIds = compatible.map(function (v) { return v.id; }).orderBy(function (v) { return v; });
        var keyOrderedCp = compatible.orderBy(function (v) { return v.key; }); // 按key排序，便于之后二分查找
        var availableIds = Array.from({ length: existIds.last() + 1 }, function (v, i) { return i; });
        for (var i = 0; i < existIds.length; ++i) {
            availableIds.removeOne(existIds[i]);
        }
        // 已有ID是顺序且严密的，直接从下一个开始编码
        availableIds.push(existIds.last() + 1);
        // 防止有重复的2个Key 用于去重的临时变量
        var keyId = {};
        return strs.map(function (str) {
            // 除非Key重复 用已有结果
            if (keyId[str] === undefined) {
                // Compatible中已有，用已有的
                var compatibleIndex = keyOrderedCp.binarySearch(str, function (v) { return v.key; });
                if (compatibleIndex > -1) {
                    keyId[str] = keyOrderedCp[compatibleIndex].id;
                }
                // 否则 选择下一个最小可用ID
                else {
                    var id = availableIds.shift();
                    if (availableIds.length === 0) {
                        availableIds.push(id + 1);
                    }
                    keyId[str] = id;
                }
            }
            return { key: str, id: keyId[str] };
        });
    };
    EncodeIdUtil.getSchemaEncodeKeys = function (schema) {
        switch (schema.type) {
            case 'Enum': {
                return schema.members.map(function (v) { return '' + v.value; });
            }
            case 'Interface': {
                return schema.properties ? schema.properties.map(function (v) { return v.name; }) : [];
            }
            case 'Intersection':
            case 'Union':
                return schema.members.map(function (v) { return k8w_crypto_1.Crypto.md5(JSON.stringify(v.type)); });
            default:
                return [];
        }
    };
    EncodeIdUtil.getKey = function (value) {
        return typeof (value) === 'object' ? k8w_crypto_1.Crypto.md5(JSON.stringify(value)) : '' + value;
    };
    EncodeIdUtil.getSchemaEncodeIds = function (schema) {
        if (!schema) {
            return undefined;
        }
        switch (schema.type) {
            case 'Enum': {
                return schema.members.map(function (v) { return ({ key: EncodeIdUtil.getKey(v.value), id: v.id }); });
            }
            case 'Interface': {
                return schema.properties ? schema.properties.map(function (v) { return ({ key: EncodeIdUtil.getKey(v.name), id: v.id }); }) : undefined;
            }
            case 'Intersection':
            case 'Union':
                return schema.members.map(function (v) { return ({ key: k8w_crypto_1.Crypto.md5(JSON.stringify(v.type)), id: v.id }); });
            default:
                return undefined;
        }
    };
    return EncodeIdUtil;
}());
exports.EncodeIdUtil = EncodeIdUtil;
