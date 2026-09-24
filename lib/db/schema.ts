import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  smallint,
  text,
  timestamp,
  vector,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const books = pgTable(
  "books",
  {
    id: serial("id").primaryKey(),
    openLibraryId: text("open_library_id").notNull().unique(),
    title: text("title").notNull(),
    author: text("author").notNull(),
    year: integer("year"),
    pageCount: integer("page_count"),
    isSeries: boolean("is_series").notNull().default(false),
    description: text("description").notNull(),
    attributes: jsonb("attributes"),
    embedding: vector("embedding", { dimensions: 1536 }),
    coverId: text("cover_id"),
  },
  (table) => [
    index("books_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
    index("books_search_tsv_idx").using(
      "gin",
      sql`to_tsvector('english', ${table.description})`,
    ),
  ],
);

export const llmCalls = pgTable("llm_calls", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  purpose: text("purpose").notNull(),
  model: text("model").notNull(),
  prompt: text("prompt").notNull(),
  response: text("response"),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  latencyMs: integer("latency_ms"),
  error: text("error"),
});

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  query: text("query").notNull(),
  bookId: integer("book_id")
    .notNull()
    .references(() => books.id),
  vote: smallint("vote").notNull(),
});

export const evalQueries = pgTable("eval_queries", {
  id: serial("id").primaryKey(),
  query: text("query").notNull(),
  expectedBookIds: integer("expected_book_ids").array().notNull(),
});
