import {
  localDateKey,
  parseDateKey,
  plannedShiftForDate,
  type RotationPlan,
  type ShiftConfig,
} from './domain';

type BuildCalendarInput = {
  startDate: string;
  numberOfDays: number;
  rotationPlan: RotationPlan;
  shifts: ShiftConfig[];
  weeklyOff: number;
};

export type CalendarExportResult = {
  content: string;
  eventCount: number;
  endDate: string;
};

function addDays(dateKey: string, amount: number) {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + amount);
  return localDateKey(date);
}

function compactDateTime(dateKey: string, time: string) {
  return `${dateKey.replaceAll('-', '')}T${time.replace(':', '')}00`;
}

function utcStamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeIcsText(value: string) {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('\n', '\\n')
    .replaceAll(',', '\\,')
    .replaceAll(';', '\\;');
}

function foldIcsLine(line: string) {
  if (line.length <= 74) return [line];
  const folded = [line.slice(0, 74)];
  for (let index = 74; index < line.length; index += 73) {
    folded.push(` ${line.slice(index, index + 73)}`);
  }
  return folded;
}

export function buildShiftCalendar({
  startDate,
  numberOfDays,
  rotationPlan,
  shifts,
  weeklyOff,
}: BuildCalendarInput): CalendarExportResult {
  const shiftMap = new Map(shifts.map((shift) => [shift.code, shift]));
  const stamp = utcStamp(new Date());
  const events: string[] = [];

  for (let offset = 0; offset < numberOfDays; offset += 1) {
    const dateKey = addDays(startDate, offset);
    const shiftCode = plannedShiftForDate(dateKey, rotationPlan, weeklyOff);
    const shift = shiftCode ? shiftMap.get(shiftCode) : undefined;
    if (!shift) continue;

    const endsNextDay = shift.endTime <= shift.startTime;
    const endDate = endsNextDay ? addDays(dateKey, 1) : dateKey;
    const summary = `Sentrio - Shift ${shift.code} (${shift.name})`;
    const description = `Planned shift ${shift.code}: ${shift.startTime}-${shift.endTime}. Created by Sentrio Shift Diary.`;

    events.push(
      [
        'BEGIN:VEVENT',
        `UID:sentrio-${dateKey}-${shift.code}@shift-diary.local`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${compactDateTime(dateKey, shift.startTime)}`,
        `DTEND:${compactDateTime(endDate, shift.endTime)}`,
        `SUMMARY:${escapeIcsText(summary)}`,
        `DESCRIPTION:${escapeIcsText(description)}`,
        'CATEGORIES:Work,Shift',
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        'END:VEVENT',
      ].join('\r\n'),
    );
  }

  const calendarLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sentrio//Shift Diary//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Sentrio Shift Plan',
    'X-WR-CALDESC:Personal shift plan exported from Sentrio',
    ...events,
    'END:VCALENDAR',
  ].flatMap((line) => line.split('\r\n'));
  const content = [...calendarLines.flatMap(foldIcsLine), ''].join('\r\n');

  return {
    content,
    eventCount: events.length,
    endDate: addDays(startDate, Math.max(numberOfDays - 1, 0)),
  };
}
