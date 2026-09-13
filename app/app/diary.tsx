'use client';

import { Check, CircleMinus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ATTENDANCE_STATUSES, type AttendanceRecord, type LanguageCode, localDateKey, overtimeMinutesFor, durationLabel } from './lib/domain';
import { copyFor, statusLabel } from './lib/i18n';

type DiaryProps = {
  initialNow: Date;
  records: AttendanceRecord[];
  onEditDate: (dateKey: string) => void;
  language: LanguageCode;
};
const WEEKDAYS = {
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  mr: ['सोम', 'मंगळ', 'बुध', 'गुरु', 'शुक्र', 'शनि', 'रवि'],
};

export function Diary({ initialNow, records, onEditDate, language }: DiaryProps) {
  const copy = copyFor(language);
  const locale = language === 'mr' ? 'mr-IN' : 'en-IN';
  const [month, setMonth] = useState(() => new Date(initialNow.getFullYear(), initialNow.getMonth(), 1, 12));
  const recordMap = useMemo(() => new Map(records.map(record => [record.date, record])), [records]);
  const todayKey = localDateKey(initialNow);
  const offset = (month.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const count = Math.ceil((offset + days) / 7) * 7;
  const monthKey = localDateKey(month).slice(0, 7);
  const marked = records.filter(record => record.date.startsWith(monthKey)).length;

  return (
    <div className="diary-view simple-diary">
      <section className="diary-heading"><div>
        <h1>{copy.attendanceCalendar}</h1>
        <p>{language === 'mr' ? 'पाळी आणि उपस्थिती नोंदवण्यासाठी तारखेवर टॅप करा.' : 'Tap a date to add your shift and attendance.'}</p>
      </div></section>
      <section className="month-card" aria-label={copy.attendanceCalendar}>
        <header className="month-toolbar">
          <button type="button" aria-label={copy.previousMonth} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1, 12))}><ChevronLeft size={20} /></button>
          <div>
            <strong aria-live="polite">{month.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</strong>
            <button type="button" onClick={() => setMonth(new Date(initialNow.getFullYear(), initialNow.getMonth(), 1, 12))}>{copy.today}</button>
          </div>
          <button type="button" aria-label={copy.nextMonth} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1, 12))}><ChevronRight size={20} /></button>
        </header>
        <div className="weekday-row" aria-hidden="true">{WEEKDAYS[language].map(day => <span key={day}>{day}</span>)}</div>
        <div className="calendar-grid">
          {Array.from({ length: count }, (_, index) => {
            const day = index - offset + 1;
            if (day < 1 || day > days) return <span key={index} aria-hidden="true" />;
            const date = new Date(month.getFullYear(), month.getMonth(), day, 12);
            const dateKey = localDateKey(date);
            const record = recordMap.get(dateKey);
            const isWork = record?.status === 'PRESENT' || record?.status === 'HALF_DAY';
            const label = date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            return <button key={dateKey} type="button"
              className={`calendar-day ${dateKey === todayKey ? 'today' : ''} ${record ? `has-${record.status.toLowerCase()}` : ''}`}
              aria-current={dateKey === todayKey ? 'date' : undefined}
              aria-label={`${label}, ${record ? statusLabel(language, record.status) + (isWork ? `, ${copy.shift} ${record.shiftCode}` : '') : copy.notMarked}`}
              onClick={() => onEditDate(dateKey)}>
              <span className="day-number">{day.toLocaleString(locale)}</span>
              <span className="calendar-entry" title={record ? statusLabel(language, record.status) : undefined}>
                {record ? isWork ? <><span className="calendar-work-icon" aria-hidden="true">{record.status === 'PRESENT' ? <Check size={14} /> : <CircleMinus size={14} />}</span><span>{copy.shift} {record.shiftCode}</span></> : <span className="calendar-status-word">{statusLabel(language, record.status)}</span> : null}
              </span>
              {record && overtimeMinutesFor(record) > 0 ? <span className="calendar-ot" title={durationLabel(overtimeMinutesFor(record), language)}>+ OT</span> : null}
            </button>;
          })}
        </div>
        <footer className="simple-calendar-footer">{marked} {copy.daysMarked}</footer>
      </section>
      <div className="simple-calendar-key" aria-label={copy.status}>
        {ATTENDANCE_STATUSES.map(status => <span key={status.value}><b className={`key-${status.value.toLowerCase()}`}>{status.short}</b>{statusLabel(language, status.value)}</span>)}
      </div>
    </div>
  );
}
