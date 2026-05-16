type NumberScaleQuestion = {
  id: string;
  kind: 'number_scale';
  title: string;
  subtitle?: string;
  required: boolean;
  min: number;
  max: number;
  lowLabel: string;
  highLabel: string;
  scoreDirection: 'higher_is_better' | 'lower_is_better';
};

type EnumQuestion = {
  id: string;
  kind: 'enum';
  title: string;
  subtitle?: string;
  required: boolean;
  options: Array<{
    value: string;
    label: string;
    description?: string;
    score: number;
  }>;
};

type FreeTextQuestion = {
  id: string;
  kind: 'free_text';
  title: string;
  subtitle?: string;
  required: boolean;
};

export type WeeklyCheckinQuestion = NumberScaleQuestion | EnumQuestion | FreeTextQuestion;

export type WeeklyCheckinDefinition = {
  id: string;
  conditionId: string | null;
  title: string;
  questions: WeeklyCheckinQuestion[];
  deeperPrompts: WeeklyCheckinQuestion[];
};

export const activeWeeklyCheckinDefinition: WeeklyCheckinDefinition = {
  id: 'weekly-checkin-core',
  conditionId: null,
  title: 'Weekly Check-in',
  questions: [
    {
      id: 'fatigue_heaviness',
      kind: 'number_scale',
      title: 'How heavy has fatigue felt this week?',
      subtitle: 'Think about your worst day this week.',
      required: true,
      min: 0,
      max: 10,
      lowLabel: 'Not at all',
      highLabel: 'As bad as it gets',
      scoreDirection: 'lower_is_better',
    },
    {
      id: 'feeling_unwell',
      kind: 'number_scale',
      title: 'How much has feeling unwell slowed you down?',
      subtitle: 'That overall sense of not quite being yourself.',
      required: true,
      min: 0,
      max: 10,
      lowLabel: 'Not at all',
      highLabel: 'As bad as it gets',
      scoreDirection: 'lower_is_better',
    },
    {
      id: 'itching',
      kind: 'number_scale',
      title: 'How much has itching bothered you?',
      subtitle: 'The unexplained MPN itch - not from a rash.',
      required: true,
      min: 0,
      max: 10,
      lowLabel: 'Not at all',
      highLabel: 'As bad as it gets',
      scoreDirection: 'lower_is_better',
    },
    {
      id: 'bone_pain',
      kind: 'number_scale',
      title: 'How bothered have you been by bone pain?',
      subtitle: 'Deep aches in the bones themselves.',
      required: true,
      min: 0,
      max: 10,
      lowLabel: 'Not at all',
      highLabel: 'As bad as it gets',
      scoreDirection: 'lower_is_better',
    },
    {
      id: 'muscle_pain',
      kind: 'number_scale',
      title: 'How bothered have you been by muscle pain?',
      subtitle: 'Soreness, tension, or aching in muscles.',
      required: true,
      min: 0,
      max: 10,
      lowLabel: 'Not at all',
      highLabel: 'As bad as it gets',
      scoreDirection: 'lower_is_better',
    },
    {
      id: 'left_rib_discomfort',
      kind: 'number_scale',
      title: 'Any pain or discomfort under your left ribs?',
      subtitle: 'Fullness, pressure, or pain in the upper left belly.',
      required: true,
      min: 0,
      max: 10,
      lowLabel: 'Not at all',
      highLabel: 'As bad as it gets',
      scoreDirection: 'lower_is_better',
    },
    {
      id: 'early_satiety',
      kind: 'number_scale',
      title: 'Are you feeling full faster than usual?',
      subtitle: 'Early satiety - full after a few bites.',
      required: true,
      min: 0,
      max: 10,
      lowLabel: 'Not at all',
      highLabel: 'As bad as it gets',
      scoreDirection: 'lower_is_better',
    },
    {
      id: 'night_sweats',
      kind: 'number_scale',
      title: 'How disruptive have night sweats been?',
      subtitle: 'Waking up drenched, or too warm to settle.',
      required: true,
      min: 0,
      max: 10,
      lowLabel: 'Not at all',
      highLabel: 'As bad as it gets',
      scoreDirection: 'lower_is_better',
    },
    {
      id: 'fevers',
      kind: 'number_scale',
      title: 'Have you had any fevers?',
      subtitle: 'Above 100°F, or persistent feverish feeling.',
      required: true,
      min: 0,
      max: 10,
      lowLabel: 'Not at all',
      highLabel: 'As bad as it gets',
      scoreDirection: 'lower_is_better',
    },
    {
      id: 'weight_loss',
      kind: 'number_scale',
      title: 'Any unintentional weight loss?',
      subtitle: 'Weight dropping without trying to lose it.',
      required: true,
      min: 0,
      max: 10,
      lowLabel: 'Not at all',
      highLabel: 'As bad as it gets',
      scoreDirection: 'lower_is_better',
    },
  ],
  deeperPrompts: [
    {
      id: 'd_inactivity',
      kind: 'enum',
      title: 'Inactivity / reduced activity',
      required: false,
      options: [
        { value: 'none', label: 'None', score: 0 },
        { value: 'some', label: 'Some', score: 1 },
        { value: 'lot', label: 'A lot', score: 2 },
      ],
    },
    {
      id: 'd_sleep',
      kind: 'enum',
      title: 'Difficulty falling or staying asleep',
      required: false,
      options: [
        { value: 'none', label: 'None', score: 0 },
        { value: 'some', label: 'Some', score: 1 },
        { value: 'lot', label: 'A lot', score: 2 },
      ],
    },
    {
      id: 'd_restless',
      kind: 'enum',
      title: 'Restless legs',
      required: false,
      options: [
        { value: 'none', label: 'None', score: 0 },
        { value: 'some', label: 'Some', score: 1 },
        { value: 'lot', label: 'A lot', score: 2 },
      ],
    },
    {
      id: 'd_flushing',
      kind: 'enum',
      title: 'Flushing',
      required: false,
      options: [
        { value: 'none', label: 'None', score: 0 },
        { value: 'some', label: 'Some', score: 1 },
        { value: 'lot', label: 'A lot', score: 2 },
      ],
    },
    {
      id: 'd_fog',
      kind: 'enum',
      title: 'Trouble concentrating / brain fog',
      required: false,
      options: [
        { value: 'none', label: 'None', score: 0 },
        { value: 'some', label: 'Some', score: 1 },
        { value: 'lot', label: 'A lot', score: 2 },
      ],
    },
    {
      id: 'd_headache',
      kind: 'enum',
      title: 'Headaches',
      required: false,
      options: [
        { value: 'none', label: 'None', score: 0 },
        { value: 'some', label: 'Some', score: 1 },
        { value: 'lot', label: 'A lot', score: 2 },
      ],
    },
    {
      id: 'd_migraine',
      kind: 'enum',
      title: 'Migraines',
      required: false,
      options: [
        { value: 'none', label: 'None', score: 0 },
        { value: 'some', label: 'Some', score: 1 },
        { value: 'lot', label: 'A lot', score: 2 },
      ],
    },
    {
      id: 'd_numb',
      kind: 'enum',
      title: 'Numbness or tingling in hands or feet',
      required: false,
      options: [
        { value: 'none', label: 'None', score: 0 },
        { value: 'some', label: 'Some', score: 1 },
        { value: 'lot', label: 'A lot', score: 2 },
      ],
    },
    {
      id: 'd_tinnitus',
      kind: 'enum',
      title: 'Ringing in the ears (tinnitus)',
      required: false,
      options: [
        { value: 'none', label: 'None', score: 0 },
        { value: 'some', label: 'Some', score: 1 },
        { value: 'lot', label: 'A lot', score: 2 },
      ],
    },
    {
      id: 'd_vision',
      kind: 'enum',
      title: 'Blurred or double vision',
      required: false,
      options: [
        { value: 'none', label: 'None', score: 0 },
        { value: 'some', label: 'Some', score: 1 },
        { value: 'lot', label: 'A lot', score: 2 },
      ],
    },
    {
      id: 'd_joint',
      kind: 'enum',
      title: 'Joint pain',
      required: false,
      options: [
        { value: 'none', label: 'None', score: 0 },
        { value: 'some', label: 'Some', score: 1 },
        { value: 'lot', label: 'A lot', score: 2 },
      ],
    },
    {
      id: 'd_cramp',
      kind: 'enum',
      title: 'Muscle cramping',
      required: false,
      options: [
        { value: 'none', label: 'None', score: 0 },
        { value: 'some', label: 'Some', score: 1 },
        { value: 'lot', label: 'A lot', score: 2 },
      ],
    },
    {
      id: 'd_spasm',
      kind: 'enum',
      title: 'Muscle spasms',
      required: false,
      options: [
        { value: 'none', label: 'None', score: 0 },
        { value: 'some', label: 'Some', score: 1 },
        { value: 'lot', label: 'A lot', score: 2 },
      ],
    },
    {
      id: 'd_ache',
      kind: 'enum',
      title: 'Generalized aches or heaviness',
      required: false,
      options: [
        { value: 'none', label: 'None', score: 0 },
        { value: 'some', label: 'Some', score: 1 },
        { value: 'lot', label: 'A lot', score: 2 },
      ],
    },
    {
      id: 'd_abdom',
      kind: 'enum',
      title: 'Abdominal discomfort',
      required: false,
      options: [
        { value: 'none', label: 'None', score: 0 },
        { value: 'some', label: 'Some', score: 1 },
        { value: 'lot', label: 'A lot', score: 2 },
      ],
    },
    {
      id: 'd_appetite',
      kind: 'enum',
      title: 'Poor appetite',
      required: false,
      options: [
        { value: 'none', label: 'None', score: 0 },
        { value: 'some', label: 'Some', score: 1 },
        { value: 'lot', label: 'A lot', score: 2 },
      ],
    },
    {
      id: 'd_bloat',
      kind: 'enum',
      title: 'Bloating',
      required: false,
      options: [
        { value: 'none', label: 'None', score: 0 },
        { value: 'some', label: 'Some', score: 1 },
        { value: 'lot', label: 'A lot', score: 2 },
      ],
    },
    {
      id: 'd_gain',
      kind: 'enum',
      title: 'Weight gain',
      required: false,
      options: [
        { value: 'none', label: 'None', score: 0 },
        { value: 'some', label: 'Some', score: 1 },
        { value: 'lot', label: 'A lot', score: 2 },
      ],
    },
    {
      id: 'd_active',
      kind: 'enum',
      title: 'Difficulty being physically active',
      required: false,
      options: [
        { value: 'none', label: 'None', score: 0 },
        { value: 'some', label: 'Some', score: 1 },
        { value: 'lot', label: 'A lot', score: 2 },
      ],
    },
    {
      id: 'd_conc',
      kind: 'enum',
      title: 'Concentration affecting daily life',
      required: false,
      options: [
        { value: 'none', label: 'None', score: 0 },
        { value: 'some', label: 'Some', score: 1 },
        { value: 'lot', label: 'A lot', score: 2 },
      ],
    },
    {
      id: 'd_intimacy',
      kind: 'enum',
      title: 'Changes in sexual health or intimacy',
      required: false,
      options: [
        { value: 'none', label: 'None', score: 0 },
        { value: 'some', label: 'Some', score: 1 },
        { value: 'lot', label: 'A lot', score: 2 },
      ],
    },
    {
      id: 'd_self',
      kind: 'enum',
      title: 'Overall sense of "not being yourself"',
      required: false,
      options: [
        { value: 'none', label: 'None', score: 0 },
        { value: 'some', label: 'Some', score: 1 },
        { value: 'lot', label: 'A lot', score: 2 },
      ],
    },
  ],
};
