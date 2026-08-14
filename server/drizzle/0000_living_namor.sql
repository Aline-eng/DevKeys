CREATE TYPE "public"."keystroke_event_type" AS ENUM('char', 'backspace', 'correction');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('free', 'premium');--> statement-breakpoint
CREATE TYPE "public"."practice_category" AS ENUM('code', 'prose', 'quote');--> statement-breakpoint
CREATE TYPE "public"."practice_source" AS ENUM('curated', 'user_import');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "key_stats" (
	"user_id" text NOT NULL,
	"key" varchar(16) NOT NULL,
	"attempts_count" integer DEFAULT 0 NOT NULL,
	"correct_count" integer DEFAULT 0 NOT NULL,
	"incorrect_count" integer DEFAULT 0 NOT NULL,
	"avg_latency_ms" real,
	"last_practiced_at" timestamp,
	CONSTRAINT "key_stats_user_id_key_pk" PRIMARY KEY("user_id","key")
);
--> statement-breakpoint
CREATE TABLE "keystroke_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"attempt_id" uuid NOT NULL,
	"seq" integer NOT NULL,
	"timestamp_ms" integer NOT NULL,
	"key" varchar(16) NOT NULL,
	"code" varchar(32) NOT NULL,
	"expected_char" varchar(8),
	"is_correct" boolean NOT NULL,
	"event_type" "keystroke_event_type" NOT NULL,
	"inter_key_interval_ms" integer
);
--> statement-breakpoint
CREATE TABLE "practice_texts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"category" "practice_category" NOT NULL,
	"language_layout" varchar(32) DEFAULT 'en-us-qwerty' NOT NULL,
	"difficulty" smallint DEFAULT 1 NOT NULL,
	"char_count" integer NOT NULL,
	"source" "practice_source" DEFAULT 'curated' NOT NULL,
	"owner_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "typing_attempts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"practice_text_id" uuid NOT NULL,
	"started_at" timestamp NOT NULL,
	"completed_at" timestamp NOT NULL,
	"duration_ms" integer NOT NULL,
	"wpm" real NOT NULL,
	"raw_wpm" real NOT NULL,
	"accuracy_pct" real NOT NULL,
	"total_chars" integer NOT NULL,
	"correct_chars" integer NOT NULL,
	"error_count" integer NOT NULL,
	"uncorrected_error_count" integer NOT NULL,
	"client_meta" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"plan" "plan" DEFAULT 'free' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "key_stats" ADD CONSTRAINT "key_stats_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keystroke_events" ADD CONSTRAINT "keystroke_events_attempt_id_typing_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."typing_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_texts" ADD CONSTRAINT "practice_texts_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "typing_attempts" ADD CONSTRAINT "typing_attempts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "typing_attempts" ADD CONSTRAINT "typing_attempts_practice_text_id_practice_texts_id_fk" FOREIGN KEY ("practice_text_id") REFERENCES "public"."practice_texts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "keystroke_events_attempt_id_idx" ON "keystroke_events" USING btree ("attempt_id");