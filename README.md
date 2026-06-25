# Resources API — Take-Home

A small REST API over PostgreSQL. TypeScript + Express + `pg` with raw,
parameterized SQL (no ORM). Migrations are plain `.sql` files applied by a
script; tests run with Vitest + Supertest.

See **[CHALLENGE.md](./CHALLENGE.md)** for the original task description and
**[PR_DESCRIPTION.md](./PR_DESCRIPTION.md)** for the implementation write-up.

## Prerequisites

- Node.js 20+
- Docker (for the Postgres container)

## Run it

```bash
cp .env.example .env
npm install
npm run db:up      # start Postgres in docker
npm run db:reset   # apply migrations + seed deterministic data
npm test           # 37 tests, should pass
```

To run the server locally:

```bash
npm run dev        # http://localhost:3000
```

## Project layout

```
src/
  resources/     # GET /resources, GET /resources/recent
  users/         # GET /users/:userId/resources
  middleware/    # auth stub, requireAuth, error handler
  shared/        # query parsing, shared errors
migrations/      # plain SQL migrations
scripts/         # migrate + deterministic seed
test/            # Vitest + Supertest integration and unit tests
```

All three list endpoints share `ResourcesRepository.findResources()` — see
`src/resources/resources.repository.ts`.

## Endpoints

All endpoints require a valid `x-user-id` header (positive bigint string for an
existing user). Missing, malformed, or unknown ids return **401**.

| Endpoint | Description |
| -------- | ----------- |
| `GET /resources` | Filterable, paginated resource list. **Admin:** all resources. **Member:** owned + shared via `resource_shares`. |
| `GET /resources/recent` | 10 most recently created resources, scoped the same way as above. |
| `GET /users/:userId/resources` | Resources **owned by** the path user. **Admin:** any user. **Member:** own user id only (403 otherwise). Missing path user → 404. |

### Query params (`GET /resources`)

| Param | Type | Description |
| ----- | ---- | ----------- |
| `where` | JSON string | Filter object, e.g. `{"type":"doc","status":"draft"}` |
| `limit` | integer 1–100 | Page size |
| `skip` | integer ≥ 0 | Offset (offset pagination) |
| `order` | JSON string | Sort, e.g. `{"field":"id","direction":"asc"}` — fields: `id`, `created_at` |

Invalid params return **400** with `{ error, details }`.

### Examples

```bash
# Member — scoped list (owned + shared)
curl -H 'x-user-id: 2' 'http://localhost:3000/resources'

# Admin — all resources, filtered and paginated
curl -H 'x-user-id: 1' \
  'http://localhost:3000/resources?where=%7B%22type%22%3A%22doc%22%7D&limit=5&order=%7B%22field%22%3A%22id%22%2C%22direction%22%3A%22asc%22%7D'

# User-owned resources (no shares on this endpoint)
curl -H 'x-user-id: 1' http://localhost:3000/users/3/resources
```

## Auth

There is no real auth provider. `authStub` reads `x-user-id` and attaches
`req.userId` when the value is a valid positive bigint string. `requireAuth` on
protected routes then confirms the user exists in the database.

User ids are handled as **strings** end-to-end (Postgres `bigint` safe).

## Scripts

| Script             | What it does                          |
| ------------------ | ------------------------------------- |
| `npm run db:up`    | Start the Postgres container          |
| `npm run db:reset` | Apply migrations, then reseed the DB  |
| `npm run dev`      | Run the server with reload            |
| `npm run build`    | Type-check / compile to `dist/`       |
| `npm run lint`     | Biome check                           |
| `npm test`         | Run the test suite (37 tests)         |
