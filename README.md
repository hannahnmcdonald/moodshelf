# moodshelf

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-0F172A?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![pgvector](https://img.shields.io/badge/pgvector-336791?style=for-the-badge)
![Drizzle](https://img.shields.io/badge/Drizzle-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

Describe the kind of book you're in the mood for — tone, pacing, setting, the vibe you can't
quite put a genre on — and get a short list of books that actually match, each with a
one-line explanation grounded in real data about the book, not an LLM's guess.

> _"A slow-burn mystery in a remote setting where you can't trust the narrator."_

This is a portfolio project built to show engineering judgment on an AI feature end to end:
hybrid retrieval, LLM enrichment, evaluation with real numbers, and the production concerns
that usually get skipped in a demo — cost, latency, caching, and what happens when the model
is wrong.

## Status

Actively in progress. Building in phases, each one ending with something working:

- [x] **Phase 1 — Basic semantic search.** Docker Postgres + pgvector, Open Library ingest,
      Home screen. _In progress: embedding script, search endpoint, Results screen._
- [ ] **Phase 2 — Better data + hybrid retrieval.** LLM enrichment, full-text search, rank
      fusion, the three filter chips.
- [ ] **Phase 3 — Evaluation.** Fixed test query set, eval script, results table comparing
      retrieval variants.
- [ ] **Phase 4 — Re-ranking + explanations.** LLM re-rank, grounded "why it matches" copy,
      "More like this", book detail page.
- [ ] **Phase 5 — Polish + deploy.** Feedback storage, query caching, latency/cost tracking,
      rate limiting, live deploy.

See [`docs/PLAN.md`](docs/PLAN.md) for the full architecture and phase breakdown.

## How it works

**Offline pipeline** (runs once, then occasionally): ingest books from Open Library →
enrich each description with an LLM into structured attributes (themes, tone, pacing,
setting, tropes, content notes) → embed description + attributes into pgvector.

**Per search:** embed the query → retrieve candidates by vector similarity _and_ Postgres
full-text search, merge with reciprocal rank fusion → apply hard filters (length, standalone
vs. series, content notes) in SQL → re-rank the top candidates with an LLM and write a
grounded "why it matches" line per book, using only stored attributes (never invented) →
return results plus the traits extracted from the query.

## Stack

- **App:** Next.js (App Router) + TypeScript
- **Database:** Postgres + pgvector (Docker), Drizzle ORM
- **Styling:** Tailwind CSS, shadcn/ui (Radix) for a few widgets, Lucide icons
- **Validation:** Zod, for all LLM JSON output
- **Data source:** Open Library API
- **Scripts:** standalone TypeScript in `scripts/` for ingest, enrich, embed, eval

Every LLM and embedding call will go through one wrapper (`lib/ai/`, coming in Phase 2) that
logs purpose, model, prompt, response, tokens, and latency to the `llm_calls` table already
in the schema — so the cost and latency numbers below will be measured, not estimated.

## Key decisions

A few highlights; the full log is in [`docs/DECISIONS.md`](docs/DECISIONS.md).

- **Open Library over the UCSD Book Graph** for data: openly licensed, current, has an API.
  The UCSD dataset is research-only and a years-old snapshot.
- **Only three filters** (length, standalone vs. series, content notes) — the things
  semantic search is bad at. No genre/era filters; the mood description and extracted traits
  cover that ground instead.
- **Fiction-only Open Library subjects for ingest**, over broader ones like `crime` or
  `family`, after sampling showed those pull in a lot of non-fiction.
- **No accounts, no saved list, no About page.** Bare bones first; see what's actually
  missing before adding it.

## Evaluation

TODO — Phase 3. Will be a table of recall@10 / nDCG across retrieval variants (vector only
vs. hybrid, embedding models, with/without re-ranking) against a fixed 30-50 query set, real
numbers only.

## Cost & latency

TODO — Phase 5, once query caching and the `llm_calls` log have real traffic to report from.

## Catalog size

Ingest is in progress against a target of ~8,000 books, sourced from Open Library across
fiction subjects (fantasy, mystery, romance, sci-fi, horror, and more — see
[`scripts/ingest.ts`](scripts/ingest.ts) for the full list). Final count TODO once it finishes.

## Live site

TODO — Phase 5.

## Running it locally

```bash
cp .env.example .env.local        # defaults work as-is for local dev
docker compose up -d              # Postgres + pgvector on localhost:5433
npm install
npm run db:migrate
npm run ingest                    # populates the books table from Open Library
npm run dev                       # http://localhost:3000
```

## License

MIT — see [`LICENSE`](LICENSE).
