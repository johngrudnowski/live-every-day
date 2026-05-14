# Dynamic Condition Flow Design

The condition flow should support variable screens and variable questions without turning our config into an arbitrary frontend framework. The right model is: configs describe product intent and clinical meaning; React components render known step kinds; the API validates the same config semantics before saving.

## Current State

We already have the beginning of dynamic flow support in `@led/conditions`:

- Each condition has a typed `ConditionDefinition`.
- Each screen is a `ConditionFlowStep`.
- A step can include `visibleWhen`.
- `visibleWhen` is evaluated against previously collected semantic values.
- The mobile app computes visible steps before moving forward/back.
- The API uses the same visibility rules when validating values.

Current rule shape:

```ts
type VisibilityRule =
  | { field: SemanticKey; equals: SemanticValue }
  | { field: SemanticKey; includes: string }
  | { all: VisibilityRule[] }
  | { any: VisibilityRule[] }
  | { not: VisibilityRule };
```

This already supports showing or hiding entire screens based on previous answers.

Example:

```ts
{
  id: 'mpn_progression',
  kind: 'grouped_toggle_list',
  semanticKey: 'diagnosis.mpn.progressions',
  visibleWhen: {
    field: 'diagnosis.condition',
    equals: 'mpn',
  },
}
```

## Gap

The current config does not fully support conditional fields inside a grouped screen.

For example, the new `about_you` grouped screen contains:

- Birth year
- Gender
- Diagnosis year

Today the whole `about_you` screen can be shown or hidden, but an individual field inside it does not yet have `visibleWhen`.

That is fine for the first MPN build, but future condition paths will likely need field-level branching, for example:

- Ask mutation follow-up questions only when the user knows their mutation.
- Ask progression details only when a progression was selected.
- Ask treatment questions only for users currently receiving treatment.
- Ask condition-specific questions only for a selected subtype.

## Design Goals

- Support branching screens and branching questions.
- Keep configs typed and readable.
- Keep validation server-authoritative.
- Avoid arbitrary code execution in configs.
- Avoid a generic form-builder that can render anything.
- Keep semantic values stable even when screens change.
- Make hidden questions excluded from validation requirements.
- Preserve provenance for any saved value.

## Proposed Config Model

Extend `ConditionStepField` to support `visibleWhen`, matching screens:

```ts
export type ConditionStepField = {
  id: string;
  kind: 'year_picker' | 'chip_select' | 'single_select_cards' | 'multi_select_cards';
  title: string;
  required?: boolean;
  semanticKey: SemanticKey;
  options?: ConditionOption[];
  minYear?: number;
  maxYear?: number;
  defaultValue?: SemanticValue;
  visibleWhen?: VisibilityRule;
};
```

Then both screens and fields use the same rule evaluator:

```ts
const visibleFields = step.fields.filter((field) =>
  isStepVisible(field.visibleWhen, semanticValues),
);
```

## Example: Conditional Mutation Follow-Up

```ts
{
  id: 'mpn_mutation_details',
  kind: 'field_group',
  title: 'A little more about your mutation',
  visibleWhen: {
    field: 'diagnosis.mpn.driverMutation',
    equals: 'jak2_positive',
  },
  fields: [
    {
      id: 'jak2_allele_burden_known',
      kind: 'single_select_cards',
      title: 'Do you know your JAK2 allele burden?',
      semanticKey: 'diagnosis.mpn.jak2AlleleBurdenKnown',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
    },
    {
      id: 'jak2_allele_burden',
      kind: 'free_text',
      title: 'What was the percentage?',
      semanticKey: 'diagnosis.mpn.jak2AlleleBurden',
      visibleWhen: {
        field: 'diagnosis.mpn.jak2AlleleBurdenKnown',
        equals: 'yes',
      },
    },
  ],
}
```

This keeps branching in the config but still limits rendering to known UI primitives.

## Validation Rules

Validation should follow visibility:

- Hidden screens are not required.
- Hidden fields are not required.
- Hidden field values should not block saving.
- Unknown semantic keys should be ignored or rejected depending on endpoint strictness.
- Values for hidden fields may be pruned during normalization if product wants the saved profile to reflect only currently visible answers.

Recommended first approach:

- Do not require hidden fields.
- Keep already collected hidden values unless the user changes an upstream answer in the same flow.
- On upstream answer changes, the mobile reducer should prune values for fields and steps that are no longer visible.
- API validation should accept only semantic keys defined by the condition definition.

## Reducer Behavior

When an answer changes:

1. Write the new semantic value.
2. Recompute visible steps and fields.
3. Remove semantic values for no-longer-visible fields if they were collected during the current flow session.
4. Keep server-saved profile history separate from the current draft until save.

This prevents stale answers like "JAK2 allele burden: 42%" remaining in the draft after the user changes mutation status to "unknown."

## API Behavior

The API should use the server-side condition config for all branching decisions.

Save flow:

1. Coerce submitted semantic values.
2. Resolve visible steps and visible fields from those values.
3. Validate required visible values.
4. Validate option membership and value types.
5. Normalize profile.
6. Save versioned profile JSON.

The mobile app can guide the user, but API validation remains the source of truth.

## Future Rule Extensions

Only add these when real product flows need them:

```ts
type VisibilityRule =
  | { field: SemanticKey; equals: SemanticValue }
  | { field: SemanticKey; notEquals: SemanticValue }
  | { field: SemanticKey; includes: string }
  | { field: SemanticKey; exists: true }
  | { field: SemanticKey; isEmpty: true }
  | { field: SemanticKey; greaterThan: number }
  | { field: SemanticKey; lessThan: number }
  | { all: VisibilityRule[] }
  | { any: VisibilityRule[] }
  | { not: VisibilityRule };
```

Keep the rule language declarative. Do not add config-defined JavaScript predicates.

## Implementation Steps

1. Add `visibleWhen?: VisibilityRule` to `ConditionStepField`.
2. Add `getVisibleFields(step, values)` to `packages/conditions`.
3. Update mobile `FieldGroupStep` to render only visible fields.
4. Update mobile reducer to prune no-longer-visible draft values.
5. Update API validation to validate only visible fields.
6. Add tests for hidden required fields, nested `any/all/not`, and answer pruning.
7. Add config examples in `packages/conditions/src/configs/mpn.condition.ts` when a real MPN branch needs it.

## Principle

Branching should be boring, explicit, and semantic-key driven. If a future condition path cannot be expressed with small declarative visibility rules, that is a signal to add one careful rule primitive, not to let configs become code.
