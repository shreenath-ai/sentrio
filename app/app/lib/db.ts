import Dexie, { type EntityTable } from 'dexie';
import {
  type AppSettings,
  type AttendanceRecord,
  DEFAULT_SHIFTS,
  type ShiftCode,
  type ShiftConfig,
  type WorkProfile,
} from './domain';

type MetaRecord = {
  key: string;
  value: string;
  updatedAt: string;
};

type LegacyAttendanceRecord = {
  date: string;
  shift: ShiftCode;
  status: AttendanceRecord['status'];
  checkIn?: string;
  checkOut?: string;
  note?: string;
  updatedAt?: string;
};

class SentrioDatabase extends Dexie {
  profiles!: EntityTable<WorkProfile, 'id'>;
  shiftConfigs!: EntityTable<ShiftConfig, 'code'>;
  settings!: EntityTable<AppSettings, 'id'>;
  attendanceRecords!: EntityTable<AttendanceRecord, 'id'>;
  meta!: EntityTable<MetaRecord, 'key'>;

  constructor() {
    super('sentrio');
    this.version(1).stores({
      profiles: 'id, onboardingComplete, language',
      shiftConfigs: 'code, enabled',
      settings: 'id',
      attendanceRecords: 'id, date, status, shiftCode, updatedAt',
      meta: 'key',
    });
  }
}

export const db = new SentrioDatabase();

const LEGACY_STORAGE_KEY = 'sentrio.attendance.v1';
const LEGACY_MIGRATION_KEY = 'migration.localStorageAttendance.v1';

export async function initializeDatabase() {
  await db.open();
  const timestamp = new Date().toISOString();

  await db.transaction(
    'rw',
    [
      db.profiles,
      db.shiftConfigs,
      db.settings,
      db.attendanceRecords,
      db.meta,
    ],
    async () => {
      if (!(await db.profiles.get('default'))) {
        await db.profiles.add({
          id: 'default',
          name: '',
          employeeId: '',
          language: 'en',
          onboardingComplete: false,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }

      if ((await db.shiftConfigs.count()) === 0) {
        await db.shiftConfigs.bulkAdd(
          DEFAULT_SHIFTS.map((shift) => ({ ...shift, updatedAt: timestamp })),
        );
      }

      if (!(await db.settings.get('app'))) {
        await db.settings.add({
          id: 'app',
          weeklyOff: 0,
          cycleStartDay: 26,
          defaultShift: 'A',
          defaultStatus: 'PRESENT',
          updatedAt: timestamp,
        });
      }

      if (!(await db.meta.get(LEGACY_MIGRATION_KEY))) {
        const legacyJson = window.localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacyJson) {
          try {
            const legacyRecords = JSON.parse(legacyJson) as Record<
              string,
              LegacyAttendanceRecord
            >;
            const shiftMap = new Map(
              DEFAULT_SHIFTS.map((shift) => [shift.code, shift]),
            );
            const migrated = Object.values(legacyRecords).flatMap((record) => {
              const shift = shiftMap.get(record.shift);
              if (!shift || !record.date || !record.status) return [];
              return [
                {
                  id: record.date,
                  date: record.date,
                  shiftCode: record.shift,
                  shiftName: shift.name,
                  shiftStartTime: shift.startTime,
                  shiftEndTime: shift.endTime,
                  status: record.status,
                  checkIn: record.checkIn ?? '',
                  checkOut: record.checkOut ?? '',
                  note: record.note ?? '',
                  createdAt: record.updatedAt ?? timestamp,
                  updatedAt: record.updatedAt ?? timestamp,
                } satisfies AttendanceRecord,
              ];
            });
            if (migrated.length > 0) {
              await db.attendanceRecords.bulkPut(migrated);
            }
          } catch {
            // A malformed legacy value is ignored; the new database remains valid.
          }
        }

        await db.meta.put({
          key: LEGACY_MIGRATION_KEY,
          value: 'complete',
          updatedAt: timestamp,
        });
      }
    },
  );
}
