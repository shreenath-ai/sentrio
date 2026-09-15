# Sentrio Stitch redesign — 14 September 2026

## Design source

Approved project: https://stitch.withgoogle.com/projects/15714245070505769455
Eight exported HTML/screens inspected: Welcome, Dashboard unmarked/saved, Attendance, Timer, Diary, Reports, Settings.

## Implemented

- Shared Stitch forest/ivory tokens, Merriweather headings, Plus Jakarta Sans body, Devanagari fallback, book wordmark, centred responsive layout.
- Dashboard / Diary / Reports / Settings navigation; Insights summaries moved into Dashboard.
- Four primary attendance categories, matching colour labels, attendance donut, week/month controls and separate OT totals.
- Existing half-day/holiday records remain stored and separately counted; no migration or deletion.
- Compact calendar symbols and OT dot; selected-day inspection card and explicit edit action.
- Optional punch/note disclosure and quick-add OT controls.
- Active shift display with elapsed time, actual start date, overnight scheduled-end date and progress.
- Grouped Settings, language, default shift, large text, shift/profile editing, backup/restore and help.
- One-screen initial setup with default shift choice.
- Month/cycle/custom reports, direct device-generated PDF and CSV, plus native print fallback.
- PDF pages render text with the browser's fonts for Marathi shaping; PDF pages are rasterized, not searchable text. CSV remains machine-readable.

## Verified

- 13 automated tests: date cycles, overnight duration, elapsed timer, OT validation and totals, legacy backups and restoration, CSV quoting/formula escaping/Marathi, old attendance categories.
- Local browser setup, attendance save with 90 minutes OT, matching dashboard and diary totals, persistence after reload.
- 390px and 360px responsive preview; Marathi Settings and report controls inspected.
- Shift start and finish exercised; finish opens the original record and preserves OT.
- English and Marathi PDF files downloaded and rendered for visual inspection; single-page test report approximately 57 KB.
- No live user attendance was modified during QA; a separate localhost test profile was used.

## Deliberate differences from mockups

- Retained real configured shift timings instead of replacing them with Stitch sample values.
- Omitted invented employer/plant information, certified/tamper-evident claims and fake verification hashes.
- Google Calendar is explicitly unavailable, not presented as an implemented connection.
- Kept the existing install icons/social preview; only the in-app wordmark follows the book design.

## Still requires follow-up

- Physical Android home-screen installation, offline reload/download, file chooser/restore, and a real overnight shift test.
- Dependency audit reports pre-existing Next.js, sharp and PostCSS advisories. This redesign does not assert they are resolved or that the production bundle is exploitable; framework/runtime compatibility needs a separate security upgrade review.
- Older than 24-hour unfinished shifts and comprehensive keyboard focus/accessibility testing remain broader follow-up items.
- Multi-page, very large report and long-note stress tests remain; representative single-page PDF output was checked in both languages.
