import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, lt } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import type { DbClient } from 'database/client';
import { weeklyCheckins } from 'database/schema';
import { DB_CLIENT } from '../database/database.constants';
import type {
  SaveWeeklyCheckinDraftDto,
  SubmitWeeklyCheckinDto,
} from './dto/save-weekly-checkin.dto';
import {
  activeWeeklyCheckinDefinition,
  type WeeklyCheckinDefinition,
  type WeeklyCheckinQuestion,
} from './weekly-checkin.definition';

type WeeklyCheckinRow = typeof weeklyCheckins.$inferSelect;
type CheckinStatus = 'draft' | 'submitted';

@Injectable()
export class WeeklyCheckinsService {
  constructor(@Inject(DB_CLIENT) private readonly db: DbClient) {}

  async getSummary(userId: string) {
    const definition = activeWeeklyCheckinDefinition;
    const weekStartDate = getCurrentWeekStartDate();
    const [currentCheckin, lastSubmittedCheckin, previousWeekCheckin, recentSubmittedCheckins] =
      await Promise.all([
        this.getCurrentCheckinRow(userId, definition.id, weekStartDate),
        this.getLastSubmittedCheckinRow(userId),
        this.getPreviousWeekCheckinRow(userId, weekStartDate),
        this.getRecentSubmittedCheckinRows(userId, 8),
      ]);
    const hasCompletedCurrentWeek = currentCheckin?.status === 'submitted';

    return {
      weekStartDate,
      activeDefinition: definition,
      currentCheckin: currentCheckin ? mapCheckinRow(currentCheckin) : null,
      lastSubmittedCheckin: lastSubmittedCheckin ? mapCheckinRow(lastSubmittedCheckin) : null,
      previousWeekCheckin: previousWeekCheckin ? mapCheckinRow(previousWeekCheckin) : null,
      recentSubmittedCheckins: recentSubmittedCheckins.map(mapCheckinRow),
      hasCompletedCurrentWeek,
      shouldStartCheckin: !hasCompletedCurrentWeek,
    };
  }

  async getCurrent(userId: string) {
    const definition = activeWeeklyCheckinDefinition;
    const weekStartDate = getCurrentWeekStartDate();
    const [currentCheckin, recentSubmittedCheckins] = await Promise.all([
      this.getCurrentCheckinRow(userId, definition.id, weekStartDate),
      this.getRecentSubmittedCheckinRows(userId, 8),
    ]);

    return {
      weekStartDate,
      activeDefinition: definition,
      currentCheckin: currentCheckin ? mapCheckinRow(currentCheckin) : null,
      lastSubmittedCheckin: null,
      previousWeekCheckin: null,
      recentSubmittedCheckins: recentSubmittedCheckins.map(mapCheckinRow),
      hasCompletedCurrentWeek: currentCheckin?.status === 'submitted',
      shouldStartCheckin: currentCheckin?.status !== 'submitted',
    };
  }

  async getCheckin(userId: string, checkinId: string) {
    const [row] = await this.db
      .select()
      .from(weeklyCheckins)
      .where(and(eq(weeklyCheckins.userId, userId), eq(weeklyCheckins.id, checkinId)))
      .limit(1);

    if (!row) {
      throw new NotFoundException('Weekly check-in not found.');
    }

    return mapCheckinRow(row);
  }

  async getHistory(userId: string) {
    const rows = await this.db
      .select()
      .from(weeklyCheckins)
      .where(and(eq(weeklyCheckins.userId, userId), eq(weeklyCheckins.status, 'submitted')))
      .orderBy(desc(weeklyCheckins.weekStartDate));

    return rows.map(mapCheckinRow);
  }

  async saveDraft(userId: string, dto: SaveWeeklyCheckinDraftDto) {
    const definition = activeWeeklyCheckinDefinition;
    const answers = this.validateAnswers(definition, dto.answers, {
      requireRequiredAnswers: false,
    });
    const score = calculateScore(definition, answers);
    const weekStartDate = getCurrentWeekStartDate();
    const existing = await this.getCurrentCheckinRow(userId, definition.id, weekStartDate);
    const customNote =
      dto.customNote === undefined ? (existing?.customNote ?? null) : dto.customNote.trim() || null;

    if (existing?.status === 'submitted') {
      return await this.getSummary(userId);
    }

    await this.upsertCheckin({
      userId,
      definition,
      weekStartDate,
      status: 'draft',
      answers,
      score,
      customNote,
      completedAt: null,
    });

    return await this.getSummary(userId);
  }

  async submit(userId: string, dto: SubmitWeeklyCheckinDto) {
    const definition = activeWeeklyCheckinDefinition;
    const answers = this.validateAnswers(definition, dto.answers, { requireRequiredAnswers: true });
    const score = calculateScore(definition, answers);
    const weekStartDate = getCurrentWeekStartDate();
    const now = new Date();

    await this.upsertCheckin({
      userId,
      definition,
      weekStartDate,
      status: 'submitted',
      answers,
      score,
      customNote: dto.customNote?.trim() || null,
      completedAt: now,
    });

    return await this.getSummary(userId);
  }

  async updateCheckin(userId: string, checkinId: string, dto: SubmitWeeklyCheckinDto) {
    const existing = await this.getCheckinRow(userId, checkinId);

    if (!existing) {
      throw new NotFoundException('Weekly check-in not found.');
    }

    const definition = activeWeeklyCheckinDefinition;

    if (existing.definitionId !== definition.id) {
      throw new BadRequestException('Weekly check-in definition does not match.');
    }

    const answers = this.validateAnswers(definition, dto.answers, { requireRequiredAnswers: true });
    const score = calculateScore(definition, answers);
    const customNote =
      dto.customNote === undefined ? existing.customNote : dto.customNote.trim() || null;
    const now = new Date();

    const [updated] = await this.db
      .update(weeklyCheckins)
      .set({
        conditionId: definition.conditionId,
        answersJson: answers,
        scoreJson: score,
        customNote,
        updatedAt: now,
      })
      .where(and(eq(weeklyCheckins.userId, userId), eq(weeklyCheckins.id, checkinId)))
      .returning();

    return mapCheckinRow(updated);
  }

  private validateAnswers(
    definition: WeeklyCheckinDefinition,
    answers: Record<string, unknown>,
    options: { requireRequiredAnswers: boolean },
  ) {
    if (!isRecord(answers)) {
      throw new BadRequestException('Weekly check-in answers are invalid.');
    }

    const answerableQuestions = [...definition.questions, ...definition.deeperPrompts];
    const questionById = new Map(answerableQuestions.map((question) => [question.id, question]));
    const validAnswers: Record<string, unknown> = {};

    for (const [questionId, value] of Object.entries(answers)) {
      const question = questionById.get(questionId);
      if (!question || isEmptyAnswer(value)) {
        continue;
      }

      validAnswers[questionId] = validateAnswerValue(question, value);
    }

    if (options.requireRequiredAnswers) {
      const missingQuestion = definition.questions.find(
        (question) => question.required && isEmptyAnswer(validAnswers[question.id]),
      );

      if (missingQuestion) {
        throw new BadRequestException(`${missingQuestion.title} is required.`);
      }
    }

    return validAnswers;
  }

  private async getCurrentCheckinRow(userId: string, definitionId: string, weekStartDate: string) {
    const [row] = await this.db
      .select()
      .from(weeklyCheckins)
      .where(
        and(
          eq(weeklyCheckins.userId, userId),
          eq(weeklyCheckins.definitionId, definitionId),
          eq(weeklyCheckins.weekStartDate, weekStartDate),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  private async getCheckinRow(userId: string, checkinId: string) {
    const [row] = await this.db
      .select()
      .from(weeklyCheckins)
      .where(and(eq(weeklyCheckins.userId, userId), eq(weeklyCheckins.id, checkinId)))
      .limit(1);

    return row ?? null;
  }

  private async getLastSubmittedCheckinRow(userId: string) {
    const [row] = await this.db
      .select()
      .from(weeklyCheckins)
      .where(and(eq(weeklyCheckins.userId, userId), eq(weeklyCheckins.status, 'submitted')))
      .orderBy(desc(weeklyCheckins.weekStartDate))
      .limit(1);

    return row ?? null;
  }

  private async getPreviousWeekCheckinRow(userId: string, weekStartDate: string) {
    const [row] = await this.db
      .select()
      .from(weeklyCheckins)
      .where(
        and(
          eq(weeklyCheckins.userId, userId),
          eq(weeklyCheckins.status, 'submitted'),
          lt(weeklyCheckins.weekStartDate, weekStartDate),
        ),
      )
      .orderBy(desc(weeklyCheckins.weekStartDate))
      .limit(1);

    return row ?? null;
  }

  private async getRecentSubmittedCheckinRows(userId: string, limit: number) {
    const rows = await this.db
      .select()
      .from(weeklyCheckins)
      .where(and(eq(weeklyCheckins.userId, userId), eq(weeklyCheckins.status, 'submitted')))
      .orderBy(desc(weeklyCheckins.weekStartDate))
      .limit(limit);

    return rows.reverse();
  }

  private async upsertCheckin({
    userId,
    definition,
    weekStartDate,
    status,
    answers,
    score,
    customNote,
    completedAt,
  }: {
    userId: string;
    definition: WeeklyCheckinDefinition;
    weekStartDate: string;
    status: CheckinStatus;
    answers: Record<string, unknown>;
    score: WeeklyCheckinScore;
    customNote: string | null;
    completedAt: Date | null;
  }) {
    const now = new Date();

    await this.db
      .insert(weeklyCheckins)
      .values({
        id: randomUUID(),
        userId,
        definitionId: definition.id,
        conditionId: definition.conditionId,
        weekStartDate,
        status,
        answersJson: answers,
        scoreJson: score,
        customNote,
        completedAt,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [weeklyCheckins.userId, weeklyCheckins.weekStartDate, weeklyCheckins.definitionId],
        set: {
          conditionId: definition.conditionId,
          status,
          answersJson: answers,
          scoreJson: score,
          customNote,
          completedAt,
          updatedAt: now,
        },
      });
  }
}

type WeeklyCheckinScore = {
  total: number;
  max: number;
  numericTotal: number;
  enumTotal: number;
  percent: number;
};

function validateAnswerValue(question: WeeklyCheckinQuestion, value: unknown) {
  if (question.kind === 'number_scale') {
    if (typeof value !== 'number' || !Number.isInteger(value)) {
      throw new BadRequestException(`${question.title} must be a whole number.`);
    }

    if (value < question.min || value > question.max) {
      throw new BadRequestException(
        `${question.title} must be between ${question.min} and ${question.max}.`,
      );
    }

    return value;
  }

  if (question.kind === 'enum') {
    if (typeof value !== 'string' || !question.options.some((option) => option.value === value)) {
      throw new BadRequestException(`${question.title} has an unknown option.`);
    }

    return value;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException(`${question.title} must be text.`);
  }

  return value.trim();
}

function calculateScore(
  definition: WeeklyCheckinDefinition,
  answers: Record<string, unknown>,
): WeeklyCheckinScore {
  let numericTotal = 0;
  let enumTotal = 0;
  let max = 0;

  for (const question of definition.questions) {
    if (question.kind === 'number_scale') {
      max += question.max;
      const value = answers[question.id];
      if (typeof value === 'number') {
        numericTotal += value;
      }
      continue;
    }

    if (question.kind === 'enum') {
      const highestOptionScore = Math.max(...question.options.map((option) => option.score));
      max += highestOptionScore;
      const value = answers[question.id];
      const option = question.options.find((item) => item.value === value);
      enumTotal += option?.score ?? 0;
    }
  }

  return {
    total: numericTotal + enumTotal,
    max,
    numericTotal,
    enumTotal,
    percent: calculateScorePercent(numericTotal + enumTotal, max),
  };
}

function mapCheckinRow(row: WeeklyCheckinRow) {
  const rawScore = row.scoreJson as Partial<WeeklyCheckinScore>;
  const score: WeeklyCheckinScore = {
    total: rawScore.total ?? 0,
    max: rawScore.max ?? 0,
    numericTotal: rawScore.numericTotal ?? 0,
    enumTotal: rawScore.enumTotal ?? 0,
    percent: calculateScorePercent(rawScore.total ?? 0, rawScore.max ?? 0),
  };

  return {
    id: row.id,
    definitionId: row.definitionId,
    conditionId: row.conditionId,
    weekStartDate: row.weekStartDate,
    status: row.status,
    answers: row.answersJson as Record<string, unknown>,
    score: {
      ...score,
      percent: rawScore.percent ?? score.percent,
    },
    customNote: row.customNote,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function calculateScorePercent(total: number, max: number) {
  if (max <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((total / max) * 100)));
}

function getCurrentWeekStartDate(date = new Date()) {
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utcDate.getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  utcDate.setUTCDate(utcDate.getUTCDate() - daysSinceMonday);
  return utcDate.toISOString().slice(0, 10);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isEmptyAnswer(value: unknown) {
  return value === undefined || value === null || value === '';
}
