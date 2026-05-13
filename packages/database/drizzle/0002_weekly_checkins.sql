CREATE TABLE "weekly_checkin_definitions" (
	"id" text NOT NULL,
	"version" integer NOT NULL,
	"condition_id" text,
	"title" text NOT NULL,
	"status" text NOT NULL,
	"definition_json" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_checkins" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"definition_id" text NOT NULL,
	"definition_version" integer NOT NULL,
	"condition_id" text,
	"week_start_date" date NOT NULL,
	"status" text NOT NULL,
	"answers_json" jsonb NOT NULL,
	"score_json" jsonb NOT NULL,
	"custom_note" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "weekly_checkins" ADD CONSTRAINT "weekly_checkins_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_checkin_definitions_id_version_unique" ON "weekly_checkin_definitions" USING btree ("id","version");
--> statement-breakpoint
CREATE INDEX "weekly_checkin_definitions_condition_status_idx" ON "weekly_checkin_definitions" USING btree ("condition_id","status");
--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_checkins_user_week_definition_unique" ON "weekly_checkins" USING btree ("user_id","week_start_date","definition_id");
--> statement-breakpoint
CREATE INDEX "weekly_checkins_user_status_week_idx" ON "weekly_checkins" USING btree ("user_id","status","week_start_date");
--> statement-breakpoint
CREATE INDEX "weekly_checkins_user_completed_at_idx" ON "weekly_checkins" USING btree ("user_id","completed_at");
