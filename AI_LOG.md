# AI Usage Log

## Tools used

- **Cursor Agent** — project onboarding; Biome setup; domain/layer restructure; class + singleton wiring; query validation scaffold.

## Representative prompts

- "Summarize this project, focus on `src/`. Big picture for contributing to CHALLENGE.md. Document important prompts and decisions in AI_LOG.md; keep AI usage simple and concise."
- "Extract code pattern and add a Biome JSON as code quality is important."
- "Restructure by separating controller, service and data layer."
- "Keep things simple — separate controller, service and data only; no auth implementation yet."
- "Reorganize by domain (screaming architecture); users in its own domain; separate interfaces."
- "Keep `findResources` naming; use `{domain}.repository.ts` convention."
- "Create classes with singleton DI; move route registration to each domain; don't export controller singletons."
- "Stick with pg; add general FindQuery (where as JSON, limit, orderBy) with Joi validation at controller; service receives but does not use yet."

## Where I accepted / rejected / corrected AI output

- **Accepted:** `src/` layout, shared `findResources()` blast radius, seed/test baseline, CHALLENGE → file mapping.
- **Accepted:** Biome config mirroring repo style (single quotes, 2-space indent, `import type`, organized imports).
- **Rejected:** Biome default `node:` import protocol — kept bare `fs`/`path` to match existing scripts.
- **Corrected:** Removed stale `eslint-disable` in `auth.ts`; disabled `noNamespace` for Express global augmentation.
- **Accepted:** Domain folders (`resources/`, `users/`); `{domain}.types.ts` + `express.types.ts`; `{domain}.repository.ts`; `find*` handlers; class-based controller/service/repository; private constructor + `getInstance()` singletons; `{domain}.routes.ts` per domain; thin `app.ts` (middleware + `register*Routes` only).
- **Rejected:** Early auth wiring (`AuthContext`, `authFromRequest`) — auth stays a future controller concern only.
- **Rejected:** `list*` / `findAll*` names — kept `findResources(opts)` and `find*` handlers.
- **Rejected:** Exporting controller singletons from controller files — `getInstance()` called in route modules instead.
- **Rejected:** Constructor-return singleton (Biome `noConstructorReturn`) — used private constructor + `getInstance()`.
- **Corrected:** Restored CHALLENGE route comments in domain route files after restructure moves.
- **Rejected:** Drizzle/TypeORM adoption — stayed on `pg` per challenge scope and SQL focus.
- **Rejected:** First manual parameterized query pass (custom parsers + repository defaults) — too complex; reverted.
- **Rejected:** Over-abstracted `FindResourcesQuery` / service preset split — reverted in favor of simpler incremental step.
- **Accepted:** Shared `FindQuery<TWhere>` (`where` JSON + `limit` + `orderBy`); Joi `where` schema per endpoint (`resourcesWhereSchema`); `parseFindQueryFromRequest()` in controller; service accepts optional query without wiring repository yet.

## How I verified AI-generated code

- Cross-checked onboarding summary against `src/*.ts`, migrations, seed, and tests.
- Ran `npm run lint`, `npm run build`, and `npm test` after each change; all pass (3 tests on `GET /resources` validation).
