'use client';

import {
  ArrowLeft,
  ArrowRight,
  CalendarRange,
  Check,
  Clock3,
  Globe2,
  CircleHelp,
  Info,
  LockKeyhole,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import { FormEvent, useState } from 'react';
import { db } from './lib/db';
import { Brand } from './brand';
import { shiftName } from './lib/i18n';
import {
  type AppSettings,
  formatShiftTime,
  type LanguageCode,
  type ShiftConfig,
  WEEKDAYS,
  type WorkProfile,
} from './lib/domain';

const ONBOARDING_COPY = {
  en: {
    privateByDesign: 'PRIVATE BY DESIGN', storyTitle: 'Your shifts,\nready every day.', storyBody: 'Set your routine once. Sentrio keeps your personal attendance diary ready—even without a connection.', stored: 'Stored on this device', back: 'Back', step: 'Step', of: 'of', welcome: 'Welcome to Sentrio', makeYours: 'Make the diary yours', details: 'A few details help personalize your private shift diary.', appLanguage: 'App language', englishHelp: 'Continue in English', name: 'Your name', namePlaceholder: 'e.g. Rohan Jadhav', employeeId: 'Employee ID', optional: 'Optional', employeePlaceholder: 'e.g. TM-PN-4821', continue: 'Continue', shiftSettings: 'Shift settings', almostReady: 'Almost ready', setShifts: 'Set your shifts', reviewTimes: 'Review your usual timings. You can edit them again later.', start: 'Start', end: 'End', weeklyOff: 'Weekly off', attendanceCycle: 'Attendance cycle', monthEnd: 'month end', profile: 'Profile', saving: 'Saving…', saveContinue: 'Save & continue', privacyPolicy: 'Privacy & data', helpSupport: 'Help & support', appVersion: 'Sentrio v1.0', privacyTitle: 'Your data stays private', privacyBody: 'Sentrio stores attendance in this browser on this device. It does not send attendance to an employer and contains no payroll, GPS, biometric, or advertising tracking.', privacyTip: 'Use Backup JSON before changing phones or clearing browser data.', helpTitle: 'How to use Sentrio', helpBody: 'Start Shift begins the live timer. Finish Shift records check-out. Use Diary to correct a day, Insights for totals, and Reports for printing or backup.', helpTip: 'For overnight Shift C, start before midnight and finish after midnight—the timer handles the date change.', close: 'Close', nameError: 'Enter your name to continue.', finishNameError: 'Enter your name to finish setup.', saveError: 'Setup could not be saved. Please try again.',
  },
  mr: {
    privateByDesign: 'गोपनीयतेला प्राधान्य', storyTitle: 'तुमच्या पाळ्या,\nदररोज तयार.', storyBody: 'तुमची दिनचर्या एकदा सेट करा. इंटरनेट नसतानाही Sentrio तुमची वैयक्तिक उपस्थिती दैनंदिनी तयार ठेवते.', stored: 'या फोनवर जतन केले', back: 'मागे', step: 'पायरी', of: 'पैकी', welcome: 'Sentrio मध्ये स्वागत', makeYours: 'दैनंदिनी तुमची बनवा', details: 'काही माहितीमुळे तुमची खाजगी पाळी दैनंदिनी वैयक्तिक होते.', appLanguage: 'ॲपची भाषा', englishHelp: 'इंग्रजीत सुरू ठेवा', name: 'तुमचे नाव', namePlaceholder: 'उदा. रोहन जाधव', employeeId: 'कर्मचारी क्रमांक', optional: 'ऐच्छिक', employeePlaceholder: 'उदा. TM-PN-4821', continue: 'पुढे', shiftSettings: 'पाळी सेटिंग्ज', almostReady: 'जवळजवळ तयार', setShifts: 'तुमच्या पाळ्या सेट करा', reviewTimes: 'नेहमीच्या वेळा तपासा. त्या नंतर पुन्हा बदलता येतील.', start: 'सुरुवात', end: 'शेवट', weeklyOff: 'साप्ताहिक सुट्टी', attendanceCycle: 'उपस्थिती कालावधी', monthEnd: 'महिना अखेर', profile: 'प्रोफाइल', saving: 'जतन करत आहे…', saveContinue: 'जतन करा आणि पुढे जा', privacyPolicy: 'गोपनीयता आणि माहिती', helpSupport: 'मदत', appVersion: 'Sentrio v1.0', privacyTitle: 'तुमची माहिती खाजगी राहते', privacyBody: 'Sentrio उपस्थिती या फोनवरील ब्राउझरमध्ये जतन करते. ती कंपनीकडे पाठवली जात नाही. यात पगार, GPS, बायोमेट्रिक किंवा जाहिरात ट्रॅकिंग नाही.', privacyTip: 'फोन बदलण्यापूर्वी किंवा ब्राउझर साफ करण्यापूर्वी JSON बॅकअप घ्या.', helpTitle: 'Sentrio कसे वापरावे', helpBody: 'पाळी सुरू करा दाबल्यावर लाइव्ह टायमर सुरू होतो. पाळी पूर्ण करा दाबल्यावर जाण्याची वेळ नोंदते. दैनंदिनीत दिवस बदला, आढाव्यात एकूण माहिती पहा आणि अहवालातून बॅकअप घ्या.', helpTip: 'रात्रीची C पाळी मध्यरात्रीपूर्वी सुरू करा आणि मध्यरात्रीनंतर पूर्ण करा—टायमर तारीख बदल योग्यरित्या हाताळतो.', close: 'बंद करा', nameError: 'पुढे जाण्यासाठी तुमचे नाव लिहा.', finishNameError: 'सेटअप पूर्ण करण्यासाठी तुमचे नाव लिहा.', saveError: 'सेटअप जतन झाला नाही. पुन्हा प्रयत्न करा.',
  },
} as const;

const WEEKDAYS_MR = ['रविवार', 'सोमवार', 'मंगळवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];

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
  const [infoPage, setInfoPage] = useState<'privacy' | 'help' | null>(null);
  const text = ONBOARDING_COPY[language];

  function continueToShifts(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError(text.nameError);
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
      setError(text.finishNameError);
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
      setError(text.saveError);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="onboarding-page">
      <aside className="onboarding-story">
        <Brand />
        <div>
          <span>{text.privateByDesign}</span>
          <h1>{text.storyTitle.split('\n').map((line) => <span key={line}>{line}<br /></span>)}</h1>
          <p>{text.storyBody}</p>
        </div>
        <p className="onboarding-privacy">
          <ShieldCheck size={18} /> {text.stored}
        </p>
      </aside>

      <section className="setup-panel">
        <header className="setup-header">
          <Brand compact />
          {mode === 'settings' ? (
            <button type="button" onClick={onClose} aria-label={text.close}>
              <ArrowLeft size={19} /> {text.back}
            </button>
          ) : (
            <span>{text.step} {step + 1} {text.of} 2</span>
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
              <span>{text.welcome}</span>
              <h2>{text.makeYours}</h2>
              <p>{text.details}</p>
            </div>

            <fieldset className="language-fieldset">
              <legend><Globe2 size={16} /> {text.appLanguage}</legend>
              <div className="language-options">
                <button
                  className={language === 'en' ? 'selected' : ''}
                  type="button"
                  aria-pressed={language === 'en'}
                  onClick={() => setLanguage('en')}
                >
                  <strong>English</strong><span>{text.englishHelp}</span>
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
              {text.name}
              <input
                autoComplete="name"
                autoFocus
                maxLength={60}
                placeholder={text.namePlaceholder}
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>

            <label className="setup-label">
              {text.employeeId} <span>{text.optional}</span>
              <input
                maxLength={30}
                placeholder={text.employeePlaceholder}
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
              />
            </label>

            {error ? <p className="form-error" role="alert">{error}</p> : null}

            <button className="setup-primary" type="submit">
              {text.continue} <ArrowRight size={18} />
            </button>
          </form>
        ) : (
          <form className="setup-form shift-setup-form" onSubmit={saveSetup}>
            <div className="setup-title compact-title">
              <div className="setup-icon"><Clock3 size={23} /></div>
              <span>{mode === 'settings' ? text.shiftSettings : text.almostReady}</span>
              <h2>{text.setShifts}</h2>
              <p>{text.reviewTimes}</p>
            </div>

            <div className="editable-shifts">
              {draftShifts.map((shift) => (
                <article className="editable-shift" key={shift.code}>
                  <div className="editable-shift-name">
                    <strong>{shift.code}</strong>
                    <div><b>{shiftName(language, shift.code, shift.name)}</b><span>{formatShiftTime(shift)}</span></div>
                  </div>
                  <div className="editable-shift-times">
                    <label>{text.start}<input type="time" value={shift.startTime} onChange={(event) => updateShift(shift.code, 'startTime', event.target.value)} /></label>
                    <label>{text.end}<input type="time" value={shift.endTime} onChange={(event) => updateShift(shift.code, 'endTime', event.target.value)} /></label>
                  </div>
                </article>
              ))}
            </div>

            <div className="setup-row-grid">
              <label className="setup-label">
                {text.weeklyOff}
                <select value={weeklyOff} onChange={(event) => setWeeklyOff(Number(event.target.value))}>
                  {WEEKDAYS.map((day, index) => <option key={day} value={index}>{language === 'mr' ? WEEKDAYS_MR[index] : day}</option>)}
                </select>
              </label>

              <fieldset className="cycle-choice">
                <legend><CalendarRange size={16} /> {text.attendanceCycle}</legend>
                <div>
                  {[26, 21, 1].map((day) => (
                    <button
                      className={cycleStartDay === day ? 'selected' : ''}
                      key={day}
                      type="button"
                      aria-pressed={cycleStartDay === day}
                      onClick={() => setCycleStartDay(day)}
                    >
                      {day === 1 ? `1–${text.monthEnd}` : `${day}–${day - 1}`}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            {error ? <p className="form-error" role="alert">{error}</p> : null}

            <div className="setup-actions">
              <button className="setup-secondary" type="button" onClick={() => setStep(0)}>
                <ArrowLeft size={18} /> {text.profile}
              </button>
              <button className="setup-primary" type="submit" disabled={isSaving}>
                {isSaving ? text.saving : <><Check size={18} /> {text.saveContinue}</>}
              </button>
            </div>
            {mode === 'settings' ? (
              <section className="settings-support" aria-label="About Sentrio">
                <button type="button" onClick={() => setInfoPage('privacy')}><LockKeyhole size={18} /><span><strong>{text.privacyPolicy}</strong><small>{text.stored}</small></span></button>
                <button type="button" onClick={() => setInfoPage('help')}><CircleHelp size={18} /><span><strong>{text.helpSupport}</strong><small>{text.appVersion}</small></span></button>
              </section>
            ) : null}
          </form>
        )}
      </section>
      {infoPage ? (
        <div className="info-backdrop" role="presentation" onMouseDown={() => setInfoPage(null)}>
          <section className="info-dialog" role="dialog" aria-modal="true" aria-labelledby="info-title" onMouseDown={(event) => event.stopPropagation()}>
            <header><span>{infoPage === 'privacy' ? <LockKeyhole /> : <Info />}</span><button type="button" onClick={() => setInfoPage(null)} aria-label={text.close}><X /></button></header>
            <h2 id="info-title">{infoPage === 'privacy' ? text.privacyTitle : text.helpTitle}</h2>
            <p>{infoPage === 'privacy' ? text.privacyBody : text.helpBody}</p>
            <aside><ShieldCheck size={18} />{infoPage === 'privacy' ? text.privacyTip : text.helpTip}</aside>
            <button className="setup-primary" type="button" onClick={() => setInfoPage(null)}>{text.close}</button>
          </section>
        </div>
      ) : null}
    </main>
  );
}
