CREATE TABLE "circle_support_people" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"linked_user_id" text,
	"display_name" text NOT NULL,
	"initials" text,
	"relationship" text,
	"role" text NOT NULL,
	"status" text NOT NULL,
	"status_message" text NOT NULL,
	"invitation_email" text,
	"invitation_phone" text,
	"permissions_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"invited_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"last_message_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "circle_care_team_people" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider_user_id" text,
	"display_name" text NOT NULL,
	"initials" text,
	"role" text NOT NULL,
	"specialty" text,
	"organization" text,
	"status" text NOT NULL,
	"status_message" text NOT NULL,
	"external_provider_id" text,
	"metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"connected_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "circle_support_people" ADD CONSTRAINT "circle_support_people_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "circle_support_people" ADD CONSTRAINT "circle_support_people_linked_user_id_user_id_fk" FOREIGN KEY ("linked_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "circle_care_team_people" ADD CONSTRAINT "circle_care_team_people_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "circle_care_team_people" ADD CONSTRAINT "circle_care_team_people_provider_user_id_user_id_fk" FOREIGN KEY ("provider_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "circle_support_people_user_role_idx" ON "circle_support_people" USING btree ("user_id","role");
--> statement-breakpoint
CREATE INDEX "circle_support_people_user_status_idx" ON "circle_support_people" USING btree ("user_id","status");
--> statement-breakpoint
CREATE INDEX "circle_support_people_linked_user_idx" ON "circle_support_people" USING btree ("linked_user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "circle_support_people_user_display_unique" ON "circle_support_people" USING btree ("user_id","display_name");
--> statement-breakpoint
CREATE INDEX "circle_care_team_people_user_role_idx" ON "circle_care_team_people" USING btree ("user_id","role");
--> statement-breakpoint
CREATE INDEX "circle_care_team_people_user_status_idx" ON "circle_care_team_people" USING btree ("user_id","status");
--> statement-breakpoint
CREATE INDEX "circle_care_team_people_provider_user_idx" ON "circle_care_team_people" USING btree ("provider_user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "circle_care_team_people_user_display_unique" ON "circle_care_team_people" USING btree ("user_id","display_name");
