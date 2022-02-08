# CHANGELOG

## [1.7.0-dev.2] - 2022-02-08
### Added
- Support `keyof`
- Support `Pick<XXX, keyof XXX>`
- Support `Pick<XXX, TypeReference>`
- Support `Pick<UnionType>` and `Pick<IntersectionType>`, the same to `Omit`

## [1.6.0] - 2021-12-18
### Added
- Add `keepRemark` option for generate proto.

## [1.5.0] - 2021-11-08
### Changed
- Update dependencies

## [1.4.9] - 2021-10-17
### Added
- Support change global reference by using `resolveModule` and `astCache` together.
- Add `customSchemaIds`.

## [1.4.8] - 2021-10-17
### Fixed
- `canOptimized` 检测阈值改为 32 和 4096，考虑到 ID 末 2 位的长度标识。

## [1.4.6] - 2021-10-05
### Added
- Add `options.logger`
- Optimize error log
- All `"` to `'`