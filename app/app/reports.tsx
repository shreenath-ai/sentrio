'use client';

import { Download, FileUp, Printer, ShieldCheck, Smartphone } from 'lucide-react';
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { createBackup, parseBackup, restoreBackup, type BackupEnvelope } from './lib/backup';
import { attendanceCycleFor, type AttendanceRecord, type LanguageCode } from './lib/domain';
import { copyFor, statusLabel } from './lib/i18n';

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function Reports({ initialNow, records, cycleStartDay, language }: {
  initialNow: Date;
  records: AttendanceRecord[];
  cycleStartDay: number;
  language: LanguageCode;
}) {
  const copy = copyFor(language);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingBackup, setPendingBackup] = useState<BackupEnvelope | null>(null);
  const [message, setMessage] = useState('');
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches,
  );
  const cycle = useMemo(() => attendanceCycleFor(initialNow, cycleStartDay), [cycleStartDay, initialNow]);
  const selected = useMemo(
    () => records.filter((record) => record.date >= cycle.startKey && record.date <= cycle.endKey).sort((a, b) => a.date.localeCompare(b.date)),
    [cycle.endKey, cycle.startKey, records],
  );

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
    <section className="reports-view screen-view">
      <header className="screen-title"><span className="eyebrow">{copy.reports}</span><h1>{copy.reportsTitle}</h1><p>{copy.reportsHelper}</p></header>
      <article className="report-card report-print-area">
        <div className="card-heading report-heading"><div><h2>{copy.periodReport}</h2><p>{cycle.label}</p></div><button type="button" onClick={() => window.print()}><Printer />{copy.printReport}</button></div>
        <div className="report-totals"><strong>{selected.length}</strong><span>{copy.totalMarked}</span></div>
        {selected.length ? (
          <div className="report-table-wrap"><table><thead><tr><th>{copy.date}</th><th>{copy.status}</th><th>{copy.shift}</th><th>{copy.checkIn}</th><th>{copy.checkOut}</th></tr></thead><tbody>
            {selected.map((record) => <tr key={record.id}><td>{record.date}</td><td>{statusLabel(language, record.status)}</td><td>{record.shiftCode}</td><td>{record.checkIn || '—'}</td><td>{record.checkOut || '—'}</td></tr>)}
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
