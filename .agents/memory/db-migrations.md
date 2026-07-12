---
name: DB migrations never run
description: The Drizzle schema exists in code but tables are not auto-created — drizzle-kit push must be run manually after any schema change.
---

## Rule
Any new table defined in `lib/db/src/schema/` will NOT exist in the database until you explicitly run migrations.

**Why:** The project uses `drizzle-kit push` (schema push mode), not auto-migrate on startup. The `complaints` table was absent from the database entirely, causing every POST /api/complaints to fail with PostgreSQL error `42P01: relation "complaints" does not exist`.

## How to apply
After adding or modifying any table in `lib/db/src/schema/`, run:
```
pnpm --filter @workspace/db run push
```
This calls `drizzle-kit push --config ./drizzle.config.ts` and syncs the schema to the live database.

The `push-force` script exists for destructive column changes: `pnpm --filter @workspace/db run push-force`.
