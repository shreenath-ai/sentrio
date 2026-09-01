export type ShiftCode = 'A' | 'B' | 'C' | 'G';

export type AttendanceStatus =
  | 'PRESENT'
  | 'HALF_DAY'
  | 'ABSENT'
  | 'WEEKLY_OFF'
  | 'HOLIDAY'
  | 'LEAVE';

export type LanguageCode = 'en' | 'mr';

export type RotationUnit = 'DAILY' | 'WEEKLY';

export type WorkProfile = {
  id: 'default';
  name: string;
  employeeId: string;
  language: LanguageCode;
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ShiftConfig = {
  code: ShiftCode;
  name: string;
  startTime: string;
  endTime: string;
  enabled: boolean;
  updatedAt: string;
};

export type AppSettings = {
  id: 'app';
  weeklyOff: number;
  cycleStartDay: number;
  defaultShift: ShiftCode;
  defaultStatus: AttendanceStatus;
  updatedAt: string;
};

export type AttendanceRecord = {
  id: string;
  date: string;
  shiftCode: ShiftCode;
  shiftName: string;
  shiftStartTime: string;
  shiftEndTime: string;
  status: AttendanceStatus;
  checkIn: string;
  checkOut: string;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type RotationPlan = {
  id: 'rotation';
  enabled: boolean;
  startDate: string;
  rotationUnit: RotationUnit;
  sequence: ShiftCode[];
  updatedAt: string;
};

export const DEFAULT_SHIFTS: ShiftConfig[] = [
  {
    code: 'A',
    name: 'Morning',
    startTime: '06:30',
    endTime: '15:00',
    enabled: true,
    updatedAt: '',
  },
  {
    code: 'B',
    name: 'Evening',
    startTime: '15:00',
    endTime: '23:30',
    enabled: true,
    updatedAt: '',
  },
  {
    code: 'C',
    name: 'Night',
    startTime: '23:30',
    endTime: '07:00',
    enabled: true,
    updatedAt: '',
  },
  {
    code: 'G',
    name: 'General',
    startTime: '08:30',
    endTime: '17:00',
    enabled: true,
    updatedAt: '',
  },
];

export const ATTENDANCE_STATUSES: Array<{
  value: AttendanceStatus;
  label: string;
  short: string;
}> = [
  { value: 'PRESENT', label: 'Present', short: 'P' },
  { value: 'HALF_DAY', label: 'Half Day', short: '½' },
  { value: 'ABSENT', label: 'Absent', short: 'A' },
  { value: 'WEEKLY_OFF', label: 'Weekly Off', short: 'W' },
  { value: 'HOLIDAY', label: 'Holiday', short: 'H' },
  { value: 'LEAVE', label: 'Leave', short: 'L' },
];

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export function formatShiftTime(shift: ShiftConfig) {
  return `${shift.startTime}–${shift.endTime}`;
}

export function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(value: string) {
  return new Date(`${value}T12:00:00`);
}

export function plannedShiftForDate(
  dateKey: string,
  plan: RotationPlan,
  weeklyOff: number,
) {
  const date = parseDateKey(dateKey);
  if (!plan.enabled || date.getDay() === weeklyOff || plan.sequence.length === 0) {
    return null;
  }

  const anchor = parseDateKey(plan.startDate);
  const dayDifference = Math.floor(
    (date.getTime() - anchor.getTime()) / 86_400_000,
  );
  const position =
    plan.rotationUnit === 'WEEKLY'
      ? Math.floor(dayDifference / 7)
      : dayDifference;
  const index = ((position % plan.sequence.length) + plan.sequence.length) % plan.sequence.length;
  return plan.sequence[index];
}

export function attendanceCycleFor(
  date: Date,
  cycleStartDay: number,
  monthOffset = 0,
) {
  const baseStart =
    date.getDate() >= cycleStartDay
      ? new Date(date.getFullYear(), date.getMonth(), cycleStartDay, 12)
      : new Date(date.getFullYear(), date.getMonth() - 1, cycleStartDay, 12);
  const start = new Date(
    baseStart.getFullYear(),
    baseStart.getMonth() + monthOffset,
    cycleStartDay,
    12,
  );
  const end = new Date(
    start.getFullYear(),
    start.getMonth() + 1,
    cycleStartDay - 1,
    12,
  );
  const totalDays = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  const short = (value: Date) =>
    value.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return {
    start,
    end,
    startKey: localDateKey(start),
    endKey: localDateKey(end),
    totalDays,
    label: `${short(start)} – ${short(end)}`,
  };
}

export function workedMinutes(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0;
  const [startHour, startMinute] = checkIn.split(':').map(Number);
  const [endHour, endMinute] = checkOut.split(':').map(Number);
  if ([startHour, startMinute, endHour, endMinute].some(Number.isNaN)) return 0;
  const start = startHour * 60 + startMinute;
  let end = endHour * 60 + endMinute;
  if (end <= start) end += 24 * 60;
  return Math.max(end - start, 0);
}

export function elapsedSeconds(dateKey: string, checkIn: string, now: Date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !/^\d{2}:\d{2}$/.test(checkIn)) return 0;
  const start = new Date(`${dateKey}T${checkIn}:00`);
  if (Number.isNaN(start.getTime())) return 0;
  return Math.max(0, Math.floor((now.getTime() - start.getTime()) / 1000));
}
