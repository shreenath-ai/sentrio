import { jsPDF } from 'jspdf';
import { durationLabel, overtimeMinutesFor, type AttendanceRecord, type LanguageCode } from './domain';
import { statusLabel } from './i18n';

export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename;
  document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export function attendanceCsv(records: AttendanceRecord[], language: LanguageCode) {
  const cell = (value: string) => `"${(/^[=+\-@\t\r]/.test(value) ? "'" : '') + value.replaceAll('"', '""')}"`;
  const rows = [['Date', 'Status', 'Shift', 'Check-in', 'Check-out', 'OT minutes', 'Note'], ...records.map(record => [record.date, statusLabel(language, record.status), record.shiftCode, record.checkIn, record.checkOut, String(overtimeMinutesFor(record)), record.note])];
  return '\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n');
}

/** Draw only report rows, not a screenshot of the app. Canvas shapes Indic text correctly. */
export async function attendancePdf(records: AttendanceRecord[], language: LanguageCode, from: string, to: string, name: string) {
  await document.fonts.ready;
  const mr = language === 'mr';
  const bodyFont = getComputedStyle(document.body).fontFamily;
  const canvas = document.createElement('canvas'); canvas.width = 1240; canvas.height = 1754;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('PDF rendering is unavailable');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  let page = 0; let y = 0;
  const text = (value: string, x: number, top: number, size = 22, bold = false) => { ctx.font = `${bold ? '600' : '400'} ${size}px ${bodyFont}`; ctx.fillStyle = '#262820'; ctx.fillText(value, x, top); };
  const wrap = (value: string, width: number) => {
    ctx.font = `400 21px ${bodyFont}`;
    const lines: string[] = []; let current = '';
    for (const char of value) {
      if (char === '\n' || (current && ctx.measureText(current + char).width > width)) { lines.push(current); current = char === '\n' ? '' : char; } else current += char;
    }
    if (current) lines.push(current);
    return lines;
  };
  function startPage() {
    ctx!.fillStyle = '#ffffff'; ctx!.fillRect(0, 0, 1240, 1754);
    text('Sentrio', 70, 95, 42, true);
    text(mr ? 'वैयक्तिक उपस्थिती अहवाल' : 'Personal attendance report', 70, 137, 24);
    text(`${from} - ${to}`, 70, 176, 22);
    text(name, 70, 216, 22);
    ctx!.fillStyle = '#eeefe2'; ctx!.fillRect(60, 244, 1120, 48);
    [mr ? 'तारीख' : 'Date', mr ? 'उपस्थिती' : 'Status', mr ? 'पाळी' : 'Shift', mr ? 'येणे / जाणे' : 'In / Out', 'OT'].forEach((label, i) => text(label, [75, 310, 560, 710, 1000][i], 277, 21, true));
    y = 332;
  }
  function endPage() {
    text(`${mr ? 'पान' : 'Page'} ${page + 1}`, 70, 1670, 18);
    text(mr ? 'वैयक्तिक नोंदी · कंपनीचा प्रमाणित अहवाल नाही' : 'Personal records · Not an employer-certified report', 310, 1670, 18);
    if (page > 0) pdf.addPage();
    pdf.addImage(canvas.toDataURL('image/jpeg', .92), 'JPEG', 0, 0, 210, 297);
    page++;
  }
  startPage();
  for (const record of records) {
    if (y > 1510) { endPage(); startPage(); }
    text(record.date, 75, y, 21);
    text(statusLabel(language, record.status), 310, y, 21);
    text(record.shiftCode, 560, y, 21);
    text(`${record.checkIn || '-'} / ${record.checkOut || '-'}`, 710, y, 21);
    text(durationLabel(overtimeMinutesFor(record), language), 1000, y, 21);
    y += 34;
    for (const line of wrap(record.note, 1080)) {
      if (y > 1540) { endPage(); startPage(); }
      text(line, 90, y, 21); y += 30;
    }
    ctx.strokeStyle = '#d9dccf'; ctx.beginPath(); ctx.moveTo(70, y); ctx.lineTo(1170, y); ctx.stroke(); y += 40;
  }
  if (y > 1480) { endPage(); startPage(); }
  text(`${mr ? 'नोंदवलेले दिवस' : 'Days recorded'}: ${records.length}`, 75, y + 20, 24, true);
  text(`OT: ${durationLabel(records.reduce((sum, row) => sum + overtimeMinutesFor(row), 0), language)}`, 710, y + 20, 24, true);
  endPage();
  return pdf.output('blob');
}
