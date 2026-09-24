# Moodshelf

A book recommendation site. A reader describes the kind of book they're in the mood for
("a slow-burn mystery in a remote setting where you can't trust the narrator") and gets
matching books, each with a short grounded explanation of why it matches.

This is a portfolio project. The goal is to show engineering judgment on an AI feature:
hybrid retrieval, LLM enrichment, evaluation with real numbers, and production concerns
(cost, latency, caching). Clarity and measurable results matter more than feature count.

See `docs/PLAN.md` for the full architecture and phased plan.

## Stack

- **App:** Next.js (App Router) + TypeScript. API lives in route handlers (`app/api/...`).
- **Database:** Postgres + pgvector (Docker locally). ORM: Drizzle.
- **Styling:** Tailwind CSS with the design tokens below. No large component library.
- **UI helpers:** shadcn/ui (Radix) only for tricky widgets (dropdowns, tooltips); Lucide icons;
  TanStack Query for calling the search API.
- **Validation:** Zod, especially for all LLM JSON output.
- **Scripts:** standalone TS scripts in `scripts/` for ingest, enrich, embed, eval.
- **Data source:** Open Library (API first, bulk dumps later). Covers via the Open Library Covers API.

## Conventions

- All LLM and embedding calls go through one wrapper (`lib/ai/`) that logs every call to the
  `llm_calls` table (purpose, model, prompt, response, tokens, latency_ms, error).
- Keep the embedding model and LLM behind small interfaces so models can be swapped and compared.
- Batch jobs (enrich, embed) must be resumable and must not re-pay for work already done.
- Explanations shown to users must be grounded in stored book data. Never let the LLM invent
  plot details or books.
- Keep a decision log in `docs/DECISIONS.md`: "tried X, saw Y, chose Z because...".
- Start with a small catalog (~5-10k books) until the pipeline is solid.

## Design

Dark "late-night reading" look. Mockup markup is in `docs/design/` (reference only, not runnable).

Screens:
1. **Home (before search):** centered headline "What are you *in the mood* to read?" (italic part
   in accent), a one-line subtitle, the search box, and "Try:" example prompt chips. No results shown.
2. **Results (after search):** search box at top holding the query ("Search again"), a "Top matches"
   list of result cards, and a "How we read your mood" sidebar listing the traits extracted from the
   query, each removable.

Nav has only the logo (links home) and "How it's built", which links to the GitHub README.
No accounts, no saved list, no About page.

Search box: label "Your mood", large serif textarea, filter chips (Any length, Standalones only,
Content notes), primary pill button "Find my next read".

Result card: cover (fallback: colored rectangle with title and author), title, author and year,
rank, "Why it matches:" sentence, trait tags, "More like this" link, thumbs up/down feedback.

Logo: lowercase "moodshelf" in Instrument Serif next to a small line icon of a shelf with two
upright books and one leaning, stroked in the accent color.

### Tokens

```css
@theme {
  --color-bg: #121118;
  --color-surface: #1C1B25;
  --color-surface-raised: #25232F;
  --color-border: #2A2835;
  --color-border-strong: #3A3650;
  --color-text: #F3F1F8;
  --color-text-soft: #CFCAE0;
  --color-text-muted: #A7A2B8;
  --color-accent: #C9B8FF;        /* primary button bg (with --color-bg text), links, logo */
  --color-accent-soft: #2B2640;   /* tag / selected-chip background */
  --color-accent-soft-text: #DCD2FF;
  --color-highlight: #FFC2A1;     /* rank numbers */
  --font-serif: "Instrument Serif", Georgia, serif;  /* headings, logo, titles, search text */
  --font-sans: "Instrument Sans", system-ui, sans-serif; /* everything else */
}
```

Radii: cards 18px, search box 20px, buttons and chips fully rounded. Touch targets at least 44px.
Use real `<button>`, `<a>`, `<label>` elements; icon-only buttons need `aria-label`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
