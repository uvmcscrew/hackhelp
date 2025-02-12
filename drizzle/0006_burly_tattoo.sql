ALTER TABLE "user_status" RENAME TO "person";--> statement-breakpoint
ALTER TABLE "person" DROP CONSTRAINT "user_status_linked_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "person" ADD COLUMN "role" text DEFAULT 'competitor';--> statement-breakpoint
ALTER TABLE "person" ADD COLUMN "given_name" text;--> statement-breakpoint
ALTER TABLE "person" ADD COLUMN "edu_email" text;--> statement-breakpoint
ALTER TABLE "person" ADD CONSTRAINT "person_linked_user_id_user_id_fk" FOREIGN KEY ("linked_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;