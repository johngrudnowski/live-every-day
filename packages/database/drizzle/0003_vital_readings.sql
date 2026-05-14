CREATE TABLE "vital_readings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"systolic_mm_hg" integer,
	"diastolic_mm_hg" integer,
	"pulse_bpm" integer,
	"temperature_f_tenths" integer,
	"oxygen_saturation_percent" integer,
	"recorded_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vital_readings" ADD CONSTRAINT "vital_readings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "vital_readings_user_recorded_at_idx" ON "vital_readings" USING btree ("user_id","recorded_at");
