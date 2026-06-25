# AI Usage Log

## Tools used

- **Cursor Agent** — project onboarding; Biome setup; domain/layer restructure.

## Representative prompts

- "Summarize this project, focus on `src/`. Big picture for contributing to CHALLENGE.md. Document important prompts and decisions in AI_LOG.md; keep AI usage simple and concise."
- "Extract code pattern and add a Biome JSON as code quality is important."
- "Restructure by separating controller, service and data layer."
- "Keep things simple — separate controller, service and data only; no auth implementation yet."
- "Reorganize by domain (screaming architecture); users in its own domain; separate interfaces."
- "Keep `findResources` naming; use `{domain}.repository.ts` convention."

## Where I accepted / rejected / corrected AI output

- **Accepted:** `src/` layout, shared `findResources()` blast radius, seed/test baseline, CHALLENGE → file mapping.
- **Accepted:** Biome config mirroring repo style (single quotes, 2-space indent, `import type`, organized imports).
- **Rejected:** Biome default `node:` import protocol — kept bare `fs`/`path` to match existing scripts.
- **Corrected:** Removed stale `eslint-disable` in `auth.ts`; disabled `noNamespace` for Express global augmentation.
- **Accepted:** Controller / service / repository split; domain folders (`resources/`, `users/`); `{domain}.types.ts` + `express.types.ts`; `resources.repository.ts` naming; `find*` handler names (`findResources`, `findRecentResources`, `findUserResources`); route comments kept in `app.ts`.
- **Rejected:** Early auth wiring (`AuthContext`, `authFromRequest`, passing auth into services) — auth stays a future controller concern only.
- **Rejected:** `list*` service wrappers (`listAllResources`, `listResourcesByUserId`, etc.) — kept `findResources(opts)` calls as in the original.
- **Corrected:** Restored `app.ts` CHALLENGE comments after they were dropped during the first restructure.

## How I verified AI-generated code

- Cross-checked onboarding summary against `src/*.ts`, migrations, seed, and tests.
- Ran `npm run lint` and `npm test` after each restructure; both pass.
