import Crypto from 'k8w-crypto';
import TSBufferSchema from 'tsbuffer-schema';
import EnumTypeSchema from 'tsbuffer-schema/src/schemas/EnumTypeSchema';
import InterfaceTypeSchema from 'tsbuffer-schema/src/schemas/InterfaceTypeSchema';
import IntersectionTypeSchema from 'tsbuffer-schema/src/schemas/IntersectionTypeSchema';
import UnionTypeSchema from 'tsbuffer-schema/src/schemas/UnionTypeSchema';

export default class EncodeIdUtil {

    /**
    * 将字符串映射为从0开始的自增数字，支持向后兼容
    * @param values object将视为 md5(JSON.stringify(obj))
    * @param compatible 需要向后兼容的结果集（新字段用新数字，旧字段ID不变）
    * @return 返回的顺序必定与values传入的顺序相同
    */
    static genEncodeIds(values: (string | number | object)[], compatible?: EncodeIdItem[]): EncodeIdItem[] {
        let strs = values.map(v => this.getKey(v));
        // 无compatible 按传入顺序生成
        if (!compatible) {
            let keyId: { [key: string]: number } = {};
            let output: EncodeIdItem[] = [];
            let id = 0;
            for (let str of strs) {
                // 已有这个key
                if (keyId[str] === undefined) {
                    keyId[str] = id++;
                }
                output.push({ key: str, id: keyId[str] });
            }
            return output;
        }

        // 有compatible
        // 先生成可用最小ID列表
        let existIds = compatible.map(v => v.id).orderBy(v => v);
        let keyOrderedCp = compatible.orderBy(v => v.key);    // 按key排序，便于之后二分查找
        let availableIds = Array.from({ length: existIds.last() + 1 }, (v, i) => i);
        for (let i = 0; i < existIds.length; ++i) {
            availableIds.removeOne(existIds[i]);
        }
        // 已有ID是顺序且严密的，直接从下一个开始编码
        availableIds.push(existIds.last() + 1);

        // 防止有重复的2个Key 用于去重的临时变量
        let keyId: { [key: string]: number } = {};

        return strs.map(str => {
            // 除非Key重复 用已有结果
            if (keyId[str] === undefined) {
                // Compatible中已有，用已有的
                let compatibleIndex = keyOrderedCp.binarySearch(str, v => v.key);
                if (compatibleIndex > -1) {
                    keyId[str] = keyOrderedCp[compatibleIndex].id;
                }
                // 否则 选择下一个最小可用ID
                else {
                    let id = availableIds.shift()!;
                    if (availableIds.length === 0) {
                        availableIds.push(id + 1)
                    }
                    keyId[str] = id;
                }
            }

            return { key: str, id: keyId[str] };
        });
    }

    static getSchemaEncodeKeys(schema: TSBufferSchema): string[] {
        switch (schema.type) {
            case 'Enum': {
                return schema.members.map(v => '' + v.value);
            }
            case 'Interface': {
                return schema.properties ? schema.properties.map(v => v.name) : [];
            }
            case 'Intersection':
            case 'Union':
                return schema.members.map(v => Crypto.md5(JSON.stringify(v.type)));
            default:
                return [];
        }
    }

    static getKey(value: string | number | object): string {
        return typeof (value) === 'object' ? Crypto.md5(JSON.stringify(value)) : '' + value;
    }

    static getSchemaEncodeIds(schema?: TSBufferSchema): EncodeIdItem[] | undefined {
        if (!schema) {
            return undefined;
        }

        switch (schema.type) {
            case 'Enum': {
                return schema.members.map(v => ({ key: EncodeIdUtil.getKey(v.value), id: v.id }));
            }
            case 'Interface': {
                return schema.properties ? schema.properties.map(v => ({ key: EncodeIdUtil.getKey(v.name), id: v.id })) : undefined;
            }
            case 'Intersection':
            case 'Union':
                return schema.members.map(v => ({ key: Crypto.md5(JSON.stringify(v.type)), id: v.id }));
            default:
                return undefined;
        }
    }

    /**
     * 获取所有是 [有编码ID] 或子项是 [有编码ID] 的Schema
     * 注意：不会去循环遍历引用
     * @param schemas 
     */
    // static getEncodeIdSchemas(schemas: TSBufferSchema | TSBufferSchema[]): {
    //     path: string,
    //     targetName: string,
    //     schema: EncodeIdSchema
    // }[] {
    //     if (!Array.isArray(schemas)) {
    //         schemas = [schemas];
    //     }

    //     let output: EncodeIdSchema[] = [];

    //     for (let schema of schemas) {
    //         switch (schema.type) {
    //             case 'Enum':
    //                 output.push(schema);
    //                 break;
    //             case 'Interface':
    //                 output.push(schema);
    //                 output
    //                 break;
    //             case 'Intersection':
    //             case 'Union':
    //                 output.push(schema);
    //                 break;
    //         }
    //     }

    //     return output;
    // }
}

export interface EncodeIdItem {
    key: string,
    id: number
}

export type EncodeIdSchema = EnumTypeSchema | InterfaceTypeSchema | IntersectionTypeSchema | UnionTypeSchema;