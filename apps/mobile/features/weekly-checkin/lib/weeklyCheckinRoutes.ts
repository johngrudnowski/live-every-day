import { router } from 'expo-router';
import type { WeeklyCheckinSummary } from '../api/weekly-checkin-queries';

export function routeToWeeklyCheckin(summary: WeeklyCheckinSummary | undefined) {
  if (summary?.hasCompletedCurrentWeek) {
    router.push('/check-in/saved');
    return;
  }

  router.push('/check-in');
}

export function routeToQuestion(questionIndex: number) {
  router.push({
    pathname: '/check-in/question',
    params: { index: String(questionIndex) },
  });
}

export function routeToSaved(justCompleted = false) {
  router.replace({
    pathname: '/check-in/saved',
    params: justCompleted ? { justCompleted: '1' } : {},
  });
}
