// timeFormat.ts
export type TimeFormatMode = '12hr' | '24hr';

export function getUserTimeFormatMode(): TimeFormatMode {
  try {
    const opts = Intl.DateTimeFormat().resolvedOptions() as any;
    if (typeof opts.hour12 === 'boolean') return opts.hour12 ? '12hr' : '24hr';
    if (typeof opts.hourCycle === 'string') {
      const hc = String(opts.hourCycle);
      if (hc === 'h12' || hc === 'h11') return '12hr';
      if (hc === 'h23' || hc === 'h24') return '24hr';
    }
    // Fallback: inspect parts for dayPeriod (AM/PM) presence
    const parts = new Intl.DateTimeFormat(undefined, { hour: 'numeric' })
      .formatToParts(new Date(Date.UTC(2020, 0, 1, 13)));
    const hasDayPeriod = parts.some(p => p.type === 'dayPeriod');
    return hasDayPeriod ? '12hr' : '24hr';
  } catch {
    return '24hr';
  }
}

export function getDefaultTimeFormatPattern(): string {
  // dayjs format tokens
  return getUserTimeFormatMode() === '12hr' ? 'h:mm A' : 'HH:mm';
}