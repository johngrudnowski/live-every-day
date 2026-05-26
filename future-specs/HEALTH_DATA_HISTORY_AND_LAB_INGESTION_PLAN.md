# Health Data History and Lab Ingestion Plan

## Goal

Build a clean, extensible health data architecture that supports:

- Daily wearable metrics.
- Manually logged home vitals.
- Sparse clinical labs.
- Scanned or uploaded lab PDFs.
- Lab screenshots and photos.
- Parsed text from OCR.
- FHIR observations from Apple Health Records, Health Connect Medical Records, direct FHIR APIs, or patient portal exports.
- Future vendor integrations such as Garmin, Oura, Withings, Omron, Epic/MyChart, CSV import, and clinician-entered values.

The main design principle is that ingestion, normalization, review, storage, and visualization should be separate concerns. The app should not need a new table or screen architecture for every source format.

This document extends `HEALTH_OBSERVATIONS_SCHEMA_PLAN.md`. That plan defines the canonical health observation model. This plan explains how we should use it for history UX and future lab ingestion.

## Product Model

There are three related but different data experiences:

1. Wearable and daily health history.
   - High-frequency or daily metrics.
   - Examples: steps, sleep, HRV, resting heart rate, pulse, weight.
   - Primary UX: metric trend screen with day/week/month/year range controls.

2. Home vitals history.
   - Manually entered or device-synced measurements.
   - Examples: blood pressure, temperature, oxygen saturation, pulse.
   - Primary UX: same metric trend framework as wearables, with special paired rendering for blood pressure.

3. Lab history.
   - Sparse, panel-based clinical results.
   - Examples: CBC, CMP, iron studies, inflammatory markers.
   - Primary UX: lab-specific history with result dates, reference ranges, abnormal flags, panel grouping, and source document traceability.

The first two can share the generic metric history screen. Labs should reuse the underlying observation model and chart primitives, but they should have their own product surface because lab data is not usually daily and because clinical interpretation depends heavily on units, reference ranges, abnormal flags, and the source report.

## Architecture Principles

- Keep raw source data. Store the original file, OCR text, FHIR JSON, or vendor payload when permitted.
- Normalize into canonical observations only after source-specific parsing.
- Never make the UI parse raw PDFs, screenshots, or FHIR directly.
- Keep ingestion adapters source-specific and storage/query APIs source-agnostic.
- Treat imported data as provisional until confidence is high or the user confirms it.
- Store provenance for every value: source, parser, confidence, source document, page/region when available.
- Avoid one table per lab or metric.
- Do not couple charts to source formats. Charts read canonical daily summaries or observation history.
- Prefer append-only/auditable ingestion records over destructive replacement.
- Support reprocessing. Parser improvements should be able to re-run against stored raw inputs.

## Current Foundation

The repo already has a strong base:

- `health_observations`
  - Canonical scalar observations.
  - Works for vitals, wearable samples, clinical observations, and lab result values.

- `health_observation_groups`
  - Groups related observations.
  - Useful for blood pressure and lab panels.

- `health_daily_summaries`
  - Supports fast daily trend views.

- `health_metric_types`
  - Catalog of metric keys, labels, units, aggregation defaults, and platform identifiers.

- Health data APIs:
  - `GET /api/me/health/summary/daily`
  - `GET /api/me/health/observations/history`
  - `GET /api/me/health/observations/latest`
  - feature-shaped wrappers like vitals summary.

The next step is to add ingestion and lab-specific layers without weakening this model.

## Proposed Domain Boundaries

### Source Acquisition

Responsible for getting raw data into the system.

Examples:

- User uploads a PDF.
- User takes a screenshot/photo.
- User connects Apple Health.
- User connects Health Connect.
- User imports a FHIR bundle.
- User forwards a portal document.

This layer should create an ingestion job and store raw source artifacts. It should not decide final medical meaning.

### Parsing

Responsible for extracting candidate structured data from a raw source.

Examples:

- PDF text extraction.
- OCR over screenshots/photos.
- Table extraction.
- FHIR `Observation` parsing.
- CSV row mapping.
- Vendor API payload mapping.

Output should be candidate records, not final trusted observations.

### Normalization

Responsible for mapping parser output to canonical concepts.

Examples:

- `Platelets`, `PLT`, and `Platelet Count` map to one metric key.
- `K/uL`, `10^3/uL`, and `x10^9/L` are normalized or preserved with conversion metadata.
- Lab panel names are mapped to panel groups.
- Reference ranges are parsed into structured low/high/text fields.

This layer should use metric catalogs and mapping tables. It should not be embedded in frontend code.

### Review and Confirmation

Responsible for deciding whether extracted data can be committed automatically or must be reviewed.

Examples:

- High-confidence FHIR observations may be written directly with source provenance.
- OCR-extracted labs should usually enter a review queue before becoming user-visible clinical data.
- Low-confidence units or dates require user confirmation.

### Canonical Storage

Responsible for storing final observations, groups, raw-resource links, provenance, confidence, and review status.

### Query and Visualization

Responsible for reading normalized observations and summaries.

Examples:

- Metric history screen.
- Lab history screen.
- Latest values cards.
- Appointment prep summaries.
- Care team sharing.

Visualization should not know whether a value came from OCR, FHIR, Apple Health, manual entry, or a vendor API except when displaying provenance.

## Suggested Additional Tables

The existing schema supports observations. We should add ingestion-oriented tables around it.

### `health_ingestion_jobs`

Tracks each import attempt.

| Column | Notes |
| --- | --- |
| `id` | Primary key. |
| `user_id` | Owner. |
| `source_id` | `manual_upload`, `apple_health_records`, `health_connect_medical`, `fhir_import`, etc. |
| `status` | `uploaded`, `parsing`, `needs_review`, `partially_imported`, `imported`, `failed`, `canceled`. |
| `input_kind` | `pdf`, `image`, `fhir_bundle`, `csv`, `vendor_payload`, `manual`. |
| `source_filename` | Original filename when available. |
| `mime_type` | Original MIME type. |
| `started_at` | Processing start. |
| `completed_at` | Processing end. |
| `error_message` | Safe error detail. |
| `metadata_json` | Source-specific metadata. |
| `created_at` / `updated_at` | Standard timestamps. |

### `health_source_documents`

Stores source document metadata and links to object storage.

| Column | Notes |
| --- | --- |
| `id` | Primary key. |
| `user_id` | Owner. |
| `ingestion_job_id` | Parent job. |
| `storage_key` | Object storage key, not public URL. |
| `document_kind` | `lab_report`, `visit_summary`, `fhir_bundle`, `unknown`. |
| `mime_type` | PDF/image/JSON/etc. |
| `page_count` | Optional. |
| `sha256_hash` | Deduplication and audit. |
| `captured_at` | When source document says it was created, if known. |
| `metadata_json` | Source metadata. |
| `created_at` / `updated_at` | Standard timestamps. |

### `health_extracted_records`

Parser output before final normalization.

| Column | Notes |
| --- | --- |
| `id` | Primary key. |
| `user_id` | Owner. |
| `ingestion_job_id` | Parent job. |
| `source_document_id` | Source document. |
| `record_kind` | `lab_result`, `vital`, `medication`, `condition`, `unknown`. |
| `raw_label` | Text as found, e.g. `PLT`. |
| `raw_value` | Text as found, e.g. `842`. |
| `raw_unit` | Text as found, e.g. `K/uL`. |
| `raw_reference_range` | Text as found. |
| `raw_observed_at` | Text/date as found. |
| `page_number` | PDF page or image index. |
| `bounding_box_json` | Optional OCR/table region. |
| `parser_name` | Parser or model identifier. |
| `parser_version` | Version for reprocessing. |
| `confidence` | Numeric confidence if available. |
| `candidate_json` | Full parser output for audit/debug. |
| `status` | `candidate`, `accepted`, `rejected`, `superseded`. |
| `created_at` / `updated_at` | Standard timestamps. |

### `health_observation_provenance`

Links canonical observations back to source records.

| Column | Notes |
| --- | --- |
| `id` | Primary key. |
| `observation_id` | Canonical `health_observations.id`. |
| `source_document_id` | Optional source document. |
| `extracted_record_id` | Optional parser candidate. |
| `fhir_resource_id` | Optional raw FHIR resource row. |
| `confidence` | Confidence at commit time. |
| `review_status` | `auto_accepted`, `user_confirmed`, `clinician_confirmed`, `rejected`. |
| `reviewed_by_user_id` | Optional. |
| `reviewed_at` | Optional. |
| `notes` | Optional internal/user-safe note. |
| `created_at` / `updated_at` | Standard timestamps. |

### `clinical_reference_ranges`

Optional but important for labs.

Reference ranges vary by lab, units, age, sex, pregnancy status, and method. Do not assume one global normal range is always correct.

| Column | Notes |
| --- | --- |
| `id` | Primary key. |
| `metric_key` | Canonical metric. |
| `source_document_id` | Source-specific range when extracted from report. |
| `unit` | Unit for this range. |
| `low_value` | Numeric low if parseable. |
| `high_value` | Numeric high if parseable. |
| `text_range` | Original text range. |
| `abnormal_flag` | `low`, `high`, `critical_low`, `critical_high`, `normal`, `abnormal`, etc. |
| `metadata_json` | Lab-specific details. |

For first pass, reference range can live in observation metadata or provenance JSON. Move to a table when lab history becomes central.

## Metric Catalog Extensions

The existing metric catalog should grow to support labs and clinical mappings.

Add fields over time:

- `category`
  - `lab`, `vital`, `activity`, `sleep`, `cardio`, `body`, etc.

- `display_group`
  - Example: `CBC`, `Metabolic panel`, `Iron studies`.

- `value_kind`
  - `quantity`, `ratio`, `percent`, `text`, `boolean`.

- `canonical_unit`
  - Preferred unit for comparison.

- `unit_conversions_json`
  - Explicit conversions where clinically safe.

- `loinc_code`
  - Primary clinical code when available.

- `synonyms_json`
  - Parser support for names like `PLT`, `Platelets`, `Platelet Count`.

- `chart_kind`
  - `line`, `bar`, `scatter`, `paired_line`, `none`.

- `aggregation_default`
  - `latest`, `average`, `sum`, `min`, `max`, `duration`.

- `lab_reference_behavior`
  - `source_report`, `global_reference`, `none`.

Metric identity must be stable. UI labels can change; metric keys should not.

## Lab Ingestion Flow

### 1. Upload

User uploads or captures a lab report.

API:

- `POST /api/me/health/imports`
  - Creates `health_ingestion_jobs`.
  - Stores the raw file in object storage.
  - Creates `health_source_documents`.
  - Enqueues parsing.

### 2. Parse

Worker pipeline:

1. Detect document type.
2. Extract text.
3. Detect tables and result rows.
4. Extract candidate values, units, ranges, flags, dates, and panel names.
5. Save `health_extracted_records`.
6. Set job to `needs_review` unless auto-accept criteria are met.

For PDFs:

- Prefer embedded text extraction first.
- Fall back to OCR for scanned pages.
- Keep page number and bounding boxes when possible.

For screenshots/photos:

- OCR first.
- Use layout/table heuristics.
- Require review unless confidence is very high.

For FHIR:

- Parse `Bundle` resources.
- Preserve raw resources.
- Extract FHIR `Observation` resources into candidates or direct canonical observations depending on source trust.

### 3. Normalize

Normalizer maps candidate rows:

- Raw label to `metric_key`.
- Raw unit to canonical or preserved unit.
- Raw date to `observed_at`.
- Raw panel to `health_observation_groups`.
- Raw abnormal flags to structured metadata.
- Raw reference range to structured range.

Low-confidence mappings stay as candidates for review.

### 4. Review

User sees a review screen:

- Source document preview.
- Extracted lab rows.
- Editable date, value, unit, reference range, and label.
- Confidence/error hints.
- Accept/reject controls.

Accepted rows become canonical observations and provenance rows.

### 5. Display

Lab history reads canonical observations and provenance:

- Latest lab cards.
- Lab metric detail chart.
- Panel timeline.
- Original source document link/preview.
- Abnormal flags and reference ranges.

## FHIR Strategy

FHIR should be treated as a source format, not as the app's internal domain model.

Store raw FHIR resources for audit and reprocessing. Then project the clinically useful parts into app tables:

- `Observation` -> `health_observations`
- `DiagnosticReport` -> lab report group/document relationship
- `Condition` -> condition profile suggestions
- `MedicationStatement` / `MedicationRequest` -> medication history
- `AllergyIntolerance` -> allergies
- `Procedure` -> procedures
- `Encounter` -> visits

For labs, important FHIR fields include:

- `Observation.code`
- `Observation.value[x]`
- `Observation.unit`
- `Observation.effective[x]`
- `Observation.referenceRange`
- `Observation.interpretation`
- `Observation.status`
- `Observation.category`
- `Observation.performer`
- `Observation.issued`
- Links to `DiagnosticReport.result`

FHIR observations can often be auto-accepted from trusted sources, but we should still store provenance and source resource links.

## API Shape

### Ingestion APIs

Initial:

- `POST /api/me/health/imports`
  - Upload metadata and create job.

- `GET /api/me/health/imports`
  - List jobs.

- `GET /api/me/health/imports/:jobId`
  - Job detail, source documents, extracted records, status.

- `POST /api/me/health/imports/:jobId/review`
  - Accept/reject/edit candidate records.

Later:

- `POST /api/me/health/imports/:jobId/reprocess`
  - Re-run parser with a newer parser version.

- `GET /api/me/health/documents/:documentId`
  - Secure signed preview/download.

### History APIs

Keep generic APIs for trend screens:

- `GET /api/me/health/summary/daily`
- `GET /api/me/health/observations/history`
- `GET /api/me/health/observations/latest`

Add lab-specific read models:

- `GET /api/me/labs/summary`
- `GET /api/me/labs/panels`
- `GET /api/me/labs/metrics/:metricKey/history`
- `GET /api/me/labs/reports/:reportId`

These lab APIs should read from canonical observations plus provenance/documents.

## Frontend Architecture

### Generic Metric History

Use for:

- Wearables.
- Daily summaries.
- Home vitals.
- Any scalar observation that can be meaningfully charted by date.

Key components:

- `MetricHistoryScreen`
- `MetricPicker`
- `HistoryPeriodControl`
- `DateRangeNavigator`
- `MetricTrendChart`
- `MetricSummaryStats`
- `DailyMetricRows`

Data inputs:

- metric metadata
- date range
- daily summary rows

This screen should not care whether values came from manual entry, Apple Health, Health Connect, FHIR, or OCR.

### Lab History

Use for sparse clinical values.

Key components:

- `LabsScreen`
- `LabPanelTimeline`
- `LabMetricHistoryScreen`
- `LabResultRow`
- `ReferenceRangeBand`
- `AbnormalFlagPill`
- `SourceDocumentLink`
- `LabImportReviewScreen`

Lab UX should default to ranges like:

- `6M`
- `1Y`
- `All`

Not daily ranges like `1D`.

### Import Review

Review UI should be modular and source-aware:

- `ImportJobScreen`
- `SourceDocumentPreview`
- `ExtractedResultTable`
- `CandidateResultEditor`
- `ConfidenceIndicator`

The review UI edits candidate records. It should not directly mutate canonical observations until the user accepts.

## Clean Code Boundaries

Suggested package/module boundaries:

- `packages/database`
  - Tables and migrations.
  - Metric catalog seeds.

- `apps/api/src/health-data`
  - Canonical observation APIs.
  - Summary queries.
  - Manual vitals writing.

- `apps/api/src/health-imports`
  - Ingestion jobs.
  - Upload metadata.
  - Review workflow.
  - Parser orchestration.

- `apps/api/src/health-parsers`
  - PDF parser adapter.
  - OCR parser adapter.
  - FHIR parser adapter.
  - CSV parser adapter.
  - Shared parser output types.

- `apps/api/src/health-normalization`
  - Metric mapping.
  - Unit normalization.
  - Reference range parsing.
  - Candidate-to-observation transformation.

- `apps/mobile/features/data`
  - Generic health data views.
  - Metric history.

- `apps/mobile/features/labs`
  - Lab-specific screens.
  - Import/review screens.

Avoid putting parser rules or clinical mapping logic in mobile.

## Parser Interface

Use a small common parser contract.

```ts
type HealthImportParser = {
  name: string;
  version: string;
  supports(input: HealthImportInput): boolean;
  parse(input: HealthImportInput): Promise<ParsedHealthImport>;
};

type ParsedHealthImport = {
  documentKind: 'lab_report' | 'clinical_summary' | 'unknown';
  candidates: ParsedHealthRecordCandidate[];
  warnings: string[];
};
```

Candidate shape:

```ts
type ParsedHealthRecordCandidate = {
  kind: 'lab_result' | 'vital' | 'unknown';
  rawLabel: string;
  rawValue: string;
  rawUnit?: string;
  rawReferenceRange?: string;
  rawObservedAt?: string;
  panelLabel?: string;
  abnormalFlag?: string;
  pageNumber?: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
  parserMetadata?: Record<string, unknown>;
};
```

This keeps parser adapters replaceable.

## Normalizer Interface

```ts
type HealthRecordNormalizer = {
  normalize(candidate: ParsedHealthRecordCandidate): NormalizedHealthRecordCandidate;
};

type NormalizedHealthRecordCandidate = {
  metricKey?: string;
  displayLabel: string;
  valueNumeric?: number;
  valueText?: string;
  unit?: string;
  observedAt?: Date;
  referenceRange?: {
    low?: number;
    high?: number;
    text?: string;
  };
  abnormalFlag?: string;
  confidence: number;
  issues: Array<{
    code: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
  }>;
};
```

The review UI can use `issues` to guide the user.

## Confidence and Review Policy

Suggested policy:

- Trusted FHIR source with recognized LOINC, parseable value, unit, and date:
  - Auto-accept.

- PDF with embedded text and high-confidence row extraction:
  - Maybe auto-accept in later phases.
  - First phase: require review.

- OCR from screenshot/photo:
  - Require review.

- Unknown metric label:
  - Require review or reject.

- Unit mismatch or unsupported conversion:
  - Require review.

- Missing date:
  - Require review.

Every auto-accepted value should still expose provenance.

## Lab Charting Rules

Labs should use charts differently than wearables:

- X-axis is result date, not every day.
- Use point/line chart for values over time.
- Show reference range band when available.
- Show abnormal markers.
- Show source report/date under each point.
- Do not interpolate meaning across large gaps too aggressively.
- Support unit changes cautiously. If units differ and cannot be converted, split series or require normalization.

Daily summaries are optional for labs. Lab history can query raw observations by metric because the data volume is low.

## Security and Privacy

- Source documents may contain broad PHI. Store in private object storage only.
- Never expose raw storage keys to the client. Use short-lived signed URLs or API streaming.
- Encrypt at rest through the storage provider and database.
- Log ingestion events without logging raw PHI values.
- Ensure all job/document/candidate endpoints are scoped by `user_id`.
- Consider deletion semantics:
  - User deletes a document.
  - User deletes extracted values but keeps document.
  - User deletes account.
- Preserve audit trails only as allowed by product/privacy policy.

## Reprocessing Strategy

Parser quality will improve. The system should support reprocessing:

1. Keep raw source document.
2. Keep parser name/version on extracted records.
3. Mark old candidates as `superseded` when reprocessed.
4. Do not overwrite user-confirmed canonical observations automatically.
5. Present diffs if a new parser finds better values.

## Phased Delivery

### Phase 1: Generic Health History

- Continue using canonical observations and daily summaries.
- Use generic metric history for wearables and home vitals.
- Keep labs static/mock until ingestion exists.

### Phase 2: Lab Data Model Extensions

- Add ingestion job/document/extracted-record/provenance tables.
- Add lab metric catalog entries.
- Add lab-specific read APIs.
- Seed a few lab examples for UI development.

### Phase 3: Manual Lab Entry and Review UI

- Build lab review table UI using manually created candidate records.
- Let users confirm/edit lab result rows.
- Commit accepted rows to canonical observations.

### Phase 4: PDF and Screenshot Import

- Add file upload.
- Add PDF text extraction.
- Add OCR for image-only pages/screenshots.
- Require review for all parsed lab imports.

### Phase 5: FHIR Import

- Store raw FHIR bundles/resources.
- Extract FHIR `Observation` labs.
- Auto-accept high-confidence trusted FHIR observations.
- Link observations back to raw FHIR resources.

### Phase 6: Connected Sources

- Apple Health Records.
- Health Connect Medical Records.
- Direct FHIR APIs.
- Vendor APIs and CSV imports.

## Open Decisions

- Which object storage provider should hold source documents?
- Do we want user-visible document deletion to cascade canonical observations, or only remove document previews?
- Which OCR provider should we use first?
- Should low-confidence lab imports block all imported values, or allow partial acceptance?
- How much clinical coding do we need initially: LOINC only, or also SNOMED/RxNorm for broader records?
- Should lab metric catalog live only in database, or be generated into shared TypeScript for mobile labels?
- Do we need clinician review as a separate role/state later?

## Recommended Next Step

Keep the generic metric history work focused on canonical observations. In parallel, build the ingestion framework as a separate vertical slice:

1. Create ingestion job/document/candidate/provenance tables.
2. Add a basic manual candidate creation endpoint for lab rows.
3. Build the review UI against candidates.
4. Commit accepted candidates into `health_observations`.

This gives us the right clean architecture before adding OCR, PDF parsing, or FHIR. Once the pipeline exists, each new source is just another adapter feeding the same candidate and normalization flow.
