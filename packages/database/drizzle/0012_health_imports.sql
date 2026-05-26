CREATE TABLE "health_ingestion_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"source_id" text NOT NULL,
	"status" text NOT NULL,
	"input_kind" text NOT NULL,
	"source_label" text,
	"observed_at" timestamp with time zone,
	"metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_source_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"ingestion_job_id" text NOT NULL,
	"document_kind" text NOT NULL,
	"source_filename" text,
	"mime_type" text,
	"storage_key" text,
	"sha256_hash" text,
	"metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_extracted_records" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"ingestion_job_id" text NOT NULL,
	"source_document_id" text,
	"record_kind" text NOT NULL,
	"raw_label" text NOT NULL,
	"raw_value" text NOT NULL,
	"raw_unit" text,
	"raw_reference_range" text,
	"raw_observed_at" text,
	"normalized_metric_key" text,
	"normalized_value_numeric" double precision,
	"normalized_unit" text,
	"normalized_observed_at" timestamp with time zone,
	"panel_label" text,
	"abnormal_flag" text,
	"confidence" double precision,
	"issues_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"candidate_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text NOT NULL,
	"committed_observation_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_observation_provenance" (
	"id" text PRIMARY KEY NOT NULL,
	"observation_id" text NOT NULL,
	"ingestion_job_id" text NOT NULL,
	"source_document_id" text,
	"extracted_record_id" text NOT NULL,
	"confidence" double precision,
	"review_status" text NOT NULL,
	"reviewed_by_user_id" text,
	"reviewed_at" timestamp with time zone,
	"metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "health_ingestion_jobs" ADD CONSTRAINT "health_ingestion_jobs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "health_source_documents" ADD CONSTRAINT "health_source_documents_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "health_source_documents" ADD CONSTRAINT "health_source_documents_ingestion_job_id_health_ingestion_jobs_id_fk" FOREIGN KEY ("ingestion_job_id") REFERENCES "public"."health_ingestion_jobs"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "health_extracted_records" ADD CONSTRAINT "health_extracted_records_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "health_extracted_records" ADD CONSTRAINT "health_extracted_records_ingestion_job_id_health_ingestion_jobs_id_fk" FOREIGN KEY ("ingestion_job_id") REFERENCES "public"."health_ingestion_jobs"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "health_extracted_records" ADD CONSTRAINT "health_extracted_records_source_document_id_health_source_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."health_source_documents"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "health_extracted_records" ADD CONSTRAINT "health_extracted_records_committed_observation_id_health_observations_id_fk" FOREIGN KEY ("committed_observation_id") REFERENCES "public"."health_observations"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "health_observation_provenance" ADD CONSTRAINT "health_observation_provenance_observation_id_health_observations_id_fk" FOREIGN KEY ("observation_id") REFERENCES "public"."health_observations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "health_observation_provenance" ADD CONSTRAINT "health_observation_provenance_ingestion_job_id_health_ingestion_jobs_id_fk" FOREIGN KEY ("ingestion_job_id") REFERENCES "public"."health_ingestion_jobs"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "health_observation_provenance" ADD CONSTRAINT "health_observation_provenance_source_document_id_health_source_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."health_source_documents"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "health_observation_provenance" ADD CONSTRAINT "health_observation_provenance_extracted_record_id_health_extracted_records_id_fk" FOREIGN KEY ("extracted_record_id") REFERENCES "public"."health_extracted_records"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "health_observation_provenance" ADD CONSTRAINT "health_observation_provenance_reviewed_by_user_id_user_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "health_ingestion_jobs_user_created_idx" ON "health_ingestion_jobs" USING btree ("user_id","created_at");
--> statement-breakpoint
CREATE INDEX "health_ingestion_jobs_user_status_idx" ON "health_ingestion_jobs" USING btree ("user_id","status");
--> statement-breakpoint
CREATE INDEX "health_source_documents_user_job_idx" ON "health_source_documents" USING btree ("user_id","ingestion_job_id");
--> statement-breakpoint
CREATE INDEX "health_extracted_records_user_job_idx" ON "health_extracted_records" USING btree ("user_id","ingestion_job_id");
--> statement-breakpoint
CREATE INDEX "health_extracted_records_user_status_idx" ON "health_extracted_records" USING btree ("user_id","status");
--> statement-breakpoint
CREATE INDEX "health_extracted_records_metric_observed_idx" ON "health_extracted_records" USING btree ("normalized_metric_key","normalized_observed_at");
--> statement-breakpoint
CREATE INDEX "health_observation_provenance_observation_idx" ON "health_observation_provenance" USING btree ("observation_id");
--> statement-breakpoint
CREATE INDEX "health_observation_provenance_ingestion_job_idx" ON "health_observation_provenance" USING btree ("ingestion_job_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "health_observation_provenance_extracted_record_unique" ON "health_observation_provenance" USING btree ("extracted_record_id");
--> statement-breakpoint
INSERT INTO "health_data_sources" ("id", "label", "kind") VALUES
	('manual_lab_entry', 'Manual lab entry', 'lab_import')
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "health_metric_types" (
	"key",
	"category",
	"label",
	"value_kind",
	"default_unit",
	"aggregation_default",
	"loinc_code",
	"metadata_json"
) VALUES
	('lab_platelets', 'lab', 'Platelets', 'quantity', 'x10^3/uL', 'latest', '777-3', '{"chartKind":"line","displayGroup":"CBC","synonyms":["platelet count","plt","platelets"]}'::jsonb),
	('lab_wbc', 'lab', 'WBC', 'quantity', 'x10^3/uL', 'latest', '6690-2', '{"chartKind":"line","displayGroup":"CBC","synonyms":["white blood cells","white blood cell count","wbc","leukocytes"]}'::jsonb),
	('lab_hemoglobin', 'lab', 'Hemoglobin', 'quantity', 'g/dL', 'latest', '718-7', '{"chartKind":"line","displayGroup":"CBC","synonyms":["hemoglobin","hgb","hb"]}'::jsonb),
	('lab_hematocrit', 'lab', 'Hematocrit', 'quantity', '%', 'latest', '4544-3', '{"chartKind":"line","displayGroup":"CBC","synonyms":["hematocrit","hct"]}'::jsonb),
	('lab_rbc', 'lab', 'RBC', 'quantity', 'x10^6/uL', 'latest', '789-8', '{"chartKind":"line","displayGroup":"CBC","synonyms":["red blood cells","red blood cell count","rbc","erythrocytes"]}'::jsonb),
	('lab_neutrophils_absolute', 'lab', 'Absolute neutrophils', 'quantity', 'x10^3/uL', 'latest', '751-8', '{"chartKind":"line","displayGroup":"CBC","synonyms":["absolute neutrophils","absolute neutrophil count","anc","neutrophils absolute"]}'::jsonb),
	('lab_lymphocytes_absolute', 'lab', 'Absolute lymphocytes', 'quantity', 'x10^3/uL', 'latest', '731-0', '{"chartKind":"line","displayGroup":"CBC","synonyms":["absolute lymphocytes","absolute lymphocyte count","alc","lymphocytes absolute"]}'::jsonb)
ON CONFLICT DO NOTHING;
