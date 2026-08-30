export type ShiftCode = 'A' | 'B' | 'C' | 'G';

export type AttendanceStatus =
  | 'PRESENT'
  | 'HALF_DAY'
  | 'ABSENT'
  | 'WEEKLY_OFF'
  | 'HOLIDAY'
  | 'LEAVE';

export type LanguageCode = 'en' | 'mr';

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
