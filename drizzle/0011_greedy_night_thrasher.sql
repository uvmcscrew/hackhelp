ALTER TABLE "ticket" ADD COLUMN "challenge_id" text;--> statement-breakpoint
ALTER TABLE "ticket" ADD COLUMN "issue_number" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "ticket" ADD COLUMN "assigned_mentor" text;--> statement-breakpoint
ALTER TABLE "ticket" ADD COLUMN "resolution_status" text DEFAULT 'open' NOT NULL;--> statement-breakpoint
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_challenge_id_challenge_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenge"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_assigned_mentor_user_id_fk" FOREIGN KEY ("assigned_mentor") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;