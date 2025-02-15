ALTER TABLE "team" ADD COLUMN "join_code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "canJoin" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_join_code_unique" UNIQUE("join_code");