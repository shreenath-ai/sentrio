import 'fake-indexeddb/auto';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  attendanceCycleFor,
  elapsedSeconds,
  workedMinutes,
  dashboardPeriods,
  periodSummary,
  overtimeMinutesFor,
  type AttendanceRecord,
} from '../app/lib/domain';

const storage = new Map<string, string>();
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
    },
  },
});

let databaseModule: typeof import('../app/lib/db');
let backupModule: typeof import('../app/lib/backup');

const nightRecord: AttendanceRecord = {
  id: '2026-08-30',
  date: '2026-08-30',
  shiftCode: 'C',
  shiftName: 'Night',
  shiftStartTime: '23:30',
  shiftEndTime: '07:00',
  status: 'PRESENT',
  checkIn: '23:30',
  checkOut: '07:00',
  note: 'overnight',
  createdAt: '2026-08-30T19:30:00.000Z',
  updatedAt: '2026-08-31T03:00:00.000Z',
};

beforeAll(async () => {
  databaseModule = await import('../app/lib/db');
  backupModule = await import('../app/lib/backup');
});

beforeEach(async () => {
  storage.clear();
  databaseModule.db.close();
  await databaseModule.db.delete();
  await databaseModule.initializeDatabase();
});

describe('attendance cycles and shift time', () => {
  it('calculates a 26-to-25 cycle across a year boundary', () => {
    const cycle = attendanceCycleFor(new Date('2027-01-05T12:00:00'), 26);
    expect(cycle.startKey).toBe('2026-12-26');
    expect(cycle.endKey).toBe('2027-01-25');
    expect(cycle.totalDays).toBe(31);
  });

  it('calculates overnight Shift C duration', () => {
    expect(workedMinutes('23:30', '07:00')).toBe(450);
    expect(elapsedSeconds('2026-08-30', '23:30', new Date('2026-08-31T01:00:00'))).toBe(5_400);
  });
});

describe('backup and restore', () => {
  it('round-trips overtime without changing legacy records', async () => {
    const withOT = { ...nightRecord, overtimeMinutes: 95 };
    await databaseModule.db.attendanceRecords.put(withOT);
    const backup = await backupModule.parseBackup(JSON.stringify(await backupModule.createBackup()));
    await backupModule.restoreBackup(backup, 'replace');
    expect((await databaseModule.db.attendanceRecords.get(withOT.id))?.overtimeMinutes).toBe(95);
    expect(overtimeMinutesFor(nightRecord)).toBe(0);
  });

  it('rejects invalid overtime in backup data', async () => {
    await databaseModule.db.attendanceRecords.put({ ...nightRecord, overtimeMinutes: -1 });
    await expect(backupModule.parseBackup(JSON.stringify(await backupModule.createBackup()))).rejects.toThrow('Invalid backup');
  });
  it('creates and validates a checksummed backup', async () => {
    await databaseModule.db.attendanceRecords.put(nightRecord);
    const backup = await backupModule.createBackup();
    const parsed = await backupModule.parseBackup(JSON.stringify(backup));
    expect(parsed.checksum).toHaveLength(64);
    expect(parsed.data.attendanceRecords).toEqual([nightRecord]);
  });

  it('rejects a backup changed after export', async () => {
    await databaseModule.db.attendanceRecords.put(nightRecord);
    const backup = await backupModule.createBackup();
    backup.data.attendanceRecords[0].note = 'tampered';
    await expect(backupModule.parseBackup(JSON.stringify(backup))).rejects.toThrow('checksum');
  });

  it('supports safe merge and complete replacement restore modes', async () => {
    await databaseModule.db.attendanceRecords.put(nightRecord);
    const backup = await backupModule.createBackup();
    const second = { ...nightRecord, id: '2026-08-31', date: '2026-08-31' };
    await databaseModule.db.attendanceRecords.put(second);

    await backupModule.restoreBackup(backup, 'merge');
    expect(await databaseModule.db.attendanceRecords.count()).toBe(2);

    await backupModule.restoreBackup(backup, 'replace');
    expect(await databaseModule.db.attendanceRecords.toArray()).toEqual([nightRecord]);
  });
});

describe('dashboard overtime totals', () => {
  it('keeps weekly and monthly periods separate across a month boundary', () => {
    const periods = dashboardPeriods(new Date('2026-09-02T12:00:00'));
    expect(periods.weekStart).toBe('2026-08-31');
    expect(periods.weekEnd).toBe('2026-09-06');
    const records = [
      { ...nightRecord, date: '2026-08-31', overtimeMinutes: 90 },
      { ...nightRecord, date: '2026-09-01', overtimeMinutes: 45 },
      { ...nightRecord, date: '2026-09-02', status: 'ABSENT' as const, overtimeMinutes: 120 },
    ];
    expect(periodSummary(records, periods.weekStart, '2026-09-02').overtimeMinutes).toBe(135);
    const month = periodSummary(records, periods.monthStart, '2026-09-02');
    expect(month.overtimeMinutes).toBe(45);
    expect(month.workedDays).toBe(1);
    expect(month.regularMinutes).toBe(450);
  });
  it('treats identical punches as zero time and keeps OT separate', () => {
    expect(workedMinutes('07:00', '07:00')).toBe(0);
    const result = periodSummary([{ ...nightRecord, overtimeMinutes: 120 }], '2026-08-01', '2026-08-31');
    expect(result.regularMinutes).toBe(450);
    expect(result.overtimeMinutes).toBe(120);
  });
});
