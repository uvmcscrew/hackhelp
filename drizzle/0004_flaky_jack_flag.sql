ALTER TABLE "user" RENAME COLUMN "isAdmin" TO "isOrgAdmin";--> statement-breakpoint
ALTER TABLE "user" RENAME COLUMN "isInOrganization" TO "isOrgMember";