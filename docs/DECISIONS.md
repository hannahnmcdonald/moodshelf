# Decisions

## Local Postgres port: 5433, not 5432

Tried the default `5432:5432` mapping in `docker-compose.yml`. Docker refused to bind it:
another project's Postgres container (`checkmate-db-1`) already owns port 5432 on this
machine. Chose to map moodshelf's container to `5433:5432` instead of touching the other
project's container. `.env.example` and `.env.local` both point at `5433`.

## Fiction-only subject list for ingest

Open Library's Subjects API also has broad subjects like `crime`, `family`, and `friendship`
with tens of thousands of works, but sampling them showed a lot of non-fiction (true crime,
parenting books) mixed in. Chose a curated list of subjects that are fiction by construction
(`fantasy`, `mystery`, `romance`, `science_fiction`, `historical_fiction`, `gothic_fiction`,
etc.) over the broader ones, trading some catalog diversity for a catalog that's actually
book-mood-searchable.

## `page_count` and `is_series` left unpopulated at ingest time

Open Library's Subjects API (used for discovery) doesn't return page count or series
membership. Getting page count would mean a second API call per book (fetching the edition
record), doubling ingest's request volume for a field the search feature doesn't use until
Phase 2's length filter. Chose to leave `page_count` null and `is_series` false at ingest,
and revisit both if the Phase 2 filters need better data than Open Library's edition API
provides directly.

## dotenv loading lives in `lib/db/index.ts`, not in each script

First attempt: call `dotenv.config()` at the top of `scripts/ingest.ts` before importing
`lib/db`. Saw the script connect to the wrong database (`hannahmcdonald`, the OS user's
default) instead of the one in `.env.local`. Cause: `tsx` transforms `.ts` files to CommonJS,
and esbuild hoists all `import`-derived `require()` calls above other top-level statements —
so `lib/db`'s `new Pool(...)` (which reads `process.env.DATABASE_URL` at import time) ran
before the script's `config()` call ever executed. Chose to load `.env.local` once, inside
`lib/db/index.ts` itself, right before constructing the `Pool` — same file, so the ordering
bug can't recur, and every future standalone script (enrich, embed, eval) gets correct env
loading for free instead of needing to get the import order right itself.
