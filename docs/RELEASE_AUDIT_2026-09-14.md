# Sentrio release audit — 14 September 2026

## Implemented

- Diary: automatic rotation removed from the active UI; tap a date to edit attendance and shift. Saved working days show a status icon and a named shift, with an OT indicator when present. Non-working days show a status word.
- Dashboard: current shift controls, attendance editing, OT entry, worked days, recorded shift time, weekly/monthly OT, cycle attendance counts, cycle OT and recent editable entries.
- Overtime: manually entered hours/minutes saved as integer minutes on present/half-day records. Absent, leave, holiday and weekly-off records contribute no OT. Existing records without OT count as zero.
- Periods: weekly OT uses Monday–Sunday; monthly OT uses calendar months. Dashboard totals include records through today. Attendance-cycle totals use the configured cycle.
- Finishing a shift opens its attendance form for OT entry. The timer can find an unfinished working record from before midnight within the last 24 hours.
- Reports, Insights and JSON backup/restore include OT. Regular punch duration and manually entered OT remain separate; the form explains that checkout is the end of the regular shift.
- Sidebar status counts use the cycle's records rather than only today's record.
- Date refresh runs periodically and when the window receives focus.

## Verification evidence

- Nine automated tests passed: cycle/year boundary, overnight duration, backup checksum, tamper rejection, merge/replace restore, OT round trip, invalid OT rejection, weekly/monthly boundary totals and zero-duration punches.
- Targeted ESLint checks passed for the changed feature files before the audit follow-up.
- The feature build succeeded. A separate TypeScript audit found four type errors; these were fixed and both `tsc --noEmit` and the final production rebuild passed afterward.
- No physical Android test or browser interaction test of this new dashboard/OT release has been completed. Automated tests validate domain/storage behavior, not visual layout or the full click-through journey.

## Remaining release checks and refinements

1. Test the new forms and dashboard on a narrow Android screen, including Marathi, text enlargement, long status labels and the OT fields.
2. Verify installation, airplane-mode relaunch, marking attendance offline, and backup/restore through Android's file picker on the actual phone.
3. Verify a real overnight session across midnight, closing/reopening the app, finishing, adding OT and checking its original shift date and totals.
4. Accessibility refinement: modal focus trapping/restoration and keyboard navigation need a dedicated pass. Dialog roles and Escape handling alone are not a full accessibility review.
5. Translation refinement: some pre-existing shift names and accessibility labels remain English, and the root HTML language is still English.
6. Running-shift recovery currently considers only the last 24 hours. Older unfinished entries must be corrected through Diary.

No payroll or OT pay calculation is included. Google Calendar integration is not implemented in this release.
