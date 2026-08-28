# Sentrio Domain Model

## 1. Modeling principles

- Sentrio stores personal attendance only; it contains no salary or payroll domain.
- Identifiers are generated locally and remain stable across backup/restore.
- Dates use `YYYY-MM-DD`; audit timestamps use ISO 8601 UTC instants.
- Times of day and durations use integer minutes.
- User-editable shift configuration is versioned by effective date.
- Attendance records snapshot their shift values to preserve history.
- Insights are calculated from source records, not duplicated as mutable counters.

## 2. Core types

```ts
export type LocalDate = string;
export type Instant = string;
export type Minutes = number;

export type ShiftCode = 'A' | 'B' | 'C' | 'G' | 'OFF' | (string & {});

export type AttendanceStatus =
  | 'PRESENT'
  | 'HALF_DAY'
  | 'ABSENT'
  | 'WEEKLY_OFF'
  | 'HOLIDAY'
  | 'LEAVE_CL'
  | 'LEAVE_PL'
  | 'LEAVE_SL'
  | 'LEAVE_CO';
```

The open-ended `ShiftCode` permits custom shift names while retaining the standard presets.

## 3. Entities

### Work profile

```ts
export interface WorkProfile {
  id: string;
  name: string;
  locale: 'mr-IN' | 'en-IN' | string;
  isActive: boolean;
  createdAt: Instant;
  updatedAt: Instant;
}
```

Employer name and employee number, if added, are optional diary metadata and are never required for core use.

### Shift configuration

```ts
export interface ShiftConfig {
  id: string;
  profileId: string;
  code: ShiftCode;
  name: string;
  startMinutes: Minutes | null;
  endMinutes: Minutes | null;
  scheduledBreakMinutes: Minutes;
  standardWorkedMinutes: Minutes;
  colorToken: string;
  effectiveFrom: LocalDate;
  effectiveTo: LocalDate | null;
}
```

Colors are semantic theme tokens rather than arbitrary CSS stored in domain records.

### Attendance record

```ts
export interface AttendanceRecord {
  id: string;
  profileId: string;
  workDate: LocalDate;
  status: AttendanceStatus;
  shiftCode: ShiftCode;
  shiftSnapshot: {
    name: string;
    startMinutes: Minutes | null;
    endMinutes: Minutes | null;
    scheduledBreakMinutes: Minutes;
    standardWorkedMinutes: Minutes;
  };
  actualStartAt: Instant | null;
  actualEndAt: Instant | null;
  actualBreakMinutes: Minutes | null;
  manualOvertimeMinutes: Minutes | null;
  note: string;
  source: 'QUICK_STAMP' | 'CLOCK' | 'MANUAL' | 'RESTORE';
  createdAt: Instant;
  updatedAt: Instant;
}
```

Invariant: a profile has at most one canonical attendance record for a `workDate`. Extra split-shift punches, if required later, belong in child `workSessions` rather than duplicate attendance records.

### Attendance-cycle rule

```ts
export interface AttendanceCycleRule {
  type: 'CALENDAR_MONTH' | 'MONTHLY_CUTOFF';
  endDay: number | null;
  invalidDayPolicy: 'CLAMP_TO_MONTH_END';
}
```

For a cutoff end day `D`, the next reporting period begins on the calendar day after the resolved prior cutoff and ends on the resolved current cutoff. An end day of 25 therefore produces a 26th–25th cycle.

### Holiday

```ts
export interface Holiday {
  id: string;
  profileId: string;
  date: LocalDate;
  name: string;
  source: 'USER' | 'ALMANAC_DATASET';
}
```

Holiday metadata never changes attendance automatically. The user chooses the actual status.

### Attendance summary

```ts
export interface AttendanceSummary {
  profileId: string;
  periodStart: LocalDate;
  periodEnd: LocalDate;
  statusCounts: Record<AttendanceStatus, number>;
  totalWorkedMinutes: Minutes;
  totalOvertimeMinutes: Minutes;
  shiftCounts: Record<string, number>;
  recordedDays: number;
  expectedWorkDays: number | null;
  attendancePermille: number | null;
  missingDates: LocalDate[];
  incompleteRecordIds: string[];
  sourceRecordIds: string[];
}
```

`sourceRecordIds` make every insight traceable to attendance inputs.

### Calendar sync records

```ts
export interface CalendarEventLink {
  id: string;
  attendanceRecordId: string;
  externalCalendarId: string;
  externalEventId: string;
  externalEtag: string | null;
  syncedRecordVersion: number;
  updatedAt: Instant;
}

export interface SyncJob {
  id: string;
  provider: 'GOOGLE_CALENDAR';
  entityId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  state: 'PENDING' | 'RUNNING' | 'NEEDS_AUTH' | 'FAILED';
  attemptCount: number;
  nextAttemptAt: Instant | null;
}
```

OAuth access tokens are not domain entities and are never persisted in these records.

## 4. Calculation contracts

### Worked minutes

For completed punches:

```text
elapsed = actualEndAt - actualStartAt
workedMinutes = max(0, elapsedMinutes - effectiveBreakMinutes)
```

Invalid negative or implausibly long sessions are rejected or flagged; they are not silently normalized.

### Overtime minutes

The application can derive overtime from worked minutes or accept a manual override. Product configuration must specify which wins. A proposed default is:

```text
rawOvertime = max(0, workedMinutes - standardWorkedMinutes)
roundedOvertime = floor(rawOvertime / roundingMinutes) * roundingMinutes
```

Overtime is reported only as time. Sentrio never converts it to money.

### Attendance percentage

When an expected-work-day count is available:

```text
attendancePermille = round(attendedWorkDays * 1000 / expectedWorkDays)
```

The UI shows the included statuses and date range so the percentage is not misleading. If expected work days cannot be determined reliably, the percentage remains `null` and raw counts are shown instead.

## 5. Date and time rules

- `workDate` is a plain local date, not a UTC timestamp.
- Shift times are integer minutes from local midnight.
- An overnight shift has `endMinutes <= startMinutes`; its end occurs on the following local date.
- An attendance record belongs to the date on which its scheduled shift starts.
- `createdAt` and `updatedAt` are UTC instants for audit purposes only.
- Attendance-cycle start and end dates are inclusive.
- Invalid cutoff days clamp to the final day of the month and display the resolved dates.

## 6. Essential invariants

1. Durations are finite safe integers within configured bounds.
2. Attendance uniqueness is enforced by profile and work date.
3. `actualEndAt` cannot exist without `actualStartAt`.
4. A completed session must end after it starts.
5. `OFF` has no scheduled start/end and zero standard worked minutes.
6. Changing a shift preset does not change historical snapshots.
7. Imported records pass the same validation as newly entered records.
8. Almanac and festival data never silently change attendance.
9. Google Calendar changes never modify local attendance automatically.
10. Insights and exports use the same summary service.

## 7. Required executable examples

Create approved fixtures for at least:

- Shift A present with no overtime.
- Shift C from 23:30 to 07:00 across midnight.
- Half day with a manual correction.
- Holiday worked with overtime time.
- Weekly off with no punches.
- Attendance cycle from 26 December through 25 January.
- February cycle in a leap and non-leap year.
- Shift configuration changed after a historical record was created.
- Missing checkout corrected manually.
- Offline Calendar update retried without producing a duplicate event.

