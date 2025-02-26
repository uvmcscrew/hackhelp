CREATE TABLE "challenge" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"linked_repo" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text,
	"created_at" timestamp NOT NULL,
	"issue_id" integer NOT NULL,
	"repository" text NOT NULL,
	"title" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "selected_challenge_id" text;--> statement-breakpoint
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_selected_challenge_id_challenge_id_fk" FOREIGN KEY ("selected_challenge_id") REFERENCES "public"."challenge"("id") ON DELETE no action ON UPDATE no action;