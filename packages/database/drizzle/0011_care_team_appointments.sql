CREATE TABLE "circle_care_team_appointments" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"care_team_person_id" text NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"location" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "circle_care_team_appointments" ADD CONSTRAINT "circle_care_team_appointments_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "circle_care_team_appointments" ADD CONSTRAINT "circle_care_team_appointments_care_team_person_fk" FOREIGN KEY ("care_team_person_id") REFERENCES "public"."circle_care_team_people"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "circle_care_team_appointments_user_scheduled_at_idx" ON "circle_care_team_appointments" USING btree ("user_id","scheduled_at");
--> statement-breakpoint
CREATE INDEX "circle_care_team_appointments_care_team_person_scheduled_at_idx" ON "circle_care_team_appointments" USING btree ("care_team_person_id","scheduled_at");
