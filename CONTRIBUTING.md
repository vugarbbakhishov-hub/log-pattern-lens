# Contributing

Thanks for considering a contribution to Log Pattern Lens.

## Good issues for this project

- A log format that should be detected more accurately.
- A small report field that helps triage without sending data anywhere.
- A UI accessibility or responsive layout bug.
- A test case that documents an edge case.

## Before opening an issue

Start with the [sample walkthrough](docs/try-it.md). The demo footer links to
the bug and usability feedback forms. Include the preset or fictional sample,
selected level, actions taken, expected result, actual result and browser.
For an interface problem, a log sample is optional.

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
