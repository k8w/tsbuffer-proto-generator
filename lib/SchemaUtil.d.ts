import { ReferenceTypeSchema, TSBufferSchema } from 'tsbuffer-schema';
export declare class SchemaUtil {
    /**
     * 解析一个Schema引用到的其它类型
     * @param schema
     */
    static getUsedReferences(schemas: TSBufferSchema | TSBufferSchema[]): ReferenceTypeSchema[];
}
//# sourceMappingURL=SchemaUtil.d.ts.map