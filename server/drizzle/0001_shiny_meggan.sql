ALTER TYPE "public"."practice_source" ADD VALUE 'generated';--> statement-breakpoint
CREATE TABLE "bigram_stats" (
	"user_id" text NOT NULL,
	"bigram" varchar(2) NOT NULL,
	"attempts_count" integer DEFAULT 0 NOT NULL,
	"correct_count" integer DEFAULT 0 NOT NULL,
	"incorrect_count" integer DEFAULT 0 NOT NULL,
	"avg_latency_ms" real,
	"last_practiced_at" timestamp,
	CONSTRAINT "bigram_stats_user_id_bigram_pk" PRIMARY KEY("user_id","bigram")
);
--> statement-breakpoint
ALTER TABLE "bigram_stats" ADD CONSTRAINT "bigram_stats_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;