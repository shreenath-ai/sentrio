'use client';

import { Clock3, PencilLine, ShieldCheck, Timer, X } from 'lucide-react';
import { elapsedSeconds, type AttendanceRecord, type LanguageCode, type ShiftConfig } from './lib/domain';
import { copyFor } from './lib/i18n';
import { Brand } from './brand';

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
  onClose,
  onFinish,
  onEdit,
}: {
  record: AttendanceRecord;
  shift: ShiftConfig;
  language: LanguageCode;
  now: Date;
  onClose: () => void;
  onFinish: () => void;
  onEdit: () => void;
}) {
  const copy = copyFor(language);
  const [hours, minutes, seconds] = elapsedParts(record, now);

  return (
    <div className="active-shift-backdrop" role="presentation">
      <section className="active-shift-screen" role="dialog" aria-modal="true" aria-labelledby="active-shift-title">
        <header>
          <Brand compact />
          <button type="button" onClick={onClose} aria-label={copy.closeTimer}><X size={21} /></button>
        </header>
        <div className="active-shift-copy">
          <span className="live-pill"><i />{copy.activeShift}</span>
          <h2 id="active-shift-title">{copy.shiftInProgress}</h2>
          <p>{copy.runningSafely}</p>
        </div>
        <div className="timer-face" aria-label={`${copy.elapsedTime}: ${hours}:${minutes}:${seconds}`}>
          <Timer size={26} aria-hidden="true" />
          <span>{copy.elapsedTime}</span>
          <strong><b>{hours}</b><i>:</i><b>{minutes}</b><i>:</i><b>{seconds}</b></strong>
        </div>
        <div className="active-shift-details">
          <article><span>{copy.shift}</span><strong>{shift.code} · {shift.name}</strong></article>
          <article><span>{copy.startedAt}</span><strong>{record.checkIn}</strong></article>
          <article><span>{copy.scheduledEnd}</span><strong>{shift.endTime}</strong></article>
        </div>
        <div className="active-shift-actions">
          <button className="timer-edit" type="button" onClick={onEdit}><PencilLine size={18} />{copy.edit}</button>
          <button className="timer-finish" type="button" onClick={onFinish}><Clock3 size={19} />{copy.finishShift}</button>
        </div>
        <p className="timer-privacy"><ShieldCheck size={16} />{copy.staysOnDevice}</p>
      </section>
    </div>
  );
}
