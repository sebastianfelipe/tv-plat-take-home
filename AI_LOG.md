# AI Usage Log

## Tools used

- **Cursor Agent** — project onboarding: architecture summary and CHALLENGE → file mapping before coding.

## Representative prompts

- "Summarize this project, focus on `src/`. Big picture for contributing to CHALLENGE.md. Document important prompts and decisions in AI_LOG.md; keep AI usage simple and concise."

## Where I accepted / rejected / corrected AI output

- **Accepted:** `src/` layout, shared `findResources()` blast radius across three endpoints, seed/test baseline (30 resources, 5 shares), and which files each CHALLENGE task likely touches.
- **Rejected:** N/A — no implementation or SQL generated yet.

## How I verified AI-generated code

- Cross-checked the summary against `src/*.ts`, `migrations/0001_init.sql`, `scripts/seed.ts`, and `test/resources.test.ts`.
- For upcoming SQL/tests: run against seed data, `npm test`, and manual `curl -H 'x-user-id: N'`.
