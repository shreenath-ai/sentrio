# Sentrio Product Specification

## 1. Product definition

Sentrio is a personal self-attendance and shift diary for industrial workers. It digitizes the familiar pocket diary while handling rotating shifts, custom attendance/reporting cycles, worked hours, overtime time, notes, Marathi cultural context, reports, backups, and optional Google Calendar reminders.

Sentrio does not calculate salary, wages, allowances, advances, deductions, or statutory payroll. It is not an employer-controlled attendance system and does not require an administrator, GPS monitoring, biometric attendance, or an account.

## 2. Target user

The primary user is a factory or plant worker who:

- rotates through morning, evening, night, general, and off shifts;
- currently records attendance in a paper diary or generic calendar app;
- wants calendar-month or custom 26th–25th attendance reports;
- wants to track worked hours and overtime hours without payroll calculations;
- may prefer Marathi for daily use.

Sentrio may support multiple work profiles for workers who change jobs, but only one profile is active at a time.

## 3. MVP outcomes

A user can:

1. Complete onboarding with language, work profile, attendance cycle, and shift presets.
2. Mark today's attendance and shift in no more than three primary interactions.
3. Record actual start/end time, break duration, overtime time, and a note when needed.
4. Review and edit attendance from a monthly diary calendar.
5. View a calendar month or custom attendance cycle such as the 26th–25th.
6. See present days, absences, leave, holidays, worked hours, overtime hours, and shift distribution.
7. Export CSV, printable/PDF reports, iCalendar events, shareable text, and a complete JSON backup.
8. Restore a validated backup without partially corrupting existing data.
9. Install and use the application while offline.
10. Optionally publish planned shifts to a dedicated Sentrio Google Calendar when online.

## 4. Attendance states

- Present
- Half day
- Absent
- Weekly off
- Holiday
- Casual leave (CL)
- Privilege leave (PL)
- Sick leave (SL)
- Compensatory off (CO)

A shift code and an attendance status are separate concepts. For example, a user can be absent from Shift B, work Shift C on a holiday, or record overtime on a weekly off.

## 5. Default shift presets

| Code | Label | Time | Default duration | Notes |
|---|---|---:|---:|---|
| A | Morning | 06:30–15:00 | User configurable | First shift |
| B | Evening | 15:00–23:30 | User configurable | Second shift |
| C | Night | 23:30–07:00 next day | User configurable | Crosses midnight |
| G | General | 08:30–17:00 | User configurable | Day/general shift |
| OFF | Off | — | 0 | No scheduled work |

These are editable presets, not hard-coded employer rules.

## 6. Primary screens

### Onboarding

- Language: Marathi or English
- Name or diary label (optional)
- Work profile
- Attendance-cycle rule
- Shift presets
- Standard daily hours and overtime tracking preference
- Reminder time

### Today

- Current date, Marathi date presentation, and optional tithi/festival
- Planned shift and quick attendance stamp
- Start Shift / End Shift actions
- Live or completed duration summary
- Add note, break, or overtime time
- Current attendance-cycle progress

### Diary

- Calendar-month and custom-cycle views
- Color-coded shift and attendance stamps
- Tap a day to add or edit its record
- Legend, search, filters, and summary

### Insights

- Selected reporting period
- Present, absent, leave, holiday, and weekly-off totals
- Total worked hours and overtime hours
- Shift distribution and attendance percentage
- Missing or incomplete record warnings
- Every total opens its source records

### Reports

- Calendar-month and custom-cycle filters
- Attendance and hours summary
- CSV export
- Print/save as PDF
- iCalendar export
- Shareable WhatsApp-style text
- Full JSON backup and restore

### Calendar

- Continue without a Google account and export an `.ics` file
- Optionally connect Google Calendar from Settings
- Create a dedicated `Sentrio Shifts` secondary calendar
- Publish planned shifts and reminders without publishing private diary notes
- Show queued, syncing, synced, and needs-attention states
- Provide a user-driven `Sync now` action when authorization has expired

### Settings

- Work profiles and active profile
- Shift configuration
- Attendance cycle and overtime preferences
- Language, theme, reminders, Calendar, and data management

## 7. Marathi pocket-diary layer

- Marathi and English UI dictionaries are bundled with the app.
- Gregorian date remains the canonical record date.
- Marathi weekday/month labels are presentation only.
- Tithi, festival, and holiday annotations come through an `AlmanacProvider` boundary.
- The first implementation uses a reviewed, licensed, versioned yearly dataset bundled for offline use.
- Almanac annotations never change attendance automatically.
- Suvichar content must be original, public-domain, or appropriately licensed.

## 8. Explicit non-goals

- Salary, wage, or take-home-pay calculation
- Allowances, advances, canteen deductions, PF, ESIC, tax, or payslips
- Employer/admin portal
- Biometric or GPS-verified attendance
- Cloud accounts and cross-device sync
- Two-way Google Calendar editing in the first release
- Automatic import from a factory punch system
- Advertisements

## 9. Success criteria

- The installed app launches and supports core attendance entry with the network disabled.
- Overnight Shift C is assigned to the date on which the shift starts.
- A 26th–25th attendance cycle works across month and year boundaries.
- Changing a shift preset does not alter historical attendance totals.
- Worked-time and overtime calculations use integer minutes.
- Backup round-trip tests reproduce all user-owned records.
- Insights and exports calculate totals from the same source records.

## 10. Product decisions still requiring confirmation

1. Initial UI language: Marathi-first, English-first, or device language.
2. Whether manual overtime or clock-derived overtime is authoritative when both exist.
3. Whether leave balances are tracked or only leave usage.
4. Which reviewed source supplies yearly tithi and festival data.
5. Whether an optional local PIN lock is needed for the first release.

