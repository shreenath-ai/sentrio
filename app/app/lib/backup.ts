import { db } from './db';
import type {
  AppSettings,
  AttendanceRecord,
  RotationPlan,
  ShiftConfig,
  WorkProfile,
} from './domain';

export type BackupData = {
  profile: WorkProfile;
  settings: AppSettings;
  shifts: ShiftConfig[];
  rotationPlan: RotationPlan;
  attendanceRecords: AttendanceRecord[];
};

export type BackupEnvelope = {
  format: 'sentrio-backup';
  schemaVersion: 1;
  exportedAt: string;
  data: BackupData;
  checksum: string;
};

async function checksumFor(data: BackupData) {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

export async function createBackup(): Promise<BackupEnvelope> {
  const [profile, settings, shifts, rotationPlan, attendanceRecords] =
    await Promise.all([
      db.profiles.get('default'),
      db.settings.get('app'),
      db.shiftConfigs.toArray(),
      db.rotationPlans.get('rotation'),
      db.attendanceRecords.toArray(),
    ]);

  if (!profile || !settings || !rotationPlan) {
    throw new Error('Sentrio data is incomplete.');
  }

  const data = { profile, settings, shifts, rotationPlan, attendanceRecords };
  return {
    format: 'sentrio-backup',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    data,
    checksum: await checksumFor(data),
  };
}

function isBackupData(value: unknown): value is BackupData {
  if (!value || typeof value !== 'object') return false;
  const data = value as Partial<BackupData>;
  return (
    data.profile?.id === 'default' &&
    data.settings?.id === 'app' &&
    data.rotationPlan?.id === 'rotation' &&
    Array.isArray(data.shifts) &&
    Array.isArray(data.attendanceRecords) &&
    data.attendanceRecords.every(
      (record) =>
        record &&
        typeof record.id === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(record.date) &&
        typeof record.status === 'string',
    )
  );
}

export async function parseBackup(text: string): Promise<BackupEnvelope> {
  const value = JSON.parse(text) as Partial<BackupEnvelope>;
  if (
    value.format !== 'sentrio-backup' ||
    value.schemaVersion !== 1 ||
    !value.data ||
    !isBackupData(value.data) ||
    typeof value.checksum !== 'string'
  ) {
    throw new Error('Invalid backup');
  }
  if ((await checksumFor(value.data)) !== value.checksum) {
    throw new Error('Backup checksum mismatch');
  }
  return value as BackupEnvelope;
}

export async function restoreBackup(
  backup: BackupEnvelope,
  mode: 'merge' | 'replace',
) {
  const { data } = backup;
  await db.transaction(
    'rw',
    [
      db.profiles,
      db.settings,
      db.shiftConfigs,
      db.rotationPlans,
      db.attendanceRecords,
    ],
    async () => {
      if (mode === 'replace') {
        await Promise.all([
          db.profiles.clear(),
          db.settings.clear(),
          db.shiftConfigs.clear(),
          db.rotationPlans.clear(),
          db.attendanceRecords.clear(),
        ]);
      }
      await db.profiles.put(data.profile);
      await db.settings.put(data.settings);
      await db.shiftConfigs.bulkPut(data.shifts);
      await db.rotationPlans.put(data.rotationPlan);
      await db.attendanceRecords.bulkPut(data.attendanceRecords);
    },
  );
}
