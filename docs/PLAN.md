# Moodshelf: architecture and plan

## How it works

### Offline pipeline (runs once, then occasionally)

1. **Ingest:** fetch book data from Open Library, clean it, load into Postgres. Drop books with no
   usable description.
2. **Enrich:** send each description to an LLM and get structured JSON (themes, tone, pacing,
   setting, tropes, content notes). Validate with Zod, store in a `jsonb` column. Resumable, cached.
3. **Embed:** embed description + enriched attributes. Store in a pgvector `vector` column with an
   HNSW index.

### Query flow (per search)

1. User types a mood description.
2. Embed the query with the same model used for books.
3. Retrieve candidates two ways and merge with reciprocal rank fusion:
   - vector similarity (`ORDER BY embedding <=> $query LIMIT 50`)
   - Postgres full-text search (`tsvector`)
4. Apply hard metadata filters as SQL `WHERE` clauses (length, standalone vs series, content notes).
   Embeddings capture vibe; hard rules belong in SQL.
5. Re-rank the top ~30 with an LLM, pick the best 5-10, and write a "why it matches" line per book
   using only the stored attributes.
6. Return results plus the traits extracted from the query (shown in the "How we read your mood"
   sidebar).

### Evaluation harness

A script that runs a fixed set of test queries (30-50, hand-written, each with known good answers)
and scores results (recall@10, nDCG). Used to compare variants: vector only vs hybrid, embedding
models, with and without re-ranking.

## Tables (starting point)

- `books`: id, open_library_id, title, author, year, page_count, is_series, description,
  attributes (jsonb), embedding (vector), search_tsv (tsvector), cover_id
- `llm_calls`: id, created_at, purpose, model, prompt, response, input_tokens, output_tokens,
  latency_ms, error
- `feedback`: id, created_at, query, book_id, vote (+1/-1)
- `eval_queries`: id, query, expected_book_ids

## Phases

Each phase ends with something working.

1. **Basic semantic search.** Docker Postgres + pgvector, ingest ~5-10k books, embedding script with
   batching and retries, search endpoint, Home and Results screens.
2. **Better data + hybrid retrieval.** LLM enrichment script, full-text search, rank fusion, the three
   filter chips.
3. **Evaluation.** Test query set, eval script, results table comparing variants, short write-up.
4. **Re-ranking + explanations.** LLM re-rank (measure whether it helps), grounded explanations,
   "More like this" (start from a book), book detail page.
5. **Polish + deploy.** Thumbs up/down stored, query caching, latency and cost per query tracked,
   rate limiting, deploy, README with architecture diagram, eval results, and tradeoffs.

## Decisions so far

- **Name:** Moodshelf ("mood reader" is a common term for people who choose books by feel).
- **Data:** Open Library over the UCSD Book Graph: openly licensed, current, has an API. UCSD data
  is research-only and a years-old snapshot.
- **Filters:** only three, all things semantic search is bad at: length, standalone vs series,
  content notes. No genre or era filters; the description and trait sidebar cover those.
- **No accounts, no saved list, no About page.** Bare bones first.
- **"How it's built"** in the nav links to the GitHub README, which holds the technical write-up.
- **Book detail page** (later): cover, title, author, description, extracted traits, why it matched,
  "More like this" row, outbound links (Open Library, library, Bookshop.org). No reviews or ratings.
- **Logging:** own `llm_calls` table first; consider Langfuse or Helicone later.

## README should eventually include

Architecture diagram, stack, eval results table (real numbers only), 3-4 decision notes from
`docs/DECISIONS.md`, typical latency, cost per search, catalog size, link to the live site.
