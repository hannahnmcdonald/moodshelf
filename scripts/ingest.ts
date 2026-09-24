/**
 * Ingest a fiction catalog from the Open Library Subjects and Works APIs.
 *
 * Crawls a curated list of fiction subjects, dedupes to unique works, fetches
 * each work's description, and loads the ones with a usable description into
 * `books`. Safe to re-run: works already in the DB are skipped without
 * re-fetching their detail page, so an interrupted run just resumes.
 *
 * Usage: npm run ingest
 */
import { db } from "../lib/db";
import { books } from "../lib/db/schema";
import { z } from "zod";

const USER_AGENT = "moodshelf/0.1 (+https://github.com/hannahnmcdonald/moodshelf)";
const TARGET_TOTAL = Number(process.env.INGEST_TARGET_TOTAL ?? 8000);
const PER_SUBJECT_TARGET = Number(process.env.INGEST_PER_SUBJECT_TARGET ?? 600);
const PAGE_SIZE = 200;
const MIN_DESCRIPTION_LENGTH = 40;
const REQUEST_DELAY_MS = Number(process.env.INGEST_DELAY_MS ?? 150);
const MAX_RETRIES = 4;

// Fiction-only subjects, chosen to span the moods/genres the search feature
// needs to cover. Broader Open Library subjects like "crime" or "family" are
// skipped because they pull in a lot of non-fiction.
const SUBJECTS = [
  "fantasy",
  "mystery",
  "romance",
  "science_fiction",
  "horror",
  "thriller",
  "historical_fiction",
  "young_adult_fiction",
  "adventure",
  "ghost_stories",
  "dystopia",
  "coming_of_age",
  "gothic_fiction",
  "short_stories",
  "fairy_tales",
  "detective_and_mystery_stories",
  "literary_fiction",
  "contemporary_fiction",
];

const subjectWorkSchema = z.object({
  key: z.string(),
  title: z.string(),
  authors: z.array(z.object({ name: z.string() })).default([]),
  first_publish_year: z.number().optional(),
  cover_id: z.number().optional(),
});
type SubjectWork = z.infer<typeof subjectWorkSchema>;

const workDetailSchema = z.object({
  description: z.union([z.string(), z.object({ value: z.string() })]).optional(),
});

const counts = {
  fetchedSubjectPages: 0,
  seenWorks: 0,
  skippedAlreadyIngested: 0,
  skippedNoAuthor: 0,
  skippedNoDescription: 0,
  skippedInvalidEntry: 0,
  inserted: 0,
  apiErrors: 0,
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url: string): Promise<unknown> {
  let attempt = 0;
  while (true) {
    attempt++;
    try {
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`retryable status ${res.status}`);
      }
      if (!res.ok) {
        throw new Error(`non-retryable status ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      if (attempt > MAX_RETRIES) {
        counts.apiErrors++;
        throw err;
      }
      const backoffMs = 500 * 2 ** (attempt - 1);
      await sleep(backoffMs);
    }
  }
}

function extractDescription(raw: unknown): string | null {
  const parsed = workDetailSchema.safeParse(raw);
  if (!parsed.success || parsed.data.description === undefined) return null;
  const value =
    typeof parsed.data.description === "string"
      ? parsed.data.description
      : parsed.data.description.value;
  const normalized = value.replace(/\r\n?/g, "\n").trim();
  return normalized.length >= MIN_DESCRIPTION_LENGTH ? normalized : null;
}

function toOpenLibraryId(workKey: string): string {
  return workKey.replace("/works/", "");
}

async function* iterateSubjectWorks(subject: string): AsyncGenerator<SubjectWork> {
  let offset = 0;
  let target = PER_SUBJECT_TARGET;
  let yielded = 0;

  while (yielded < target) {
    const url = `https://openlibrary.org/subjects/${subject}.json?limit=${PAGE_SIZE}&offset=${offset}`;
    const data = (await fetchJson(url)) as { work_count?: number; works?: unknown[] };
    counts.fetchedSubjectPages++;

    const works = Array.isArray(data.works) ? data.works : [];
    if (works.length === 0) return;

    for (const raw of works) {
      const parsed = subjectWorkSchema.safeParse(raw);
      if (!parsed.success) {
        counts.skippedInvalidEntry++;
        continue;
      }
      yield parsed.data;
      yielded++;
      if (yielded >= target) return;
    }

    offset += works.length;
    if (typeof data.work_count === "number" && offset >= data.work_count) return;
  }
}

async function main() {
  const existing = await db.select({ openLibraryId: books.openLibraryId }).from(books);
  const seenIds = new Set(existing.map((row) => row.openLibraryId));
  const startingTotal = existing.length;
  console.log(`Starting with ${startingTotal} books already ingested.`);

  outer: for (const subject of SUBJECTS) {
    if (startingTotal + counts.inserted >= TARGET_TOTAL) break outer;
    console.log(`\n[${subject}]`);
    let insertedForSubject = 0;

    for await (const work of iterateSubjectWorks(subject)) {
      if (startingTotal + counts.inserted >= TARGET_TOTAL) break outer;

      counts.seenWorks++;
      const openLibraryId = toOpenLibraryId(work.key);

      if (seenIds.has(openLibraryId)) {
        counts.skippedAlreadyIngested++;
        continue;
      }

      if (work.authors.length === 0) {
        counts.skippedNoAuthor++;
        seenIds.add(openLibraryId);
        continue;
      }

      let detail: unknown;
      try {
        await sleep(REQUEST_DELAY_MS);
        detail = await fetchJson(`https://openlibrary.org${work.key}.json`);
      } catch {
        seenIds.add(openLibraryId);
        continue;
      }

      const description = extractDescription(detail);
      seenIds.add(openLibraryId);
      if (!description) {
        counts.skippedNoDescription++;
        continue;
      }

      await db
        .insert(books)
        .values({
          openLibraryId,
          title: work.title,
          author: work.authors.map((a) => a.name).join(", "),
          year: work.first_publish_year ?? null,
          description,
          coverId: work.cover_id !== undefined ? String(work.cover_id) : null,
        })
        .onConflictDoNothing({ target: books.openLibraryId });

      counts.inserted++;
      insertedForSubject++;
    }

    console.log(`  inserted ${insertedForSubject} from this subject`);
  }

  console.log("\nDone.");
  console.table(counts);
  process.exit(0);
}

main().catch((err) => {
  console.error("Ingest failed:", err);
  process.exit(1);
});
