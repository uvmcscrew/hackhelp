ALTER TABLE "user" ALTER COLUMN "isOrgAdmin" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "isOrgMember" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_status" ALTER COLUMN "isWhitelisted" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_status" ALTER COLUMN "isBanned" SET NOT NULL;