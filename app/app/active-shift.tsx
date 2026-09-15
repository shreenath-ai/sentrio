'use client';

import { Clock3, PencilLine, ShieldCheck, Timer } from 'lucide-react';
import { elapsedSeconds, workedMinutes, type AttendanceRecord, type LanguageCode, type ShiftConfig } from './lib/domain';
import { copyFor, shiftName } from './lib/i18n';

function elapsedParts(record: AttendanceRecord, now: Date) {
  const total = elapsedSeconds(record.date, record.checkIn, now);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0'));
}

export function ActiveShift({
  record,
  shift,
  language,
  now,
  onFinish,
  onEdit,
}: {
  record: AttendanceRecord;
  shift: ShiftConfig;
  language: LanguageCode;
  now: Date;
  onFinish: () => void;
  onEdit: () => void;
}) {
  const copy = copyFor(language);
  const [hours, minutes, seconds] = elapsedParts(record, now);
  const locale = language === 'mr' ? 'mr-IN' : 'en-IN';
  const started = new Date(`${record.date}T${record.checkIn}:00`);
  const scheduledEnd = new Date(`${record.date}T${record.shiftEndTime}:00`);
  const overnight = record.shiftEndTime < record.shiftStartTime;
  if (overnight) scheduledEnd.setDate(scheduledEnd.getDate() + 1);
  const plannedMinutes = workedMinutes(record.shiftStartTime, record.shiftEndTime);
  const progress = plannedMinutes ? Math.min(100, elapsedSeconds(record.date, record.checkIn, now) / (plannedMinutes * 60) * 100) : 0;

  return (
      <section className="inline-shift" aria-labelledby="active-shift-title">
        <div className="active-shift-copy">
          <span className="live-pill"><i />{copy.activeShift}</span>
          <h2 id="active-shift-title">{copy.shiftInProgress}</h2>
          <p>{copy.runningSafely}</p>
          <p className="timer-shift-label">{copy.shift} {record.shiftCode} · {record.shiftStartTime}–{record.shiftEndTime}{overnight ? (language === 'mr' ? ' · पुढील दिवस' : ' · next day') : ''}</p>
        </div>
        <div className="timer-face" aria-label={`${copy.elapsedTime}: ${hours}:${minutes}:${seconds}`}>
          <Timer size={26} aria-hidden="true" />
          <span>{copy.elapsedTime}</span>
          <strong><b>{hours}</b><i>:</i><b>{minutes}</b><i>:</i><b>{seconds}</b></strong>
        </div>
        <progress className="timer-progress" value={progress} max={100} aria-label={language === 'mr' ? 'पाळीची प्रगती' : 'Shift progress'} />
        <div className="active-shift-details">
          <article><span>{copy.shift}</span><strong>{shift.code} · {shiftName(language, shift.code, shift.name)}</strong></article>
          <article><span>{copy.startedAt}</span><strong>{started.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} · {record.checkIn}</strong></article>
          <article><span>{copy.scheduledEnd}</span><strong>{scheduledEnd.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} · {record.shiftEndTime}</strong></article>
        </div>
        <div className="active-shift-actions">
          <button className="timer-edit" type="button" onClick={onEdit}><PencilLine size={18} />{copy.edit}</button>
          <button className="timer-finish" type="button" onClick={onFinish}><Clock3 size={19} />{copy.finishShift}</button>
        </div>
        <p className="timer-privacy"><ShieldCheck size={16} />{copy.staysOnDevice}</p>
      </section>
  );
}
