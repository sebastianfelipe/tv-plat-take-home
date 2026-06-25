# AI Usage Log

## Tools used

- **Cursor Agent** — project onboarding; Biome setup; domain/layer restructure; class + singleton wiring; query validation and repository wiring for Task 1; auth stub hardening and owner authorization for Task 2.

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
- "Add authorizeOwner at users service layer; admin bypasses, member must match ownerId; 403 otherwise."
- "Use UserRole enum for member/admin instead of string literals in authorizeOwner."
- "Replace `findRoleById` with `UsersService.findById`; inject `UsersService` into `ResourcesService` for role-based resource filtering."
- "Add `buildRestrictedWhere(userId)` on resources service — admin sees all, member restricted to `ownerId`."
- "Wire `buildRestrictedWhere` at resources controller for `GET /resources`; pass `restrictedWhere` as second arg to `findResources` and merge in service."
- "Apply same `buildRestrictedWhere` policy to `GET /resources/recent`; `findRecentResources` accepts only `restrictedWhere`."
- "Validate user existence in `requireAuth` via `UsersService.findById`; reject unknown ids with 401."
- "Remove `type` / `status` enum restrictions on resource filters — migration uses unconstrained `text` columns."
- "Add global error handler and `asyncHandler` wrapper; move `ForbiddenError` to shared errors module."
- "Validate path owner exists in `findUserResources(ownerId)` — throw 404 when missing (not in `authorizeOwner`)."
- "Improve access-control test coverage: admin lists all resources/recent; member scoped lists; admin accesses any user's resources; member own only."
- "Add dedicated `test/access-control.test.ts` for role-based integration scenarios; keep auth/validation tests in route-specific files."
- "Add unit tests for `UsersService.findUserResources` (404 when owner missing, loads when owner exists)."
- "Review test gaps against implemented features — shared resources, auth edge cases, validation boundaries, service-layer unit tests."
- "Add unit tests for `ResourcesService.buildRestrictedWhere`, `findResources` merge behavior, and `parseUserId`."

## Assumptions

- **Auth scope (Task 2):** `requireAuth` on `GET /users/:userId/resources`, `GET /resources`, and `GET /resources/recent`. The global `authStub` reads `x-user-id` but never rejects — it sets `req.userId` only when the header is a valid positive bigint string. `requireAuth` then confirms the id exists in `users` via `UsersService.findById()` (401 if missing or unknown). **TODO:** extend member access to shared resources via `resource_shares`.
- **User ids as strings:** `users.id` is postgres `bigint`. JavaScript `number` is not safe for the full 64-bit range, so `req.userId`, path params, and `ownerId` filters use decimal strings end-to-end to match pg's default bigint wire format.
- **Owner authorization:** `authorizeOwner(userId, ownerId)` runs in the controller before `findUserResources(ownerId)`. Admins may read any user's resources; members may only read their own (`userId === ownerId`). `findUserResources` then confirms the path owner exists (404 if not).

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
- **Rejected:** Global 401 on all endpoints via `authStub` — scoped `requireAuth` to protected routes only; `authStub` attaches valid `req.userId` without rejecting.
- **Rejected:** Parsing user ids with `Number()` — loses precision above `Number.MAX_SAFE_INTEGER`; use shared `parseUserId()` with `BigInt` validation instead.
- **Rejected:** Returning 401 from `authStub` for malformed headers — `authStub` is opt-in attachment only; `requireAuth` on protected routes handles rejection.
- **Accepted:** Split `authStub` (attach valid `req.userId`) + async `requireAuth` (401 when unset or user not found via `UsersService.findById`); `requireAuth` on users and resources routes; path param validated with same `parseUserId()` helper.
- **Accepted:** Unknown-but-well-formed `x-user-id` returns 401 from `requireAuth` (not 403 from `authorizeOwner`) — identity does not exist.
- **Accepted:** `UsersService.authorizeOwner(userId, ownerId)` called from controller before `findUserResources`; throws `ForbiddenError` → global `errorHandler` returns 403.
- **Accepted:** `User` interface (`id`, `name`, `role`) in `users.types.ts`; `UsersRepository.findById()` returns full user row; `UsersService.findById()` as the service-layer lookup used by `authorizeOwner` and `ResourcesService.buildRestrictedWhere`.
- **Accepted:** `ResourcesService` injects `UsersService` (optional in `getInstance` for tests); `UsersService.getInstance()` wires itself back into `ResourcesService` after bootstrap (resources routes register first in `app.ts`).
- **Rejected:** Lazy `require()` for `UsersService` in `ResourcesService` — failed under Vitest; explicit singleton wiring instead.
- **Rejected:** `ResourcesService` calling `UsersRepository` directly — role lookups go through `UsersService.findById`.
- **Rejected:** Module-level `export const usersService` / `resourcesService` singletons — caused circular import at load time; controllers call `getInstance()` instead.
- **Accepted:** `ResourcesService.buildRestrictedWhere(userId)` — admin → `{}` (no filter); member → `{ ownerId: userId }`.
- **Accepted:** `GET /resources` controller calls `buildRestrictedWhere(userId)` then `findResources(filter, restrictedWhere)`; service merges `{ ...filter.where, ...restrictedWhere }` so access restrictions win on conflicts.
- **Accepted:** `GET /resources/recent` controller calls `buildRestrictedWhere(userId)` then `findRecentResources(restrictedWhere)`; service applies `restrictedWhere` to the fixed preset (limit 10, `created_at desc`) with no caller-supplied filter.
- **Rejected:** Separate `users.authorization.ts` module — kept `authorizeOwner` on `UsersService`.
- **Rejected:** `{ ok: true | false }` return from `authorizeOwner` alongside `ForbiddenError` catch — service throws, global handler maps errors.
- **Accepted:** Global `errorHandler` in `middleware/error-handler.ts` registered last in `app.ts`; `HttpError` base + `ForbiddenError` in `shared/errors.ts`; unknown errors → 500.
- **Accepted:** `asyncHandler` in `middleware/async-handler.ts` wraps async route handlers in domain route modules — controllers drop try/catch/`next(err)` boilerplate.
- **Rejected:** Per-controller `ForbiddenError` catch blocks — centralized in error handler instead.
- **Accepted:** `findUserResources(ownerId)` validates the path owner via `findById` after `authorizeOwner`; missing owner → `NotFoundError` (404). Admins otherwise pass authorization but get 404 for unknown target users; members only reach this when `ownerId` matches their id.
- **Rejected:** Owner existence check in `authorizeOwner` — kept authorization (403) separate from resource lookup (404) in `findUserResources`.
- **Accepted:** `test/access-control.test.ts` — integration suite for four role-based scenarios (admin/member × global lists / user-scoped resources); admin 404 for missing path owner; member scoped filters on `GET /resources`.
- **Accepted:** `UsersService.findUserResources` unit tests — `NotFoundError` when owner missing; delegates to `findResourcesByOwner` when owner exists.
- **Rejected:** Duplicating scoping assertions in `resources.test.ts` and `users.test.ts` once covered by `access-control.test.ts`.
- **Accepted:** Unit and integration tests for users domain in `test/users.test.ts` (`authorizeOwner`, `findUserResources`, auth integration).
- **Accepted:** `test/resources.service.test.ts` — unit tests for `buildRestrictedWhere` (admin/member/missing user), `findResources` merge (restriction wins on `ownerId` conflict), and `findRecentResources` scoped preset; mocked repository + `UsersService`, no DB.
- **Accepted:** `test/auth.test.ts` — unit tests for `parseUserId` (positive ids, bigint strings above `Number.MAX_SAFE_INTEGER`, rejects non-numeric/zero/negative).
- **Accepted:** `UserRole` enum (`Member`, `Admin`) in `users.types.ts` — string values match postgres `role` column; used in `authorizeOwner` and tests.
- **Corrected:** Dropped hardcoded `type` / `status` unions and Joi `.valid()` allowlists — `resources.type` and `resources.status` are plain `text` in `0001_init.sql`; `ResourcesWhere` and `resourcesWhereSchema` accept any string. Order field allowlist (`id`, `created_at`) unchanged.

## How I verified AI-generated code

- Cross-checked onboarding summary against `src/*.ts`, migrations, seed, and tests.
- Ran `npm run lint`, `npm run build`, and `npm test` after each change; all pass (37 total: 10 access-control integration, 9 users unit/integration, 7 resources validation/auth, 7 resources service unit, 4 auth unit).
- Verified member (user 2) on `GET /resources` sees only 8 owned resources; admin (user 1) still sees all 30.
- Verified member on `GET /resources/recent` sees 8 owned resources (most recent id `30`); admin sees global top 10.
- Verified admin `GET /users/:userId/resources` returns 404 when path owner does not exist.
- Manually reviewed parameterized SQL in `resources.repository.ts` (typed order fields after controller validation, no string interpolation of user input).
- Verified `parseUserId()` via `test/auth.test.ts` — accepts ids above `Number.MAX_SAFE_INTEGER`; rejects non-numeric, zero, and negative values.
- Verified `ResourcesService.buildRestrictedWhere` and merge behavior via `test/resources.service.test.ts` (admin → `{}`, member → `{ ownerId }`, restriction overrides filter `where`).
- Verified unknown user id (`9007199254740992`) returns 401 on protected routes.
- Verified admin (user 1) can list another user's resources; member (user 2) gets 403 on user 3's resources.
- **TODO (tests):** `resource_shares` access once implemented; auth integration edge cases (malformed/zero/bigint header on all protected routes); validation boundaries (`limit` max, bad order direction); member 403 vs admin 404 for missing path owner; invalid path param on `/users/:userId/resources`.
