'use client';

import { BarChart3, Clock3, PieChart } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  ATTENDANCE_STATUSES,
  attendanceCycleFor,
  type AttendanceRecord,
  type LanguageCode,
  workedMinutes,
} from './lib/domain';
import { copyFor, statusLabel } from './lib/i18n';

export function Insights({
  initialNow,
  records,
  cycleStartDay,
  language,
}: {
  initialNow: Date;
  records: AttendanceRecord[];
  cycleStartDay: number;
  language: LanguageCode;
}) {
  const [period, setPeriod] = useState<'current' | 'previous'>('current');
  const copy = copyFor(language);
  const cycle = useMemo(
    () => attendanceCycleFor(initialNow, cycleStartDay, period === 'current' ? 0 : -1),
    [cycleStartDay, initialNow, period],
  );
  const selected = useMemo(
    () => records.filter((record) => record.date >= cycle.startKey && record.date <= cycle.endKey),
    [cycle.endKey, cycle.startKey, records],
  );
  const statusCounts = ATTENDANCE_STATUSES.map((status) => ({
    ...status,
    count: selected.filter((record) => record.status === status.value).length,
  }));
  const hours = selected.reduce(
    (total, record) => total + workedMinutes(record.checkIn, record.checkOut),
    0,
  ) / 60;
  const shiftCounts = ['A', 'B', 'C', 'G'].map((code) => ({
    code,
    count: selected.filter((record) => record.shiftCode === code).length,
  }));

  return (
    <section className="insights-view screen-view">
      <header className="screen-title">
        <span className="eyebrow">{copy.insights}</span>
        <h1>{copy.insightsTitle}</h1>
        <p>{copy.insightsHelper}</p>
      </header>
      <div className="period-switch" role="group" aria-label="Report period">
        {(['current', 'previous'] as const).map((value) => (
          <button key={value} className={period === value ? 'active' : ''} type="button" onClick={() => setPeriod(value)}>
            {copy[value]}
          </button>
        ))}
      </div>
      <p className="period-label">{cycle.label}</p>
      <div className="metric-grid">
        <article><BarChart3 /><span>{copy.totalMarked}</span><strong>{selected.length}</strong></article>
        <article><Clock3 /><span>{copy.workedTime}</span><strong>{hours.toFixed(1)} <small>{copy.hours}</small></strong></article>
      </div>
      {selected.length === 0 ? <div className="empty-panel">{copy.noRecordsYet}</div> : (
        <>
          <article className="breakdown-card">
            <div className="card-heading"><PieChart /><h2>{copy.attendanceBreakdown}</h2></div>
            <div className="breakdown-list">
              {statusCounts.map((item) => (
                <div className="breakdown-row" key={item.value}>
                  <span>{statusLabel(language, item.value)}</span>
                  <div className="bar-track"><i style={{ width: `${selected.length ? item.count / selected.length * 100 : 0}%` }} /></div>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
          </article>
          <article className="breakdown-card">
            <h2>{copy.shiftDistribution}</h2>
            <div className="shift-counts">
              {shiftCounts.map((item) => <div key={item.code}><span>{item.code}</span><strong>{item.count}</strong></div>)}
            </div>
          </article>
        </>
      )}
    </section>
  );
}
