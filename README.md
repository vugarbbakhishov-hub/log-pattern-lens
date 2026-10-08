# Log Pattern Lens

[![CI](https://github.com/vugarbbakhishov-hub/log-pattern-lens/actions/workflows/ci.yml/badge.svg)](https://github.com/vugarbbakhishov-hub/log-pattern-lens/actions/workflows/ci.yml) [![Deploy GitHub Pages](https://github.com/vugarbbakhishov-hub/log-pattern-lens/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/vugarbbakhishov-hub/log-pattern-lens/actions/workflows/deploy-pages.yml)

Log Pattern Lens is a browser-only React and TypeScript utility for quick log triage. Paste a log excerpt, then review level counts, repeated message patterns, timestamp coverage and the observed time range. Reports can be saved as CSV or JSON without uploading the log contents anywhere.

## Live demo

The project is published with GitHub Pages:

https://vugarbbakhishov-hub.github.io/log-pattern-lens/

Latest release: [v0.3.1](https://github.com/vugarbbakhishov-hub/log-pattern-lens/releases/tag/v0.3.1),
with corrected credential masking and reliable file switching.

## Features

- Paste logs directly into the browser
- Open `.log`, `.txt`, `.out` and `.json` files locally with a 2 MB browser safety limit
- Detect `error`, `warn`, `info`, `debug`, `trace` and unknown lines
- Detect common ISO and time-only timestamps
- Calculate chronological bounds for valid ISO timestamps with explicit timezones, including unsorted input and fractional seconds. If any detected timestamp lacks a date/timezone or is invalid, show first/last in file order instead. CSV and JSON reports include `timestampOrder` (`chronological`, `input`, or `none`); entries without timestamps do not participate in the range.
- Normalize volatile values such as UUIDs, IP addresses, long IDs and durations
- Load focused sample logs for stack traces, sensitive data review and latency bursts
- Fold multiline stack traces, including JavaScript, Python, Go panic and JVM-style frames, into the previous log entry instead of inflating error counts
- Surface repeated message patterns with counts and examples
- Preview CSV or JSON reports with visible line counts before downloading or copying a short excerpt
- Flag possible sensitive lines such as tokens, API keys, JWTs and email addresses before sharing
- Locate sensitive findings by their original file line numbers, including blank lines inside multiline entries
- Mask detected sensitive values locally while preserving the surrounding log structure
- Mask credential assignments in JSON-style logs and quoted values containing spaces or escaped quotes
- Export a CSV or JSON triage report in the current tab
- Responsive interface with keyboard focus states

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Validation

```bash
npm test
npm run lint
npm run build
```

The tests cover local file validation, sensitive-value masking, level detection, timestamp extraction, multiline stack trace folding across common runtimes, pattern normalization, repeated pattern counts, JSON reports, CSV reports and safe report file names.

## Privacy

CSV exports prefix formula-like text cells with an apostrophe and quote them to
reduce spreadsheet formula interpretation. This covers leading `=`, `+`, `-`,
`@` (including full-width variants and leading whitespace), tabs and line breaks.
The prefix becomes part of the exported data; use JSON when exact values matter.
Spreadsheet import settings and saving/reopening CSV can change this behavior;
this is not a universal guarantee. See [OWASP CSV Injection](https://community.owasp.org/attacks/CSV_Injection).

The app has no backend, analytics or upload endpoint. Log text is processed in the current browser tab. Automatic detection and masking are best-effort safeguards, so review the result and remove secrets, tokens, customer data and personal data before sharing samples in issues.

## Scope

This tool is for fast local triage. It does not parse every logging framework or replace a full observability platform. Its goal is to make a pasted excerpt easier to scan before opening a larger incident workflow.

## Changelog

Release-by-release changes are listed in [CHANGELOG.md](CHANGELOG.md).

## Contributing

Bug reports and focused improvements are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening an issue or pull request.

## License

[MIT](LICENSE)
