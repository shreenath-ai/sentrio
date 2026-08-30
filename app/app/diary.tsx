'use client';

import {
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  PencilLine,
  Repeat2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  ATTENDANCE_STATUSES,
  type AppSettings,
  type AttendanceRecord,
  localDateKey,
  parseDateKey,
  plannedShiftForDate,
  type RotationPlan,
  type ShiftConfig,
} from './lib/domain';

type DiaryProps = {
  initialNow: Date;
  records: AttendanceRecord[];
  settings: AppSettings;
  shifts: ShiftConfig[];
  rotationPlan: RotationPlan;
  onEditDate: (dateKey: string) => void;
  onOpenExport: () => void;
  onOpenPlanner: () => void;
};

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
  onOpenExport,
  onOpenPlanner,
}: DiaryProps) {
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
  const selectedStatus = ATTENDANCE_STATUSES.find(
    (status) => status.value === selectedRecord?.status,
  );
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
          <span className="eyebrow">Pocket diary</span>
          <h1>Attendance calendar</h1>
          <p>Actual attendance and planned shifts, together.</p>
        </div>
        <div className="diary-actions">
          <button className="planner-button" type="button" onClick={onOpenExport}>
            <Download size={18} /> Export
          </button>
          <button className="planner-button" type="button" onClick={onOpenPlanner}>
            <Repeat2 size={18} /> Rotation
          </button>
        </div>
      </section>

      <section className="month-card" aria-label="Monthly attendance calendar">
        <header className="month-toolbar">
          <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month">
            <ChevronLeft size={20} />
          </button>
          <div>
            <strong>{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</strong>
            <button type="button" onClick={jumpToToday}>Today</button>
          </div>
          <button type="button" onClick={() => changeMonth(1)} aria-label="Next month">
            <ChevronRight size={20} />
          </button>
        </header>

        <div className="weekday-row" aria-hidden="true">
          {WEEKDAY_LABELS.map((day) => <span key={day}>{day}</span>)}
        </div>

        <div className="calendar-grid">
          {cells.map((date) => {
            const dateKey = localDateKey(date);
            const record = recordMap.get(dateKey);
            const status = ATTENDANCE_STATUSES.find((item) => item.value === record?.status);
            const plannedShift = plannedShiftForDate(dateKey, rotationPlan, settings.weeklyOff);
            const isWeeklyOff = date.getDay() === settings.weeklyOff;
            const isOutsideMonth = date.getMonth() !== month.getMonth();
            const label = date.toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            });

            return (
              <button
                className={`calendar-day ${isOutsideMonth ? 'outside' : ''} ${dateKey === todayKey ? 'today' : ''} ${dateKey === selectedDate ? 'selected' : ''} ${record ? `has-${record.status.toLowerCase()}` : ''}`}
                key={dateKey}
                type="button"
                aria-label={`${label}${status ? `, ${status.label}` : ''}${plannedShift ? `, planned shift ${plannedShift}` : ''}`}
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
          <span><i className="actual-dot" /> Actual</span>
          <span><i className="plan-dot" /> Planned shift</span>
          <span>{monthRecords.length} days marked</span>
        </footer>
      </section>

      <section className="selected-day-card">
        <div className="selected-date-block">
          <span>{parseDateKey(selectedDate).toLocaleDateString('en-IN', { weekday: 'short' })}</span>
          <strong>{parseDateKey(selectedDate).getDate()}</strong>
          <small>{parseDateKey(selectedDate).toLocaleDateString('en-IN', { month: 'short' })}</small>
        </div>
        <div className="selected-day-content">
          <span className="eyebrow">Selected day</span>
          <h2>{selectedStatus?.label ?? 'Not marked'}</h2>
          <p>
            {selectedRecord ? (
              <>Shift {selectedRecord.shiftCode} · {selectedRecord.shiftStartTime}–{selectedRecord.shiftEndTime}</>
            ) : selectedShift ? (
              <><Clock3 size={14} /> Planned: Shift {selectedShift.code} · {selectedShift.startTime}–{selectedShift.endTime}</>
            ) : (
              'Weekly off · no shift planned'
            )}
          </p>
        </div>
        <button type="button" onClick={() => onEditDate(selectedDate)}>
          {selectedRecord ? <PencilLine size={17} /> : <CalendarCheck2 size={17} />}
          {selectedRecord ? 'Edit' : 'Mark'}
        </button>
      </section>

      <section className="month-insight-row" aria-label="Month summary">
        <article><strong>{monthRecords.length}</strong><span>Days marked</span></article>
        <article><strong>{presentCount}</strong><span>Present</span></article>
        <article><strong>{leaveCount}</strong><span>Off / leave</span></article>
      </section>
    </div>
  );
}
