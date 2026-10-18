CREATE TABLE "profile" (
	"id" text PRIMARY KEY NOT NULL,
	"role" text DEFAULT 'competitor',
	"affiliation" text,
	"data" json
);
--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_id_user_id_fk" FOREIGN KEY ("id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "profile_userId_idx" ON "profile" USING btree ("id");--> statement-breakpoint
CREATE INDEX "configuration_key_idx" ON "configuration" USING btree ("key");