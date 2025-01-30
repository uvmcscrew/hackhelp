CREATE TABLE "team" (
	"id" text PRIMARY KEY NOT NULL,
	"github_id" integer NOT NULL,
	"github_slug" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_status" (
	"username" text PRIMARY KEY NOT NULL,
	"isWhitelisted" boolean DEFAULT false,
	"isBanned" boolean DEFAULT false,
	"linked_user_id" text
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "isWhitelisted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "team_id" text;--> statement-breakpoint
ALTER TABLE "user_status" ADD CONSTRAINT "user_status_linked_user_id_user_id_fk" FOREIGN KEY ("linked_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE no action ON UPDATE no action;