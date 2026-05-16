import { sql } from 'drizzle-orm';
import { createHash } from 'node:crypto';
import { weeklyCheckins } from '../../schema';
import type { SeedContext, SeedResult, SeedUserTarget } from '../types';

export type SeedWeeklyCheckinsOptions = {
  weeks: number;
};

type NumberScaleQuestion = {
  id: string;
  kind: 'number_scale';
  min: number;
  max: number;
  scoreDirection: 'higher_is_better' | 'lower_is_better';
};

type EnumQuestion = {
  id: string;
  kind: 'enum';
  options: Array<{
    value: string;
    score: number;
  }>;
};

type SeedWeeklyCheckinDefinition = {
  id: string;
  conditionId: string | null;
  title: string;
  questions: NumberScaleQuestion[];
  deeperPrompts: EnumQuestion[];
};

const activeSeedWeeklyCheckinDefinition: SeedWeeklyCheckinDefinition = {
  id: 'weekly-checkin-core',
  conditionId: null,
  title: 'Weekly Check-in',
  questions: [
    {
      id: 'fatigue_heaviness',
      kind: 'number_scale',
      min: 0,
      max: 10,
      scoreDirection: 'lower_is_better',
    },
    {
      id: 'feeling_unwell',
      kind: 'number_scale',
      min: 0,
      max: 10,
      scoreDirection: 'lower_is_better',
    },
    { id: 'itching', kind: 'number_scale', min: 0, max: 10, scoreDirection: 'lower_is_better' },
    { id: 'bone_pain', kind: 'number_scale', min: 0, max: 10, scoreDirection: 'lower_is_better' },
    { id: 'muscle_pain', kind: 'number_scale', min: 0, max: 10, scoreDirection: 'lower_is_better' },
    {
      id: 'left_rib_discomfort',
      kind: 'number_scale',
      min: 0,
      max: 10,
      scoreDirection: 'lower_is_better',
    },
    {
      id: 'early_satiety',
      kind: 'number_scale',
      min: 0,
      max: 10,
      scoreDirection: 'lower_is_better',
    },
    {
      id: 'night_sweats',
      kind: 'number_scale',
      min: 0,
      max: 10,
      scoreDirection: 'lower_is_better',
    },
    { id: 'fevers', kind: 'number_scale', min: 0, max: 10, scoreDirection: 'lower_is_better' },
    { id: 'weight_loss', kind: 'number_scale', min: 0, max: 10, scoreDirection: 'lower_is_better' },
  ],
  deeperPrompts: [
    {
      id: 'd_sleep',
      kind: 'enum',
      options: [
        { value: 'none', score: 0 },
        { value: 'some', score: 1 },
        { value: 'lot', score: 2 },
      ],
    },
    {
      id: 'd_headache',
      kind: 'enum',
      options: [
        { value: 'none', score: 0 },
        { value: 'some', score: 1 },
        { value: 'lot', score: 2 },
      ],
    },
    {
      id: 'd_bloat',
      kind: 'enum',
      options: [
        { value: 'none', score: 0 },
        { value: 'some', score: 1 },
        { value: 'lot', score: 2 },
      ],
    },
  ],
};

const seedTrendPercents = [35, 42, 48, 55, 65, 75, 85, 100];

export async function seedWeeklyCheckins(
  ctx: SeedContext,
  target: SeedUserTarget,
  options: SeedWeeklyCheckinsOptions,
): Promise<SeedResult> {
  const rows = Array.from({ length: options.weeks }, (_, index) =>
    buildWeeklyCheckinRow(ctx, target, index, options.weeks),
  );

  await ctx.db
    .insert(weeklyCheckins)
    .values(rows)
    .onConflictDoUpdate({
      target: [weeklyCheckins.userId, weeklyCheckins.weekStartDate, weeklyCheckins.definitionId],
      set: {
        conditionId: sql`excluded.condition_id`,
        status: sql`excluded.status`,
        answersJson: sql`excluded.answers_json`,
        scoreJson: sql`excluded.score_json`,
        customNote: sql`excluded.custom_note`,
        completedAt: sql`excluded.completed_at`,
        updatedAt: ctx.now,
      },
    });

  return {
    module: 'weekly-checkins',
    count: rows.length,
    detail: `upserted ${rows.length} submitted weekly check-ins`,
  };
}

function buildWeeklyCheckinRow(
  ctx: SeedContext,
  target: SeedUserTarget,
  weekOffset: number,
  totalWeeks: number,
) {
  const definition = activeSeedWeeklyCheckinDefinition;
  const weekStartDate = getWeekStartDate(ctx.now, weekOffset);
  const answers = buildAnswers(definition, getTrendPercent(weekOffset, totalWeeks));
  const score = calculateScore(definition, answers);
  const completedAt = getCompletedAt(ctx.now, weekStartDate);

  return {
    id: createSeedWeeklyCheckinId(target.userId, weekStartDate, definition.id),
    userId: target.userId,
    definitionId: definition.id,
    conditionId: definition.conditionId,
    weekStartDate,
    status: 'submitted',
    answersJson: answers,
    scoreJson: score,
    customNote: `Seeded check-in for ${weekStartDate}.`,
    completedAt,
    updatedAt: ctx.now,
  } satisfies typeof weeklyCheckins.$inferInsert;
}

function buildAnswers(definition: SeedWeeklyCheckinDefinition, targetPercent: number) {
  const answers: Record<string, unknown> = {};
  const numericMax = definition.questions.reduce((total, question) => total + question.max, 0);
  const targetTotal = Math.round((numericMax * targetPercent) / 100);
  const numericScores = distributeScore(
    targetTotal,
    definition.questions.length,
    10,
    0,
  );

  definition.questions.forEach((question, questionIndex) => {
    answers[question.id] = numericScores[questionIndex] ?? 0;
  });

  definition.deeperPrompts.forEach((question) => {
    const option = question.options.find((item) => item.value === 'none') ?? question.options[0];
    answers[question.id] = option?.value ?? 'none';
  });

  return answers;
}

function getTrendPercent(weekOffset: number, totalWeeks: number) {
  const chronologicalIndex = totalWeeks - 1 - weekOffset;
  const scaledIndex =
    totalWeeks <= 1
      ? seedTrendPercents.length - 1
      : Math.round((chronologicalIndex / (totalWeeks - 1)) * (seedTrendPercents.length - 1));

  return seedTrendPercents[Math.max(0, Math.min(seedTrendPercents.length - 1, scaledIndex))] ?? 50;
}

function calculateScore(definition: SeedWeeklyCheckinDefinition, answers: Record<string, unknown>) {
  let numericTotal = 0;
  let enumTotal = 0;
  let max = 0;

  for (const question of definition.questions) {
    max += question.max;
    const value = answers[question.id];
    if (typeof value === 'number') {
      numericTotal += value;
    }
  }

  return {
    total: numericTotal + enumTotal,
    max,
    numericTotal,
    enumTotal,
    percent: getPercent(numericTotal + enumTotal, max),
  };
}

function distributeScore(total: number, slots: number, maxPerSlot: number, minPerSlot = 0) {
  const scores = Array.from({ length: slots }, () => minPerSlot);
  let remaining = Math.max(0, total - minPerSlot * slots);

  while (remaining > 0) {
    let changed = false;

    for (let index = 0; index < scores.length && remaining > 0; index += 1) {
      if ((scores[index] ?? 0) >= maxPerSlot) {
        continue;
      }

      scores[index] = (scores[index] ?? 0) + 1;
      remaining -= 1;
      changed = true;
    }

    if (!changed) {
      break;
    }
  }

  return scores;
}

function getWeekStartDate(now: Date, weekOffset: number) {
  const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = utcDate.getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  utcDate.setUTCDate(utcDate.getUTCDate() - daysSinceMonday - weekOffset * 7);
  return utcDate.toISOString().slice(0, 10);
}

function getCompletedAt(now: Date, weekStartDate: string) {
  const completedAt = new Date(`${weekStartDate}T15:30:00.000Z`);
  completedAt.setUTCDate(completedAt.getUTCDate() + 4);
  return completedAt > now ? now : completedAt;
}

function createSeedWeeklyCheckinId(userId: string, weekStartDate: string, definitionId: string) {
  const digest = createHash('sha256')
    .update(`${userId}:${weekStartDate}:${definitionId}`)
    .digest('hex')
    .slice(0, 24);
  return `seed_checkin_${digest}`;
}

function getPercent(total: number, max: number) {
  if (max <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((total / max) * 100)));
}
