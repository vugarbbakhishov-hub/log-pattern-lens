# Changelog

All notable changes to this project are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Multiline stack trace folding so JavaScript, Python, Go panic and JVM-style continuation frames stay attached to the previous log entry.
- Report summary fields for continuation lines and stack trace lines.
- Report preview panel with CSV/JSON toggles, visible line counts and clipboard copy support.

## [0.1.0] - 2026-09-21

### Added

- First release: browser-only log triage with level counts, timestamp coverage,
  repeated normalized message patterns and observed time range.
- CSV and JSON report downloads generated in the browser.
- Tests for log parsing, pattern normalization and report generation.
- GitHub Actions CI and GitHub Pages deployment workflow.

[Unreleased]: https://github.com/vugarbbakhishov-hub/log-pattern-lens/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/vugarbbakhishov-hub/log-pattern-lens/releases/tag/v0.1.0
