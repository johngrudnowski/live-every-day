# Lab Ingestion Vertical Slice Plan

## Goal

Build the smallest useful ingestion pipeline for lab rows before adding OCR, PDF parsing, screenshots, or FHIR.

This slice should prove the architecture:

1. Create ingestion job/document/candidate/provenance tables.
2. Add a basic manual candidate creation endpoint for lab rows.
3. Build the review UI against candidates.
4. Commit accepted candidates into `health_observations`.

Once this exists, future sources become adapters that feed the same candidate and normalization flow:

- OCR parser.
- PDF table parser.
- Screenshot/photo parser.
- FHIR `Observation` importer.
- CSV importer.
- Portal export importer.

The important constraint: do not let the first lab UI write directly to final observations. The review pipeline is the product and architecture foundation.

## Scope

### In Scope

- Database tables for ingestion jobs, source documents, extracted candidate records, and observation provenance.
- API endpoints to create manual lab candidates.
- API endpoints to review, accept, edit, or reject candidates.
- Commit accepted lab candidates into canonical `health_observations`.
- Basic mobile review UI.
- Lab metric mapping for a small initial set, probably CBC.
- Provenance from accepted observations back to candidate rows.

### Out of Scope

- OCR.
- PDF parsing.
- Screenshot/photo parsing.
- FHIR import.
- Object storage file upload.
- Automated parser confidence.
- Clinician review.
- Full lab history UX.

Those future features should plug into the same ingestion tables and review endpoints.

## Design Principles

- Candidates are not canonical observations.
- Review UI edits candidates, not final observations.
- Accepted candidates are transformed into canonical observations in one controlled commit path.
- Every committed observation has provenance.
- The pipeline should support reprocessing and source traceability even though this first slice uses manual entry.
- Use existing `health_observations` and `health_observation_groups` for final storage.
- Keep source-specific parsing out of mobile.
- Keep lab normalization in API-side services.

## First User Story

As a user, I can manually enter a set of lab rows into a review screen, confirm them, and then see accepted values stored as canonical health observations.

Example:

- Lab report date: `2026-05-19`
- Panel: `CBC`
- Rows:
  - Platelets: `842`, unit `x10^3/uL`, flag `High`
  - WBC: `10.4`, unit `x10^3/uL`, flag `Normal`
  - Hemoglobin: `14.6`, unit `g/dL`, flag `Normal`

The first implementation can create these candidates from a manual form instead of a file.

## Data Model

### `health_ingestion_jobs`

One row per import/review session.

Initial columns:

| Column          | Type                                 | Notes                                                                  |
| --------------- | ------------------------------------ | ---------------------------------------------------------------------- |
| `id`            | `text primary key`                   | Generated id.                                                          |
| `user_id`       | `text not null`                      | Owner.                                                                 |
| `source_id`     | `text not null`                      | For this slice: `manual_lab_entry`.                                    |
| `status`        | `text not null`                      | `draft`, `needs_review`, `imported`, `partially_imported`, `canceled`. |
| `input_kind`    | `text not null`                      | For this slice: `manual`.                                              |
| `source_label`  | `text`                               | Optional user-facing source label.                                     |
| `observed_at`   | `timestamptz`                        | Default report date for candidates.                                    |
| `metadata_json` | `jsonb not null default '{}'`        | Flexible source metadata.                                              |
| `created_at`    | `timestamptz not null default now()` |                                                                        |
| `updated_at`    | `timestamptz not null default now()` |                                                                        |

Indexes:

- `(user_id, created_at)`
- `(user_id, status)`

Status behavior:

- `draft`: job exists but candidate rows may still be edited.
- `needs_review`: candidate rows are ready for review.
- `imported`: every candidate was accepted or rejected and accepted rows were committed.
- `partially_imported`: some accepted rows committed, but unresolved candidates remain.
- `canceled`: user abandoned the import.

### `health_source_documents`

For this first slice, this table can exist but be optional because there is no uploaded file yet.

Initial columns:

| Column             | Type                                 | Notes                                         |
| ------------------ | ------------------------------------ | --------------------------------------------- |
| `id`               | `text primary key`                   | Generated id.                                 |
| `user_id`          | `text not null`                      | Owner.                                        |
| `ingestion_job_id` | `text not null`                      | Parent job.                                   |
| `document_kind`    | `text not null`                      | For future: `lab_report`, `fhir_bundle`, etc. |
| `source_filename`  | `text`                               | Future upload support.                        |
| `mime_type`        | `text`                               | Future upload support.                        |
| `storage_key`      | `text`                               | Future upload support.                        |
| `sha256_hash`      | `text`                               | Future dedupe/audit.                          |
| `metadata_json`    | `jsonb not null default '{}'`        |                                               |
| `created_at`       | `timestamptz not null default now()` |                                               |
| `updated_at`       | `timestamptz not null default now()` |                                               |

Even if unused in phase 1, adding it now keeps the API model aligned with future PDF/screenshot/FHIR imports.

### `health_extracted_records`

Candidate rows for user review.

Initial columns:

| Column                     | Type                                 | Notes                                             |
| -------------------------- | ------------------------------------ | ------------------------------------------------- |
| `id`                       | `text primary key`                   | Generated id.                                     |
| `user_id`                  | `text not null`                      | Owner.                                            |
| `ingestion_job_id`         | `text not null`                      | Parent job.                                       |
| `source_document_id`       | `text`                               | Nullable in manual slice.                         |
| `record_kind`              | `text not null`                      | For this slice: `lab_result`.                     |
| `raw_label`                | `text not null`                      | User-entered or parser-extracted label.           |
| `raw_value`                | `text not null`                      | User-entered or parser-extracted value.           |
| `raw_unit`                 | `text`                               | Unit as entered/extracted.                        |
| `raw_reference_range`      | `text`                               | Optional.                                         |
| `raw_observed_at`          | `text`                               | Original date text if available.                  |
| `normalized_metric_key`    | `text`                               | Candidate mapped metric key.                      |
| `normalized_value_numeric` | `double precision`                   | Parsed numeric value.                             |
| `normalized_unit`          | `text`                               | Unit chosen for final observation.                |
| `normalized_observed_at`   | `timestamptz`                        | Date chosen for final observation.                |
| `panel_label`              | `text`                               | Example: `CBC`.                                   |
| `abnormal_flag`            | `text`                               | `low`, `high`, `normal`, `critical`, etc.         |
| `confidence`               | `double precision`                   | Manual rows can default to `1`.                   |
| `issues_json`              | `jsonb not null default '[]'`        | Normalization/review issues.                      |
| `candidate_json`           | `jsonb not null default '{}'`        | Original candidate payload.                       |
| `status`                   | `text not null`                      | `candidate`, `accepted`, `rejected`, `committed`. |
| `created_at`               | `timestamptz not null default now()` |                                                   |
| `updated_at`               | `timestamptz not null default now()` |                                                   |

Indexes:

- `(user_id, ingestion_job_id)`
- `(user_id, status)`
- `(normalized_metric_key, normalized_observed_at)`

Status behavior:

- `candidate`: pending review.
- `accepted`: reviewed and ready to commit.
- `rejected`: reviewed and intentionally ignored.
- `committed`: accepted and converted into canonical observation.

### `health_observation_provenance`

Links final observations back to candidates.

Initial columns:

| Column                | Type                                 | Notes                                        |
| --------------------- | ------------------------------------ | -------------------------------------------- |
| `id`                  | `text primary key`                   | Generated id.                                |
| `observation_id`      | `text not null`                      | FK to `health_observations.id`.              |
| `ingestion_job_id`    | `text not null`                      | Parent job.                                  |
| `source_document_id`  | `text`                               | Nullable in manual slice.                    |
| `extracted_record_id` | `text not null`                      | Candidate row that created this observation. |
| `confidence`          | `double precision`                   | Commit-time confidence.                      |
| `review_status`       | `text not null`                      | For this slice: `user_confirmed`.            |
| `reviewed_by_user_id` | `text`                               | User who confirmed.                          |
| `reviewed_at`         | `timestamptz`                        | Confirmation time.                           |
| `metadata_json`       | `jsonb not null default '{}'`        |                                              |
| `created_at`          | `timestamptz not null default now()` |                                              |
| `updated_at`          | `timestamptz not null default now()` |                                              |

Indexes:

- `(observation_id)`
- `(ingestion_job_id)`
- `(extracted_record_id)`

## Initial Lab Metric Catalog

Start with a small CBC set to prove the flow.

Suggested metric keys:

- `lab_platelets`
- `lab_wbc`
- `lab_hemoglobin`
- `lab_hematocrit`
- `lab_rbc`
- `lab_neutrophils_absolute`
- `lab_lymphocytes_absolute`

Each metric should have:

- Label.
- Category: `lab`.
- Display group: `CBC`.
- Default unit.
- LOINC code where available.
- Synonyms for matching.
- Chart kind: `line`.
- Aggregation default: `latest`.

Do not block the ingestion framework on a complete lab catalog. The catalog will grow.

## API Endpoints

### Create Manual Lab Import

`POST /api/me/health/imports/labs/manual`

Request:

```json
{
  "observedAt": "2026-05-19T12:00:00.000Z",
  "panelLabel": "CBC",
  "sourceLabel": "Manual lab entry",
  "rows": [
    {
      "label": "Platelets",
      "value": "842",
      "unit": "x10^3/uL",
      "referenceRange": "150-450",
      "abnormalFlag": "high"
    }
  ]
}
```

Behavior:

1. Create `health_ingestion_jobs`.
2. Normalize each row.
3. Create `health_extracted_records`.
4. Return the job with candidate rows.

Response:

```json
{
  "job": {
    "id": "health_import_123",
    "status": "needs_review",
    "observedAt": "2026-05-19T12:00:00.000Z"
  },
  "candidates": [
    {
      "id": "health_candidate_123",
      "rawLabel": "Platelets",
      "normalizedMetricKey": "lab_platelets",
      "normalizedValueNumeric": 842,
      "normalizedUnit": "x10^3/uL",
      "status": "candidate",
      "issues": []
    }
  ]
}
```

### Get Import Job

`GET /api/me/health/imports/:jobId`

Returns:

- Job metadata.
- Source document metadata if present.
- Candidate rows.
- Commit status.

### Update Candidate

`PATCH /api/me/health/imports/:jobId/candidates/:candidateId`

Allows review UI edits:

- Label.
- Metric key.
- Value.
- Unit.
- Reference range.
- Observed date.
- Abnormal flag.
- Status.

After edits, API should re-run normalization for the candidate.

### Accept Candidates

`POST /api/me/health/imports/:jobId/accept`

Request:

```json
{
  "candidateIds": ["health_candidate_123", "health_candidate_456"]
}
```

Behavior:

1. Validate candidates belong to the user and job.
2. Validate candidates are commit-ready.
3. Mark candidates `accepted`.
4. Commit accepted candidates into `health_observations`.
5. Create provenance rows.
6. Mark candidates `committed`.
7. Update job status.
8. Invalidate/recompute daily summaries as needed.

### Reject Candidates

`POST /api/me/health/imports/:jobId/reject`

Request:

```json
{
  "candidateIds": ["health_candidate_789"]
}
```

Marks candidates `rejected` and updates job status.

### List Import Jobs

`GET /api/me/health/imports`

Useful for showing recent imports and unfinished review work.

## Normalization Service

Add an API-side service, for example `HealthImportNormalizationService`.

Responsibilities:

- Match raw label to metric key.
- Parse numeric values.
- Normalize units when safe.
- Parse dates.
- Structure reference ranges.
- Produce user-facing issues.

Example issues:

- `unknown_metric`
- `invalid_number`
- `missing_unit`
- `unsupported_unit`
- `missing_observed_date`
- `ambiguous_label`

The normalizer should return candidates even when imperfect. The review UI should show issues and let the user fix them.

## Commit Service

Add a single commit path, for example `HealthImportCommitService`.

Responsibilities:

- Convert accepted candidate rows into `health_observations`.
- Create `health_observation_groups` for panel grouping when useful.
- Create `health_observation_provenance`.
- Mark candidates committed.
- Update job status.
- Trigger summary invalidation/recalculation.

Rules:

- Do not commit candidates with unresolved error-level issues.
- Do not commit rejected candidates.
- Avoid duplicate commits from repeated requests.
- Use transactions.

Idempotency options:

- Store `committed_observation_id` on `health_extracted_records`, or
- Enforce unique provenance per `extracted_record_id`.

## Mobile Review UI

### Screens

Initial screens:

- `LabImportManualEntryScreen`
  - Creates a manual lab import job.
  - Simple panel/date/rows form.

- `LabImportReviewScreen`
  - Shows candidate rows.
  - Lets user edit values.
  - Lets user accept or reject rows.
  - Commits accepted rows.

- `LabImportResultScreen`
  - Confirms import.
  - Links to lab history.

The review UI should be built against candidate records, not final observations.

### Candidate Row UI

Each row should show:

- Raw label.
- Normalized metric label.
- Value and unit.
- Reference range if present.
- Abnormal flag.
- Date.
- Issues.
- Accept/reject state.

Editing a row should update the candidate through the API, not mutate local-only state permanently.

### Empty and Error States

- No candidates found.
- Candidate has unknown metric.
- Candidate has invalid number.
- Commit failed.
- Job was already imported.

## Backend Module Shape

Suggested modules:

```txt
apps/api/src/health-imports/
  health-imports.controller.ts
  health-imports.service.ts
  health-import-normalization.service.ts
  health-import-commit.service.ts
  dto/
    create-manual-lab-import.dto.ts
    update-health-import-candidate.dto.ts
    review-health-import.dto.ts
```

Keep canonical observation reads/writes in `health-data` services where appropriate, but keep ingestion orchestration in `health-imports`.

## Database Package Shape

Suggested files:

```txt
packages/database/src/schema/health-imports.ts
packages/database/src/health-lab-catalog.ts
packages/database/drizzle/00xx_health_imports.sql
```

Export import tables from `packages/database/src/schema/index.ts`.

## API DTO Shape

Manual lab import DTO:

```ts
export class CreateManualLabImportDto {
  observedAt!: string;
  panelLabel?: string;
  sourceLabel?: string;
  rows!: CreateManualLabImportRowDto[];
}

export class CreateManualLabImportRowDto {
  label!: string;
  value!: string;
  unit?: string;
  referenceRange?: string;
  abnormalFlag?: string;
}
```

Candidate update DTO:

```ts
export class UpdateHealthImportCandidateDto {
  rawLabel?: string;
  rawValue?: string;
  rawUnit?: string | null;
  rawReferenceRange?: string | null;
  normalizedMetricKey?: string | null;
  normalizedObservedAt?: string | null;
  abnormalFlag?: string | null;
  status?: 'candidate' | 'rejected';
}
```

Accept/reject DTO:

```ts
export class ReviewHealthImportCandidatesDto {
  candidateIds!: string[];
}
```

## Test Plan

### Unit Tests

Normalizer:

- Known labels map to metric keys.
- Synonyms map correctly.
- Invalid numeric values produce issues.
- Missing dates produce issues.
- Unsupported units produce issues.

Commit service:

- Accepted candidates create observations.
- Provenance rows are created.
- Repeated accept requests do not duplicate observations.
- Rejected candidates are not committed.
- Candidate/job ownership is enforced.
- Job status updates correctly.

### API Tests

- Create manual import.
- Fetch import job.
- Update candidate.
- Accept candidates.
- Reject candidates.
- Cannot access another user's job.

### Mobile Tests

- Manual entry form creates a job.
- Review screen renders candidates.
- Candidate issues render.
- Accept flow navigates to result.
- Rejected rows do not commit.

## Migration Strategy

This is additive:

1. Add tables.
2. Seed lab metric catalog entries.
3. Add APIs.
4. Add mobile review screens.
5. Add navigation from `Our Data` or future `Labs` section.

No existing health observation data needs to move.

## Future Adapter Integration

After this slice, each new source implements:

1. Source acquisition.
2. Parser adapter.
3. Candidate creation.
4. Optional normalization hints.

Everything after candidate creation is shared:

- Review UI.
- Candidate update API.
- Accept/reject API.
- Commit service.
- Provenance.
- Canonical observations.
- Lab history.

Examples:

- PDF adapter creates candidates with `source_document_id`, page numbers, and bounding boxes.
- OCR adapter creates candidates with lower confidence and review issues.
- FHIR adapter creates candidates or directly accepted records with raw resource provenance.
- CSV adapter maps rows into candidates using column configuration.

## Rollout Plan

### Step 1: Database

- Add health import tables.
- Add lab metric catalog seed entries.
- Generate and apply migration.

### Step 2: API Skeleton

- Create manual lab import endpoint.
- Create job detail endpoint.
- Create candidate update endpoint.
- Create accept/reject endpoints.

### Step 3: Normalization

- Implement basic label matching.
- Implement numeric parsing.
- Implement unit preservation.
- Implement issue generation.

### Step 4: Commit

- Implement transaction-based commit.
- Create observations and provenance.
- Update candidate and job statuses.

### Step 5: Mobile UI

- Add manual lab import screen.
- Add candidate review screen.
- Add import completion screen.

### Step 6: Lab History Preview

- Add a minimal lab results view that reads accepted observations.
- Keep full lab chart UX for a later slice.

## Open Questions

- Should manual lab entry be available to users immediately, or hidden behind dev/demo mode until import UX is polished?
- Should `health_source_documents` be created for manual entries with no file, or only once uploads exist?
- Should accepted candidates be immutable, or can users edit an accepted candidate and create a corrected observation?
- Should provenance include both parser confidence and reviewer confidence?
- Should daily summaries include lab values, or should labs read raw observations only?
- Should abnormal flags be normalized into a shared enum now or remain text initially?

## Definition of Done

This vertical slice is done when:

- A user can create a manual lab import job.
- Candidate lab rows are persisted.
- Candidate rows can be reviewed and edited.
- Accepted candidates commit to `health_observations`.
- Provenance links observations back to candidates and jobs.
- Rejected candidates do not commit.
- The system can list unfinished jobs.
- The architecture can accept future parser-created candidates without changing the review/commit flow.
