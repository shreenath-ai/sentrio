'use client';

import { Download, FileUp, Printer, ShieldCheck, Smartphone } from 'lucide-react';
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { createBackup, parseBackup, restoreBackup, type BackupEnvelope } from './lib/backup';
import { attendanceCycleFor, dashboardPeriods, durationLabel, overtimeMinutesFor, periodSummary, type AttendanceRecord, type LanguageCode } from './lib/domain';
import { db } from './lib/db';
import { attendancePdf, attendanceCsv, downloadFile } from './lib/report-export';
import { copyFor, statusLabel } from './lib/i18n';

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function Reports({ initialNow, records, cycleStartDay, language, dataOnly = false }: {
  initialNow: Date;
  records: AttendanceRecord[];
  cycleStartDay: number;
  language: LanguageCode;
  dataOnly?: boolean;
}) {
  const copy = copyFor(language);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingBackup, setPendingBackup] = useState<BackupEnvelope | null>(null);
  const [message, setMessage] = useState('');
  const [period, setPeriod] = useState<'month' | 'cycle' | 'custom'>('month');
  const dates = dashboardPeriods(initialNow);
  const [customStart, setCustomStart] = useState(dates.monthStart);
  const [customEnd, setCustomEnd] = useState(dates.monthEnd);
  const [exporting, setExporting] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches,
  );
  const cycle = useMemo(() => attendanceCycleFor(initialNow, cycleStartDay), [cycleStartDay, initialNow]);
  const from = period === 'cycle' ? cycle.startKey : period === 'custom' ? customStart : dates.monthStart;
  const to = period === 'cycle' ? cycle.endKey : period === 'custom' ? customEnd : dates.monthEnd;
  const validPeriod = Boolean(from && to && from <= to);
  const totals = periodSummary(records, from, to);
  const selected = useMemo(
    () => records.filter((record) => record.date >= from && record.date <= to).sort((a, b) => a.date.localeCompare(b.date)),
    [from, to, records],
  );

  async function exportReport(format: 'pdf' | 'csv') {
    if (exporting || !validPeriod) return;
    setExporting(true); setMessage('');
    try {
      const profile = await db.profiles.get('default');
      const blob = format === 'pdf' ? await attendancePdf(selected, language, from, to, profile?.name ?? 'Sentrio') : new Blob([attendanceCsv(selected, language)], { type: 'text/csv;charset=utf-8' });
      downloadFile(blob, `sentrio-${from}-${to}.${format}`);
      setMessage(language === 'mr' ? 'अहवाल तयार आहे. डाउनलोड तपासा.' : 'Report ready. Check your downloads.');
    } catch { setMessage(language === 'mr' ? 'अहवाल तयार झाला नाही. पुन्हा प्रयत्न करा.' : 'Could not generate the report. Please try again.'); }
    finally { setExporting(false); }
  }

  useEffect(() => {
    const capture = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPrompt);
    };
    const markInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', capture);
    window.addEventListener('appinstalled', markInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', capture);
      window.removeEventListener('appinstalled', markInstalled);
    };
  }, []);

  async function downloadBackup() {
    const backup = await createBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sentrio-backup-${cycle.startKey}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage(copy.backupSaved);
  }

  async function chooseBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || file.size > 5_000_000) return setMessage(copy.restoreInvalid);
    try {
      setPendingBackup(await parseBackup(await file.text()));
      setMessage(copy.restorePreview);
    } catch {
      setPendingBackup(null);
      setMessage(copy.restoreInvalid);
    }
    event.target.value = '';
  }

  async function applyRestore(mode: 'merge' | 'replace') {
    if (!pendingBackup) return;
    await restoreBackup(pendingBackup, mode);
    setPendingBackup(null);
    setMessage(copy.restoreSuccess);
  }

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    if ((await installPrompt.userChoice).outcome === 'accepted') setInstalled(true);
    setInstallPrompt(null);
  }

  return (
    <section className={`reports-view screen-view ${dataOnly ? 'data-only' : 'report-only'}`}>
      <header className="screen-title"><h1>{language === 'mr' ? 'Sentrio अहवाल' : 'Sentrio Reports'}</h1><p>{language === 'mr' ? 'तुमच्या उपस्थितीची वैयक्तिक नोंद' : 'Your personal attendance ledger'}</p></header>
      {!dataOnly ? <>
        <div className="report-period dashboard-period-switch" role="group" aria-label={language === 'mr' ? 'अहवाल कालावधी' : 'Report period'}>{(['month', 'cycle', 'custom'] as const).map(value => <button type="button" key={value} aria-pressed={period === value} onClick={() => setPeriod(value)}>{language === 'mr' ? ({ month: 'हा महिना', cycle: 'कालावधी', custom: 'तारखा निवडा' })[value] : ({ month: 'This month', cycle: 'Attendance cycle', custom: 'Custom' })[value]}</button>)}</div>
        {period === 'custom' ? <div className="time-grid"><label>{language === 'mr' ? 'पासून' : 'From'}<input type="date" value={customStart} onChange={event => setCustomStart(event.target.value)} /></label><label>{language === 'mr' ? 'पर्यंत' : 'To'}<input type="date" value={customEnd} onChange={event => setCustomEnd(event.target.value)} /></label></div> : null}
        <p className="ledger-range">{from} – {to}</p>
        <article className="report-summary-card"><h2>{language === 'mr' ? 'उपस्थितीचा आढावा' : 'Attendance summary'}</h2><div className="report-status-totals">{(['PRESENT', 'ABSENT', 'WEEKLY_OFF', 'LEAVE'] as const).map(status => <div key={status} className={`report-count-${status.toLowerCase()}`}><span>{statusLabel(language, status)}</span><strong>{totals.counts[status]}</strong></div>)}</div>{totals.counts.HALF_DAY || totals.counts.HOLIDAY ? <p className="ledger-range">{statusLabel(language, 'HALF_DAY')}: {totals.counts.HALF_DAY} · {statusLabel(language, 'HOLIDAY')}: {totals.counts.HOLIDAY}</p> : null}<p className="report-ot-total">{language === 'mr' ? 'एकूण जादा वेळ' : 'Total overtime'}<strong>{durationLabel(totals.overtimeMinutes, language)}</strong></p></article>
        {!validPeriod ? <p role="alert">{language === 'mr' ? 'योग्य तारखा निवडा.' : 'Choose a valid date range.'}</p> : null}
        <article className="report-export-card"><h2>{language === 'mr' ? 'अहवाल डाउनलोड करा' : 'Export your diary'}</h2><button className="setup-primary" type="button" disabled={exporting || !validPeriod} onClick={() => void exportReport('pdf')}><Download size={20} />{exporting ? (language === 'mr' ? 'तयार करत आहे…' : 'Preparing…') : (language === 'mr' ? 'PDF अहवाल डाउनलोड करा' : 'Download PDF report')}</button><button className="setup-secondary" type="button" disabled={exporting || !validPeriod} onClick={() => void exportReport('csv')}>{language === 'mr' ? 'CSV निर्यात करा' : 'Export CSV'}</button><p>{language === 'mr' ? 'या फोनवर तयार होतो. माहिती अपलोड होत नाही.' : 'Generated on this device. Your records are not uploaded.'}</p>{message ? <p role="status">{message}</p> : null}</article>
      </> : null}
      <article className="report-card report-print-area">
        <div className="card-heading report-heading"><div><h2>{copy.periodReport}</h2><p>{from} – {to}</p></div><button type="button" onClick={() => window.print()}><Printer />{copy.printReport}</button></div>
        <div className="report-totals"><strong>{selected.length}</strong><span>{copy.totalMarked}</span><span>OT: {durationLabel(selected.reduce((sum, record) => sum + overtimeMinutesFor(record), 0), language)}</span></div>
        {selected.length ? (
          <div className="report-table-wrap"><table><thead><tr><th>{copy.date}</th><th>{copy.status}</th><th>{copy.shift}</th><th>{copy.checkIn}</th><th>{copy.checkOut}</th><th>OT</th></tr></thead><tbody>
            {selected.map((record) => <tr key={record.id}><td>{record.date}</td><td>{statusLabel(language, record.status)}</td><td>{record.shiftCode}</td><td>{record.checkIn || '—'}</td><td>{record.checkOut || '—'}</td><td>{durationLabel(overtimeMinutesFor(record), language)}</td></tr>)}
          </tbody></table></div>
        ) : <p className="empty-copy">{copy.noEntries}</p>}
      </article>
      <article className="data-card">
        <div className="card-heading"><ShieldCheck /><div><h2>{copy.dataSafety}</h2><p>{copy.dataSafetyHelper}</p></div></div>
        <div className="data-actions"><button type="button" onClick={() => void downloadBackup()}><Download />{copy.saveBackup}</button><button type="button" onClick={() => inputRef.current?.click()}><FileUp />{copy.restoreBackup}</button></div>
        <input ref={inputRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={(event) => void chooseBackup(event)} />
        {message && <p className="data-message" role="status">{message}</p>}
        {pendingBackup && <div className="restore-confirm"><p>{pendingBackup.data.attendanceRecords.length} {copy.totalMarked} · {new Date(pendingBackup.exportedAt).toLocaleDateString(language === 'mr' ? 'mr-IN' : 'en-IN')}</p><div><button type="button" onClick={() => void applyRestore('merge')}>{copy.restoreMerge}</button><button className="danger" type="button" onClick={() => void applyRestore('replace')}>{copy.restoreReplace}</button></div></div>}
      </article>
      <article className="install-card">
        <div className="card-heading"><Smartphone /><div><h2>{copy.installApp}</h2><p>{copy.installHelper}</p></div></div>
        {installed ? <p className="installed-state"><ShieldCheck />{copy.installed}</p> : installPrompt ? <button type="button" onClick={() => void install()}>{copy.install}</button> : <p className="install-hint">{copy.installUnavailable}</p>}
      </article>
    </section>
  );
}
