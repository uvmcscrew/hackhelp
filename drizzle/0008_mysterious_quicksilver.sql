ALTER TABLE "person" RENAME TO "profile";--> statement-breakpoint
ALTER TABLE "profile" RENAME COLUMN "edu_email" TO "email";--> statement-breakpoint
ALTER TABLE "profile" DROP CONSTRAINT "person_linked_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_linked_user_id_user_id_fk" FOREIGN KEY ("linked_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;