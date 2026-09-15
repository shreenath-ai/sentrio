import { describe, expect, it } from 'vitest';
import { attendanceCsv } from '../app/lib/report-export';
import { periodSummary, type AttendanceRecord } from '../app/lib/domain';

const record: AttendanceRecord = { id: '2026-09-14', date: '2026-09-14', shiftCode: 'C', shiftName: 'Night', shiftStartTime: '23:30', shiftEndTime: '07:00', status: 'PRESENT', checkIn: '23:30', checkOut: '07:00', overtimeMinutes: 90, note: 'Motor, "repair"\ncomplete', createdAt: '2026-09-14T00:00:00Z', updatedAt: '2026-09-14T00:00:00Z' };
describe('redesigned report exports', () => {
  it('exports overtime separately and escapes commas, quotes and line breaks', () => {
    const csv = attendanceCsv([record], 'en');
    expect(csv).toContain('"90"');
    expect(csv).toContain('"Motor, ""repair""\ncomplete"');
    expect(csv).toContain('"23:30","07:00"');
  });
  it('neutralizes spreadsheet formulas in notes', () => {
    expect(attendanceCsv([{ ...record, note: '=1+1' }], 'en')).toContain('"\'=1+1"');
  });
  it('preserves Marathi text in CSV', () => {
    const csv = attendanceCsv([{ ...record, note: 'पाळी पूर्ण झाली' }], 'mr');
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('पाळी पूर्ण झाली');
    expect(csv).toContain('उपस्थित');
  });
  it('keeps old categories separate and does not count unmarked dates as absent', () => {
    const summary = periodSummary([record, { ...record, id: 'half', date: '2026-09-13', status: 'HALF_DAY' }, { ...record, id: 'holiday', date: '2026-09-12', status: 'HOLIDAY' }], '2026-09-01', '2026-09-14');
    expect(summary.marked).toBe(3);
    expect(summary.counts.ABSENT).toBe(0);
    expect(summary.counts.HALF_DAY).toBe(1);
    expect(summary.counts.HOLIDAY).toBe(1);
    expect(summary.overtimeMinutes).toBe(180);
  });
});
