ALTER TABLE "configuration" ALTER COLUMN "value" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "configuration" ADD COLUMN "last_updated" timestamp DEFAULT now() NOT NULL;