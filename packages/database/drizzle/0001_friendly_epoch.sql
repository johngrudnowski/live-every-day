CREATE TABLE "user_condition_onboarding_state" (
	"user_id" text PRIMARY KEY NOT NULL,
	"skipped_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_condition_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"condition_id" text NOT NULL,
	"condition_version" integer NOT NULL,
	"profile_json" jsonb NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_condition_onboarding_state" ADD CONSTRAINT "user_condition_onboarding_state_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_condition_profiles" ADD CONSTRAINT "user_condition_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_condition_profiles_user_condition_unique" ON "user_condition_profiles" USING btree ("user_id","condition_id");--> statement-breakpoint
CREATE INDEX "user_condition_profiles_user_id_idx" ON "user_condition_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_condition_profiles_condition_id_idx" ON "user_condition_profiles" USING btree ("condition_id");