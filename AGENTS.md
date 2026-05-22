# CareerLab Public Demo Agent Entry

This file is the first entry point for Codex sessions in this public demo repo.

Before making changes, read:

1. `README.md`
2. `docs/PORTFOLIO_DEMO_STRATEGY.md`

Core operating rules:

- This repo is the public portfolio demo for CareerLab.
- Keep all committed data public-safe and anonymized.
- Do not add real personal data, actual private company details, internal system identifiers, private reports, secret values, API keys, or non-demo seed data.
- A verified meaningful change is a commit boundary. Do not wait for an extra "commit" request after completing and validating a scoped change.
- Keep commits small and scoped. Stage only files related to the completed change.
- Check `git status --short --branch` before editing, before staging, and after committing.
- Run `npm run lint` and `npm run build:demo:pages` before pushing app or build/deploy changes.
- Run `npm run ui:check:demo` before pushing demo seed or user-flow changes.
- Pushes to `main` trigger GitHub Pages deployment at `https://phoebe7075.github.io/CareerLab/`.
- After pushing, confirm the GitHub Actions Pages workflow succeeded and the Pages URL responds.

If these rules conflict with a direct user request, follow the user request and state the tradeoff in the final report.
