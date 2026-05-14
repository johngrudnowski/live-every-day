import type { ConditionDefinition, ConditionOptionGroup, SemanticFieldDefinition } from '../types';
import {
  createAboutYouStep,
  createSignificantHealthEventsStep,
  sharedConditionFields,
} from './shared-pages';

const mpnFields: SemanticFieldDefinition[] = [
  {
    key: 'diagnosis.condition',
    label: 'Condition',
    description: 'The condition path selected by the user.',
    valueType: 'string',
    clinicalMeaning: 'Primary condition context used to tailor symptom tracking and education.',
  },
  {
    key: 'diagnosis.mpn.subtypes',
    label: 'MPN subtypes',
    description: 'Current MPN diagnosis or overlap diagnosis.',
    valueType: 'string[]',
    clinicalMeaning: 'Distinguishes ET, PV, myelofibrosis, and related MPN diagnoses.',
  },
  {
    key: 'diagnosis.mpn.driverMutation',
    label: 'Driver mutation',
    description: 'Known MPN driver mutation status.',
    valueType: 'string',
    clinicalMeaning: 'JAK2, CALR, MPL, triple-negative, or unknown driver mutation status.',
  },
  {
    key: 'diagnosis.mpn.progressions',
    label: 'MPN progression history',
    description: 'Known disease evolution or transformation history.',
    valueType: 'string[]',
  },
  {
    key: 'history.events.expanded',
    label: 'Expanded health history',
    description: 'Optional expanded MPN-related history list inspired by the prototype survey.',
    valueType: 'string[]',
  },
  ...sharedConditionFields,
];

const expandedHistoryGroups: ConditionOptionGroup[] = [
  {
    id: 'frequently_reported',
    label: 'Frequently reported',
    options: [
      { value: 'thrombocytosis', label: 'Thrombocytosis', description: 'High platelet count' },
      { value: 'bruising', label: 'Bruising' },
      {
        value: 'high_hematocrit',
        label: 'High hematocrit',
        description: 'Elevated red cell volume',
      },
      { value: 'decreased_quality_of_life', label: 'Decrease in quality of life' },
      { value: 'anxiety', label: 'Anxiety' },
      { value: 'anemia', label: 'Anemia', description: 'Low hemoglobin' },
      { value: 'hypertension', label: 'High blood pressure', description: 'Hypertension' },
      { value: 'depression', label: 'Depression' },
      { value: 'splenomegaly', label: 'Splenomegaly', description: 'Enlarged spleen' },
      { value: 'mpn_disease_progression', label: 'MPN disease progression' },
      {
        value: 'erythrocytosis',
        label: 'Erythrocytosis',
        description: 'High red blood cell count',
      },
      { value: 'bleeding_complications', label: 'Bleeding complications' },
      { value: 'leukocytosis', label: 'Leukocytosis', description: 'High white blood cell count' },
      { value: 'infection_susceptibility', label: 'Higher susceptibility to infections' },
      {
        value: 'elevated_cholesterol',
        label: 'Elevated cholesterol',
        description: 'Or other metabolic abnormalities',
      },
    ],
  },
  {
    id: 'less_frequently_reported',
    label: 'Less frequently reported',
    options: [
      { value: 'blood_clots', label: 'Blood clots' },
      { value: 'gout', label: 'Gout', description: 'High uric acid levels' },
      { value: 'deep_vein_thrombosis', label: 'Deep vein thrombosis', description: 'DVT' },
      { value: 'leukopenia', label: 'Leukopenia', description: 'Low white blood cell count' },
      { value: 'hepatomegaly', label: 'Hepatomegaly', description: 'Enlarged liver' },
      { value: 'stroke_tia', label: 'Stroke or TIA', description: 'Transient ischemic attack' },
      { value: 'thrombocytopenia', label: 'Thrombocytopenia', description: 'Low platelet count' },
      { value: 'pulmonary_embolism', label: 'Pulmonary embolism' },
      { value: 'heart_attack', label: 'Heart attack', description: 'Myocardial infarction (MI)' },
      {
        value: 'portal_vein_thrombosis',
        label: 'Portal vein thrombosis',
        description: 'Or Budd-Chiari syndrome',
      },
      { value: 'pulmonary_arterial_hypertension', label: 'Pulmonary arterial hypertension' },
      { value: 'ascites', label: 'Ascites', description: 'Fluid in the abdomen' },
    ],
  },
];

export const mpnCondition: ConditionDefinition = {
  id: 'mpn',
  version: 1,
  label: 'MPNs',
  subtitle: 'ET, PV, or Myelofibrosis',
  status: 'active',
  profileSchemaId: 'led.conditionProfile.v1',
  fields: mpnFields,
  flow: [
    {
      id: 'mpn_subtypes',
      kind: 'multi_select_cards',
      eyebrow: 'MPNs',
      title: "What's your current diagnosis?",
      subtitle:
        'Each MPN has a distinct symptom profile and lab pattern. Some patients have an overlap diagnosis, like ET + PV. Pick all that apply.',
      required: true,
      semanticKey: 'diagnosis.mpn.subtypes',
      accountLink: {
        label: 'Condition',
        subtitle: 'MPN subtype or overlap diagnosis',
        icon: 'heartbeat',
        summarySemanticKeys: ['diagnosis.mpn.subtypes'],
      },
      options: [
        {
          value: 'essential_thrombocythemia',
          label: 'Essential Thrombocythemia (ET)',
          description: 'Elevated platelets - most common MPN',
          codes: [{ system: 'internal', code: 'MPN_ET' }],
        },
        {
          value: 'polycythemia_vera',
          label: 'Polycythemia Vera (PV)',
          description: 'Elevated red cell mass',
          codes: [{ system: 'internal', code: 'MPN_PV' }],
        },
        {
          value: 'primary_myelofibrosis',
          label: 'Primary Myelofibrosis (pMF)',
          description: 'Diagnosed without a prior history of another MPN',
          codes: [{ system: 'internal', code: 'MPN_PMF' }],
        },
        {
          value: 'secondary_myelofibrosis',
          label: 'Secondary Myelofibrosis (sMF)',
          description: 'Develops as a progression of ET or PV',
          codes: [{ system: 'internal', code: 'MPN_SMF' }],
        },
        {
          value: 'mpn_unclassifiable',
          label: 'MPN Unclassifiable (MPN-U)',
          description: "Doesn't fit ET, PV, or MF criteria",
          codes: [{ system: 'internal', code: 'MPN_U' }],
        },
        {
          value: 'other_mpn',
          label: 'Other MPN',
          description: 'CNL, CEL, MDS/MPN overlap',
          codes: [{ system: 'internal', code: 'MPN_OTHER' }],
        },
      ],
    },
    {
      id: 'mpn_driver_mutation',
      kind: 'single_select_cards',
      eyebrow: 'MPNs - Mutation status',
      title: 'Do you know your mutation?',
      subtitle:
        'Mutation status affects symptom patterns and risk profile. You can add or update this later.',
      required: false,
      semanticKey: 'diagnosis.mpn.driverMutation',
      accountLink: {
        label: 'Mutation status',
        subtitle: 'JAK2, CALR, MPL, or unknown',
        icon: 'flask',
        summarySemanticKeys: ['diagnosis.mpn.driverMutation'],
      },
      options: [
        {
          value: 'jak2_positive',
          label: 'JAK2 positive',
          description: 'JAK2 V617F mutation confirmed',
        },
        { value: 'calr_positive', label: 'CALR positive', description: 'Calreticulin mutation' },
        { value: 'mpl_positive', label: 'MPL positive', description: 'MPL mutation' },
        {
          value: 'triple_negative',
          label: 'Triple negative',
          description: 'No JAK2, CALR, or MPL mutation',
        },
        {
          value: 'unknown',
          label: "I don't know",
          description: "Not tested or not sure - that's fine",
        },
      ],
    },
    createAboutYouStep(),
    {
      id: 'mpn_progression',
      kind: 'grouped_toggle_list',
      eyebrow: 'MPNs - Progression',
      title: "What's your progression history?",
      subtitle: 'Most MPNs stay stable. If yours has evolved, please share.',
      required: false,
      semanticKey: 'diagnosis.mpn.progressions',
      accountLink: {
        label: 'Progression history',
        subtitle: 'Known disease evolution',
        icon: 'exchange',
        summarySemanticKeys: ['diagnosis.mpn.progressions'],
      },
      optionGroups: [
        {
          id: 'progressions',
          label: 'Progressions',
          options: [
            {
              value: 'et_to_myelofibrosis',
              label: 'ET progressed to Myelofibrosis',
              description: 'Also called post-ET sMF',
            },
            {
              value: 'pv_to_myelofibrosis',
              label: 'PV progressed to Myelofibrosis',
              description: 'Also called post-PV sMF',
            },
            { value: 'et_to_polycythemia_vera', label: 'ET progressed to Polycythemia Vera' },
            {
              value: 'transformation_to_acute_leukemia',
              label: 'Transformation to acute leukemia',
              description: 'AML',
            },
            {
              value: 'different_progression',
              label: 'A different kind of progression',
              description: 'You can add details to your notes anytime',
            },
            { value: 'no_progression', label: "I haven't experienced progression" },
          ],
        },
      ],
    },
    createSignificantHealthEventsStep('expanded_health_history'),
    {
      id: 'expanded_health_history',
      kind: 'grouped_toggle_list',
      title: 'Your complete history',
      subtitle:
        "Conditions and complications associated with MPNs, from the MPN Research Foundation's patient survey. Pick anything that applies - past or present.",
      required: false,
      semanticKey: 'history.events.expanded',
      includeInOnboarding: false,
      accountLink: {
        label: 'Complete history',
        subtitle: 'Optional expanded MPN history',
        icon: 'list-alt',
        summarySemanticKeys: ['history.events.expanded'],
      },
      optionGroups: expandedHistoryGroups,
    },
  ],
  outputs: {
    primaryDiagnosisKey: 'diagnosis.condition',
    summaryFields: [
      'diagnosis.mpn.subtypes',
      'diagnosis.mpn.driverMutation',
      'diagnosis.year',
      'diagnosis.mpn.progressions',
    ],
    tags: [],
  },
};
