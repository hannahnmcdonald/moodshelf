CREATE TABLE "books" (
	"id" serial PRIMARY KEY NOT NULL,
	"open_library_id" text NOT NULL,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"year" integer,
	"page_count" integer,
	"is_series" boolean DEFAULT false NOT NULL,
	"description" text NOT NULL,
	"attributes" jsonb,
	"embedding" vector(1536),
	"cover_id" text,
	CONSTRAINT "books_open_library_id_unique" UNIQUE("open_library_id")
);
--> statement-breakpoint
CREATE TABLE "eval_queries" (
	"id" serial PRIMARY KEY NOT NULL,
	"query" text NOT NULL,
	"expected_book_ids" integer[] NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"query" text NOT NULL,
	"book_id" integer NOT NULL,
	"vote" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "llm_calls" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"purpose" text NOT NULL,
	"model" text NOT NULL,
	"prompt" text NOT NULL,
	"response" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"latency_ms" integer,
	"error" text
);
--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "books_embedding_idx" ON "books" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "books_search_tsv_idx" ON "books" USING gin (to_tsvector('english', "description"));