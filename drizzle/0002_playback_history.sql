CREATE TABLE "playback_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"imdb_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"year" integer,
	"poster_url" text,
	"season" integer,
	"episode" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "playback_history" ADD CONSTRAINT "playback_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "playback_history_user_updated_idx" ON "playback_history" USING btree ("user_id","updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "playback_history_user_imdb_idx" ON "playback_history" USING btree ("user_id","imdb_id");--> statement-breakpoint
CREATE INDEX "playback_history_imdb_idx" ON "playback_history" USING btree ("imdb_id");