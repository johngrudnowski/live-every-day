export type ConditionId = 'mpn' | 'cll' | 'prostate' | 'breast' | 'thyroid' | 'remission';

export type ConditionStatus = 'active' | 'coming_soon' | 'hidden';

export type SemanticKey =
  | 'diagnosis.condition'
  | 'diagnosis.mpn.subtypes'
  | 'diagnosis.mpn.driverMutation'
  | 'diagnosis.year'
  | 'diagnosis.mpn.progressions'
  | 'demographics.birthYear'
  | 'demographics.gender'
  | 'history.events'
  | 'history.events.expanded';

export type SemanticValue = string | number | boolean | string[] | null;

export type CodeSystem = 'internal' | 'snomed' | 'loinc' | 'icd10' | 'rxnorm';

export type ConditionCode = {
  system: CodeSystem;
  code: string;
  display?: string;
};

export type SemanticFieldDefinition = {
  key: SemanticKey;
  label: string;
  description: string;
  valueType: 'string' | 'number' | 'boolean' | 'string[]' | 'date' | 'year';
  clinicalMeaning?: string;
  aiHint?: string;
  codes?: ConditionCode[];
};

export type ConditionOption = {
  value: string;
  label: string;
  description?: string;
  codes?: ConditionCode[];
};

export type ConditionOptionGroup = {
  id: string;
  label: string;
  options: ConditionOption[];
};

export type VisibilityRule =
  | { field: SemanticKey; equals: SemanticValue }
  | { field: SemanticKey; includes: string }
  | { all: VisibilityRule[] }
  | { any: VisibilityRule[] }
  | { not: VisibilityRule };

export type ConditionStepKind =
  | 'single_select_cards'
  | 'multi_select_cards'
  | 'grouped_toggle_list'
  | 'year_picker'
  | 'chip_select'
  | 'field_group'
  | 'free_text'
  | 'info_interstitial';

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
};

export type ConditionFlowStep = {
  id: string;
  kind: ConditionStepKind;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  required?: boolean;
  semanticKey?: SemanticKey;
  options?: ConditionOption[];
  optionGroups?: ConditionOptionGroup[];
  fields?: ConditionStepField[];
  minYear?: number;
  maxYear?: number;
  defaultValue?: SemanticValue;
  visibleWhen?: VisibilityRule;
  includeInOnboarding?: boolean;
  linkedSteps?: ConditionStepLink[];
  accountLink?: ConditionAccountLink;
};

export type ConditionStepLink = {
  stepId: string;
  label: string;
  description?: string;
};

export type ConditionAccountLink = {
  label: string;
  subtitle?: string;
  icon?: string;
  summarySemanticKeys?: SemanticKey[];
};

export type ConditionTagRule = {
  id: string;
  label: string;
  when: VisibilityRule;
};

export type ConditionDefinition = {
  id: ConditionId;
  version: number;
  label: string;
  subtitle: string;
  status: ConditionStatus;
  profileSchemaId: 'led.conditionProfile.v1';
  fields: SemanticFieldDefinition[];
  flow: ConditionFlowStep[];
  outputs: {
    primaryDiagnosisKey: SemanticKey;
    summaryFields: SemanticKey[];
    tags: ConditionTagRule[];
  };
};

export type ConditionRegistryItem = Pick<
  ConditionDefinition,
  'id' | 'version' | 'label' | 'subtitle' | 'status'
>;

export type ConditionValueProvenance = {
  source: 'onboarding' | 'settings' | 'lab_import' | 'clinician' | 'ai_extract';
  stepId?: string;
  conditionDefinitionVersion?: number;
  capturedAt: string;
};

export type UserConditionProfile = {
  schema: 'led.conditionProfile.v1';
  conditionDefinitionId: ConditionId;
  conditionDefinitionVersion: number;
  collectedAt: string;
  updatedAt: string;
  values: Record<string, SemanticValue>;
  provenance: Record<string, ConditionValueProvenance>;
  onboarding?: {
    currentStepId?: string;
  };
};

export type ConditionFlowState = {
  conditionId?: ConditionId;
  currentStepId: string;
  answers: Record<string, unknown>;
  semanticValues: Partial<Record<SemanticKey, SemanticValue>>;
  skippedStepIds: string[];
};

export type NormalizeConditionProfileInput = {
  conditionDefinition: ConditionDefinition;
  semanticValues: Partial<Record<SemanticKey, SemanticValue>>;
  source?: ConditionValueProvenance['source'];
  capturedAt?: Date;
};

export type ConditionValidationIssue = {
  stepId?: string;
  field?: SemanticKey;
  message: string;
};

export type ConditionValidationResult = {
  valid: boolean;
  issues: ConditionValidationIssue[];
};
