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
  attendanceCycleFor,
  type AttendanceRecord,
  type AttendanceStatus,
  DEFAULT_SHIFTS,
  formatShiftTime,
  localDateKey,
  parseDateKey,
  plannedShiftForDate,
  type ShiftCode,
} from './lib/domain';
import { copyFor, statusLabel } from './lib/i18n';
import { Diary } from './diary';
import { Insights } from './insights';
import { Onboarding } from './onboarding';
import { Reports } from './reports';
import { RotationPlanner } from './rotation-planner';
import { Brand } from './brand';
import { ActiveShift } from './active-shift';

export function SentrioApp({ initialNow }: { initialNow: string }) {
  const [now] = useState(() => new Date(initialNow));
  const [isOnline, setIsOnline] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isRotationOpen, setIsRotationOpen] = useState(false);
  const [isClockOpen, setIsClockOpen] = useState(false);
  const [clockNow, setClockNow] = useState(() => new Date());
  const [activeView, setActiveView] = useState<'today' | 'diary' | 'insights' | 'reports'>('today');
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
    if (!isSheetOpen && !isRotationOpen && !isClockOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSheetOpen(false);
        setIsRotationOpen(false);
        setIsClockOpen(false);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isClockOpen, isRotationOpen, isSheetOpen]);

  const todayKey = localDateKey(now);
  const records = useMemo(
    () =>
      Object.fromEntries(
        (attendanceRecords ?? []).map((record) => [record.date, record]),
      ),
    [attendanceRecords],
  );
  const todayRecord = records[todayKey];

  useEffect(() => {
    if (!isClockOpen) return;
    const timer = window.setInterval(() => setClockNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, [isClockOpen]);
  const cycleStartDay = settings?.cycleStartDay ?? 26;
  const cycle = useMemo(
    () => attendanceCycleFor(now, cycleStartDay),
    [cycleStartDay, now],
  );
  const markedInCycle = useMemo(() => {
    return (attendanceRecords ?? []).filter(
      (record) => record.date >= cycle.startKey && record.date <= cycle.endKey,
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
  const copy = copyFor(profile.language);
  const locale = profile.language === 'mr' ? 'mr-IN' : 'en-IN';
  const todayShiftCode = todayRecord?.shiftCode ?? plannedShiftForDate(todayKey, rotationPlan, settings.weeklyOff) ?? settings.defaultShift;
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
    setToast(copy.attendanceSaved);
    window.setTimeout(() => setToast(''), 2600);
  }

  async function startShift() {
    const selectedShift = shiftMap.get(todayShiftCode) ?? DEFAULT_SHIFTS[0];
    const timestamp = new Date();
    const currentTime = timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    await db.attendanceRecords.put({
      id: todayKey,
      date: todayKey,
      shiftCode: selectedShift.code,
      shiftName: selectedShift.name,
      shiftStartTime: selectedShift.startTime,
      shiftEndTime: selectedShift.endTime,
      status: 'PRESENT',
      checkIn: todayRecord?.checkIn || currentTime,
      checkOut: todayRecord?.checkOut || '',
      note: todayRecord?.note || '',
      createdAt: todayRecord?.createdAt || timestamp.toISOString(),
      updatedAt: timestamp.toISOString(),
    });
    setClockNow(timestamp);
    setIsClockOpen(true);
    setToast(copy.shiftStarted);
    window.setTimeout(() => setToast(''), 2600);
  }

  async function endShift() {
    if (!todayRecord?.checkIn) return;
    const timestamp = new Date();
    const currentTime = timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    await db.attendanceRecords.update(todayRecord.id, { checkOut: currentTime, updatedAt: timestamp.toISOString() });
    setIsClockOpen(false);
    setToast(copy.shiftEnded);
    window.setTimeout(() => setToast(''), 2600);
  }

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
          <span className="eyebrow light">{copy.selfAttendanceDiary}</span>
          <h2>{copy.yourShiftRecord.split('\n').map((line) => <span key={line}>{line}<br /></span>)}</h2>
          <p>{copy.privatePractical}</p>
        </div>
        <div className="rail-status">
          <ShieldCheck size={18} aria-hidden="true" />
          <span>{copy.staysOnDevice}</span>
        </div>
      </aside>

      <main className="app-frame">
        <header className="app-header">
          <Brand compact />
          <div className="header-actions">
            <span className={`connection-pill ${isOnline ? '' : 'offline'}`}>
              <CloudOff size={14} aria-hidden="true" />
              {isOnline ? copy.offlineReady : copy.youAreOffline}
            </span>
            <button
              className="icon-button"
              type="button"
              aria-label={copy.settings}
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
              <span className="eyebrow">{copy.today}</span>
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
                <span className="eyebrow light">{copy.todaysShift}</span>
                <h2 id="shift-title">{todayShift.name} Shift</h2>
                <p><Clock3 size={16} /> {formatShiftTime(todayShift)}</p>
              </div>
              <span className="shift-state">{copy.scheduled}</span>
            </div>

            {todayRecord ? (
              <div className="saved-record">
                <div>
                  <span className="saved-check"><Check size={15} /></span>
                  <div>
                    <strong>{statusLabel(profile.language, todayRecord.status)}</strong>
                    <span>
                      Shift {todayRecord.shiftCode}
                      {todayRecord.checkIn ? ` · ${todayRecord.checkIn}` : ''}
                    </span>
                  </div>
                </div>
                <button type="button" onClick={() => openAttendanceSheet()}>
                  {copy.edit} <ChevronRight size={16} />
                </button>
              </div>
            ) : (
              <p className="shift-helper">{copy.noAttendance}</p>
            )}

            <div className="clock-panel">
              <div><strong>{copy.clockMode}</strong><span>{copy.clockHelper}</span></div>
              {!todayRecord?.checkIn ? (
                <button type="button" onClick={() => void startShift()}><Clock3 size={18} />{copy.startShift}</button>
              ) : !todayRecord.checkOut ? (
                <button type="button" onClick={() => { setClockNow(new Date()); setIsClockOpen(true); }}><TimerReset size={18} />{copy.openTimer}</button>
              ) : (
                <span className="clock-complete"><Check size={16} />{todayRecord.checkIn} – {todayRecord.checkOut}</span>
              )}
            </div>

            <button className="primary-action" type="button" onClick={() => openAttendanceSheet()}>
              <span className="action-icon"><Check size={20} /></span>
              {todayRecord ? copy.updateAttendance : copy.markAttendance}
            </button>
          </section>

          <section className="status-section" aria-labelledby="quick-status-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow">{copy.oneTapEntry}</span>
                <h2 id="quick-status-title">{copy.quickStatus}</h2>
              </div>
              <span>{copy.sixOptions}</span>
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
                  {statusLabel(profile.language, status.value)}
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
                  <span className="eyebrow">{copy.attendanceCycle}</span>
                  <h2 id="cycle-title">{cycle.label}</h2>
                </div>
                <strong>{markedInCycle}/{cycle.totalDays}</strong>
              </div>
              <div className="progress-track" aria-label={`${markedInCycle} days marked in this cycle`}>
                <span style={{ width: `${Math.min((markedInCycle / cycle.totalDays) * 100, 100)}%` }} />
              </div>
              <p>{markedInCycle === 0 ? copy.startByMarking : `${markedInCycle} ${copy.safelyRecorded}.`}</p>
            </div>
          </section>

          <section className="diary-note">
            <Sparkles size={19} aria-hidden="true" />
            <div>
              <span>{copy.todaysThought}</span>
              <blockquote>“{copy.thought}”</blockquote>
            </div>
          </section>
            </>
          ) : activeView === 'diary' ? (
            <Diary
              initialNow={now}
              records={attendanceRecords}
              settings={settings}
              shifts={shiftConfigs}
              rotationPlan={rotationPlan}
              onEditDate={(dateKey) => openAttendanceSheet(settings.defaultStatus, dateKey)}
              onOpenPlanner={() => setIsRotationOpen(true)}
              language={profile.language}
            />
          ) : activeView === 'insights' ? (
            <Insights initialNow={now} records={attendanceRecords} cycleStartDay={cycleStartDay} language={profile.language} />
          ) : (
            <Reports initialNow={now} records={attendanceRecords} cycleStartDay={cycleStartDay} language={profile.language} />
          )}
        </div>

        <nav className="bottom-nav" aria-label="Primary navigation">
          <button className={`nav-item ${activeView === 'today' ? 'active' : ''}`} type="button" aria-current={activeView === 'today' ? 'page' : undefined} onClick={() => setActiveView('today')}>
            <Home size={21} /><span>{copy.today}</span>
          </button>
          <button className={`nav-item ${activeView === 'diary' ? 'active' : ''}`} type="button" aria-current={activeView === 'diary' ? 'page' : undefined} onClick={() => setActiveView('diary')}>
            <NotebookTabs size={21} /><span>{copy.diary}</span>
          </button>
          <button className={`nav-item ${activeView === 'insights' ? 'active' : ''}`} type="button" aria-current={activeView === 'insights' ? 'page' : undefined} onClick={() => setActiveView('insights')}>
            <BarChart3 size={21} /><span>{copy.insights}</span>
          </button>
          <button className={`nav-item ${activeView === 'reports' ? 'active' : ''}`} type="button" aria-current={activeView === 'reports' ? 'page' : undefined} onClick={() => setActiveView('reports')}>
            <FileText size={21} /><span>{copy.reports}</span>
          </button>
        </nav>
      </main>

      <aside className="desktop-summary" aria-label="Cycle summary">
        <span className="eyebrow">{copy.currentCycle}</span>
        <h2>{cycle.label}</h2>
        <div className="summary-number">
          <strong>{markedInCycle}</strong>
          <span>{copy.daysMarked}</span>
        </div>
        <div className="summary-list">
          <div><span className="summary-dot present" />{copy.present} <strong>{todayRecord?.status === 'PRESENT' ? 1 : 0}</strong></div>
          <div><span className="summary-dot off" />{copy.weeklyOff} <strong>{todayRecord?.status === 'WEEKLY_OFF' ? 1 : 0}</strong></div>
          <div><span className="summary-dot absent" />{copy.absent} <strong>{todayRecord?.status === 'ABSENT' ? 1 : 0}</strong></div>
        </div>
        <div className="privacy-card">
          <UserRound size={19} />
          <div><strong>{copy.yourDiary}</strong><span>{copy.noPayroll}</span></div>
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
                <span className="eyebrow">{copy.quickEntry}</span>
                <h2 id="attendance-sheet-title">{copy.markAttendance}</h2>
                <p>{parseDateKey(entryDate).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <button className="icon-button" type="button" onClick={() => setIsSheetOpen(false)} aria-label="Close attendance form">
                <X size={20} />
              </button>
            </header>

            <form onSubmit={saveAttendance}>
              <fieldset>
                <legend>{copy.status}</legend>
                <div className="sheet-status-grid">
                  {ATTENDANCE_STATUSES.map((status) => (
                    <button
                      className={activeStatus === status.value ? 'selected' : ''}
                      key={status.value}
                      type="button"
                      aria-pressed={activeStatus === status.value}
                      onClick={() => setActiveStatus(status.value)}
                    >
                      <span>{status.short}</span>{statusLabel(profile.language, status.value)}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend>{copy.shift}</legend>
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
                <label>{copy.checkIn} <span>{copy.optional}</span><input type="time" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} /></label>
                <label>{copy.checkOut} <span>{copy.optional}</span><input type="time" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} /></label>
              </div>

              <label className="note-field">{copy.personalNote} <span>{copy.optional}</span>
                <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder={copy.notePlaceholder} rows={2} />
              </label>

              <div className="sheet-actions">
                <button className="secondary-action" type="button" onClick={() => setIsSheetOpen(false)}>{copy.cancel}</button>
                <button className="save-action" type="submit"><Save size={18} />{copy.saveAttendance}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {isRotationOpen ? (
        <RotationPlanner
          plan={rotationPlan}
          shifts={shiftConfigs}
          language={profile.language}
          onClose={() => setIsRotationOpen(false)}
        />
      ) : null}

      {isClockOpen && todayRecord?.checkIn && !todayRecord.checkOut ? (
        <ActiveShift
          record={todayRecord}
          shift={todayShift}
          language={profile.language}
          now={clockNow}
          onClose={() => setIsClockOpen(false)}
          onFinish={() => void endShift()}
          onEdit={() => { setIsClockOpen(false); openAttendanceSheet(); }}
        />
      ) : null}

      {toast && <div className="toast" role="status"><Check size={17} />{toast}</div>}
    </div>
  );
}
