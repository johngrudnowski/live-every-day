import { colors } from '@led/design-system';

export type WeeklyCheckinScoreTone = 'high' | 'mid' | 'low';

/** Symptom burden as 0–100% of the week's maximum possible total (higher = more symptoms). */
export function normalizeWeeklyCheckinScore(value: number, max: number) {
  if (max <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}

export function getWeeklyCheckinScoreTone(scorePercent: number): WeeklyCheckinScoreTone {
  if (scorePercent >= 80) {
    return 'high';
  }

  if (scorePercent >= 60) {
    return 'mid';
  }

  return 'low';
}

export function getWeeklyCheckinScoreColor(scorePercent: number) {
  const tone = getWeeklyCheckinScoreTone(scorePercent);

  if (tone === 'high') {
    return colors.flagHigh;
  }

  if (tone === 'mid') {
    return colors.sunset;
  }

  return colors.midday;
}

export function getWeeklyCheckinBarColor(scorePercent: number) {
  const tone = getWeeklyCheckinScoreTone(scorePercent);

  if (tone === 'low') {
    return colors.surface;
  }

  return getWeeklyCheckinScoreColor(scorePercent);
}

export function getWeeklyCheckinScoreOpacity(scorePercent: number) {
  if (scorePercent >= 90) {
    return 1;
  }

  if (scorePercent >= 80) {
    return 0.82;
  }

  if (scorePercent >= 70) {
    return 0.8;
  }

  if (scorePercent >= 60) {
    return 0.7;
  }

  return 1;
}

export function formatWeeklyCheckinScore(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

/** e.g. "72%" — burden as % of that check-in's max possible total. */
export function formatWeeklyCheckinBurdenPercent(percent: number) {
  return `${Math.max(0, Math.min(100, Math.round(percent)))}%`;
}

/** e.g. "72 of 100" — raw sum vs max for the same check-in. */
export function formatWeeklyCheckinRawSumLabel(total: number, max: number) {
  return `${formatWeeklyCheckinScore(total)} of ${formatWeeklyCheckinScore(max)}`;
}

/** e.g. "72% (72 of 100)" for single-line summaries. */
export function formatWeeklyCheckinBurdenWithRawParen(percent: number, total: number, max: number) {
  return `${formatWeeklyCheckinBurdenPercent(percent)} (${formatWeeklyCheckinRawSumLabel(total, max)})`;
}
