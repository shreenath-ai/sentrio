'use client';
import { useState } from 'react';
import { UserRound, Clock3, ChevronRight, ShieldCheck, CircleHelp, Type } from 'lucide-react';
import { db } from './lib/db';
import { Reports } from './reports';
import { type WorkProfile, type AppSettings, type ShiftConfig, type AttendanceRecord, WEEKDAYS } from './lib/domain';

export function SettingsView({ profile, settings, shifts, records, now, onEdit }: { profile: WorkProfile; settings: AppSettings; shifts: ShiftConfig[]; records: AttendanceRecord[]; now: Date; onEdit: () => void }) {
  const mr = profile.language === 'mr';
  const [message, setMessage] = useState('');
  const [large, setLarge] = useState(() => typeof window !== 'undefined' && localStorage.getItem('sentrio-large-text') === 'true');
  async function language(value: 'en' | 'mr') { try { await db.profiles.update('default', { language: value, updatedAt: new Date().toISOString() }); } catch { setMessage(mr ? 'जतन झाले नाही. पुन्हा प्रयत्न करा.' : 'Could not save. Please try again.'); } }
  function textSize(value: boolean) { try { localStorage.setItem('sentrio-large-text', String(value)); document.documentElement.style.fontSize = value ? '18px' : '16px'; setLarge(value); } catch { setMessage(mr ? 'अक्षरांचा आकार जतन झाला नाही.' : 'Could not save text size.'); } }
  return <section className="settings-view">
    <header className="screen-title"><h1>{mr ? 'सेटिंग्ज' : 'Settings'}</h1><p>{mr ? 'प्राधान्ये आणि तुमची दैनंदिनी' : 'Preferences & your diary'}</p></header>
    <h2 className="settings-section-label"><UserRound size={18} />{mr ? 'प्रोफाइल आणि भाषा' : 'Profile & language'}</h2>
    <article className="settings-group">
      <button className="settings-row" type="button" onClick={onEdit}><span><small>{mr ? 'तुमचे नाव' : 'Your name'}</small><strong>{profile.name}</strong></span><ChevronRight /></button>
      <button className="settings-row" type="button" onClick={onEdit}><span><small>{mr ? 'कर्मचारी क्रमांक' : 'Employee ID · optional'}</small><strong>{profile.employeeId || '—'}</strong></span><ChevronRight /></button>
      <div className="settings-row-block"><strong>{mr ? 'ॲपची भाषा' : 'App language'}</strong><div className="dashboard-period-switch"><button type="button" aria-pressed={!mr} onClick={() => void language('en')}>English</button><button type="button" aria-pressed={mr} onClick={() => void language('mr')}>मराठी</button></div></div>
    </article>
    <h2 className="settings-section-label"><Clock3 size={18} />{mr ? 'पाळी सेटअप' : 'Shift setup'}</h2>
    <article className="settings-group">
      <button className="settings-row" type="button" onClick={onEdit}><span><small>{mr ? 'साप्ताहिक सुट्टी' : 'Weekly off'}</small><strong>{mr ? ['रविवार','सोमवार','मंगळवार','बुधवार','गुरुवार','शुक्रवार','शनिवार'][settings.weeklyOff] : WEEKDAYS[settings.weeklyOff]}</strong></span><ChevronRight /></button>
      <button className="settings-row" type="button" onClick={onEdit}><span><small>{mr ? 'उपस्थिती कालावधी' : 'Attendance cycle'}</small><strong>{settings.cycleStartDay === 1 ? (mr ? 'कॅलेंडर महिना' : 'Calendar month') : `${settings.cycleStartDay} – ${settings.cycleStartDay - 1}`}</strong></span><ChevronRight /></button>
      <button className="settings-row" type="button" onClick={onEdit}><span><small>{mr ? 'पाळीच्या वेळा' : 'Shift timings'}</small><strong>{shifts.filter(shift => shift.enabled).map(shift => shift.code).join(', ')}</strong></span><ChevronRight /></button>
    </article>
    <h2 className="settings-section-label"><Type size={18} />{mr ? 'ॲप प्राधान्ये' : 'App preferences'}</h2>
    <article className="settings-group"><div className="settings-row-block"><strong>{mr ? 'अक्षरांचा आकार' : 'Text size'}</strong><div className="dashboard-period-switch"><button type="button" aria-pressed={!large} onClick={() => textSize(false)}>{mr ? 'सामान्य' : 'Standard'}</button><button type="button" aria-pressed={large} onClick={() => textSize(true)}>{mr ? 'मोठा' : 'Large'}</button></div></div><div className="settings-row"><span>{mr ? 'थीम' : 'Theme'}</span><strong>{mr ? 'पॉकेट दैनंदिनी' : 'Pocket diary'}</strong></div></article>
    <h2 className="settings-section-label"><ShieldCheck size={18} />{mr ? 'माहिती आणि बॅकअप' : 'Data & backups'}</h2>
    <Reports initialNow={now} records={records} cycleStartDay={settings.cycleStartDay} language={profile.language} dataOnly />
    <article className="settings-group"><div className="settings-row"><span>Google Calendar</span><small>{mr ? 'अद्याप उपलब्ध नाही' : 'Not available yet'}</small></div></article>
    <h2 className="settings-section-label"><CircleHelp size={18} />{mr ? 'मदत आणि गोपनीयता' : 'Help & privacy'}</h2>
    <article className="settings-group settings-help"><details><summary>{mr ? 'Sentrio कसे वापरावे' : 'How Sentrio works'}</summary><p>{mr ? 'उपस्थिती नोंदवा, दैनंदिनीत तारीख निवडून नोंद बदला. जादा वेळ वेगळा नोंदवा. अहवालातून PDF मिळवा.' : 'Mark attendance on Dashboard. Select a day in Diary to edit it. Record extra hours separately as OT. Use Reports to export your attendance.'}</p></details><details><summary>{mr ? 'तुमची माहिती कुठे असते?' : 'Where is my data stored?'}</summary><p>{mr ? 'या ब्राउझरमध्ये, या फोनवर. फोन बदलण्यापूर्वी किंवा ब्राउझर साफ करण्यापूर्वी बॅकअप घ्या.' : 'Your records are stored in this browser on this device. They are not sent to your employer. Download a backup before changing devices or clearing browser data.'}</p></details></article>
    {message ? <p role="alert">{message}</p> : null}
  </section>;
}
