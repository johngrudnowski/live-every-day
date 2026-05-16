CREATE TABLE "circle_permission_definitions" (
	"key" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "circle_support_person_permission_grants" (
	"id" text PRIMARY KEY NOT NULL,
	"support_person_id" text NOT NULL,
	"user_id" text NOT NULL,
	"permission_key" text NOT NULL,
	"granted_by_user_id" text,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "circle_support_person_permission_grants" ADD CONSTRAINT "circle_support_permission_grants_support_fk" FOREIGN KEY ("support_person_id") REFERENCES "public"."circle_support_people"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "circle_support_person_permission_grants" ADD CONSTRAINT "circle_support_permission_grants_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "circle_support_person_permission_grants" ADD CONSTRAINT "circle_support_permission_grants_definition_fk" FOREIGN KEY ("permission_key") REFERENCES "public"."circle_permission_definitions"("key") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "circle_support_person_permission_grants" ADD CONSTRAINT "circle_support_permission_grants_granted_by_fk" FOREIGN KEY ("granted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "circle_support_permission_grants_support_person_idx" ON "circle_support_person_permission_grants" USING btree ("support_person_id");
--> statement-breakpoint
CREATE INDEX "circle_support_permission_grants_user_permission_idx" ON "circle_support_person_permission_grants" USING btree ("user_id","permission_key");
--> statement-breakpoint
CREATE INDEX "circle_support_permission_grants_permission_key_idx" ON "circle_support_person_permission_grants" USING btree ("permission_key");
--> statement-breakpoint
CREATE UNIQUE INDEX "circle_support_permission_grants_support_permission_unique" ON "circle_support_person_permission_grants" USING btree ("support_person_id","permission_key");
--> statement-breakpoint
INSERT INTO "circle_permission_definitions" ("key", "label", "description", "category", "sort_order")
VALUES
	('weekly_score', 'Weekly score', 'Can receive weekly check-in score summaries.', 'checkins', 0),
	('symptom_trends', 'Symptom trends', 'Can receive symptom trend context from check-ins.', 'checkins', 1),
	('labs', 'Labs', 'Can receive lab-related context when shared.', 'clinical', 2),
	('appointment_brief', 'Appointment brief', 'Can receive appointment preparation summaries.', 'care', 3)
ON CONFLICT ("key") DO UPDATE SET
	"label" = excluded."label",
	"description" = excluded."description",
	"category" = excluded."category",
	"sort_order" = excluded."sort_order",
	"updated_at" = now();
--> statement-breakpoint
INSERT INTO "circle_support_person_permission_grants" (
	"id",
	"support_person_id",
	"user_id",
	"permission_key",
	"granted_by_user_id",
	"granted_at",
	"created_at",
	"updated_at"
)
SELECT
	'circle_permission_grant_' || md5(circle_support_people."id" || ':' || legacy_permissions."permission_key"),
	circle_support_people."id",
	circle_support_people."user_id",
	legacy_permissions."permission_key",
	circle_support_people."user_id",
	COALESCE(circle_support_people."accepted_at", circle_support_people."invited_at", circle_support_people."created_at", now()),
	now(),
	now()
FROM "circle_support_people"
JOIN (
	VALUES
		('weeklyScore', 'weekly_score'),
		('symptomTrends', 'symptom_trends'),
		('labs', 'labs'),
		('appointmentBrief', 'appointment_brief')
) AS legacy_permissions("legacy_key", "permission_key")
	ON circle_support_people."permissions_json" ->> legacy_permissions."legacy_key" = 'true'
ON CONFLICT ("support_person_id", "permission_key") DO UPDATE SET
	"revoked_at" = null,
	"updated_at" = now();
--> statement-breakpoint
ALTER TABLE "circle_support_people" DROP COLUMN "permissions_json";
