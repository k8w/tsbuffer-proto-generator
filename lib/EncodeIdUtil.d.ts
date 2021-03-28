import { EnumTypeSchema, InterfaceTypeSchema, IntersectionTypeSchema, TSBufferSchema, UnionTypeSchema } from 'tsbuffer-schema';
export declare class EncodeIdUtil {
    /**
    * 将字符串映射为从0开始的自增数字，支持向后兼容
    * @param values object将视为 md5(JSON.stringify(obj))
    * @param compatible 需要向后兼容的结果集（新字段用新数字，旧字段ID不变）
    * @return 返回的顺序必定与values传入的顺序相同
    */
    static genEncodeIds(values: (string | number | object)[], compatible?: EncodeIdItem[]): EncodeIdItem[];
    static getSchemaEncodeKeys(schema: TSBufferSchema): string[];
    static getKey(value: string | number | object): string;
    static getSchemaEncodeIds(schema?: TSBufferSchema): EncodeIdItem[] | undefined;
}
export interface EncodeIdItem {
    key: string;
    id: number;
}
export declare type EncodeIdSchema = EnumTypeSchema | InterfaceTypeSchema | IntersectionTypeSchema | UnionTypeSchema;
//# sourceMappingURL=EncodeIdUtil.d.ts.map