# AI Usage Log

## Tools used

- **Cursor Agent** — project onboarding; Biome setup from existing code patterns.

## Representative prompts

- "Summarize this project, focus on `src/`. Big picture for contributing to CHALLENGE.md. Document important prompts and decisions in AI_LOG.md; keep AI usage simple and concise."
- "Extract code pattern and add a Biome JSON as code quality is important."

## Where I accepted / rejected / corrected AI output

- **Accepted:** `src/` layout, shared `findResources()` blast radius, seed/test baseline, CHALLENGE → file mapping.
- **Accepted:** Biome config mirroring repo style (single quotes, 2-space indent, `import type`, organized imports).
- **Rejected:** Biome default `node:` import protocol — kept bare `fs`/`path` to match existing scripts.
- **Corrected:** Removed stale `eslint-disable` in `auth.ts`; disabled `noNamespace` for Express global augmentation.

## How I verified AI-generated code

- Cross-checked onboarding summary against `src/*.ts`, migrations, seed, and tests.
- Ran `npm run lint` and `npm test` after Biome setup; both pass.
