export type HistoryPeriod = '1D' | '7D' | '4W' | '1Y';

export const historyPeriods: HistoryPeriod[] = ['1D', '7D', '4W', '1Y'];

export type HistoryDateRange = {
  from: string;
  to: string;
};

export function getInitialRange(period: HistoryPeriod, now = new Date()): HistoryDateRange {
  const to = startOfLocalDay(now);
  return getRangeEndingOn(period, to);
}

export function shiftRange(range: HistoryDateRange, period: HistoryPeriod, direction: -1 | 1) {
  const days = getPeriodDays(period);
  const to = parseDate(range.to);
  to.setDate(to.getDate() + days * direction);
  return getRangeEndingOn(period, to);
}

export function isRangeAtOrAfterToday(range: HistoryDateRange, now = new Date()) {
  return parseDate(range.to).getTime() >= startOfLocalDay(now).getTime();
}

export function formatRangeLabel(range: HistoryDateRange, period: HistoryPeriod) {
  const from = parseDate(range.from);
  const to = parseDate(range.to);

  if (period === '1D') {
    return formatDate(from, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return `${formatDate(from, { month: 'short', day: 'numeric' })} - ${formatDate(to, {
    month: 'short',
    day: 'numeric',
    year: from.getFullYear() === to.getFullYear() ? undefined : 'numeric',
  })}`;
}

export function enumerateDates(range: HistoryDateRange) {
  const dates: string[] = [];
  const cursor = parseDate(range.from);
  const end = parseDate(range.to);

  while (cursor.getTime() <= end.getTime()) {
    dates.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

export function formatDateLabel(dateKey: string, compact = false) {
  const date = parseDate(dateKey);
  return formatDate(
    date,
    compact
      ? { month: 'numeric', day: 'numeric' }
      : {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        },
  );
}

export function getPeriodDays(period: HistoryPeriod) {
  if (period === '1D') {
    return 1;
  }

  if (period === '7D') {
    return 7;
  }

  if (period === '4W') {
    return 28;
  }

  return 365;
}

function getRangeEndingOn(period: HistoryPeriod, to: Date): HistoryDateRange {
  const days = getPeriodDays(period);
  const from = new Date(to);
  from.setDate(to.getDate() - days + 1);
  return { from: toDateKey(from), to: toDateKey(to) };
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function formatDate(date: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

export function getRangeIsoBounds(range: HistoryDateRange) {
  return {
    from: `${range.from}T00:00:00.000Z`,
    to: `${range.to}T23:59:59.999Z`,
  };
}
