import { TSBufferSchema } from 'tsbuffer-schema';
import { ReferenceTypeSchema } from 'tsbuffer-schema/src/schemas/ReferenceTypeSchema';

export class SchemaUtil {
    /**
     * 解析一个Schema引用到的其它类型
     * @param schema 
     */
    static getUsedReferences(schemas: TSBufferSchema | TSBufferSchema[]): ReferenceTypeSchema[] {
        if (!Array.isArray(schemas)) {
            schemas = [schemas];
        }

        let output: ReferenceTypeSchema[] = [];

        for (let schema of schemas) {
            switch (schema.type) {
                case 'Array':
                    output = output.concat(this.getUsedReferences(schema.elementType));
                    break;
                case 'Tuple':
                    output = output.concat(this.getUsedReferences(schema.elementTypes));
                    break;
                case 'Interface':
                    if (schema.extends) {
                        output = output.concat(this.getUsedReferences(schema.extends));
                    }
                    if (schema.properties) {
                        output = output.concat(this.getUsedReferences(schema.properties.map(v => v.type)));
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
                    output = output.concat(this.getUsedReferences(schema.members.map(v => v.type)));
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
    }
}