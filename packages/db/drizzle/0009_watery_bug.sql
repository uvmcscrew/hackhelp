CREATE TABLE "ticket" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"issue_number" integer NOT NULL,
	"repository" text NOT NULL,
	"title" text NOT NULL,
	"assigned_mentor_id" text,
	"resolution_status" text DEFAULT 'open' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_assigned_mentor_id_user_id_fk" FOREIGN KEY ("assigned_mentor_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;