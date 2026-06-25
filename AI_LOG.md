# AI Usage Log

## Tools used

- **Cursor Agent** — project onboarding; Biome setup; domain/layer restructure; class + singleton wiring; query validation and repository wiring for Task 1; auth stub hardening for Task 2.

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
- "Require `x-user-id` on user routes only for Task 2 scope; document assumption that other endpoints stay open for now."
- "Support postgres bigint for user ids; reject 401 only in requireAuth; set req.userId if and only if header format is valid."

## Assumptions

- **Auth scope (Task 2):** `requireAuth` applies only to `GET /users/:userId/resources`. The global `authStub` reads `x-user-id` but never rejects — it sets `req.userId` only when the header is a valid positive bigint string. `/resources` and `/resources/recent` remain unauthenticated intentionally — Task 2 focuses on user-scoped access control on the users endpoint. **TODO:** extend `requireAuth` to all endpoints once access control is wired globally (would be the right production default).
- **User ids as strings:** `users.id` is postgres `bigint`. JavaScript `number` is not safe for the full 64-bit range, so `req.userId`, path params, and `ownerId` filters use decimal strings end-to-end to match pg's default bigint wire format.

## Where I accepted / rejected / corrected AI output

- **Accepted:** `src/` layout, shared `findResources()` blast radius, seed/test baseline, CHALLENGE → file mapping.
- **Accepted:** Biome config mirroring repo style (single quotes, 2-space indent, `import type`, organized imports).
- **Rejected:** Biome default `node:` import protocol — kept bare `fs`/`path` to match existing scripts.
- **Corrected:** Removed stale `eslint-disable` in `auth.ts`; disabled `noNamespace` for Express global augmentation.
- **Accepted:** Domain folders (`resources/`, `users/`); `{domain}.types.ts` + `express.types.ts`; `{domain}.repository.ts`; `find*` handlers; class-based controller/service/repository; private constructor + `getInstance()` singletons; `{domain}.routes.ts` per domain; thin `app.ts` (middleware + `register*Routes` only).
- **Rejected:** Early auth wiring (`AuthContext`, `authFromRequest`) — kept auth minimal in middleware only.
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
- **Rejected:** Global 401 on all endpoints via `authStub` — scoped `requireAuth` to users routes only (Task 2 focus); left resources endpoints open with a documented TODO.
- **Rejected:** Parsing user ids with `Number()` — loses precision above `Number.MAX_SAFE_INTEGER`; use shared `parseUserId()` with `BigInt` validation instead.
- **Rejected:** Returning 401 from `authStub` for malformed headers — `authStub` is opt-in attachment only; `requireAuth` on protected routes handles rejection.
- **Accepted:** Split `authStub` (attach valid `req.userId`) + `requireAuth` (401 when unset); `requireAuth` on `GET /users/:userId/resources` only; path param validated with same `parseUserId()` helper.

## How I verified AI-generated code

- Cross-checked onboarding summary against `src/*.ts`, migrations, seed, and tests.
- Ran `npm run lint`, `npm run build`, and `npm test` after each change; all pass (5 tests on `GET /resources`, 4 on `GET /users/:userId/resources` auth and bigint header handling).
- Manually reviewed parameterized SQL in `resources.repository.ts` (typed order fields after controller validation, no string interpolation of user input).
- Verified `parseUserId()` accepts ids above `Number.MAX_SAFE_INTEGER` and rejects non-numeric headers via `requireAuth`.
