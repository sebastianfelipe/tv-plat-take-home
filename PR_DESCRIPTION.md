# PR Write-up

## Summary

Production-ready filtering, pagination, and validation for `GET /resources`, plus
role-based access control on the shared `findResources()` path. Admins see all
resources; members see resources they own or that are shared with them via
`resource_shares`. All three list endpoints require authentication.

## Changes

- **Task 1 — `GET /resources`**
  - JSON query params: `where` (type/status), `limit`, `skip`, `order`
  - Joi validation at controller; 400 with error details on bad input
  - Offset pagination (`LIMIT` / `OFFSET` in SQL)
  - Order allowlist: `id`, `created_at`

- **Task 2 — access control**
  - `buildAccessScope(userId)` — admin → no scope; member → `{ userId }`
  - Repository scopes members with `owner_id = $user OR EXISTS (resource_shares …)`
  - `EXISTS` subquery (not JOIN) to avoid duplicate rows and keep pagination correct
  - `GET /users/:userId/resources` — owner-only list; `authorizeOwner` (403) + 404 for missing user
  - Migration `0002_resource_shares_user_id_idx.sql` for share lookups
  - Migration `0003_resource_query_indexes.sql` for filter and sort columns

- **Infrastructure**
  - Domain layout: `resources/`, `users/`, `middleware/`, `shared/`
  - Global error handler + `asyncHandler` wrapper
  - `requireAuth` on all three list endpoints

## Design considerations & decisions

Decisions made to keep the solution maintainable, correct under the shared data
path, and honest to the schema — not just to pass the challenge.

### Architecture & layering

- **Domain folders over technical layers** — `resources/` and `users/` each own
  controller, service, repository, routes, and types. A reader can find
  everything for one feature in one place; `app.ts` stays thin (middleware +
  route registration only).
- **Shared `findResources()` with explicit blast radius** — all three endpoints
  call `ResourcesRepository.findResources()`. Access rules live in one SQL path
  so behavior cannot drift between `/resources`, `/recent`, and user-scoped
  lists. Service layer decides *what* scope to apply; repository decides *how*
  to express it in SQL.
- **Controller → service → repository responsibilities**
  - Controller: parse/validate HTTP input (Joi), resolve `AccessScope`, map HTTP
    status via thrown errors
  - Service: business rules (`buildAccessScope`, `authorizeOwner`, merge filter +
    scope)
  - Repository: parameterized SQL only — no role checks, no HTTP concepts

### Access control model

- **`authStub` + `requireAuth` split** — global stub attaches `req.userId` when
  the header is a well-formed positive bigint string; it never rejects. Protected
  routes use `requireAuth` to require a header and confirm the user exists (401).
  Malformed headers on unprotected routes are ignored rather than failing the
  whole app — keeps attachment opt-in and rejection explicit per route.
- **`buildAccessScope` as a first-class object** — replaced an earlier
  `buildRestrictedWhere` that merged scope into filter `where` clauses (and
  needed `delete ownerId` hacks). `AccessScope` (`{ userId? }`) is built once
  in the controller and passed through the service, which maps it to
  `accessScopeUserId` at the repository boundary. Scope is not mixed with caller
  filters.
- **Admin = no filter, member = scoped** — admins get an empty scope so the
  shared query path adds no overhead. Members always get `{ userId }` even if
  role lookup fails (defense in depth; `requireAuth` already blocks unknown
  users on protected routes).
- **`EXISTS` for shares, not `JOIN`** — a JOIN on `resource_shares` can
  duplicate rows when a resource is both owned and shared (seed resource 10).
  `EXISTS` keeps one row per resource so `LIMIT` / `OFFSET` pagination stays
  correct without `DISTINCT`.
- **Owner-only vs accessible lists** — `GET /users/:userId/resources` lists
  resources *owned by* the path user (`ownerId` filter). Global list endpoints
  include shares. That matches “show me Alice’s documents” vs “show me everything
  I can access.”
- **403 vs 404 vs 401 semantics**
  - **401** — identity missing or unknown (`requireAuth`)
  - **403** — known user, not allowed (`authorizeOwner`: member on another
    user’s path)
  - **404** — authorized request, target user does not exist (`findUserResources`
    after `authorizeOwner`; admins can reach this for unknown path owners)

### Data & SQL

- **User ids as strings end-to-end** — Postgres `bigint` exceeds
  `Number.MAX_SAFE_INTEGER`. `parseUserId()` uses `BigInt` validation; ids flow
  as decimal strings through Express, services, and `$1` parameters.
- **`type` / `status` match the schema** — migration uses unconstrained `text`;
  Joi accepts any string rather than hardcoded enums that would lie about the DB.
- **Order allowlist at controller** — `id` and `created_at` validated before
  SQL; repository maps to a fixed `ORDER_FIELDS` record (no user-controlled
  column names in SQL).
- **No implicit `ORDER BY`** — pagination without an explicit `order` param does
  not invent a sort (except `/resources/recent`, which owns its preset). Avoids
  surprising ordering and unnecessary sorts on large tables.
- **Indexing strategy** — migrations added incrementally per query need (baseline
  intentionally sparse). Full map:

  | Index | Migration | Supports |
  | ----- | --------- | -------- |
  | `resources` PK (`id`) | 0001 | `ORDER BY id` |
  | `idx_resources_owner_id` | 0001 | `WHERE owner_id`, member scope owned branch |
  | `resource_shares` PK (`resource_id`, `user_id`) | 0001 | `EXISTS` share check per resource |
  | `idx_resource_shares_user_id` | 0002 | share lookups by recipient `user_id` |
  | `idx_resources_type` | 0003 | `WHERE type` |
  | `idx_resources_status` | 0003 | `WHERE status` |
  | `idx_resources_type_status` | 0003 | combined `type` + `status` filters |
  | `idx_resources_created_at` | 0003 | `ORDER BY created_at` (incl. `/recent` DESC preset) |
  | `idx_resources_owner_id_created_at` | 0003 | owned lists sorted by recency |

  No index on arbitrary order fields — allowlist is `id` and `created_at` only.
  Member `OR EXISTS` scope may still combine bitmap scans; indexes avoid full
  table scans on filter and sort columns as data grows.

### Error handling & ergonomics

- **Global `errorHandler` + `HttpError` hierarchy** — services throw
  `ForbiddenError` / `NotFoundError`; controllers stay free of try/catch. One
  place maps errors to status codes.
- **`asyncHandler` on routes** — async controllers don’t need `next(err)`
  boilerplate; unhandled rejections reach the error handler.

### Testing strategy

- **`test/access-control.test.ts` for role matrix** — admin/member × global lists
  / user routes in one suite; avoids duplicating scoping assertions across
  route-specific files.
- **Unit tests without DB for pure logic** — `buildAccessScope`, `parseUserId`,
  `authorizeOwner` use mocked dependencies and singleton reset in `beforeEach`.
- **Deterministic seed** — fixed ids, timestamps, and share rows so integration
  tests assert exact counts and resource ids.

## Testing

### Automated tests (37 total)

| File | Count | Covers |
| ---- | ----- | ------ |
| `test/resources.test.ts` | 7 | Auth 401s, where/limit/order validation, pagination, 400 errors |
| `test/access-control.test.ts` | 11 | Admin global lists; member owned+shared; scoped pagination; filtered scope; user routes (403/404) |
| `test/users.test.ts` | 9 | `authorizeOwner`, `findUserResources`, auth integration |
| `test/resources.service.test.ts` | 6 | `buildAccessScope`, scope wiring to repository |
| `test/auth.test.ts` | 4 | `parseUserId` (bigint-safe, rejects invalid) |

### Edge cases exercised

- **Auth:** missing header, unknown user id, valid bigint above `Number.MAX_SAFE_INTEGER`
- **Admin vs member:** admin sees 30 resources; member 2 sees 9 (8 owned + 1 shared-only)
- **Shared access:** member 2 sees resource `1` (owned by user 1, shared with 2)
- **Owner vs shared:** `GET /users/:userId/resources` returns owned only (no shares)
- **Forbidden vs not found:** member 403 on another user's resources; admin 404 for missing path user
- **Pagination under scope:** member pages with `limit`/`skip` return unique ids
- **Validation:** invalid JSON, unsupported order field, limit out of range

### Performance / regression

- Shared path unchanged for admin (no extra WHERE when scope is empty)
- Member scope uses parameterized `EXISTS` — no string interpolation of user input
- `EXISTS` chosen over JOIN so a resource both owned and shared does not appear twice (seed resource 10 tests this)
- Indexes aligned to `findResources()` predicates and allowlisted sort fields (see **Indexing strategy** above); `0003` adds `type`, `status`, composite `(type, status)`, `created_at DESC`, and `(owner_id, created_at DESC)`
- `ORDER BY id` uses the primary key; no extra index needed

### How verified

```bash
npm run db:up && npm run db:reset
npm test          # 37 passed
npm run build     # tsc clean
npm run lint      # biome check clean
```

## Trade-offs

- **Offset pagination** — simple and sufficient for this scope; cursor-based pagination deferred
- **Auth stub** — `x-user-id` header only; no tokens or sessions (per challenge baseline)
- **`GET /users/:userId/resources` excludes shares** — returns resources owned by the path user; global lists include shares. Product could extend this later
- **Order field validation at controller only** — repository trusts typed order map after allowlist check
- **No total count / page metadata** — returns array only; kept minimal per time scope
- **Cast in `buildFindResourcesParams`** — bridges generic `FindParams` to resources-specific order type after controller validation

## Open questions

- Should `GET /users/:userId/resources` include resources shared with that user, or stay owner-only?
- Should members see a 404 or 403 when requesting a non-existent path user (today: 403 for members, 404 for admins who pass authorization)?
- Cursor pagination if resource volume grows significantly (offset + composite indexes help but do not replace cursors at very large scale)
