DROP INDEX IF EXISTS "circle_support_people_user_status_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "circle_care_team_people_user_status_idx";
--> statement-breakpoint
ALTER TABLE "circle_support_people" RENAME COLUMN "status" TO "invite_status";
--> statement-breakpoint
ALTER TABLE "circle_care_team_people" RENAME COLUMN "status" TO "connection_status";
--> statement-breakpoint
ALTER TABLE "circle_care_team_people" ADD COLUMN "next_appointment_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "circle_support_people" DROP COLUMN "status_message";
--> statement-breakpoint
ALTER TABLE "circle_care_team_people" DROP COLUMN "status_message";
--> statement-breakpoint
CREATE INDEX "circle_support_people_user_invite_status_idx" ON "circle_support_people" USING btree ("user_id","invite_status");
--> statement-breakpoint
CREATE INDEX "circle_care_team_people_user_connection_status_idx" ON "circle_care_team_people" USING btree ("user_id","connection_status");
