'use client';

import {
  ArrowLeft,
  ArrowRight,
  CalendarRange,
  Check,
  Clock3,
  Globe2,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { FormEvent, useState } from 'react';
import { db } from './lib/db';
import {
  type AppSettings,
  formatShiftTime,
  type LanguageCode,
  type ShiftConfig,
  WEEKDAYS,
  type WorkProfile,
} from './lib/domain';

type OnboardingProps = {
  mode: 'onboarding' | 'settings';
  profile: WorkProfile;
  settings: AppSettings;
  shifts: ShiftConfig[];
  onClose: () => void;
};

export function Onboarding({
  mode,
  profile,
  settings,
  shifts,
  onClose,
}: OnboardingProps) {
  const [step, setStep] = useState(mode === 'settings' ? 1 : 0);
  const [name, setName] = useState(profile.name);
  const [employeeId, setEmployeeId] = useState(profile.employeeId);
  const [language, setLanguage] = useState<LanguageCode>(profile.language);
  const [draftShifts, setDraftShifts] = useState(() =>
    shifts.map((shift) => ({ ...shift })),
  );
  const [weeklyOff, setWeeklyOff] = useState(settings.weeklyOff);
  const [cycleStartDay, setCycleStartDay] = useState(settings.cycleStartDay);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  function continueToShifts(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError('Enter your name to continue.');
      return;
    }
    setError('');
    setStep(1);
  }

  function updateShift(
    code: ShiftConfig['code'],
    field: 'startTime' | 'endTime',
    value: string,
  ) {
    setDraftShifts((current) =>
      current.map((shift) =>
        shift.code === code ? { ...shift, [field]: value } : shift,
      ),
    );
  }

  async function saveSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setStep(0);
      setError('Enter your name to finish setup.');
      return;
    }

    setIsSaving(true);
    setError('');
    const timestamp = new Date().toISOString();

    try {
      await db.transaction(
        'rw',
        [db.profiles, db.shiftConfigs, db.settings],
        async () => {
          await db.profiles.put({
            ...profile,
            name: name.trim(),
            employeeId: employeeId.trim(),
            language,
            onboardingComplete: true,
            updatedAt: timestamp,
          });
          await db.shiftConfigs.bulkPut(
            draftShifts.map((shift) => ({ ...shift, updatedAt: timestamp })),
          );
          await db.settings.put({
            ...settings,
            weeklyOff,
            cycleStartDay,
            updatedAt: timestamp,
          });
        },
      );
      onClose();
    } catch {
      setError('Setup could not be saved. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="onboarding-page">
      <aside className="onboarding-story">
        <Brand />
        <div>
          <span>PRIVATE BY DESIGN</span>
          <h1>Your shifts,<br />ready every day.</h1>
          <p>
            Set your routine once. Sentrio keeps your personal attendance diary
            ready—even without a connection.
          </p>
        </div>
        <p className="onboarding-privacy">
          <ShieldCheck size={18} /> Stored on this device
        </p>
      </aside>

      <section className="setup-panel">
        <header className="setup-header">
          <Brand compact />
          {mode === 'settings' ? (
            <button type="button" onClick={onClose} aria-label="Close setup">
              <ArrowLeft size={19} /> Back
            </button>
          ) : (
            <span>Step {step + 1} of 2</span>
          )}
        </header>

        <div className="setup-progress" aria-hidden="true">
          <span className="complete" />
          <span className={step === 1 ? 'complete' : ''} />
        </div>

        {step === 0 ? (
          <form className="setup-form" onSubmit={continueToShifts}>
            <div className="setup-title">
              <div className="setup-icon"><UserRound size={23} /></div>
              <span>Welcome to Sentrio</span>
              <h2>Make the diary yours</h2>
              <p>A few details help personalize your private shift diary.</p>
            </div>

            <fieldset className="language-fieldset">
              <legend><Globe2 size={16} /> App language</legend>
              <div className="language-options">
                <button
                  className={language === 'en' ? 'selected' : ''}
                  type="button"
                  aria-pressed={language === 'en'}
                  onClick={() => setLanguage('en')}
                >
                  <strong>English</strong><span>Continue in English</span>
                </button>
                <button
                  className={language === 'mr' ? 'selected' : ''}
                  type="button"
                  aria-pressed={language === 'mr'}
                  onClick={() => setLanguage('mr')}
                >
                  <strong lang="mr">मराठी</strong><span lang="mr">मराठीत सुरू ठेवा</span>
                </button>
              </div>
            </fieldset>

            <label className="setup-label">
              Your name
              <input
                autoComplete="name"
                autoFocus
                maxLength={60}
                placeholder="e.g. Rohan Jadhav"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>

            <label className="setup-label">
              Employee ID <span>Optional</span>
              <input
                maxLength={30}
                placeholder="e.g. TM-PN-4821"
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
              />
            </label>

            {error ? <p className="form-error" role="alert">{error}</p> : null}

            <button className="setup-primary" type="submit">
              Continue <ArrowRight size={18} />
            </button>
          </form>
        ) : (
          <form className="setup-form shift-setup-form" onSubmit={saveSetup}>
            <div className="setup-title compact-title">
              <div className="setup-icon"><Clock3 size={23} /></div>
              <span>{mode === 'settings' ? 'Shift settings' : 'Almost ready'}</span>
              <h2>Set your shifts</h2>
              <p>Review your usual timings. You can edit them again later.</p>
            </div>

            <div className="editable-shifts">
              {draftShifts.map((shift) => (
                <article className="editable-shift" key={shift.code}>
                  <div className="editable-shift-name">
                    <strong>{shift.code}</strong>
                    <div><b>{shift.name}</b><span>{formatShiftTime(shift)}</span></div>
                  </div>
                  <div className="editable-shift-times">
                    <label>Start<input type="time" value={shift.startTime} onChange={(event) => updateShift(shift.code, 'startTime', event.target.value)} /></label>
                    <label>End<input type="time" value={shift.endTime} onChange={(event) => updateShift(shift.code, 'endTime', event.target.value)} /></label>
                  </div>
                </article>
              ))}
            </div>

            <div className="setup-row-grid">
              <label className="setup-label">
                Weekly off
                <select value={weeklyOff} onChange={(event) => setWeeklyOff(Number(event.target.value))}>
                  {WEEKDAYS.map((day, index) => <option key={day} value={index}>{day}</option>)}
                </select>
              </label>

              <fieldset className="cycle-choice">
                <legend><CalendarRange size={16} /> Attendance cycle</legend>
                <div>
                  {[26, 21, 1].map((day) => (
                    <button
                      className={cycleStartDay === day ? 'selected' : ''}
                      key={day}
                      type="button"
                      aria-pressed={cycleStartDay === day}
                      onClick={() => setCycleStartDay(day)}
                    >
                      {day === 1 ? '1–month end' : `${day}–${day - 1}`}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            {error ? <p className="form-error" role="alert">{error}</p> : null}

            <div className="setup-actions">
              <button className="setup-secondary" type="button" onClick={() => setStep(0)}>
                <ArrowLeft size={18} /> Profile
              </button>
              <button className="setup-primary" type="submit" disabled={isSaving}>
                {isSaving ? 'Saving…' : <><Check size={18} /> Save & continue</>}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? 'compact' : ''}`}>
      <span className="brand-mark" aria-hidden="true">S</span>
      <div><strong>Sentrio</strong>{!compact ? <span>Shift diary</span> : null}</div>
    </div>
  );
}
