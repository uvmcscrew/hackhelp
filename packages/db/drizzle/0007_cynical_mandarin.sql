ALTER TABLE "teamMember" ALTER COLUMN "teamId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "teamMember" ALTER COLUMN "userId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "teamMember" ADD COLUMN "isCaptain" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "teamMember" ADD COLUMN "teamRole" text NOT NULL;