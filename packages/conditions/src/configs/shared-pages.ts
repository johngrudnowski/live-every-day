import type { ConditionFlowStep, SemanticFieldDefinition } from '../types';

export const sharedConditionFields: SemanticFieldDefinition[] = [
  {
    key: 'demographics.birthYear',
    label: 'Birth year',
    description: 'Birth year used for age-contextualized trends.',
    valueType: 'year',
  },
  {
    key: 'demographics.gender',
    label: 'Gender',
    description: 'Self-reported gender.',
    valueType: 'string',
  },
  {
    key: 'diagnosis.year',
    label: 'Diagnosis year',
    description: 'Year the user was diagnosed.',
    valueType: 'year',
  },
  {
    key: 'history.events',
    label: 'Significant health events',
    description: 'High-signal health events and comorbidities relevant to care.',
    valueType: 'string[]',
  },
];

export function createAboutYouStep(): ConditionFlowStep {
  return {
    id: 'about_you',
    kind: 'field_group',
    title: 'Tell us about yourself.',
    subtitle:
      'A bit of context helps us understand your patterns. You can update any of this later.',
    required: false,
    accountLink: {
      label: 'About yourself',
      subtitle: 'Birth year, gender, and diagnosis year',
      icon: 'user-o',
      summarySemanticKeys: ['demographics.birthYear', 'demographics.gender', 'diagnosis.year'],
    },
    fields: [
      {
        id: 'birth_year',
        kind: 'year_picker',
        title: 'Birth year',
        required: false,
        semanticKey: 'demographics.birthYear',
        minYear: 1900,
        maxYear: new Date().getFullYear(),
        defaultValue: 1965,
      },
      {
        id: 'gender',
        kind: 'chip_select',
        title: 'Gender',
        required: false,
        semanticKey: 'demographics.gender',
        options: [
          { value: 'woman', label: 'Woman' },
          { value: 'man', label: 'Man' },
          { value: 'non_binary', label: 'Non-binary' },
          { value: 'prefer_not_to_say', label: 'Prefer not to say' },
        ],
      },
      {
        id: 'diagnosis_year',
        kind: 'year_picker',
        title: 'Diagnosis year',
        required: false,
        semanticKey: 'diagnosis.year',
        minYear: 1900,
        maxYear: new Date().getFullYear(),
        defaultValue: 2017,
      },
    ],
  };
}

export function createSignificantHealthEventsStep(
  linkedCompleteHistoryStepId?: string,
): ConditionFlowStep {
  return {
    id: 'health_events',
    kind: 'grouped_toggle_list',
    title: 'Any significant health events?',
    subtitle:
      'These help us flag connections your care team may have missed - like the link between a heart attack and your condition.',
    required: false,
    semanticKey: 'history.events',
    accountLink: {
      label: 'Health events',
      subtitle: 'Cardiovascular, clotting, and other conditions',
      icon: 'bolt',
      summarySemanticKeys: ['history.events'],
    },
    linkedSteps: linkedCompleteHistoryStepId
      ? [
          {
            stepId: linkedCompleteHistoryStepId,
            label: "If you'd like, share your complete history",
            description: 'Optional - an expanded condition-specific list',
          },
        ]
      : undefined,
    optionGroups: [
      {
        id: 'cardiovascular_clotting',
        label: 'Cardiovascular & clotting',
        options: [
          {
            value: 'heart_attack',
            label: 'Heart attack',
            description: 'Myocardial infarction (MI)',
          },
          { value: 'stroke_tia', label: 'Stroke or TIA', description: 'Including "mini strokes"' },
          {
            value: 'blood_clot',
            label: 'Blood clot',
            description: 'DVT, pulmonary embolism, or portal vein',
          },
        ],
      },
      {
        id: 'other_conditions',
        label: 'Other conditions',
        options: [
          { value: 'diabetes', label: 'Diabetes', description: 'Type 1 or Type 2' },
          { value: 'hypertension', label: 'High blood pressure', description: 'Hypertension' },
          {
            value: 'prior_chemotherapy',
            label: 'Prior chemotherapy',
            description: 'Any treatment, any condition',
          },
          { value: 'none_of_the_above', label: 'None of the above' },
        ],
      },
    ],
  };
}
