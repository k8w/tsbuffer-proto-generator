Supported Type List
---

- AnyType
    - `any`
- BufferType
    - `ArrayBuffer`
    - TypedArray: `Uint8Array` ...
- BooleanType
    - `boolean`
- NonPrimitiveType
    - `object`
- NumberType
    - `number`
    - ExtraScalarTypes
        - `[u]int8~64`
        - `float32/64`
- StringType
    - `string`
- ArrayType
    - `string[]`
    - `Array<string>`
- TupleType
    - `[number, string, {a:string}]`
- LiteralType
    - StringLiteral: `'XXX'`
    - NumberLiteral: `123`
    - BooleanLiteral: `true` `false`
    - Null/Undefined: `null` `undefined`
- EnumType
    - `Enum XXX { a, b=100, c}
- ReferenceType
    - `OtherTypeName`
    - Support import from other file
- Interface
    - InterfaceDeclaration
    - TypeLiteral
    - IndexSignatureType
    - optional fields
- IndexAccessedType
    - `A['b']`
- UnionType
    - `A | B`
- IntersectionType
    - `A & B`
- PickType
    - `Pick<A, 'a'|'b'>
- PartialType
    - `Partial<A>`
- OmitType
    - `OmitType<A, 'a'|'b'>`
- OverwriteType
    - `OverwriteType<A, {a: string}>`