# Contributing

Thanks for considering a contribution to Log Pattern Lens.

## Good issues for this project

- A log format that should be detected more accurately.
- A small report field that helps triage without sending data anywhere.
- A UI accessibility or responsive layout bug.
- A test case that documents an edge case.

## Before opening an issue

Remove secrets, tokens, customer data, IPs that should not be public, personal data and internal hostnames from every sample. Keep examples as small as possible.

## Local checks

Run these before opening a pull request:

```bash
npm test
npm run lint
npm run build
```

## Scope

Keep changes focused. This project should stay a small browser-only utility rather than a full observability product.
