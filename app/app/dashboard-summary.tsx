'use client';
import { useState } from 'react';
import { Check, X, CalendarDays, Flag, Clock3 } from 'lucide-react';
import { dashboardPeriods, durationLabel, localDateKey, parseDateKey, periodSummary, type AttendanceRecord, type LanguageCode } from './lib/domain';
import { statusLabel } from './lib/i18n';

export function DashboardSummary({ now, records, language }: { now: Date; records: AttendanceRecord[]; language: LanguageCode }) {
  const [period, setPeriod] = useState<'week' | 'month'>('month');
  const mr = language === 'mr';
  const dates = dashboardPeriods(now);
  const today = localDateKey(now);
  const start = period === 'month' ? dates.monthStart : dates.weekStart;
  const summary = periodSummary(records, start, today);
  const week = periodSummary(records, dates.weekStart, today);
  const month = periodSummary(records, dates.monthStart, today);
  const rows = [
    { status: 'PRESENT' as const, count: summary.counts.PRESENT, color: '#46543d', Icon: Check },
    { status: 'ABSENT' as const, count: summary.counts.ABSENT, color: '#ba1a1a', Icon: X },
    { status: 'WEEKLY_OFF' as const, count: summary.counts.WEEKLY_OFF, color: '#4a6176', Icon: CalendarDays },
    { status: 'LEAVE' as const, count: summary.counts.LEAVE, color: '#6c4298', Icon: Flag },
  ];
  const legacy = summary.marked - rows.reduce((sum, row) => sum + row.count, 0);
  let cursor = 0;
  const segments = [...rows, { count: legacy, color: '#af9152' }].filter(row => row.count > 0).map(row => {
    const begin = cursor; cursor += row.count / summary.marked * 100;
    return `${row.color} ${begin}% ${cursor}%`;
  });
  const range = (from: string) => [from, today].map(date => parseDateKey(date).toLocaleDateString(mr ? 'mr-IN' : 'en-IN', { day: 'numeric', month: 'short' })).join(' – ');
  return <section className="ledger-summary" aria-label={mr ? 'उपस्थितीचा आढावा' : 'Attendance summary'}>
    <h2>{mr ? 'तुमचा आढावा' : 'Your summary'}</h2>
    <div className="dashboard-period-switch" role="group" aria-label={mr ? 'कालावधी' : 'Summary period'}>
      <button type="button" aria-pressed={period === 'month'} onClick={() => setPeriod('month')}>{mr ? 'हा महिना' : 'This month'}</button>
      <button type="button" aria-pressed={period === 'week'} onClick={() => setPeriod('week')}>{mr ? 'हा आठवडा' : 'This week'}</button>
    </div>
    <p className="ledger-range">{range(start)} · {mr ? 'आजपर्यंत' : 'Through today'}</p>
    <div className="attendance-donut" role="img" aria-label={`${summary.marked} ${mr ? 'नोंदवलेले दिवस' : 'days recorded'}`} style={{ background: segments.length ? `conic-gradient(${segments.join(',')})` : '#eeefe2' }}><div><strong>{summary.marked}</strong><span>{mr ? 'नोंदवलेले दिवस' : 'Days recorded'}</span></div></div>
    <p className="chart-note">{mr ? 'नोंद नसलेले दिवस गैरहजर धरले जात नाहीत.' : 'Unmarked days are not counted as absent.'}</p>
    <div className="ledger-counts">{rows.map(({ status, count, color, Icon }) => <article key={status} style={{ color }}><Icon size={22} aria-hidden="true" /><div><span>{statusLabel(language, status)}</span><strong>{count} <small>{mr ? 'दिवस' : count === 1 ? 'day' : 'days'}</small></strong></div></article>)}</div>
    {legacy > 0 ? <p className="ledger-range">{mr ? 'जुन्या नोंदी' : 'Existing records'}: {summary.counts.HALF_DAY} {statusLabel(language, 'HALF_DAY')} · {summary.counts.HOLIDAY} {statusLabel(language, 'HOLIDAY')}</p> : null}
    <div className="ledger-overtime"><h3><Clock3 size={20} />{mr ? 'नोंदवलेला जादा वेळ' : 'Overtime recorded'}</h3><div>
      <article><span>{mr ? 'या महिन्यात' : 'This month'}</span><strong>{durationLabel(month.overtimeMinutes, language)}</strong><small>{range(dates.monthStart)}</small></article>
      <article><span>{mr ? 'या आठवड्यात' : 'This week'}</span><strong>{durationLabel(week.overtimeMinutes, language)}</strong><small>{range(dates.weekStart)}</small></article>
    </div></div>
  </section>;
}
