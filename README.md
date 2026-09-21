# Log Pattern Lens

[![CI](https://github.com/vugarbbakhishov-hub/log-pattern-lens/actions/workflows/ci.yml/badge.svg)](https://github.com/vugarbbakhishov-hub/log-pattern-lens/actions/workflows/ci.yml) [![Deploy GitHub Pages](https://github.com/vugarbbakhishov-hub/log-pattern-lens/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/vugarbbakhishov-hub/log-pattern-lens/actions/workflows/deploy-pages.yml)

Log Pattern Lens is a browser-only React and TypeScript utility for quick log triage. Paste a log excerpt, then review level counts, repeated message patterns, timestamp coverage and the observed time range. Reports can be saved as CSV or JSON without uploading the log contents anywhere.

## Live demo

The project is published with GitHub Pages:

https://vugarbbakhishov-hub.github.io/log-pattern-lens/

## Features

- Paste logs directly into the browser
- Detect `error`, `warn`, `info`, `debug`, `trace` and unknown lines
- Detect common ISO and time-only timestamps
- Normalize volatile values such as UUIDs, IP addresses, long IDs and durations
- Surface repeated message patterns with counts and examples
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

The tests cover level detection, timestamp extraction, pattern normalization, repeated pattern counts, JSON reports, CSV reports and safe report file names.

## Privacy

The app has no backend, analytics or upload endpoint. Log text is processed in the current browser tab. Remove secrets, tokens, customer data and personal data before sharing samples in issues.

## Scope

This tool is for fast local triage. It does not parse every logging framework, join multiline stack traces or replace a full observability platform. Its goal is to make a pasted excerpt easier to scan before opening a larger incident workflow.

## Changelog

Release-by-release changes are listed in [CHANGELOG.md](CHANGELOG.md).

## Contributing

Bug reports and focused improvements are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening an issue or pull request.

## License

[MIT](LICENSE)
