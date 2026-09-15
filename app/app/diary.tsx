'use client';

import { ChevronLeft, ChevronRight, Clock3, PencilLine } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ATTENDANCE_STATUSES, type AttendanceRecord, type LanguageCode, localDateKey, overtimeMinutesFor, durationLabel, parseDateKey } from './lib/domain';
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
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const selectedRecord = recordMap.get(selectedDate);
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
              className={`calendar-day ${dateKey === todayKey ? 'today' : ''} ${dateKey === selectedDate ? 'selected-date' : ''} ${record ? `has-${record.status.toLowerCase()}` : ''}`}
              aria-pressed={dateKey === selectedDate}
              aria-current={dateKey === todayKey ? 'date' : undefined}
              aria-label={`${label}, ${record ? statusLabel(language, record.status) + (isWork ? `, ${copy.shift} ${record.shiftCode}` : '') + (overtimeMinutesFor(record) > 0 ? `, OT ${durationLabel(overtimeMinutesFor(record), language)}` : '') : copy.notMarked}`}
              onClick={() => { setSelectedDate(dateKey); onEditDate(dateKey); }}>
              <span className="day-number">{day.toLocaleString(locale)}</span>
              <span className="calendar-entry" title={record ? statusLabel(language, record.status) : undefined}>
                {record ? <span className="calendar-status-word">{isWork ? `${record.status === 'PRESENT' ? 'P' : '½'} · ${record.shiftCode}` : record.status === 'WEEKLY_OFF' ? 'W' : record.status === 'ABSENT' ? 'A' : record.status === 'LEAVE' ? 'L' : 'H'}</span> : null}
              </span>
              {record && overtimeMinutesFor(record) > 0 ? <span className="calendar-ot" title={`OT · ${durationLabel(overtimeMinutesFor(record), language)}`}>OT</span> : null}
            </button>;
          })}
        </div>
        <footer className="simple-calendar-footer">{marked} {copy.daysMarked}</footer>
      </section>
      <div className="simple-calendar-key" aria-label={copy.status}>
        {ATTENDANCE_STATUSES.filter(status => !['HALF_DAY', 'HOLIDAY'].includes(status.value)).map(status => <span key={status.value}><b className={`key-${status.value.toLowerCase()}`}>{status.short}</b>{statusLabel(language, status.value)}</span>)}
        <span><b className="key-ot">OT</b>{language === 'mr' ? 'जादा वेळ' : 'Overtime'}</span>
        <span className="shift-key"><b>B</b>{language === 'mr' ? 'पाळी (A / B / C / G)' : 'Shift (A / B / C / G)'}</span>
      </div>
      <article className="diary-entry-card">
        <header><h2>{parseDateKey(selectedDate).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</h2><span>{selectedRecord ? statusLabel(language, selectedRecord.status) : copy.notMarked}</span></header>
        {selectedRecord ? <>
          <p><Clock3 size={20} />{copy.shift} {selectedRecord.shiftCode} · {selectedRecord.shiftStartTime}–{selectedRecord.shiftEndTime}</p>
          {selectedRecord.checkIn ? <p>{copy.checkIn}: {selectedRecord.checkIn} · {copy.checkOut}: {selectedRecord.checkOut || '—'}</p> : null}
          {overtimeMinutesFor(selectedRecord) > 0 ? <p className="day-overtime">OT · {durationLabel(overtimeMinutesFor(selectedRecord), language)}</p> : null}
          {selectedRecord.note ? <blockquote>{selectedRecord.note}</blockquote> : null}
        </> : <p>{language === 'mr' ? 'या दिवसाची उपस्थिती नोंदवा.' : 'Add your attendance for this day.'}</p>}
        <button type="button" onClick={() => onEditDate(selectedDate)}><PencilLine size={18} />{selectedRecord ? copy.edit : copy.markAttendance}</button>
      </article>
    </div>
  );
}
