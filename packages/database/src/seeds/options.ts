import { parseArgs } from 'node:util';

export type SeedOptions = {
  email: string;
  databaseUrl?: string;
  allowRemote: boolean;
  dryRun: boolean;
  modules: {
    circle: boolean;
    weeklyCheckins: boolean;
    vitals: boolean;
    conditions: boolean;
  };
  weeklyCheckins: {
    weeks: number;
  };
  vitals: {
    readings: number;
    days: number;
  };
  conditions: {
    conditionIds: string[];
  };
};

export function parseSeedOptions(args = process.argv.slice(2)): SeedOptions {
  const { values } = parseArgs({
    args: stripArgumentSeparators(args),
    options: {
      email: { type: 'string', short: 'e' },
      all: { type: 'boolean', default: false },
      circle: { type: 'boolean', default: false },
      'weekly-checkins': { type: 'boolean', default: false },
      weeks: { type: 'string', default: '8' },
      vitals: { type: 'boolean', default: false },
      'vital-readings': { type: 'string', default: '30' },
      'vital-days': { type: 'string', default: '30' },
      conditions: { type: 'boolean', default: false },
      condition: { type: 'string', multiple: true, default: [] },
      'database-url': { type: 'string' },
      'allow-remote': { type: 'boolean', default: false },
      'dry-run': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
    strict: true,
  });

  if (values.help) {
    throw new UsageError(seedUsage);
  }

  if (!values.email) {
    throw new UsageError(`Missing required --email.\n\n${seedUsage}`);
  }

  const circle = Boolean(values.all || values.circle);
  const weeklyCheckins = Boolean(values.all || values['weekly-checkins']);
  const vitals = Boolean(values.all || values.vitals);
  const conditions = Boolean(values.all || values.conditions);

  if (!circle && !weeklyCheckins && !vitals && !conditions) {
    throw new UsageError(`Choose at least one seed module or pass --all.\n\n${seedUsage}`);
  }

  return {
    email: values.email,
    databaseUrl: values['database-url'],
    allowRemote: Boolean(values['allow-remote']),
    dryRun: Boolean(values['dry-run']),
    modules: {
      circle,
      weeklyCheckins,
      vitals,
      conditions,
    },
    weeklyCheckins: {
      weeks: readPositiveInteger(values.weeks, '--weeks'),
    },
    vitals: {
      readings: readPositiveInteger(values['vital-readings'], '--vital-readings'),
      days: readPositiveInteger(values['vital-days'], '--vital-days'),
    },
    conditions: {
      conditionIds: values.condition.length > 0 ? values.condition : ['mpn'],
    },
  };
}

function stripArgumentSeparators(args: string[]) {
  return args.filter((arg) => arg !== '--');
}

export class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UsageError';
  }
}

export const seedUsage = `Usage:
  pnpm db:seed -- --email dev@example.com --all
  pnpm db:seed -- --email dev@example.com --circle
  pnpm db:seed -- --email dev@example.com --weekly-checkins --weeks 12
  pnpm db:seed -- --email dev@example.com --vitals --vital-readings 30
  pnpm db:seed -- --email dev@example.com --conditions --condition mpn

Options:
  --email, -e          User email to seed.
  --all               Seed every module.
  --circle            Seed My Circle support and care team rows.
  --weekly-checkins   Seed weekly check-in rows.
  --weeks             Number of weekly check-ins to seed. Default: 8.
  --vitals            Seed vital readings.
  --vital-readings    Number of vital readings to seed. Default: 30.
  --vital-days        Date range, in days, for vital readings. Default: 30.
  --conditions        Seed condition profiles.
  --condition         Condition id to seed. Repeatable. Default: mpn.
  --database-url      Override DATABASE_URL.
  --allow-remote      Allow non-local database hosts.
  --dry-run           Print the plan without writing data.`;

function readPositiveInteger(value: string | undefined, label: string) {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new UsageError(`${label} must be a positive integer.`);
  }
  return parsed;
}
