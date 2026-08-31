'use client';

import {
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  PencilLine,
  Repeat2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  ATTENDANCE_STATUSES,
  type AppSettings,
  type AttendanceRecord,
  type LanguageCode,
  localDateKey,
  parseDateKey,
  plannedShiftForDate,
  type RotationPlan,
  type ShiftConfig,
} from './lib/domain';
import { copyFor, statusLabel } from './lib/i18n';

type DiaryProps = {
  initialNow: Date;
  records: AttendanceRecord[];
  settings: AppSettings;
  shifts: ShiftConfig[];
  rotationPlan: RotationPlan;
  onEditDate: (dateKey: string) => void;
  onOpenPlanner: () => void;
  language: LanguageCode;
};

const WEEKDAY_LABELS = {
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  mr: ['सोम', 'मंगळ', 'बुध', 'गुरु', 'शुक्र', 'शनि', 'रवि'],
};

function monthCells(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  const mondayOffset = (first.getDay() + 6) % 7;
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

export function Diary({
  initialNow,
  records,
  settings,
  shifts,
  rotationPlan,
  onEditDate,
  onOpenPlanner,
  language,
}: DiaryProps) {
  const copy = copyFor(language);
  const locale = language === 'mr' ? 'mr-IN' : 'en-IN';
  const [month, setMonth] = useState(
    () => new Date(initialNow.getFullYear(), initialNow.getMonth(), 1, 12),
  );
  const [selectedDate, setSelectedDate] = useState(() => localDateKey(initialNow));
  const recordMap = useMemo(
    () => new Map(records.map((record) => [record.date, record])),
    [records],
  );
  const shiftMap = useMemo(
    () => new Map(shifts.map((shift) => [shift.code, shift])),
    [shifts],
  );
  const cells = useMemo(() => monthCells(month), [month]);
  const todayKey = localDateKey(initialNow);
  const selectedRecord = recordMap.get(selectedDate);
  const selectedPlannedShift = plannedShiftForDate(
    selectedDate,
    rotationPlan,
    settings.weeklyOff,
  );
  const selectedShift = selectedPlannedShift
    ? shiftMap.get(selectedPlannedShift)
    : undefined;
  const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
  const monthRecords = records.filter((record) => record.date.startsWith(monthKey));
  const presentCount = monthRecords.filter((record) => record.status === 'PRESENT').length;
  const leaveCount = monthRecords.filter((record) =>
    ['LEAVE', 'HOLIDAY', 'WEEKLY_OFF'].includes(record.status),
  ).length;

  function changeMonth(offset: number) {
    setMonth((current) =>
      new Date(current.getFullYear(), current.getMonth() + offset, 1, 12),
    );
  }

  function jumpToToday() {
    setMonth(new Date(initialNow.getFullYear(), initialNow.getMonth(), 1, 12));
    setSelectedDate(todayKey);
  }

  return (
    <div className="diary-view">
      <section className="diary-heading">
        <div>
          <span className="eyebrow">{copy.pocketDiary}</span>
          <h1>{copy.attendanceCalendar}</h1>
          <p>{copy.actualAndPlanned}</p>
        </div>
        <button className="planner-button" type="button" onClick={onOpenPlanner}>
          <Repeat2 size={18} /> {copy.rotation}
        </button>
      </section>

      <section className="month-card" aria-label="Monthly attendance calendar">
        <header className="month-toolbar">
          <button type="button" onClick={() => changeMonth(-1)} aria-label={copy.previousMonth}>
            <ChevronLeft size={20} />
          </button>
          <div>
            <strong>{month.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</strong>
            <button type="button" onClick={jumpToToday}>{copy.today}</button>
          </div>
          <button type="button" onClick={() => changeMonth(1)} aria-label={copy.nextMonth}>
            <ChevronRight size={20} />
          </button>
        </header>

        <div className="weekday-row" aria-hidden="true">
          {WEEKDAY_LABELS[language].map((day) => <span key={day}>{day}</span>)}
        </div>

        <div className="calendar-grid">
          {cells.map((date) => {
            const dateKey = localDateKey(date);
            const record = recordMap.get(dateKey);
            const status = ATTENDANCE_STATUSES.find((item) => item.value === record?.status);
            const plannedShift = plannedShiftForDate(dateKey, rotationPlan, settings.weeklyOff);
            const isWeeklyOff = date.getDay() === settings.weeklyOff;
            const isOutsideMonth = date.getMonth() !== month.getMonth();
            const label = date.toLocaleDateString(locale, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            });

            return (
              <button
                className={`calendar-day ${isOutsideMonth ? 'outside' : ''} ${dateKey === todayKey ? 'today' : ''} ${dateKey === selectedDate ? 'selected' : ''} ${record ? `has-${record.status.toLowerCase()}` : ''}`}
                key={dateKey}
                type="button"
                aria-label={`${label}${status ? `, ${statusLabel(language, status.value)}` : ''}${plannedShift ? `, ${copy.plannedShift} ${plannedShift}` : ''}`}
                aria-pressed={dateKey === selectedDate}
                onClick={() => setSelectedDate(dateKey)}
              >
                <span className="day-number">{date.getDate()}</span>
                <span className="day-markers">
                  {record ? <b>{status?.short}</b> : null}
                  <i>{isWeeklyOff ? 'W' : plannedShift}</i>
                </span>
              </button>
            );
          })}
        </div>

        <footer className="calendar-legend">
          <span><i className="actual-dot" /> {copy.actual}</span>
          <span><i className="plan-dot" /> {copy.plannedShift}</span>
          <span>{monthRecords.length} {copy.daysMarked}</span>
        </footer>
      </section>

      <section className="selected-day-card">
        <div className="selected-date-block">
          <span>{parseDateKey(selectedDate).toLocaleDateString(locale, { weekday: 'short' })}</span>
          <strong>{parseDateKey(selectedDate).getDate()}</strong>
          <small>{parseDateKey(selectedDate).toLocaleDateString(locale, { month: 'short' })}</small>
        </div>
        <div className="selected-day-content">
          <span className="eyebrow">{copy.selectedDay}</span>
          <h2>{selectedRecord ? statusLabel(language, selectedRecord.status) : copy.notMarked}</h2>
          <p>
            {selectedRecord ? (
              <>Shift {selectedRecord.shiftCode} · {selectedRecord.shiftStartTime}–{selectedRecord.shiftEndTime}</>
            ) : selectedShift ? (
              <><Clock3 size={14} /> {copy.planned}: {copy.shift} {selectedShift.code} · {selectedShift.startTime}–{selectedShift.endTime}</>
            ) : (
              copy.noShiftPlanned
            )}
          </p>
        </div>
        <button type="button" onClick={() => onEditDate(selectedDate)}>
          {selectedRecord ? <PencilLine size={17} /> : <CalendarCheck2 size={17} />}
          {selectedRecord ? copy.edit : copy.mark}
        </button>
      </section>

      <section className="month-insight-row" aria-label="Month summary">
        <article><strong>{monthRecords.length}</strong><span>{copy.daysMarked}</span></article>
        <article><strong>{presentCount}</strong><span>{copy.present}</span></article>
        <article><strong>{leaveCount}</strong><span>{copy.offLeave}</span></article>
      </section>
    </div>
  );
}
