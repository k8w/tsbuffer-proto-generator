# CHANGELOG

## [1.4.9-dev.0] - 2021-10-17
### Added
- 支持通过 `resolveModule` 和 `astCache` 自定义全局引用解析方式。
### Fixed
- `resolveModule` 考虑 `baseDir` 的值。

## [1.4.8] - 2021-10-17
### Fixed
- `canOptimized` 检测阈值改为 32 和 4096，考虑到 ID 末 2 位的长度标识。

## [1.4.6] - 2021-10-05
### Added
- Add `options.logger`
- Optimize error log
- All `"` to `'`