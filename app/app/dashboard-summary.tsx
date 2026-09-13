'use client';

import { Clock3, ArrowUpRight, CalendarCheck2 } from 'lucide-react';
import { ATTENDANCE_STATUSES, attendanceCycleFor, dashboardPeriods, durationLabel, localDateKey, overtimeMinutesFor, parseDateKey, periodSummary, type AttendanceRecord, type LanguageCode } from './lib/domain';
import { copyFor, statusLabel } from './lib/i18n';

export function DashboardSummary({ now, records, language, cycleStartDay, onEdit, onDiary }: {
  now: Date; records: AttendanceRecord[]; language: LanguageCode; cycleStartDay: number;
  onEdit: (date: string) => void; onDiary: () => void;
}) {
  const mr = language === 'mr';
  const copy = copyFor(language);
  const periods = dashboardPeriods(now);
  const today = localDateKey(now);
  const cycle = attendanceCycleFor(now, cycleStartDay);
  const week = periodSummary(records, periods.weekStart, today);
  const month = periodSummary(records, periods.monthStart, today);
  const summary = periodSummary(records, cycle.startKey, today);
  const recent = records.filter(record => record.date <= today).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  const dateRange = (start: string, end: string) => [start, end].map(date => parseDateKey(date).toLocaleDateString(mr ? 'mr-IN' : 'en-IN', { day: 'numeric', month: 'short' })).join(' – ');
  return <section className="dashboard-summary" aria-label={mr ? 'उपस्थिती आणि जादा कामाचा आढावा' : 'Attendance and overtime overview'}>
    <div className="dashboard-metrics">
      <article><CalendarCheck2 size={20} /><span>{mr ? 'या महिन्यात कामाचे दिवस' : 'Days worked this month'}</span><strong>{month.workedDays}<small>{mr ? 'दिवस' : 'days'}</small></strong><small>{dateRange(periods.monthStart, today)}</small></article>
      <article><Clock3 size={20} /><span>{mr ? 'नोंदवलेले पाळीचे तास' : 'Recorded shift time'}</span><strong>{durationLabel(month.regularMinutes, language)}</strong><small>{mr ? 'या महिन्यात · जादा वेळ वेगळा' : 'This month · overtime separate'}</small></article>
      <article className="ot-metric"><Clock3 size={20} /><span>{mr ? 'या आठवड्याचा जादा वेळ' : 'Overtime this week'}</span><strong>{durationLabel(week.overtimeMinutes, language)}</strong><small>{dateRange(periods.weekStart, periods.weekEnd)} · {mr ? 'सोम–रवि' : 'Mon–Sun'}</small></article>
      <article className="ot-metric"><Clock3 size={20} /><span>{mr ? 'या महिन्याचा जादा वेळ' : 'Overtime this month'}</span><strong>{durationLabel(month.overtimeMinutes, language)}</strong><small>{dateRange(periods.monthStart, periods.monthEnd)}</small></article>
    </div>
    <article className="dashboard-panel">
      <header><div><h2>{mr ? 'या कालावधीतील उपस्थिती' : 'Attendance this cycle'}</h2><p>{dateRange(cycle.startKey, cycle.endKey)}</p></div><button type="button" onClick={onDiary}>{copy.diary}<ArrowUpRight size={18} /></button></header>
      <div className="dashboard-status-counts">{ATTENDANCE_STATUSES.map(status => <div key={status.value}><span>{statusLabel(language, status.value)}</span><strong>{summary.counts[status.value]}</strong></div>)}</div>
      <p className="dashboard-caption">{mr ? 'या कालावधीतील जादा वेळ' : 'Overtime this cycle'}: <strong>{durationLabel(summary.overtimeMinutes, language)}</strong></p>
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
