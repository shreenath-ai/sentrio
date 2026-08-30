'use client';

import {
  CalendarPlus2,
  CheckCircle2,
  Download,
  LockKeyhole,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { buildShiftCalendar } from './lib/ics';
import {
  localDateKey,
  parseDateKey,
  type RotationPlan,
  type ShiftConfig,
} from './lib/domain';

type CalendarExportProps = {
  initialNow: Date;
  rotationPlan: RotationPlan;
  shifts: ShiftConfig[];
  weeklyOff: number;
  onClose: () => void;
};

const RANGE_OPTIONS = [
  { days: 30, label: '30 days' },
  { days: 90, label: '3 months' },
  { days: 180, label: '6 months' },
] as const;

export function CalendarExport({
  initialNow,
  rotationPlan,
  shifts,
  weeklyOff,
  onClose,
}: CalendarExportProps) {
  const [startDate, setStartDate] = useState(() => localDateKey(initialNow));
  const [numberOfDays, setNumberOfDays] = useState(90);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const exportResult = useMemo(
    () =>
      buildShiftCalendar({
        startDate,
        numberOfDays,
        rotationPlan,
        shifts,
        weeklyOff,
      }),
    [numberOfDays, rotationPlan, shifts, startDate, weeklyOff],
  );
  const endDateLabel = parseDateKey(exportResult.endDate).toLocaleDateString(
    'en-IN',
    { day: 'numeric', month: 'short', year: 'numeric' },
  );

  function downloadCalendar() {
    const file = new Blob([exportResult.content], {
      type: 'text/calendar;charset=utf-8',
    });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sentrio-shifts-${startDate}.ics`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setHasDownloaded(true);
  }

  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="attendance-sheet export-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-export-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" />
        <header className="sheet-header">
          <div>
            <span className="eyebrow">Free calendar export</span>
            <h2 id="calendar-export-title">Add shifts to Calendar</h2>
            <p>No Google sign-in or API key required.</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close calendar export">
            <X size={20} />
          </button>
        </header>

        <div className="export-privacy">
          <LockKeyhole size={19} />
          <div><strong>Private export</strong><span>The file is created on this device. Sentrio sends nothing to Google.</span></div>
        </div>

        <div className="export-fields">
          <label>
            Start date
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </label>
          <fieldset>
            <legend>Export range</legend>
            <div>
              {RANGE_OPTIONS.map((option) => (
                <button
                  className={numberOfDays === option.days ? 'selected' : ''}
                  key={option.days}
                  type="button"
                  aria-pressed={numberOfDays === option.days}
                  onClick={() => setNumberOfDays(option.days)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="export-summary">
          <div className="export-calendar-icon"><CalendarPlus2 size={22} /></div>
          <div>
            <span>Sentrio Shift Plan</span>
            <strong>{exportResult.eventCount} shift events</strong>
            <small>Through {endDateLabel} · weekly offs excluded</small>
          </div>
        </div>

        {!rotationPlan.enabled ? (
          <p className="export-warning">Turn on the rotation plan before exporting shifts.</p>
        ) : null}

        <button
          className="export-download"
          type="button"
          disabled={exportResult.eventCount === 0}
          onClick={downloadCalendar}
        >
          {hasDownloaded ? <CheckCircle2 size={19} /> : <Download size={19} />}
          {hasDownloaded ? 'Calendar downloaded' : 'Download .ics calendar'}
        </button>

        <section className="import-help" aria-labelledby="import-help-title">
          <h3 id="import-help-title">Import into Google Calendar</h3>
          <ol>
            <li><span>1</span><p>Download the Sentrio calendar file.</p></li>
            <li><span>2</span><p>Open Google Calendar → Settings → Import & export.</p></li>
            <li><span>3</span><p>Select the <b>.ics</b> file and choose your calendar.</p></li>
          </ol>
          <a href="https://calendar.google.com/" target="_blank" rel="noreferrer">Open Google Calendar</a>
        </section>
      </section>
    </div>
  );
}
