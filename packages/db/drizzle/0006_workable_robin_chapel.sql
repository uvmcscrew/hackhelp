CREATE TABLE "challenge" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"descr" text,
	"linked_repo" text
);
--> statement-breakpoint
CREATE TABLE "team" (
	"id" text PRIMARY KEY NOT NULL,
	"github_id" integer,
	"github_slug" text,
	"name" text NOT NULL,
	"join_code" text NOT NULL,
	"canJoin" boolean DEFAULT true NOT NULL,
	"isPublic" boolean DEFAULT true NOT NULL,
	"selected_challenge_id" text,
	CONSTRAINT "team_join_code_unique" UNIQUE("join_code")
);
--> statement-breakpoint
CREATE TABLE "teamMember" (
	"teamId" text,
	"userId" text,
	CONSTRAINT "teamMember_teamId_userId_pk" PRIMARY KEY("teamId","userId")
);
--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_selected_challenge_id_challenge_id_fk" FOREIGN KEY ("selected_challenge_id") REFERENCES "public"."challenge"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teamMember" ADD CONSTRAINT "teamMember_teamId_team_id_fk" FOREIGN KEY ("teamId") REFERENCES "public"."team"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teamMember" ADD CONSTRAINT "teamMember_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;