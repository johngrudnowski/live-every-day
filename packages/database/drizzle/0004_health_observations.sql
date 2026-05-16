CREATE TABLE "health_data_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"kind" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_metric_types" (
	"key" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"label" text NOT NULL,
	"value_kind" text NOT NULL,
	"default_unit" text,
	"aggregation_default" text NOT NULL,
	"loinc_code" text,
	"apple_identifier" text,
	"health_connect_record_type" text,
	"metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_source_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"source_id" text NOT NULL,
	"external_account_id" text,
	"display_name" text,
	"status" text NOT NULL,
	"scopes_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_sync_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_sync_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"source_connection_id" text,
	"status" text NOT NULL,
	"sync_kind" text NOT NULL,
	"window_start_at" timestamp with time zone,
	"window_end_at" timestamp with time zone,
	"cursor_before" text,
	"cursor_after" text,
	"records_read" integer DEFAULT 0 NOT NULL,
	"records_written" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "health_observation_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"group_type" text NOT NULL,
	"source_connection_id" text,
	"source_record_id" text,
	"observed_at" timestamp with time zone NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_observations" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"metric_key" text NOT NULL,
	"source_connection_id" text,
	"observation_group_id" text,
	"source_record_id" text,
	"source_record_version" text,
	"value_numeric" double precision,
	"value_text" text,
	"value_boolean" boolean,
	"unit" text,
	"observed_at" timestamp with time zone NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"recorded_at" timestamp with time zone,
	"aggregation_kind" text DEFAULT 'point' NOT NULL,
	"body_site" text,
	"device_name" text,
	"source_metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"quality_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "health_daily_summaries" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"metric_key" text NOT NULL,
	"summary_date" date NOT NULL,
	"timezone" text NOT NULL,
	"source_connection_id" text,
	"sample_count" integer DEFAULT 0 NOT NULL,
	"value_sum" double precision,
	"value_avg" double precision,
	"value_min" double precision,
	"value_max" double precision,
	"value_latest" double precision,
	"latest_observed_at" timestamp with time zone,
	"metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "health_source_connections" ADD CONSTRAINT "health_source_connections_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "health_source_connections" ADD CONSTRAINT "health_source_connections_source_id_health_data_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."health_data_sources"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "health_sync_runs" ADD CONSTRAINT "health_sync_runs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "health_sync_runs" ADD CONSTRAINT "health_sync_runs_source_connection_id_health_source_connections_id_fk" FOREIGN KEY ("source_connection_id") REFERENCES "public"."health_source_connections"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "health_observation_groups" ADD CONSTRAINT "health_observation_groups_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "health_observation_groups" ADD CONSTRAINT "health_observation_groups_source_connection_id_health_source_connections_id_fk" FOREIGN KEY ("source_connection_id") REFERENCES "public"."health_source_connections"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "health_observations" ADD CONSTRAINT "health_observations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "health_observations" ADD CONSTRAINT "health_observations_metric_key_health_metric_types_key_fk" FOREIGN KEY ("metric_key") REFERENCES "public"."health_metric_types"("key") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "health_observations" ADD CONSTRAINT "health_observations_source_connection_id_health_source_connections_id_fk" FOREIGN KEY ("source_connection_id") REFERENCES "public"."health_source_connections"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "health_observations" ADD CONSTRAINT "health_observations_observation_group_id_health_observation_groups_id_fk" FOREIGN KEY ("observation_group_id") REFERENCES "public"."health_observation_groups"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "health_daily_summaries" ADD CONSTRAINT "health_daily_summaries_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "health_daily_summaries" ADD CONSTRAINT "health_daily_summaries_metric_key_health_metric_types_key_fk" FOREIGN KEY ("metric_key") REFERENCES "public"."health_metric_types"("key") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "health_daily_summaries" ADD CONSTRAINT "health_daily_summaries_source_connection_id_health_source_connections_id_fk" FOREIGN KEY ("source_connection_id") REFERENCES "public"."health_source_connections"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "health_source_connections_user_source_idx" ON "health_source_connections" USING btree ("user_id","source_id");
--> statement-breakpoint
CREATE INDEX "health_source_connections_user_status_idx" ON "health_source_connections" USING btree ("user_id","status");
--> statement-breakpoint
CREATE INDEX "health_sync_runs_user_started_idx" ON "health_sync_runs" USING btree ("user_id","started_at");
--> statement-breakpoint
CREATE INDEX "health_sync_runs_connection_started_idx" ON "health_sync_runs" USING btree ("source_connection_id","started_at");
--> statement-breakpoint
CREATE INDEX "health_observation_groups_user_group_observed_idx" ON "health_observation_groups" USING btree ("user_id","group_type","observed_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "health_observation_groups_source_record_unique" ON "health_observation_groups" USING btree ("source_connection_id","source_record_id") WHERE "health_observation_groups"."source_record_id" is not null;
--> statement-breakpoint
CREATE INDEX "health_observations_user_metric_observed_idx" ON "health_observations" USING btree ("user_id","metric_key","observed_at");
--> statement-breakpoint
CREATE INDEX "health_observations_user_observed_idx" ON "health_observations" USING btree ("user_id","observed_at");
--> statement-breakpoint
CREATE INDEX "health_observations_group_idx" ON "health_observations" USING btree ("observation_group_id");
--> statement-breakpoint
CREATE INDEX "health_observations_user_metric_aggregation_observed_idx" ON "health_observations" USING btree ("user_id","metric_key","aggregation_kind","observed_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "health_observations_source_record_unique" ON "health_observations" USING btree ("source_connection_id","source_record_id","metric_key") WHERE "health_observations"."source_record_id" is not null;
--> statement-breakpoint
CREATE INDEX "health_daily_summaries_user_date_idx" ON "health_daily_summaries" USING btree ("user_id","summary_date");
--> statement-breakpoint
CREATE INDEX "health_daily_summaries_user_metric_date_idx" ON "health_daily_summaries" USING btree ("user_id","metric_key","summary_date");
--> statement-breakpoint
CREATE UNIQUE INDEX "health_daily_summaries_user_metric_source_date_unique" ON "health_daily_summaries" USING btree ("user_id","metric_key","summary_date","source_connection_id") WHERE "health_daily_summaries"."source_connection_id" is not null;
--> statement-breakpoint
CREATE UNIQUE INDEX "health_daily_summaries_user_metric_manual_date_unique" ON "health_daily_summaries" USING btree ("user_id","metric_key","summary_date") WHERE "health_daily_summaries"."source_connection_id" is null;
--> statement-breakpoint
INSERT INTO "health_data_sources" ("id", "label", "kind") VALUES
	('manual', 'Manual entry', 'manual'),
	('seed', 'Seed data', 'manual'),
	('apple_health', 'Apple Health', 'platform'),
	('health_connect', 'Health Connect', 'platform'),
	('fhir_import', 'FHIR import', 'clinical_fhir');
--> statement-breakpoint
INSERT INTO "health_metric_types" ("key", "category", "label", "value_kind", "default_unit", "aggregation_default", "loinc_code", "apple_identifier", "health_connect_record_type") VALUES
	('blood_pressure_systolic', 'vital', 'Systolic blood pressure', 'quantity', 'mmHg', 'latest', '8480-6', null, null),
	('blood_pressure_diastolic', 'vital', 'Diastolic blood pressure', 'quantity', 'mmHg', 'latest', '8462-4', null, null),
	('heart_rate', 'vital', 'Pulse', 'quantity', 'bpm', 'latest', '8867-4', 'heartRate', 'HeartRateRecord'),
	('resting_heart_rate', 'cardio', 'Resting heart rate', 'quantity', 'bpm', 'average', null, 'restingHeartRate', 'RestingHeartRateRecord'),
	('body_temperature', 'vital', 'Temperature', 'quantity', 'degF', 'latest', '8310-5', 'bodyTemperature', 'BodyTemperatureRecord'),
	('oxygen_saturation', 'vital', 'O2 saturation', 'percent', '%', 'latest', '2708-6', 'oxygenSaturation', 'OxygenSaturationRecord'),
	('respiratory_rate', 'vital', 'Respiratory rate', 'quantity', 'breaths/min', 'average', '9279-1', 'respiratoryRate', 'RespiratoryRateRecord'),
	('body_weight', 'body', 'Weight', 'quantity', 'lb', 'latest', '29463-7', 'bodyMass', 'WeightRecord'),
	('steps', 'activity', 'Steps', 'count', 'count', 'sum', null, 'stepCount', 'StepsRecord'),
	('active_minutes', 'activity', 'Active minutes', 'duration', 'min', 'sum', null, 'appleExerciseTime', 'ActiveCaloriesBurnedRecord'),
	('sleep_duration', 'sleep', 'Sleep', 'duration', 'min', 'duration', null, 'sleepAnalysis', 'SleepSessionRecord'),
	('time_in_bed', 'sleep', 'Time in bed', 'duration', 'min', 'duration', null, 'sleepAnalysis', 'SleepSessionRecord'),
	('heart_rate_variability_sdnn', 'cardio', 'HRV', 'quantity', 'ms', 'average', null, 'heartRateVariabilitySDNN', 'HeartRateVariabilityRmssdRecord');
--> statement-breakpoint
DROP TABLE "vital_readings";
