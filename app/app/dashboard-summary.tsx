'use client';

import { Clock3, ArrowUpRight, CalendarCheck2 } from 'lucide-react';
import { useState } from 'react';
import { ATTENDANCE_STATUSES, dashboardPeriods, durationLabel, localDateKey, overtimeMinutesFor, parseDateKey, periodSummary, type AttendanceRecord, type LanguageCode } from './lib/domain';
import { copyFor, statusLabel } from './lib/i18n';

export function DashboardSummary({ now, records, language, onEdit, onDiary }: {
  now: Date; records: AttendanceRecord[]; language: LanguageCode;
  onEdit: (date: string) => void; onDiary: () => void;
}) {
  const mr = language === 'mr';
  const [period, setPeriod] = useState<'week' | 'month'>('month');
  const copy = copyFor(language);
  const periods = dashboardPeriods(now);
  const today = localDateKey(now);
  const start = period === 'week' ? periods.weekStart : periods.monthStart;
  const summary = periodSummary(records, start, today);
  const recent = records.filter(record => record.date >= start && record.date <= today).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  const dateRange = (start: string, end: string) => [start, end].map(date => parseDateKey(date).toLocaleDateString(mr ? 'mr-IN' : 'en-IN', { day: 'numeric', month: 'short' })).join(' – ');
  return <section className="dashboard-summary" aria-label={mr ? 'उपस्थिती आणि जादा कामाचा आढावा' : 'Attendance and overtime overview'}>
    <header className="dashboard-period">
      <h2>{mr ? 'तुमचा आढावा' : 'Your summary'}</h2>
      <div className="dashboard-period-switch" role="group" aria-label={mr ? 'कालावधी निवडा' : 'Summary period'}>
        <button type="button" aria-pressed={period === 'week'} onClick={() => setPeriod('week')}>{mr ? 'हा आठवडा' : 'This week'}</button>
        <button type="button" aria-pressed={period === 'month'} onClick={() => setPeriod('month')}>{mr ? 'हा महिना' : 'This month'}</button>
      </div>
      <p>{dateRange(start, today)} · {mr ? 'आजपर्यंत' : 'Through today'}</p>
    </header>
    <div className="dashboard-metrics">
      <article><CalendarCheck2 size={20} /><span>{mr ? 'उपस्थित दिवस' : 'Days attended'}</span><strong>{summary.workedDays}<small>{mr ? 'दिवस' : 'days'}</small></strong><small>{mr ? 'अर्ध्या दिवसांच्या नोंदींसह' : 'Includes half-day entries'}</small></article>
      <article className="ot-metric"><Clock3 size={20} /><span>{mr ? 'जादा कामाचा वेळ' : 'Overtime'}</span><strong>{durationLabel(summary.overtimeMinutes, language)}</strong><small>{mr ? 'तुम्ही नोंदवलेला जादा वेळ' : 'Extra time you have logged'}</small></article>
    </div>
    <article className="dashboard-panel">
      <header><div><h2>{mr ? 'उपस्थितीचा तपशील' : 'Attendance breakdown'}</h2><p>{mr ? 'निवडलेल्या कालावधीतील नोंदी' : 'Entries in the selected period'}</p></div><button type="button" onClick={onDiary}>{copy.diary}<ArrowUpRight size={18} /></button></header>
      <div className="dashboard-status-counts">{ATTENDANCE_STATUSES.map(status => <div key={status.value}><span>{statusLabel(language, status.value)}</span><strong>{summary.counts[status.value]}</strong></div>)}</div>
    </article>
    <article className="dashboard-panel">
      <header><h2>{mr ? 'अलीकडील नोंदी' : 'Recent entries'}</h2><button type="button" onClick={onDiary}>{mr ? 'सर्व पहा' : 'View all'}<ArrowUpRight size={18} /></button></header>
      {recent.length ? recent.map(record => <button className="recent-entry" type="button" key={record.id} onClick={() => onEdit(record.date)}>
        <span><strong>{parseDateKey(record.date).toLocaleDateString(mr ? 'mr-IN' : 'en-IN', { day: 'numeric', month: 'short' })}</strong><small>{statusLabel(language, record.status)}{record.status === 'PRESENT' || record.status === 'HALF_DAY' ? ` · ${copy.shift} ${record.shiftCode}` : ''}</small></span>
        <span>{overtimeMinutesFor(record) ? <strong>+{durationLabel(overtimeMinutesFor(record), language)} OT</strong> : <small>{copy.edit}</small>}<ArrowUpRight size={16} /></span>
      </button>) : <p className="dashboard-caption">{copy.noRecordsYet}</p>}
    </article>
  </section>;
}
