# Weekly Check-In Implementation Plan

## Goal

Build a weekly check-in flow that users complete once per week. Users answer 10 configurable questions, optionally add deeper feedback, receive a total score, and can later view the saved result.

The first version should be useful without appointment briefs, LED chat, or provider-facing outputs.

## Product Behavior

### Entry Points

- Dashboard weekly check-in widget routes to the weekly check-in feature.
- Bottom tab `Check-in` routes based on completion state:
  - If the current week is incomplete: route to the weekly check-in intro page.
  - If the current week is complete: route to the saved check-in view.
- After a user completes the questionnaire, the saved view title should be `Check-in Saved`.
- If a user opens the saved view directly later, show the saved data at the top without the celebratory `Check-in Saved` title.

### Flow

1. Intro page
   - Title: `Time for your weekly check-in.`
   - Copy: `10 questions about how you've been feeling this week. Be honest - this data is only for you.`
   - Includes `WhatToExpect`.
   - Includes `LastWeeksScore` only if a previous submitted weekly check-in exists.
   - No `Talk to LED instead`.

2. Ten question flow
   - Questions come from configurable definitions, not hard-coded screens.
   - Supported question types for MVP:
     - Numeric 1-10 score.
     - Enum picker, for example `None | Some | A lot`.
   - Each answer should be saved as draft/progress when the user continues.

3. Anchor Done page
   - Shown after the required 10 questions.
   - Confirms the structured portion is complete.
   - Offers optional deeper feedback.

4. Optional Go Deeper page
   - User can answer additional free-text/deeper reflection prompts.
   - This is optional and can be skipped.

5. Complete page
   - Shows total numeric score.
   - Allows custom text entry.
   - Saves/submits the check-in.
   - Does not include `Building your appointment brief`.
   - Does not create Doctor Brief.

6. Saved page
   - Shows saved check-in data.
   - If reached immediately after completion, title can be `Check-in Saved`.
   - If opened directly, show date/week and data at the top without completion language.

## Data Model

Use a clean schema that supports future condition-specific questions, draft saving, generated API types, analytics, and later appointment briefs.

### Tables

#### `weekly_checkin_definitions`

Stores versioned question sets.

Suggested columns:

- `id text primary key`
- `version integer not null`
- `condition_id text null`
- `title text not null`
- `status text not null`  
  Values: `active`, `archived`, `hidden`
- `definition_json jsonb not null`
- `created_at timestamp with time zone not null default now()`
- `updated_at timestamp with time zone not null default now()`

Indexes:

- unique index on `(id, version)`
- index on `(condition_id, status)`

Notes:

- `condition_id` nullable allows a universal/default weekly check-in.
- `definition_json` contains question config, scoring metadata, and optional deeper prompts.
- Keep definitions versioned so submitted check-ins remain interpretable if questions change.

#### `weekly_checkins`

Stores user weekly check-in drafts and submissions.

Suggested columns:

- `id text primary key`
- `user_id text not null references user(id) on delete cascade`
- `definition_id text not null`
- `definition_version integer not null`
- `condition_id text null`
- `week_start_date date not null`
- `status text not null`  
  Values: `draft`, `submitted`
- `answers_json jsonb not null`
- `score_json jsonb not null`
- `custom_note text null`
- `completed_at timestamp with time zone null`
- `created_at timestamp with time zone not null default now()`
- `updated_at timestamp with time zone not null default now()`

Indexes:

- unique index on `(user_id, week_start_date, definition_id)`
- index on `(user_id, status, week_start_date desc)`
- index on `(user_id, completed_at desc)`

Notes:

- Drafts and submissions live in the same table.
- `answers_json` stores all question answers keyed by question id.
- `score_json` stores computed totals and future sub-scores.
- `completed_at` is null until submitted.
- `week_start_date` should be computed server-side to avoid client timezone drift.

### Definition JSON Shape

Example:

```json
{
  "schema": "led.weeklyCheckinDefinition.v1",
  "questions": [
    {
      "id": "energy",
      "kind": "number_scale",
      "title": "How was your energy this week?",
      "min": 1,
      "max": 10,
      "lowLabel": "Very low",
      "highLabel": "Strong",
      "scoreDirection": "higher_is_better",
      "required": true
    },
    {
      "id": "night_sweats",
      "kind": "enum",
      "title": "Night sweats",
      "options": [
        { "value": "none", "label": "None", "score": 0 },
        { "value": "some", "label": "Some", "score": 1 },
        { "value": "a_lot", "label": "A lot", "score": 2 }
      ],
      "required": true
    }
  ],
  "deeperPrompts": [
    {
      "id": "what_changed",
      "title": "What changed this week?"
    }
  ],
  "scoring": {
    "total": {
      "label": "Weekly score",
      "method": "sum_numeric_answers"
    }
  }
}
```

### Answer JSON Shape

Example:

```json
{
  "energy": 7,
  "night_sweats": "some",
  "what_changed": "More fatigue after treatment day."
}
```

### Score JSON Shape

Example:

```json
{
  "total": 48,
  "max": 100,
  "numericTotal": 44,
  "enumTotal": 4
}
```

## API Design

All UI should consume generated API types from `@led/api-client`. Add NestJS endpoints, regenerate the client, and use generated query/mutation hooks in mobile feature adapters.

### Endpoints

#### `GET /api/me/weekly-checkin/summary`

Returns:

- current week draft or submitted check-in
- latest submitted check-in
- previous week submitted check-in
- active definition metadata
- flags for routing

Suggested DTO:

```ts
type WeeklyCheckinSummaryDto = {
  weekStartDate: string;
  activeDefinition: WeeklyCheckinDefinitionDto;
  currentCheckin: WeeklyCheckinDto | null;
  lastSubmittedCheckin: WeeklyCheckinDto | null;
  previousWeekCheckin: WeeklyCheckinDto | null;
  hasCompletedCurrentWeek: boolean;
  shouldStartCheckin: boolean;
};
```

#### `GET /api/me/weekly-checkin/current`

Returns the current week draft/submission plus active definition.

#### `PUT /api/me/weekly-checkin/current`

Saves draft progress.

Request:

```ts
type SaveWeeklyCheckinDraftDto = {
  definitionId: string;
  definitionVersion: number;
  answers: Record<string, unknown>;
  currentQuestionId?: string;
};
```

#### `POST /api/me/weekly-checkin/current/submit`

Submits the weekly check-in.

Request:

```ts
type SubmitWeeklyCheckinDto = {
  definitionId: string;
  definitionVersion: number;
  answers: Record<string, unknown>;
  customNote?: string;
};
```

#### `GET /api/me/weekly-checkins/:checkinId`

Returns a saved check-in detail view.

### API Service Rules

- Server computes `week_start_date`.
- Server validates definition id/version.
- Server validates required answers on submit.
- Draft save can accept partial answers.
- Submit computes `score_json` server-side.
- A submitted current-week check-in should not be accidentally overwritten by draft saves.
- Later updates to submitted check-ins should be explicit, not hidden behind normal draft save.

## Mobile Architecture

Create a feature folder:

```txt
apps/mobile/features/weekly-checkin/
  api/
    weekly-checkin-queries.ts
  components/
    WeeklyCheckinIntroScreen.tsx
    WhatToExpect.tsx
    LastWeeksScore.tsx
    WeeklyCheckinQuestionScreen.tsx
    WeeklyCheckinNumberScale.tsx
    WeeklyCheckinEnumPicker.tsx
    AnchorDoneScreen.tsx
    GoDeeperScreen.tsx
    WeeklyCheckinSavedScreen.tsx
  hooks/
    useWeeklyCheckinFlow.ts
  lib/
    weeklyCheckinReducer.ts
    weeklyCheckinScoring.ts
    weeklyCheckinRoutes.ts
```

Routes:

```txt
apps/mobile/app/(app)/check-in/index.tsx
apps/mobile/app/(app)/check-in/question.tsx
apps/mobile/app/(app)/check-in/anchor-done.tsx
apps/mobile/app/(app)/check-in/go-deeper.tsx
apps/mobile/app/(app)/check-in/saved.tsx
```

### State Flow

- `useWeeklyCheckinFlow` loads summary/current draft.
- Initial answers come from current draft if present.
- On each Continue:
  - update local reducer state
  - save draft via generated mutation
  - navigate next
- On final submit:
  - call submit mutation
  - update summary cache
  - route to saved page with `justCompleted=true`

### Bottom Nav Routing

Update `DashboardBottomBar`:

- `Check-in` press calls weekly check-in summary-aware route helper.
- If current week complete: route to `/check-in/saved`.
- If incomplete: route to `/check-in`.

MVP implementation can use the check-in summary query inside a `CheckInTabButton` wrapper, or expose a small `useWeeklyCheckinDestination` hook.

## UI Components

### Design System Candidates

These may become reusable primitives in `packages/design-system` after proving they are used beyond weekly check-in:

#### `NumberScaleInput`

Purpose:

- Select a number from 1-10.
- Color changes based on good/bad threshold and `scoreDirection`.

Props:

```ts
type NumberScaleInputProps = {
  value?: number;
  min?: number;
  max?: number;
  lowLabel?: string;
  highLabel?: string;
  scoreDirection?: 'higher_is_better' | 'lower_is_better';
  onChange: (value: number) => void;
};
```

Design:

- Use `colors.flagHigh`, `colors.flagOk`, `colors.midday`, `colors.surface`.
- Stable button dimensions.
- Accessible `button` roles.
- No viewport-scaled font sizes.

#### `EnumPicker`

Purpose:

- Configurable segmented/card picker for options like `None | Some | A lot`.

Props:

```ts
type EnumPickerProps = {
  value?: string;
  options: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
  onChange: (value: string) => void;
};
```

MVP placement:

- Start inside `features/weekly-checkin/components`.
- Promote to design system only after repeated use in condition flows or other app areas.

### Feature Components

#### `WeeklyCheckinIntroScreen`

- Fetches summary.
- Shows intro copy.
- Shows `WhatToExpect`.
- Shows `LastWeeksScore` only if previous submitted exists.
- Primary CTA starts/resumes current week.

#### `WhatToExpect`

- Static feature component.
- Explains 10 questions, optional deeper feedback, and weekly score.

#### `LastWeeksScore`

- Accepts previous submitted DTO.
- Shows score and submission date.
- Hidden when no previous submitted check-in exists.

#### `WeeklyCheckinQuestionScreen`

- Renders current question based on definition.
- Delegates input to `WeeklyCheckinNumberScale` or `WeeklyCheckinEnumPicker`.
- Continue saves draft and advances.

#### `AnchorDoneScreen`

- Shows after 10 required questions.
- CTA options:
  - `Go deeper`
  - `Skip for now` (submits immediately)

#### `GoDeeperScreen`

- Optional grouped deeper symptom prompts with enum picks.
- Saves draft as user selects answers.
- `Save and finish` submits current week.
- `Skip` also submits current week.

#### `WeeklyCheckinSavedScreen`

- Shows saved check-in details.
- If route param `justCompleted=true`, title is `Check-in Saved`.
- Otherwise show date/week and score at the top.

## Generated API Client Workflow

1. Add API DTOs and controllers in `apps/api`.
2. Add database schema and migration in `packages/database`.
3. Run OpenAPI generation.
4. Regenerate `@led/api-client`.
5. In mobile, import generated hooks/types only through `features/weekly-checkin/api/weekly-checkin-queries.ts`.
6. Keep UI components typed from local adapter types derived from generated DTOs.

## Scoring

MVP:

- Total score is server-computed on submit.
- Numeric questions contribute their selected value.
- Enum questions contribute option score from definition.
- Store both total and max where possible.

Future:

- Symptom domains.
- Trend comparisons.
- Condition-specific weighting.
- Alert thresholds.

## Validation

Draft save:

- Definition id/version required.
- Answers must match known question ids.
- Values must match question kind.
- Required answers are not enforced.

Submit:

- All required questions must be answered.
- Values must match question kind.
- Score is computed after validation.

## Testing Plan

API:

- Summary returns active definition and correct current week status.
- Draft save creates current week draft.
- Draft save updates existing draft.
- Submit marks current week as submitted.
- Submit rejects missing required answers.
- Submitted check-in appears as current completed check-in.
- Previous week score appears only when prior submitted data exists.

Mobile:

- Intro renders with/without previous week score.
- Continue saves draft and advances.
- Reload resumes draft answers.
- Bottom tab routes to intro when incomplete.
- Bottom tab routes to saved when complete.
- Saved page title changes based on `justCompleted`.
- Complete page submits and routes to saved.

## Rollout Steps

1. Add database schema and migration.
2. Add weekly check-in definitions package/module or seed definition in API.
3. Add API DTOs/controller/service.
4. Regenerate API client.
5. Add mobile API adapter.
6. Add weekly check-in reducer/hook.
7. Build intro, question, anchor done, go deeper, complete, and saved screens.
8. Wire dashboard widget and bottom tab routing.
9. Add targeted API and mobile tests.
10. Run typecheck/lint.

## Explicitly Out Of Scope

- Talk to LED instead.
- Building appointment brief.
- Doctor Brief page.
- Provider-facing exports.
- AI summaries.
- Medication pages.
