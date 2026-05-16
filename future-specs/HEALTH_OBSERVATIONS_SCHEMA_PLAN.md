# Health Observations Schema Plan

## Goal

Build the health-data foundation now, while the app is still in prototype phase, so we do not keep growing app-specific tables like `vital_readings`.

The long-term model should support:

- Manual vitals entered in Live Every Day.
- Apple HealthKit consumer samples.
- Android Health Connect consumer samples.
- Wearable-derived daily summaries.
- Clinical records from Apple Health Records / HealthKit FHIR.
- Clinical records from Health Connect Medical Records / FHIR.
- Future direct integrations such as Oura, Garmin, Epic/MyChart/FHIR, CSV import, or clinician-entered records.

The core decision: use a canonical health observation model for time-series measurements, and keep FHIR clinical records as raw resources plus extracted links/projections.

## Product Direction

Replace the current split between "vitals" and "wearables" with a broader health data model.

Vitals are not a separate domain at the database layer. They are a category of observations:

- Blood pressure systolic.
- Blood pressure diastolic.
- Pulse / heart rate.
- Resting heart rate.
- Body temperature.
- Oxygen saturation.
- Respiratory rate.
- Weight.

Wearable metrics are also observations:

- Steps.
- Active minutes.
- Sleep duration.
- Time in bed.
- Sleep stages.
- HRV.
- Resting heart rate.
- Exercise sessions.
- Active energy.
- VO2 max / cardio fitness.

Clinical values are often FHIR `Observation` resources:

- Lab results.
- Clinical vital signs.
- Body weight.
- Blood pressure.
- Temperature.
- Smoking status and social-history observations.

For UI and API ergonomics, we can expose feature-specific endpoints like `/health/vitals/summary`, but those endpoints should read from the health observation tables.

## Platform Reality

Apple HealthKit has two relevant data surfaces:

- Health and fitness samples: steps, sleep, heart rate, HRV, body mass, workouts, blood pressure, oxygen saturation, and similar types.
- Clinical Health Records: read-only `HKClinicalRecord` samples backed by FHIR JSON from participating institutions.

Android should use Health Connect, not Google Fit. Google Fit APIs are being transitioned away from starting in 2026. Health Connect supports health/fitness samples and has Medical Records APIs for FHIR-based clinical data. The Medical Records APIs are newer, policy-sensitive, and still have some limitations, so they should be planned as a later phase.

## Design Principles

- Store source-aware data. Every imported or manually created observation should retain where it came from.
- Preserve raw external records where practical. Normalized rows are for querying; raw records are for audit, reprocessing, and future extraction.
- Use one canonical observation shape for scalar health measurements.
- Use grouped observations for panel-like measurements, especially blood pressure.
- Avoid one table per metric. That becomes brittle as soon as Apple, Health Connect, FHIR, and wearable vendors disagree on naming or shape.
- Prefer daily summary tables for UI speed, but derive them from observations.
- Keep FHIR resources raw first. Flatten only the fields needed for search, summaries, or linking.
- Treat HealthKit/Health Connect values and clinical FHIR values as different sources that may describe the same concept.

## Phase Plan

### 1. Build Health Observation Schema

Add the source, metric, observation, summary, and sync tables below.

Do not migrate FHIR yet. Include enough columns to support FHIR links later.

### 2. Build Health Observation APIs

Initial API surface:

- `POST /health/observations`
- `GET /health/observations`
- `GET /health/observations/latest`
- `GET /health/observations/history`
- `GET /health/summary/daily`
- `GET /health/vitals/summary`

The vitals API can exist as a feature-shaped wrapper, but it should be backed by `health_observations`.

### 3. Migrate Vitals and Seeding

Remove the current `vital_readings` app contract.

Manual vital entry should write canonical observations:

- Blood pressure creates a group plus two observation rows: systolic and diastolic.
- Pulse creates `heart_rate` or `pulse`.
- Temperature creates `body_temperature`.
- Oxygen saturation creates `oxygen_saturation`.

The current vitals UI should read from health observation summary/query APIs.

Seed modules should write health observations directly.

### 4. Add FHIR Later

Add raw FHIR resource storage and selected projections:

- Conditions.
- Medications.
- Allergies.
- Labs.
- Clinical vitals.
- Procedures.
- Encounters.
- Immunizations.

Clinical FHIR observations that are useful for charts can be extracted into `health_observations` with links back to the raw FHIR resource.

## Proposed Tables

### `health_data_sources`

Catalog of source systems. This is not user-specific.

| Column       | Type                                 | Notes                                                                             |
| ------------ | ------------------------------------ | --------------------------------------------------------------------------------- |
| `id`         | `text primary key`                   | `manual`, `apple_health`, `health_connect`, `oura`, `garmin`, `fhir_import`, etc. |
| `label`      | `text not null`                      | Human label.                                                                      |
| `kind`       | `text not null`                      | `manual`, `platform`, `wearable`, `clinical_fhir`, `lab_import`, `device`.        |
| `created_at` | `timestamptz not null default now()` |                                                                                   |
| `updated_at` | `timestamptz not null default now()` |                                                                                   |

Seed this table from code/migration.

### `health_source_connections`

Per-user connection or data channel. Manual data can have one implicit connection per user, or `source_connection_id` can be nullable for first pass.

| Column                | Type                                                  | Notes                                                     |
| --------------------- | ----------------------------------------------------- | --------------------------------------------------------- |
| `id`                  | `text primary key`                                    | UUID.                                                     |
| `user_id`             | `text not null references user(id) on delete cascade` |                                                           |
| `source_id`           | `text not null references health_data_sources(id)`    |                                                           |
| `external_account_id` | `text`                                                | Vendor account id when available. Avoid storing PHI here. |
| `display_name`        | `text`                                                | Example: `Apple Health on Tucker's iPhone`.               |
| `status`              | `text not null`                                       | `connected`, `revoked`, `error`, `paused`.                |
| `scopes_json`         | `jsonb not null default '[]'`                         | Granted categories/permissions.                           |
| `metadata_json`       | `jsonb not null default '{}'`                         | Device/source details.                                    |
| `last_sync_at`        | `timestamptz`                                         | Last successful sync.                                     |
| `created_at`          | `timestamptz not null default now()`                  |                                                           |
| `updated_at`          | `timestamptz not null default now()`                  |                                                           |

Indexes:

- `(user_id, source_id)`
- `(user_id, status)`

### `health_sync_runs`

Tracks imports from HealthKit, Health Connect, FHIR, or wearable APIs.

| Column                 | Type                                                               | Notes                                                   |
| ---------------------- | ------------------------------------------------------------------ | ------------------------------------------------------- |
| `id`                   | `text primary key`                                                 | UUID.                                                   |
| `user_id`              | `text not null references user(id) on delete cascade`              |                                                         |
| `source_connection_id` | `text references health_source_connections(id) on delete set null` |                                                         |
| `status`               | `text not null`                                                    | `started`, `succeeded`, `failed`, `partial`.            |
| `sync_kind`            | `text not null`                                                    | `incremental`, `backfill`, `manual_refresh`, `webhook`. |
| `window_start_at`      | `timestamptz`                                                      | Queried range start.                                    |
| `window_end_at`        | `timestamptz`                                                      | Queried range end.                                      |
| `cursor_before`        | `text`                                                             | Vendor cursor before run.                               |
| `cursor_after`         | `text`                                                             | Vendor cursor after run.                                |
| `records_read`         | `integer not null default 0`                                       |                                                         |
| `records_written`      | `integer not null default 0`                                       |                                                         |
| `error_message`        | `text`                                                             | Store short error only.                                 |
| `started_at`           | `timestamptz not null default now()`                               |                                                         |
| `completed_at`         | `timestamptz`                                                      |                                                         |

Indexes:

- `(user_id, started_at desc)`
- `(source_connection_id, started_at desc)`

### `health_metric_types`

Canonical metric catalog. This gives the app stable keys even when source platforms use different identifiers.

| Column                       | Type                                 | Notes                                                                                    |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------- |
| `key`                        | `text primary key`                   | Example: `resting_heart_rate`.                                                           |
| `category`                   | `text not null`                      | `vital`, `activity`, `sleep`, `body`, `lab`, `cardio`, `respiratory`, `symptom_context`. |
| `label`                      | `text not null`                      | UI label.                                                                                |
| `value_kind`                 | `text not null`                      | `quantity`, `count`, `duration`, `percent`, `score`, `text`, `boolean`.                  |
| `default_unit`               | `text`                               | Canonical unit, e.g. `bpm`, `mmHg`, `kg`, `min`, `%`, `count`.                           |
| `aggregation_default`        | `text not null`                      | `latest`, `sum`, `average`, `min`, `max`, `duration`, `session`.                         |
| `loinc_code`                 | `text`                               | For clinical/FHIR mapping where applicable.                                              |
| `apple_identifier`           | `text`                               | HealthKit quantity/category identifier.                                                  |
| `health_connect_record_type` | `text`                               | Health Connect record class/type.                                                        |
| `metadata_json`              | `jsonb not null default '{}'`        | Ranges, display hints, etc.                                                              |
| `created_at`                 | `timestamptz not null default now()` |                                                                                          |
| `updated_at`                 | `timestamptz not null default now()` |                                                                                          |

Recommended initial metric keys:

Vitals/body:

- `blood_pressure_systolic`
- `blood_pressure_diastolic`
- `heart_rate`
- `resting_heart_rate`
- `body_temperature`
- `oxygen_saturation`
- `respiratory_rate`
- `body_weight`
- `body_mass_index`

Activity:

- `steps`
- `active_minutes`
- `exercise_minutes`
- `active_energy`
- `distance_walking_running`
- `flights_climbed`

Sleep:

- `sleep_duration`
- `time_in_bed`
- `sleep_efficiency`
- `sleep_deep_duration`
- `sleep_rem_duration`
- `sleep_awake_duration`
- `sleep_light_core_duration`

Cardio/recovery:

- `heart_rate_variability_sdnn`
- `vo2_max`
- `walking_heart_rate_average`
- `resting_energy`

Labs, later:

- `platelets`
- `wbc`
- `hemoglobin`
- `hematocrit`
- `absolute_neutrophils`
- `absolute_lymphocytes`

### `health_observation_groups`

Optional grouping for related observations captured at the same time.

Use this for:

- Blood pressure panel: systolic + diastolic.
- Sleep session: total sleep + stages.
- Lab panel: CBC observations.
- FHIR Observation panels.

| Column                 | Type                                                               | Notes                                                                         |
| ---------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `id`                   | `text primary key`                                                 | UUID.                                                                         |
| `user_id`              | `text not null references user(id) on delete cascade`              |                                                                               |
| `group_type`           | `text not null`                                                    | `blood_pressure`, `sleep_session`, `lab_panel`, `fhir_panel`, `manual_entry`. |
| `source_connection_id` | `text references health_source_connections(id) on delete set null` |                                                                               |
| `source_record_id`     | `text`                                                             | Vendor panel/session id.                                                      |
| `observed_at`          | `timestamptz not null`                                             | Best single timestamp.                                                        |
| `started_at`           | `timestamptz`                                                      | For interval groups.                                                          |
| `ended_at`             | `timestamptz`                                                      | For interval groups.                                                          |
| `metadata_json`        | `jsonb not null default '{}'`                                      |                                                                               |
| `created_at`           | `timestamptz not null default now()`                               |                                                                               |
| `updated_at`           | `timestamptz not null default now()`                               |                                                                               |

Indexes:

- `(user_id, group_type, observed_at desc)`
- unique nullable pattern on `(source_connection_id, source_record_id)` where `source_record_id is not null`.

### `health_observations`

Canonical scalar health measurements.

One row should represent one metric value. Blood pressure is two rows in one group.

| Column                  | Type                                                               | Notes                                                                                         |
| ----------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `id`                    | `text primary key`                                                 | UUID.                                                                                         |
| `user_id`               | `text not null references user(id) on delete cascade`              |                                                                                               |
| `metric_key`            | `text not null references health_metric_types(key)`                |                                                                                               |
| `source_connection_id`  | `text references health_source_connections(id) on delete set null` | Null allowed for early manual data.                                                           |
| `observation_group_id`  | `text references health_observation_groups(id) on delete set null` |                                                                                               |
| `source_record_id`      | `text`                                                             | HealthKit UUID, Health Connect metadata id, FHIR resource id, etc.                            |
| `source_record_version` | `text`                                                             | Vendor version/change token if available.                                                     |
| `value_numeric`         | `numeric`                                                          | Primary value for numeric metrics.                                                            |
| `value_text`            | `text`                                                             | For coded/text values if needed.                                                              |
| `value_boolean`         | `boolean`                                                          | For boolean observations if needed.                                                           |
| `unit`                  | `text`                                                             | Unit of stored value. Prefer canonical units.                                                 |
| `observed_at`           | `timestamptz not null`                                             | Main timestamp for sorting/filtering.                                                         |
| `started_at`            | `timestamptz`                                                      | For intervals.                                                                                |
| `ended_at`              | `timestamptz`                                                      | For intervals.                                                                                |
| `recorded_at`           | `timestamptz`                                                      | When the source recorded/logged it, if different.                                             |
| `aggregation_kind`      | `text not null default 'point'`                                    | `point`, `interval`, `daily_sum`, `daily_average`, `daily_min`, `daily_max`, `session_total`. |
| `body_site`             | `text`                                                             | Optional.                                                                                     |
| `device_name`           | `text`                                                             | Optional display/debug field.                                                                 |
| `source_metadata_json`  | `jsonb not null default '{}'`                                      | Source-specific extras.                                                                       |
| `quality_json`          | `jsonb not null default '{}'`                                      | Confidence, outlier flags, validation notes.                                                  |
| `created_at`            | `timestamptz not null default now()`                               |                                                                                               |
| `updated_at`            | `timestamptz not null default now()`                               |                                                                                               |
| `deleted_at`            | `timestamptz`                                                      | Soft-delete/tombstone for source deletions.                                                   |

Indexes:

- `(user_id, metric_key, observed_at desc)`
- `(user_id, observed_at desc)`
- `(observation_group_id)`
- `(source_connection_id, source_record_id)` where `source_record_id is not null`
- `(user_id, metric_key, aggregation_kind, observed_at desc)`

Notes:

- Keep `value_numeric`, `value_text`, and `value_boolean` nullable, but enforce in application validation that one value is present.
- If Postgres `numeric` is awkward in TypeScript, use integer storage for known units where precision matters, but this becomes cumbersome across metric types. Prefer `numeric` at the canonical layer and map carefully in DTOs.
- For duplicate prevention, source records need source-specific behavior. HealthKit and Health Connect usually provide stable record metadata; manual records may not.

### `health_daily_summaries`

Materialized daily rollups for fast dashboard/history queries.

| Column                 | Type                                                               | Notes                                           |
| ---------------------- | ------------------------------------------------------------------ | ----------------------------------------------- |
| `id`                   | `text primary key`                                                 | UUID or deterministic hash.                     |
| `user_id`              | `text not null references user(id) on delete cascade`              |                                                 |
| `metric_key`           | `text not null references health_metric_types(key)`                |                                                 |
| `summary_date`         | `date not null`                                                    | User-local date.                                |
| `timezone`             | `text not null`                                                    | Timezone used for the daily boundary.           |
| `source_connection_id` | `text references health_source_connections(id) on delete set null` | Optional per-source summary.                    |
| `sample_count`         | `integer not null default 0`                                       |                                                 |
| `value_sum`            | `numeric`                                                          | For step count, active minutes, durations, etc. |
| `value_avg`            | `numeric`                                                          | For HR, HRV, etc.                               |
| `value_min`            | `numeric`                                                          |                                                 |
| `value_max`            | `numeric`                                                          |                                                 |
| `value_latest`         | `numeric`                                                          | Latest value in the day.                        |
| `latest_observed_at`   | `timestamptz`                                                      |                                                 |
| `metadata_json`        | `jsonb not null default '{}'`                                      |                                                 |
| `created_at`           | `timestamptz not null default now()`                               |                                                 |
| `updated_at`           | `timestamptz not null default now()`                               |                                                 |

Indexes:

- unique `(user_id, metric_key, summary_date, source_connection_id)`
- `(user_id, summary_date desc)`
- `(user_id, metric_key, summary_date desc)`

For first implementation, this can be computed synchronously after writes or lazily by query. Add the table when dashboard performance or history queries need it.

## Later FHIR Tables

### `clinical_fhir_resources`

Raw FHIR resource storage. This is the source of truth for clinical records.

| Column                 | Type                                                               | Notes                                                                              |
| ---------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `id`                   | `text primary key`                                                 | UUID.                                                                              |
| `user_id`              | `text not null references user(id) on delete cascade`              |                                                                                    |
| `source_connection_id` | `text references health_source_connections(id) on delete set null` | Apple Health Records, Health Connect Medical Records, direct FHIR connection, etc. |
| `fhir_version`         | `text not null`                                                    | Usually `R4` / `4.0.1` or `R4B` / `4.3.0`.                                         |
| `resource_type`        | `text not null`                                                    | `Observation`, `Condition`, `MedicationRequest`, etc.                              |
| `resource_id`          | `text not null`                                                    | FHIR resource `id`.                                                                |
| `resource_json`        | `jsonb not null`                                                   | Full FHIR JSON.                                                                    |
| `status`               | `text`                                                             | Resource status when available.                                                    |
| `code_system`          | `text`                                                             | Primary code system if extracted.                                                  |
| `code_value`           | `text`                                                             | Primary code value if extracted.                                                   |
| `code_display`         | `text`                                                             | Primary display if extracted.                                                      |
| `effective_at`         | `timestamptz`                                                      | Observation/condition date when available.                                         |
| `issued_at`            | `timestamptz`                                                      | FHIR issued timestamp when available.                                              |
| `source_url`           | `text`                                                             | Apple `HKFHIRResource.sourceURL` or FHIR server URL if available.                  |
| `hash`                 | `text not null`                                                    | Hash of normalized resource JSON for change detection.                             |
| `created_at`           | `timestamptz not null default now()`                               |                                                                                    |
| `updated_at`           | `timestamptz not null default now()`                               |                                                                                    |
| `deleted_at`           | `timestamptz`                                                      |                                                                                    |

Indexes:

- unique `(source_connection_id, resource_type, resource_id)`
- `(user_id, resource_type, effective_at desc)`
- `(user_id, code_system, code_value)`
- GIN index on `resource_json` if we need JSONB search.

### `clinical_fhir_observation_links`

Links extracted canonical observations back to raw FHIR.

| Column                  | Type                                                                     | Notes                                            |
| ----------------------- | ------------------------------------------------------------------------ | ------------------------------------------------ |
| `id`                    | `text primary key`                                                       | UUID.                                            |
| `fhir_resource_id`      | `text not null references clinical_fhir_resources(id) on delete cascade` |                                                  |
| `health_observation_id` | `text not null references health_observations(id) on delete cascade`     |                                                  |
| `extraction_status`     | `text not null`                                                          | `extracted`, `ignored`, `unsupported`, `failed`. |
| `metadata_json`         | `jsonb not null default '{}'`                                            |                                                  |
| `created_at`            | `timestamptz not null default now()`                                     |                                                  |

Unique:

- `(fhir_resource_id, health_observation_id)`

## How Current Vitals Map

Current `vital_readings` columns map like this:

| Current Column              | New Observation Metric                              |
| --------------------------- | --------------------------------------------------- |
| `systolic_mm_hg`            | `blood_pressure_systolic`, unit `mmHg`              |
| `diastolic_mm_hg`           | `blood_pressure_diastolic`, unit `mmHg`             |
| `pulse_bpm`                 | `heart_rate`, unit `bpm`                            |
| `temperature_f_tenths`      | `body_temperature`, unit `degF` or canonical `degC` |
| `oxygen_saturation_percent` | `oxygen_saturation`, unit `%`                       |
| `recorded_at`               | `observed_at` / `recorded_at`                       |
| `source`                    | `health_data_sources` + `health_source_connections` |

Blood pressure should create a `health_observation_groups` row with `group_type = 'blood_pressure'`.

## API Shape

### Write Observations

`POST /health/observations`

Accept one or more observations. This replaces `POST /vitals/readings`.

Example manual vital payload:

```json
{
  "source": "manual",
  "observedAt": "2026-05-15T14:00:00.000Z",
  "observations": [
    { "metricKey": "blood_pressure_systolic", "value": 132, "unit": "mmHg" },
    { "metricKey": "blood_pressure_diastolic", "value": 84, "unit": "mmHg" },
    { "metricKey": "heart_rate", "value": 72, "unit": "bpm" },
    { "metricKey": "body_temperature", "value": 98.4, "unit": "degF" },
    { "metricKey": "oxygen_saturation", "value": 97, "unit": "%" }
  ],
  "group": {
    "type": "manual_entry"
  }
}
```

The API can infer a blood-pressure group when both systolic and diastolic are present.

### Query Observations

`GET /health/observations?metricKey=resting_heart_rate&from=...&to=...`

Useful filters:

- `metricKey`
- `category`
- `sourceId`
- `from`
- `to`
- `aggregationKind`
- `limit`

### Latest Values

`GET /health/observations/latest?metricKeys=resting_heart_rate,heart_rate_variability_sdnn,sleep_duration,steps`

Returns latest canonical value per metric.

### Daily History

`GET /health/summary/daily?metricKeys=steps,sleep_duration,resting_heart_rate&from=...&to=...`

Backed by `health_daily_summaries` when available.

### Vitals Summary

`GET /health/vitals/summary`

Feature-shaped response for the UI, backed by canonical observations:

- Blood pressure latest grouped pair.
- Pulse latest.
- Temperature latest.
- O2 saturation latest.
- Respiratory rate latest if available.
- Weight latest if the UI includes it.

## Recommended Implementation Order

1. Add `health-data.ts` Drizzle schema with:
   - `healthDataSources`
   - `healthSourceConnections`
   - `healthSyncRuns`
   - `healthMetricTypes`
   - `healthObservationGroups`
   - `healthObservations`

2. Add seed/catalog for initial `health_metric_types` and `health_data_sources`.

3. Add `HealthObservationsModule` in `apps/api`.

4. Implement manual write endpoint.

5. Implement latest/history endpoints.

6. Change mobile vitals logging to write observations.

7. Change mobile data screens to read health observation summaries.

8. Change seed modules to create health observations.

9. Remove or stop exporting the old `vital_readings` API.

10. Drop `vital_readings` once no app code reads or writes it.

11. Add FHIR raw resource tables and extraction later.

## Open Questions

- Canonical temperature unit: store `degC` internally or preserve user-entered `degF`? Recommendation: store canonical `degC` and format by locale/preference. If we need zero friction now, store original unit and normalize in summaries.
- Numeric precision: Drizzle/Postgres `numeric` may come back as strings. Decide whether DTO mapping handles that or whether key metrics store integer scaled values. Recommendation: use `numeric` and centralize parsing/serialization.
- User-local day boundaries: daily summaries need a timezone. Store the timezone used for each summary row.
- Deduplication policy: source APIs differ. We need source-specific import adapters that define stable `source_record_id`.
- Manual edits/deletes: decide whether manual observations are editable in place, soft-deleted, or versioned.
- FHIR patient identity: Apple/Health Connect records are intended for the device user, but direct FHIR connections may include multiple identifiers. Keep `user_id` as app owner and store FHIR Patient identifiers inside raw JSON/metadata.

## References

- Apple HealthKit clinical records: https://developer.apple.com/documentation/healthkit/accessing-health-records
- Apple clinical record types: https://developer.apple.com/documentation/healthkit/hkclinicaltypeidentifier
- Android Health Connect: https://developer.android.com/health-and-fitness/health-connect
- Health Connect Medical Records: https://developer.android.com/health-and-fitness/health-connect/medical-records
- Health Connect Medical Records data format: https://developer.android.com/health-and-fitness/health-connect/medical-records/data-format
- FHIR Observation: https://hl7.org/fhir/r4/observation.html
- FHIR Vital Signs profile: https://hl7.org/fhir/R4/observation-vitalsigns.html
