'use client';

import {
  BarChart3,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  CloudOff,
  FileText,
  Home,
  NotebookTabs,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  TimerReset,
  UserRound,
  X,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { db, initializeDatabase } from './lib/db';
import {
  ATTENDANCE_STATUSES,
  type AttendanceRecord,
  type AttendanceStatus,
  DEFAULT_SHIFTS,
  formatShiftTime,
  localDateKey,
  parseDateKey,
  plannedShiftForDate,
  type ShiftCode,
} from './lib/domain';
import { Diary } from './diary';
import { Onboarding } from './onboarding';
import { RotationPlanner } from './rotation-planner';

function formatCycle(date: Date, cycleStartDay: number) {
  const start =
    date.getDate() >= cycleStartDay
      ? new Date(date.getFullYear(), date.getMonth(), cycleStartDay)
      : new Date(date.getFullYear(), date.getMonth() - 1, cycleStartDay);
  const end = new Date(
    start.getFullYear(),
    start.getMonth() + 1,
    cycleStartDay - 1,
  );
  const short = (value: Date) =>
    value.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const totalDays =
    Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  return { start, end, totalDays, label: `${short(start)} – ${short(end)}` };
}

export function SentrioApp({ initialNow }: { initialNow: string }) {
  const [now] = useState(() => new Date(initialNow));
  const [isOnline, setIsOnline] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isRotationOpen, setIsRotationOpen] = useState(false);
  const [activeView, setActiveView] = useState<'today' | 'diary'>('today');
  const [setupMode, setSetupMode] = useState<'settings' | null>(null);
  const [initializationError, setInitializationError] = useState('');
  const [activeStatus, setActiveStatus] =
    useState<AttendanceStatus>('PRESENT');
  const [activeShift, setActiveShift] = useState<ShiftCode>('A');
  const [checkIn, setCheckIn] = useState('06:28');
  const [checkOut, setCheckOut] = useState('');
  const [note, setNote] = useState('');
  const [entryDate, setEntryDate] = useState(() => localDateKey(new Date(initialNow)));
  const [toast, setToast] = useState('');

  const profile = useLiveQuery(() => db.profiles.get('default'), []);
  const settings = useLiveQuery(() => db.settings.get('app'), []);
  const shiftConfigs = useLiveQuery(
    () => db.shiftConfigs.orderBy('code').toArray(),
    [],
  );
  const attendanceRecords = useLiveQuery(
    () => db.attendanceRecords.toArray(),
    [],
  );
  const rotationPlan = useLiveQuery(() => db.rotationPlans.get('rotation'), []);

  useEffect(() => {
    let isCurrent = true;
    void initializeDatabase().catch(() => {
      if (isCurrent) {
        setInitializationError(
          'Sentrio could not open its offline database. Reload to try again.',
        );
      }
    });

    const updateConnection = () => setIsOnline(navigator.onLine);
    queueMicrotask(updateConnection);
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
    return () => {
      isCurrent = false;
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
    };
  }, []);

  useEffect(() => {
    if (!isSheetOpen && !isRotationOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSheetOpen(false);
        setIsRotationOpen(false);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isRotationOpen, isSheetOpen]);

  const todayKey = localDateKey(now);
  const records = useMemo(
    () =>
      Object.fromEntries(
        (attendanceRecords ?? []).map((record) => [record.date, record]),
      ),
    [attendanceRecords],
  );
  const todayRecord = records[todayKey];
  const cycleStartDay = settings?.cycleStartDay ?? 26;
  const cycle = useMemo(
    () => formatCycle(now, cycleStartDay),
    [cycleStartDay, now],
  );
  const markedInCycle = useMemo(() => {
    const start = localDateKey(cycle.start);
    const end = localDateKey(cycle.end);
    return (attendanceRecords ?? []).filter(
      (record) => record.date >= start && record.date <= end,
    ).length;
  }, [attendanceRecords, cycle]);

  const englishDate = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const marathiDate = now.toLocaleDateString('mr-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  if (initializationError) {
    return (
      <main className="database-state error-state">
        <Brand compact />
        <h1>Offline database unavailable</h1>
        <p>{initializationError}</p>
        <button type="button" onClick={() => window.location.reload()}>
          Reload Sentrio
        </button>
      </main>
    );
  }

  if (!profile || !settings || !shiftConfigs || !rotationPlan || attendanceRecords === undefined) {
    return (
      <main className="database-state" aria-busy="true">
        <Brand compact />
        <span className="database-loader" />
        <p>Opening your private shift diary…</p>
      </main>
    );
  }

  if (!profile.onboardingComplete || setupMode === 'settings') {
    return (
      <Onboarding
        mode={setupMode === 'settings' ? 'settings' : 'onboarding'}
        profile={profile}
        settings={settings}
        shifts={shiftConfigs}
        onClose={() => setSetupMode(null)}
      />
    );
  }

  const shiftMap = new Map(shiftConfigs.map((shift) => [shift.code, shift]));
  const todayShiftCode = todayRecord?.shiftCode ?? settings.defaultShift;
  const todayShift = shiftMap.get(todayShiftCode) ?? DEFAULT_SHIFTS[0];

  function openAttendanceSheet(
    status: AttendanceStatus = 'PRESENT',
    dateKey: string = todayKey,
  ) {
    const existing = records[dateKey];
    const plannedShift = plannedShiftForDate(
      dateKey,
      rotationPlan,
      settings.weeklyOff,
    );
    const suggestedShift = plannedShift ?? settings.defaultShift;
    const selectedShift = shiftMap.get(existing?.shiftCode ?? suggestedShift);
    setEntryDate(dateKey);
    setActiveStatus(existing?.status ?? status);
    setActiveShift(existing?.shiftCode ?? suggestedShift);
    setCheckIn(existing?.checkIn ?? selectedShift?.startTime ?? '');
    setCheckOut(existing?.checkOut ?? '');
    setNote(existing?.note ?? '');
    setIsSheetOpen(true);
  }

  async function saveAttendance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selectedShift = shiftMap.get(activeShift) ?? DEFAULT_SHIFTS[0];
    const existingRecord = records[entryDate];
    const timestamp = new Date().toISOString();
    const nextRecord: AttendanceRecord = {
      id: entryDate,
      date: entryDate,
      shiftCode: activeShift,
      shiftName: selectedShift.name,
      shiftStartTime: selectedShift.startTime,
      shiftEndTime: selectedShift.endTime,
      status: activeStatus,
      checkIn,
      checkOut,
      note: note.trim(),
      createdAt: existingRecord?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };
    await db.attendanceRecords.put(nextRecord);
    setIsSheetOpen(false);
    setToast('Attendance saved to your diary');
    window.setTimeout(() => setToast(''), 2600);
  }

  const savedStatus = ATTENDANCE_STATUSES.find(
    (status) => status.value === todayRecord?.status,
  );
  const initials = profile.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className="sentrio-shell">
      <aside className="desktop-rail" aria-label="Sentrio overview">
        <Brand />
        <div className="rail-copy">
          <span className="eyebrow light">Self-attendance diary</span>
          <h2>Your shift.<br />Your record.</h2>
          <p>Private, practical and always available on your device.</p>
        </div>
        <div className="rail-status">
          <ShieldCheck size={18} aria-hidden="true" />
          <span>Personal data stays on this device</span>
        </div>
      </aside>

      <main className="app-frame">
        <header className="app-header">
          <Brand compact />
          <div className="header-actions">
            <span className={`connection-pill ${isOnline ? '' : 'offline'}`}>
              <CloudOff size={14} aria-hidden="true" />
              {isOnline ? 'Offline ready' : 'You are offline'}
            </span>
            <button
              className="icon-button"
              type="button"
              aria-label="Open settings"
              onClick={() => setSetupMode('settings')}
            >
              <Settings size={20} />
            </button>
            <button
              className="avatar"
              type="button"
              aria-label={`Open profile for ${profile.name}`}
              onClick={() => setSetupMode('settings')}
            >
              {initials || 'S'}
            </button>
          </div>
        </header>

        <div className="page-scroll">
          {activeView === 'today' ? (
            <>
          <section className="date-heading">
            <div>
              <span className="eyebrow">Today</span>
              <h1>{englishDate}</h1>
              <p lang="mr">{marathiDate}</p>
            </div>
            <button className="calendar-button" type="button" aria-label="Open diary calendar" onClick={() => setActiveView('diary')}>
              <CalendarDays size={20} />
            </button>
          </section>

          <section className="shift-card" aria-labelledby="shift-title">
            <div className="shift-card-top">
              <div className="shift-badge">{todayShift.code}</div>
              <div>
                <span className="eyebrow light">Today&apos;s shift</span>
                <h2 id="shift-title">{todayShift.name} Shift</h2>
                <p><Clock3 size={16} /> {formatShiftTime(todayShift)}</p>
              </div>
              <span className="shift-state">Scheduled</span>
            </div>

            {todayRecord ? (
              <div className="saved-record">
                <div>
                  <span className="saved-check"><Check size={15} /></span>
                  <div>
                    <strong>{savedStatus?.label}</strong>
                    <span>
                      Shift {todayRecord.shiftCode}
                      {todayRecord.checkIn ? ` · ${todayRecord.checkIn}` : ''}
                    </span>
                  </div>
                </div>
                <button type="button" onClick={() => openAttendanceSheet()}>
                  Edit <ChevronRight size={16} />
                </button>
              </div>
            ) : (
              <p className="shift-helper">No attendance has been marked for today.</p>
            )}

            <button className="primary-action" type="button" onClick={() => openAttendanceSheet()}>
              <span className="action-icon"><Check size={20} /></span>
              {todayRecord ? 'Update attendance' : 'Mark attendance'}
            </button>
          </section>

          <section className="status-section" aria-labelledby="quick-status-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow">One-tap entry</span>
                <h2 id="quick-status-title">Quick status</h2>
              </div>
              <span>6 options</span>
            </div>
            <div className="status-grid">
              {ATTENDANCE_STATUSES.map((status) => (
                <button
                  className={`status-button status-${status.value.toLowerCase()} ${
                    todayRecord?.status === status.value ? 'is-saved' : ''
                  }`}
                  key={status.value}
                  type="button"
                  onClick={() => openAttendanceSheet(status.value)}
                >
                  <span>{status.short}</span>
                  {status.label}
                  {todayRecord?.status === status.value && <Check size={15} />}
                </button>
              ))}
            </div>
          </section>

          <section className="cycle-card" aria-labelledby="cycle-title">
            <div className="cycle-icon"><TimerReset size={21} /></div>
            <div className="cycle-content">
              <div className="cycle-row">
                <div>
                  <span className="eyebrow">Attendance cycle</span>
                  <h2 id="cycle-title">{cycle.label}</h2>
                </div>
                <strong>{markedInCycle}/{cycle.totalDays}</strong>
              </div>
              <div className="progress-track" aria-label={`${markedInCycle} days marked in this cycle`}>
                <span style={{ width: `${Math.min((markedInCycle / cycle.totalDays) * 100, 100)}%` }} />
              </div>
              <p>{markedInCycle === 0 ? 'Start by marking today.' : `${markedInCycle} day${markedInCycle === 1 ? '' : 's'} safely recorded.`}</p>
            </div>
          </section>

          <section className="diary-note">
            <Sparkles size={19} aria-hidden="true" />
            <div>
              <span lang="mr">आजचा सुविचार</span>
              <blockquote lang="mr">“प्रयत्नांती परमेश्वर.”</blockquote>
            </div>
          </section>
            </>
          ) : (
            <Diary
              initialNow={now}
              records={attendanceRecords}
              settings={settings}
              shifts={shiftConfigs}
              rotationPlan={rotationPlan}
              onEditDate={(dateKey) => openAttendanceSheet(settings.defaultStatus, dateKey)}
              onOpenPlanner={() => setIsRotationOpen(true)}
            />
          )}
        </div>

        <nav className="bottom-nav" aria-label="Primary navigation">
          <button className={`nav-item ${activeView === 'today' ? 'active' : ''}`} type="button" aria-current={activeView === 'today' ? 'page' : undefined} onClick={() => setActiveView('today')}>
            <Home size={21} /><span>Today</span>
          </button>
          <button className={`nav-item ${activeView === 'diary' ? 'active' : ''}`} type="button" aria-current={activeView === 'diary' ? 'page' : undefined} onClick={() => setActiveView('diary')}>
            <NotebookTabs size={21} /><span>Diary</span>
          </button>
          <button className="nav-item" type="button" title="Coming next" disabled aria-disabled="true">
            <BarChart3 size={21} /><span>Insights</span>
          </button>
          <button className="nav-item" type="button" title="Coming next" disabled aria-disabled="true">
            <FileText size={21} /><span>Reports</span>
          </button>
        </nav>
      </main>

      <aside className="desktop-summary" aria-label="Cycle summary">
        <span className="eyebrow">Current cycle</span>
        <h2>{cycle.label}</h2>
        <div className="summary-number">
          <strong>{markedInCycle}</strong>
          <span>days marked</span>
        </div>
        <div className="summary-list">
          <div><span className="summary-dot present" />Present <strong>{todayRecord?.status === 'PRESENT' ? 1 : 0}</strong></div>
          <div><span className="summary-dot off" />Weekly off <strong>{todayRecord?.status === 'WEEKLY_OFF' ? 1 : 0}</strong></div>
          <div><span className="summary-dot absent" />Absent <strong>{todayRecord?.status === 'ABSENT' ? 1 : 0}</strong></div>
        </div>
        <div className="privacy-card">
          <UserRound size={19} />
          <div><strong>Your diary</strong><span>No manager or payroll access.</span></div>
        </div>
      </aside>

      {isSheetOpen && (
        <div className="sheet-backdrop" role="presentation" onMouseDown={() => setIsSheetOpen(false)}>
          <section
            className="attendance-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="attendance-sheet-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="sheet-handle" />
            <header className="sheet-header">
              <div>
                <span className="eyebrow">Quick entry</span>
                <h2 id="attendance-sheet-title">Mark attendance</h2>
                <p>{parseDateKey(entryDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <button className="icon-button" type="button" onClick={() => setIsSheetOpen(false)} aria-label="Close attendance form">
                <X size={20} />
              </button>
            </header>

            <form onSubmit={saveAttendance}>
              <fieldset>
                <legend>Status</legend>
                <div className="sheet-status-grid">
                  {ATTENDANCE_STATUSES.map((status) => (
                    <button
                      className={activeStatus === status.value ? 'selected' : ''}
                      key={status.value}
                      type="button"
                      aria-pressed={activeStatus === status.value}
                      onClick={() => setActiveStatus(status.value)}
                    >
                      <span>{status.short}</span>{status.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend>Shift</legend>
                <div className="shift-selector">
                  {shiftConfigs.filter((shift) => shift.enabled).map((shift) => (
                    <button
                      className={activeShift === shift.code ? 'selected' : ''}
                      key={shift.code}
                      type="button"
                      aria-pressed={activeShift === shift.code}
                      onClick={() => setActiveShift(shift.code)}
                    >
                      <strong>{shift.code}</strong><span>{formatShiftTime(shift)}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="time-grid">
                <label>Check-in <span>Optional</span><input type="time" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} /></label>
                <label>Check-out <span>Optional</span><input type="time" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} /></label>
              </div>

              <label className="note-field">Personal note <span>Optional</span>
                <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a note about your shift…" rows={2} />
              </label>

              <div className="sheet-actions">
                <button className="secondary-action" type="button" onClick={() => setIsSheetOpen(false)}>Cancel</button>
                <button className="save-action" type="submit"><Save size={18} />Save attendance</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {isRotationOpen ? (
        <RotationPlanner
          plan={rotationPlan}
          shifts={shiftConfigs}
          onClose={() => setIsRotationOpen(false)}
        />
      ) : null}

      {toast && <div className="toast" role="status"><Check size={17} />{toast}</div>}
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? 'compact' : ''}`}>
      <span className="brand-mark" aria-hidden="true">S</span>
      <div><strong>Sentrio</strong>{!compact && <span>Shift diary</span>}</div>
    </div>
  );
}
