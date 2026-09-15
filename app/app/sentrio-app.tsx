'use client';

import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  CloudOff,
  ChartNoAxesColumn as FileText,
  LayoutGrid as Home,
  BookOpen as NotebookTabs,
  Save,
  Settings,
  ShieldCheck,
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
  type ShiftCode,
} from './lib/domain';
import { copyFor, statusLabel, shiftName } from './lib/i18n';
import { Diary } from './diary';
import { SettingsView } from './settings-view';
import { Onboarding } from './onboarding';
import { Reports } from './reports';
import { Brand } from './brand';
import { ActiveShift } from './active-shift';
import { DashboardSummary } from './dashboard-summary';
import { durationLabel, overtimeMinutesFor, periodSummary } from './lib/domain';

export function SentrioApp({ initialNow }: { initialNow: string }) {
  const [now, setNow] = useState(() => new Date(initialNow));
  const [isOnline, setIsOnline] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [clockNow, setClockNow] = useState(() => new Date());
  const [activeView, setActiveView] = useState<'today' | 'diary' | 'settings' | 'reports'>('today');
  const [setupMode, setSetupMode] = useState<'settings' | null>(null);
  const [initializationError, setInitializationError] = useState('');
  const [activeStatus, setActiveStatus] =
    useState<AttendanceStatus>('PRESENT');
  const [activeShift, setActiveShift] = useState<ShiftCode | ''>('');
  const [dailyChoice, setDailyChoice] = useState<{ date: string; code: ShiftCode } | null>(null);
  const [checkIn, setCheckIn] = useState('06:28');
  const [checkOut, setCheckOut] = useState('');
  const [note, setNote] = useState('');
  const [entryDate, setEntryDate] = useState(() => localDateKey(new Date(initialNow)));
  const [toast, setToast] = useState('');
  const [otHours, setOtHours] = useState('0');
  const [otMinutes, setOtMinutes] = useState('0');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const refresh = () => setNow(new Date());
    try { document.documentElement.style.fontSize = localStorage.getItem('sentrio-large-text') === 'true' ? '18px' : '16px'; } catch { /* Default text size remains readable when storage is unavailable. */ }
    refresh();
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, []);

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
    if (!isSheetOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSheetOpen(false);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isSheetOpen]);

  const todayKey = localDateKey(now);
  const records = useMemo(
    () =>
      Object.fromEntries(
        (attendanceRecords ?? []).map((record) => [record.date, record]),
      ),
    [attendanceRecords],
  );
  const todayRecord = records[todayKey];
  const runningRecord = (attendanceRecords ?? []).filter(record => {
    const start = new Date(`${record.date}T${record.checkIn}:00`).getTime();
    return (record.status === 'PRESENT' || record.status === 'HALF_DAY') && record.checkIn && !record.checkOut && start <= now.getTime() && now.getTime() - start < 86400000;
  }).sort((a, b) => b.date.localeCompare(a.date))[0];

  useEffect(() => {
    if (!runningRecord) return;
    const timer = window.setInterval(() => setClockNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, [runningRecord]);
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

  if (!profile || !settings || !shiftConfigs || attendanceRecords === undefined) {
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
  const language = profile.language;
  const locale = profile.language === 'mr' ? 'mr-IN' : 'en-IN';
  const todayShiftCode = todayRecord?.shiftCode ?? (dailyChoice?.date === todayKey ? dailyChoice.code : undefined);
  const todayShift = todayShiftCode ? shiftMap.get(todayShiftCode) : undefined;

  function openAttendanceSheet(
    status: AttendanceStatus = 'PRESENT',
    dateKey: string = todayKey,
  ) {
    const existing = records[dateKey];
    setEntryDate(dateKey);
    setActiveStatus(existing?.status ?? status);
    setActiveShift(existing?.shiftCode ?? '');
    setCheckIn(existing?.checkIn ?? '');
    setCheckOut(existing?.checkOut ?? '');
    setNote(existing?.note ?? '');
    const ot = existing ? overtimeMinutesFor(existing) : 0;
    setOtHours(String(Math.floor(ot / 60)));
    setOtMinutes(String(ot % 60));
    setSaveError('');
    setIsSheetOpen(true);
  }

  async function saveAttendance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const ot = Number(otHours) * 60 + Number(otMinutes);
    if (!Number.isInteger(ot) || ot < 0 || ot > 1440 || Number(otMinutes) < 0 || Number(otMinutes) > 59) {
      setSaveError(language === 'mr' ? 'जादा वेळ ० ते २४ तासांच्या दरम्यान नोंदवा.' : 'Enter overtime between 0 and 24 hours, with minutes from 0 to 59.');
      return;
    }
    if (!activeShift) {
      setSaveError(language === 'mr' ? 'या दिवसाची पाळी निवडा.' : 'Choose a shift for this day.');
      return;
    }
    const selectedShift = shiftMap.get(activeShift);
    if (!selectedShift) return;
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
      overtimeMinutes: activeStatus === 'PRESENT' || activeStatus === 'HALF_DAY' ? ot : 0,
      note: note.trim(),
      createdAt: existingRecord?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };
    setSaving(true);
    try {
      await db.attendanceRecords.put(nextRecord);
      setIsSheetOpen(false);
      setToast(copy.attendanceSaved);
      window.setTimeout(() => setToast(''), 2600);
    } catch {
      setSaveError(language === 'mr' ? 'नोंद जतन झाली नाही. पुन्हा प्रयत्न करा.' : 'Could not save. Please try again.');
    } finally { setSaving(false); }
  }

  async function startShift() {
    if (!todayShift) return;
    const selectedShift = todayShift;
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
      overtimeMinutes: todayRecord?.overtimeMinutes ?? 0,
      note: todayRecord?.note || '',
      createdAt: todayRecord?.createdAt || timestamp.toISOString(),
      updatedAt: timestamp.toISOString(),
    });
    setClockNow(timestamp);
    setNow(timestamp);
    setToast(copy.shiftStarted);
    window.setTimeout(() => setToast(''), 2600);
  }

  async function endShift() {
    if (!runningRecord?.checkIn) return;
    const timestamp = new Date();
    const currentTime = timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    await db.attendanceRecords.update(runningRecord.id, { checkOut: currentTime, updatedAt: timestamp.toISOString() });
    openAttendanceSheet('PRESENT', runningRecord.date);
    setCheckOut(currentTime);
    setToast(copy.shiftEnded);
    window.setTimeout(() => setToast(''), 2600);
  }

  const cycleSummary = periodSummary(attendanceRecords, cycle.startKey, todayKey);
  const initials = profile.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className={`sentrio-shell ${activeView === 'today' ? 'dashboard-shell' : ''}`}>
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
              <span className="eyebrow">{profile.language === 'mr' ? marathiDate : englishDate}</span>
              <h1>{profile.language === 'mr' ? 'नमस्कार' : 'Hello'}, {profile.name.split(' ')[0]}</h1>
              <p lang="mr">{marathiDate}</p>
            </div>
            <button className="calendar-button" type="button" aria-label="Open diary calendar" onClick={() => setActiveView('diary')}>
              <CalendarDays size={20} />
            </button>
          </section>

          <section className="shift-card" aria-labelledby="shift-title">
            <div className="shift-card-top">
              <div className="shift-badge">{todayShift?.code ?? '—'}</div>
              <div>
                <span className="eyebrow light">{copy.todaysShift}</span>
                <h2 id="shift-title">{todayShift ? `${copy.shift} ${todayShift.code} · ${shiftName(language, todayShift.code, todayShift.name)}` : (language === 'mr' ? 'आजची पाळी निवडा' : 'Choose today’s shift')}</h2>
                {todayShift ? <p><Clock3 size={16} /> {formatShiftTime(todayShift)}</p> : null}
              </div>
              <span className="shift-state">{todayRecord ? statusLabel(profile.language, todayRecord.status) : copy.notMarked}</span>
            </div>

            {todayRecord ? (
              <div className="saved-record">
                <div>
                  <span className="saved-check"><Check size={15} /></span>
                  <div>
                    <strong>{statusLabel(profile.language, todayRecord.status)}</strong>
                    <span>
                      {copy.shift} {todayRecord.shiftCode}
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

            {!todayRecord && !runningRecord ? <label className="daily-shift-choice">{language === 'mr' ? 'आजची पाळी' : 'Shift for today'}<select value={todayShiftCode ?? ''} onChange={event => setDailyChoice(event.target.value ? { date: todayKey, code: event.target.value as ShiftCode } : null)}><option value="">{language === 'mr' ? 'पाळी निवडा' : 'Select a shift'}</option>{shiftConfigs.filter(shift => shift.enabled).map(shift => <option key={shift.code} value={shift.code}>{shift.code} · {shiftName(language, shift.code, shift.name)} · {formatShiftTime(shift)}</option>)}</select></label> : null}
            {!runningRecord ? <div className="clock-panel">
              <div><strong>{copy.clockMode}</strong><span>{copy.clockHelper}</span></div>
              {!todayRecord?.checkIn ? (
                <button type="button" disabled={!todayShift} onClick={() => void startShift()}><Clock3 size={18} />{copy.startShift}</button>
              ) : !todayRecord.checkOut ? (
                <button type="button" onClick={() => openAttendanceSheet()}>{copy.edit}</button>
              ) : (
                <span className="clock-complete"><Check size={16} />{todayRecord.checkIn} – {todayRecord.checkOut}</span>
              )}
            </div> : null}

            <button className="primary-action" type="button" onClick={() => openAttendanceSheet()}>
              <span className="action-icon"><Check size={20} /></span>
              {todayRecord ? copy.updateAttendance : copy.markAttendance}
            </button>
          </section>

          {runningRecord ? <ActiveShift record={runningRecord} shift={shiftMap.get(runningRecord.shiftCode) ?? DEFAULT_SHIFTS[0]} language={language} now={clockNow} onFinish={() => void endShift()} onEdit={() => openAttendanceSheet('PRESENT', runningRecord.date)} /> : null}

          {todayRecord && overtimeMinutesFor(todayRecord) > 0 ? <p className="dashboard-caption">{profile.language === 'mr' ? 'आजचा जादा वेळ' : "Today's overtime"}: {durationLabel(overtimeMinutesFor(todayRecord), profile.language)}</p> : null}
          <DashboardSummary now={now} records={attendanceRecords} language={profile.language} />
            </>
          ) : activeView === 'diary' ? (
            <Diary
              initialNow={now}
              records={attendanceRecords}
              onEditDate={(dateKey) => openAttendanceSheet(settings.defaultStatus, dateKey)}
              language={profile.language}
            />
          ) : activeView === 'settings' ? (
            <SettingsView profile={profile} settings={settings} shifts={shiftConfigs} records={attendanceRecords} now={now} onEdit={() => setSetupMode('settings')} />
          ) : (
            <Reports initialNow={now} records={attendanceRecords} cycleStartDay={cycleStartDay} language={profile.language} />
          )}
        </div>

        <nav className="bottom-nav" aria-label="Primary navigation">
          <button className={`nav-item ${activeView === 'today' ? 'active' : ''}`} type="button" aria-current={activeView === 'today' ? 'page' : undefined} onClick={() => setActiveView('today')}>
            <Home size={21} /><span>{profile.language === 'mr' ? 'डॅशबोर्ड' : 'Dashboard'}</span>
          </button>
          <button className={`nav-item ${activeView === 'diary' ? 'active' : ''}`} type="button" aria-current={activeView === 'diary' ? 'page' : undefined} onClick={() => setActiveView('diary')}>
            <NotebookTabs size={21} /><span>{copy.diary}</span>
          </button>
          <button className={`nav-item ${activeView === 'reports' ? 'active' : ''}`} type="button" aria-current={activeView === 'reports' ? 'page' : undefined} onClick={() => setActiveView('reports')}>
            <FileText size={21} /><span>{copy.reports}</span>
          </button>
          <button className={`nav-item ${activeView === 'settings' ? 'active' : ''}`} type="button" aria-current={activeView === 'settings' ? 'page' : undefined} onClick={() => setActiveView('settings')}>
            <Settings size={21} /><span>{copy.settings}</span>
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
          <div><span className="summary-dot present" />{copy.present} <strong>{cycleSummary.counts.PRESENT}</strong></div>
          <div><span className="summary-dot off" />{copy.weeklyOff} <strong>{cycleSummary.counts.WEEKLY_OFF}</strong></div>
          <div><span className="summary-dot absent" />{copy.absent} <strong>{cycleSummary.counts.ABSENT}</strong></div>
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
                  {ATTENDANCE_STATUSES.filter(status => !['HALF_DAY', 'HOLIDAY'].includes(status.value) || status.value === activeStatus).map((status) => (
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

              {(activeStatus === 'PRESENT' || activeStatus === 'HALF_DAY') ? <fieldset className="overtime-fields">
                <legend>{profile.language === 'mr' ? 'पाळीनंतरचा जादा वेळ (OT)' : 'Overtime after your shift (OT)'}</legend>
                <p>{profile.language === 'mr' ? 'जादा कामाचा वेळ स्वतंत्रपणे नोंदवा.' : 'Extra hours, recorded separately from your shift.'}</p>
                <div className="ot-presets">{[30, 60, 90, 120].map(minutes => <button type="button" key={minutes} onClick={() => { const total = Math.min(1440, Math.max(0, Number(otHours) * 60 + Number(otMinutes)) + minutes); setOtHours(String(Math.floor(total / 60))); setOtMinutes(String(total % 60)); }}>+{minutes} {profile.language === 'mr' ? 'मि.' : 'min'}</button>)}</div>
                <div className="time-grid">
                  <label>{profile.language === 'mr' ? 'तास' : 'Hours'}<input type="number" inputMode="numeric" min="0" max="24" step="1" value={otHours} onChange={event => setOtHours(event.target.value)} /></label>
                  <label>{profile.language === 'mr' ? 'मिनिटे' : 'Minutes'}<input type="number" inputMode="numeric" min="0" max="59" step="1" value={otMinutes} onChange={event => setOtMinutes(event.target.value)} /></label>
                </div>
              </fieldset> : null}
              {saveError ? <p role="alert" className="form-error">{saveError}</p> : null}
              <details className="optional-details"><summary>{profile.language === 'mr' ? 'ऐच्छिक तपशील' : 'Optional details'}</summary>
              {(activeStatus === 'PRESENT' || activeStatus === 'HALF_DAY') ? <div className="time-grid">
                <label>{copy.checkIn}<input type="time" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} /></label>
                <label>{copy.checkOut}<input type="time" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} /></label>
              </div> : null}
              <label className="note-field">{copy.personalNote} <span>{copy.optional}</span>
                <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder={copy.notePlaceholder} rows={2} />
              </label>
              </details>

              <div className="sheet-actions">
                <button className="secondary-action" type="button" onClick={() => setIsSheetOpen(false)}>{copy.cancel}</button>
                <button className="save-action" type="submit" disabled={saving}><Save size={18} />{saving ? (profile.language === 'mr' ? 'जतन करत आहे…' : 'Saving…') : copy.saveAttendance}</button>
              </div>
            </form>
          </section>
        </div>
      )}


      {toast && <div className="toast" role="status"><Check size={17} />{toast}</div>}
    </div>
  );
}
