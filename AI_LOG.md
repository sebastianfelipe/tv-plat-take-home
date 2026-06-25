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
- "Extend member access to shared resources via `resource_shares`; admins see all; paginate scoped results."
- "Replace `buildRestrictedWhere` with `buildAccessScope` returning `{ userId? }`; pass scope object through controller/service."
- "Verify solution end-to-end; update README and PR_DESCRIPTION for deliverables."
- "Document design considerations and decisions in PR write-up; update AI_LOG."
- "Add indexes for owner_id, shares, type, status, and created_at sort in a separate migration."

## Assumptions

- **Auth scope (Task 2):** `requireAuth` on `GET /users/:userId/resources`, `GET /resources`, and `GET /resources/recent`. The global `authStub` reads `x-user-id` but never rejects — it sets `req.userId` only when the header is a valid positive bigint string. `requireAuth` then confirms the id exists in `users` via `UsersService.findById()` (401 if missing or unknown). Members on global list endpoints see resources they **own or that are shared with them** via `resource_shares`; admins see all. `GET /users/:userId/resources` lists resources **owned by** the path user only (no shares on that endpoint).
- **User ids as strings:** `users.id` is postgres `bigint`. JavaScript `number` is not safe for the full 64-bit range, so `req.userId`, path params, and `ownerId` filters use decimal strings end-to-end to match pg's default bigint wire format.
- **Owner authorization:** `authorizeOwner(userId, ownerId)` runs in the controller before `findUserResources(ownerId)`. Admins may read any user's resources; members may only read their own (`userId === ownerId`). `findUserResources` then confirms the path owner exists (404 if not).

- **Deliverables:** `README.md` updated (layout, auth, endpoints, query params, test count). `PR_DESCRIPTION.md` filled with summary, changes, design decisions, testing, and trade-offs. `AI_LOG.md` maintained throughout.

## Design decisions (summary)

Key choices made for software quality — full rationale in `PR_DESCRIPTION.md`:

- **Domain layout** (`resources/`, `users/`) over flat technical layers — feature cohesion, thin `app.ts`.
- **Shared `findResources()` with explicit blast radius** — one SQL path; service applies scope, repository executes it.
- **`authStub` attaches, `requireAuth` rejects** — malformed headers don’t 401 globally; protected routes enforce identity.
- **`buildAccessScope` → `AccessScope` object** — scope separated from caller filters; no merged-where hacks.
- **`EXISTS` for `resource_shares`** — pagination-safe; no duplicate rows when owned and shared overlap.
- **User ids as bigint strings** — `parseUserId()` + `BigInt`; no `Number()` precision loss.
- **403 / 404 / 401 split** — authorization vs existence vs identity at the right layer.
- **`GET /users/:userId/resources` owner-only** — global lists include shares; user route lists owned resources.
- **Controller validates, repository parameterizes** — order allowlist and Joi at edge; no user input in SQL fragments.
- **Global error handler + `asyncHandler`** — services throw; routes stay thin.
- **Dedicated `test/access-control.test.ts`** — role matrix without duplicating assertions across route tests.
- **Incremental index migrations** — `0002` for share recipient lookups; `0003` for `type`, `status`, `created_at`, and owner+recency composites; `ORDER BY id` uses PK; share `EXISTS` uses `resource_shares` PK.

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
- **Accepted:** `User` interface (`id`, `name`, `role`) in `users.types.ts`; `UsersRepository.findById()` returns full user row; `UsersService.findById()` as the service-layer lookup used by `authorizeOwner` and `ResourcesService.buildAccessScope`.
- **Accepted:** `ResourcesService` injects `UsersService` (optional in `getInstance` for tests); `UsersService.getInstance()` wires itself back into `ResourcesService` after bootstrap (resources routes register first in `app.ts`).
- **Rejected:** Lazy `require()` for `UsersService` in `ResourcesService` — failed under Vitest; explicit singleton wiring instead.
- **Rejected:** `ResourcesService` calling `UsersRepository` directly — role lookups go through `UsersService.findById`.
- **Rejected:** Module-level `export const usersService` / `resourcesService` singletons — caused circular import at load time; controllers call `getInstance()` instead.
- **Rejected:** `buildRestrictedWhere` returning a merged `FindResourcesWhere` — replaced with `buildAccessScope(userId)` returning `AccessScope` (`{ userId? }`); admin → `{}`, member → `{ userId }`; service maps to `where.accessScopeUserId` for repository.
- **Accepted:** Member scoping in shared `findResources()` via `EXISTS` subquery on `resource_shares` (not JOIN) — owned OR shared, no row duplication, pagination safe.
- **Accepted:** `0002_resource_shares_user_id_idx.sql` — index on `resource_shares(user_id)` for scoped lookups.
- **Accepted:** `0003_resource_query_indexes.sql` — `idx_resources_type`, `idx_resources_status`, `idx_resources_type_status`, `idx_resources_created_at` (DESC), `idx_resources_owner_id_created_at`; documented mapping to `findResources()` filters and sorts; PK covers `ORDER BY id` and share `EXISTS (resource_id, user_id)`.
- **Accepted:** `GET /resources` / `GET /resources/recent` controller calls `buildAccessScope(userId)` then passes `AccessScope` to service; `findResourcesByOwner` still uses `ownerId` only for user-scoped endpoint.
- **Corrected:** Seed comment for share `{ resourceId: 10, userId: 2 }` — original comment preserved; added note that owner/share overlap is intentional for dedup testing.
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
- **Accepted:** `test/resources.service.test.ts` — unit tests for `buildAccessScope` (admin/member/missing user), `findResources` scope wiring, and `findRecentResources` scoped preset; mocked repository + `UsersService`, no DB.
- **Accepted:** `test/auth.test.ts` — unit tests for `parseUserId` (positive ids, bigint strings above `Number.MAX_SAFE_INTEGER`, rejects non-numeric/zero/negative).
- **Accepted:** `UserRole` enum (`Member`, `Admin`) in `users.types.ts` — string values match postgres `role` column; used in `authorizeOwner` and tests.
- **Corrected:** Dropped hardcoded `type` / `status` unions and Joi `.valid()` allowlists — `resources.type` and `resources.status` are plain `text` in `0001_init.sql`; `ResourcesWhere` and `resourcesWhereSchema` accept any string. Order field allowlist (`id`, `created_at`) unchanged.
- **Accepted:** `README.md` and `PR_DESCRIPTION.md` updated for submission — current layout, auth behavior, endpoint scoping, query params, 37-test suite, design decisions section.
- **Corrected:** Stale route comment in `users.routes.ts` claiming `/resources` endpoints were unauthenticated.

## How I verified AI-generated code

- Cross-checked onboarding summary against `src/*.ts`, migrations, seed, and tests.
- Ran `npm run lint`, `npm run build`, and `npm test` after each change; all pass (37 total: 11 access-control integration, 9 users unit/integration, 7 resources validation/auth, 6 resources service unit, 4 auth unit).
- Verified member (user 2) on `GET /resources` sees 9 accessible resources (8 owned + 1 shared-only); admin (user 1) still sees all 30.
- Verified member on `GET /resources/recent` sees 9 accessible resources including shared resource `1`; admin sees global top 10.
- Verified admin `GET /users/:userId/resources` returns 404 when path owner does not exist.
- Manually reviewed parameterized SQL in `resources.repository.ts` (typed order fields after controller validation, no string interpolation of user input).
- Verified `parseUserId()` via `test/auth.test.ts` — accepts ids above `Number.MAX_SAFE_INTEGER`; rejects non-numeric, zero, and negative values.
- Verified `ResourcesService.buildAccessScope` and repository scoping via unit + integration tests (admin → no scope, member → owned + shared, pagination under scope).
- Verified unknown user id (`9007199254740992`) returns 401 on protected routes.
- Verified admin (user 1) can list another user's resources; member (user 2) gets 403 on user 3's resources.
- Reviewed `PR_DESCRIPTION.md` design decisions against implemented code paths (`buildAccessScope`, repository `EXISTS`, error semantics).
- Mapped `0003` indexes to repository WHERE/ORDER BY clauses; confirmed migrations apply cleanly via test `beforeAll` migrate.
- **Deferred (non-blocking):** auth integration edge cases on every protected route; validation boundary tests (`limit` 101, bad order direction); member 403 vs admin 404 for missing path owner; invalid path param on `/users/:userId/resources`.
