# Changelog

All notable changes to this project are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Prefix and quote formula-like CSV text cells, including source names and log
  examples. JSON retains original values; document spreadsheet import limitations.

- Preserve original file line numbers for sensitive findings when multiline
  entries contain blank lines, including CSV and JSON exports.

- Compute chronological timestamp bounds for unsorted timezone-qualified logs,
  preserving fractional precision and original timestamp text. For ambiguous or
  invalid timestamps, label first/last as file order rather than a time range.
- Include timestamp ordering mode in CSV and JSON reports.

## [0.3.1] - 2026-10-08

### Fixed

- Mask truncated quoted credential values through the end of their line,
  preserving missing closing quotes and line breaks. A bare `Bearer` no longer
  consumes the next line, and a redaction marker followed by a suffix is masked.

- Detect and mask JSON-style credential assignments and complete quoted values
  containing spaces or escaped quotes. Empty assignments no longer consume text
  from the next line, and masking an already masked assignment counts no change.

- Ignore late file reads after selecting another file (including an invalid
  selection), clearing, loading a sample, editing the input/source or masking
  sensitive values. Old results and errors cannot overwrite the newer action.
- Show which file is being read and clear outdated file status on manual edits.

## [0.3.0] - 2026-09-28

### Added

- Local `.log`, `.txt`, `.out` and `.json` file opening with a 2 MB browser safety limit.
- A keyboard-focusable, labelled report preview for easier screen-reader and keyboard review.
- One-click local masking for detected API keys, passwords, bearer tokens, JWTs, AWS access keys and email addresses.

## [0.2.0] - 2026-09-21

### Added

- Multiline stack trace folding so JavaScript, Python, Go panic and JVM-style continuation frames stay attached to the previous log entry.
- Report summary fields for continuation lines and stack trace lines.
- Report preview panel with CSV/JSON toggles, visible line counts and clipboard copy support.
- Possible sensitive line detection for tokens, API keys, JWTs, AWS access keys and email addresses.
- Sample log presets for stack trace, sensitive data review and latency burst scenarios.

## [0.1.0] - 2026-09-21

### Added

- First release: browser-only log triage with level counts, timestamp coverage,
  repeated normalized message patterns and observed time range.
- CSV and JSON report downloads generated in the browser.
- Tests for log parsing, pattern normalization and report generation.
- GitHub Actions CI and GitHub Pages deployment workflow.

[Unreleased]: https://github.com/vugarbbakhishov-hub/log-pattern-lens/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/vugarbbakhishov-hub/log-pattern-lens/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/vugarbbakhishov-hub/log-pattern-lens/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/vugarbbakhishov-hub/log-pattern-lens/releases/tag/v0.1.0
