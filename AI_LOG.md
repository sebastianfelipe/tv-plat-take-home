# AI Usage Log

## Tools used

- **Cursor Agent** — project onboarding; Biome setup; domain/layer restructure; class + singleton wiring; query validation and repository wiring for Task 1.

## Representative prompts

- "Summarize this project, focus on `src/`. Big picture for contributing to CHALLENGE.md. Document important prompts and decisions in AI_LOG.md; keep AI usage simple and concise."
- "Extract code pattern and add a Biome JSON as code quality is important."
- "Restructure by separating controller, service and data layer."
- "Keep things simple — separate controller, service and data only; no auth implementation yet."
- "Reorganize by domain (screaming architecture); users in its own domain; separate interfaces."
- "Keep `findResources` naming; use `{domain}.repository.ts` convention."
- "Create classes with singleton DI; move route registration to each domain; don't export controller singletons."
- "Stick with pg; add general FindQuery (where as JSON, limit, order) with Joi validation at controller; wire through service to repository."
- "Create a common reusable feature for query→params mapping; avoid default order on limit/skip."
- "Use `order` at controller level (`{ field, direction }`); shared order shape in query parser; only provide where schema per endpoint."
- "At service layer call it `filter` (`ResourcesFilter`); keep `parsed.value` at controller."
- "Restrict allowed order fields (`id`, `created_at`) at controller level with `resourcesOrderSchema`."

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
- **Accepted:** Shared `FindQuery<TWhere>` (`where` JSON + `limit` + `skip` + `order` JSON); Joi `where` schema per endpoint (`resourcesWhereSchema`); shared order shape (`{ field, direction }`) in `parseFindQueryFromRequest()`; `resourcesOrderSchema` at controller for allowed sort fields.
- **Accepted:** Shared `FindParams` + `buildFindParams()` for query→repository mapping; `buildFindResourcesParams()` in resources domain.
- **Accepted:** `ResourcesFilter` alias at service layer; controller passes `parsed.value` into `findResources(filter)`.
- **Accepted:** Collapsed `resources.where.types.ts` into `resources.types.ts`.
- **Rejected:** `orderBy` string param and `orderBy`→`order`→`orderBy` conversions — single `order` object end-to-end.
- **Rejected:** Service-layer order field validation (`ResourcesFilterError`) — kept allowlist check in controller only.
- **Rejected:** Implicit default `ORDER BY id ASC` when `limit`/`skip` present — order only when explicitly requested (except internal presets like `/resources/recent`).

## How I verified AI-generated code

- Cross-checked onboarding summary against `src/*.ts`, migrations, seed, and tests.
- Ran `npm run lint`, `npm run build`, and `npm test` after each change; all pass (5 tests on `GET /resources`: list, filter+limit+order, skip pagination, 400 on unsupported order field, 400 on bad params).
- Manually reviewed parameterized SQL in `resources.repository.ts` (typed order fields after controller validation, no string interpolation of user input).
