import type { VitalReading } from '../api/vitals-queries';

export function formatVitalsSummary(reading: VitalReading) {
  const parts: string[] = [];

  if (reading.systolicMmHg != null && reading.diastolicMmHg != null) {
    parts.push(`BP ${reading.systolicMmHg}/${reading.diastolicMmHg}`);
  }

  if (reading.pulseBpm != null) {
    parts.push(`Pulse ${reading.pulseBpm}`);
  }

  if (reading.temperatureF != null) {
    parts.push(`${reading.temperatureF.toFixed(1)} F`);
  }

  if (reading.oxygenSaturationPercent != null) {
    parts.push(`O2 ${reading.oxygenSaturationPercent}%`);
  }

  parts.push(formatRelativeTime(reading.recordedAt));

  return parts.join(' - ');
}

function formatRelativeTime(value: string, now = new Date()) {
  const recordedAt = new Date(value);
  const elapsedMs = now.getTime() - recordedAt.getTime();
  const elapsedMinutes = Math.max(0, Math.round(elapsedMs / 60_000));

  if (elapsedMinutes < 1) {
    return 'just now';
  }

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m ago`;
  }

  const elapsedHours = Math.round(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours}h ago`;
  }

  const elapsedDays = Math.round(elapsedHours / 24);
  return `${elapsedDays}d ago`;
}
