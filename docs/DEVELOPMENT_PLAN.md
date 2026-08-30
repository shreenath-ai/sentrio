# Sentrio Development Plan

## 1. Strategy

Build Sentrio as a sequence of complete vertical slices. The first usable release lets a worker configure shifts, record attendance, close and reopen the app offline, and review the diary. Insights, exports, and Google Calendar are added only after that attendance foundation is reliable.

Sentrio is intentionally a self-attendance application. Salary, wages, allowances, advances, deductions, and statutory payroll are outside the product.

The web application remains the source project. Android packaging is a release concern, not a second UI codebase.

## 2. Product defaults

- Product name: Sentrio
- Initial platform: responsive installable PWA
- Primary launch platform: Android
- Languages: English and Marathi; device language initially selected
- Default reporting period: calendar month
- Optional attendance cycle: 26th through 25th or another cutoff
- Default shifts: A, B, C, and G; all editable
- Default attendance method: Quick Mark, with Clock Mode available
- Overtime: tracked as time only
- Persistence: IndexedDB; no account or backend in MVP
- Google Calendar: optional, one-way Sentrio-to-Google synchronization
- Calendar onboarding: skipped by default and available in Settings
- Distribution: validate the PWA first, then add an Android container for Play Store delivery

## 3. Milestones

### Milestone 0 — Attendance-rule approval

**Purpose:** prevent shift, date, and overtime rules from being guessed inside UI code.

Deliverables:

- Meaning and editing rules for every attendance status
- Overnight Shift C examples
- Manual versus clock-derived overtime decision
- Overtime threshold and rounding examples
- Calendar-month, 26th–25th, and 21st–20th reporting examples
- Half-day, holiday work, leave, absence, weekly-off, and missing-punch examples
- Decision on which statuses count toward optional attendance percentage
- Reviewed source plan for Marathi tithi and festival data

Exit gate:

- Domain fixtures have expected date, status, worked-minute, and overtime-minute answers reviewed by the product owner.

### Milestone 1 — Engineering foundation

Deliverables:

- React, TypeScript, and Vite application
- Strict TypeScript, linting, formatting, and test commands
- Tailwind design tokens and Lucide icons
- Routing and provider structure
- English and Marathi localization
- PWA manifest, icons, service worker, and offline shell
- IndexedDB database, migrations, repositories, and runtime validation
- Continuous integration for type-check, tests, and production build

Exit gate:

- A clean install builds successfully and the empty application reloads offline.

### Milestone 2 — Design system and core screens

Deliverables:

- Penpot colors, spacing, typography, radius, elevation, and motion tokens
- Light parchment and dark industrial themes
- Buttons, fields, status stamps, shift chips, cards, bottom navigation, sheets, and dialogs
- Final mobile designs for Welcome, Onboarding, Today, Quick Mark, Clock Mode, Diary, Day Editor, Insights, Reports, and Settings
- Marathi layout review and long-label testing
- Accessibility contrast and touch-target review

Exit gate:

- Today, Diary, Insights, and Reports share one approved component language at 360–430 px mobile widths.

### Milestone 3 — Attendance domain and persistence

Deliverables:

- Work profile, shift, attendance, cycle, holiday, and Calendar-sync schemas
- Local-date, overnight-shift, duration, and overtime utilities
- Custom inclusive attendance-cycle calculator
- Attendance summary service
- IndexedDB repositories and reactive queries
- Backup schema versioning and migration harness
- Unit tests for all approved fixtures

Exit gate:

- Domain tests pass without importing React or browser UI code.

### Milestone 4 — First usable vertical slice

User journey:

```text
Install/open -> Onboard -> See Today -> Mark attendance -> Close app -> Reopen offline -> Record remains
```

Deliverables:

- Language and work-profile onboarding
- Shift and attendance-cycle setup
- Today screen
- Quick Mark attendance
- Start Shift and End Shift clock mode
- Local save confirmation and error recovery
- Current cycle progress
- Offline install/reload verification on Android

Exit gate:

- A worker completes today's attendance in three primary interactions and retrieves it after an offline restart.

### Milestone 5 — Diary and corrections

Deliverables:

- Calendar-month and custom-cycle views
- Shift/status legend
- Day editor for shift, status, punches, break, overtime time, and note
- Marathi weekday/month presentation
- Holidays and optional almanac annotations
- Search, filters, and audit events for corrections

Exit gate:

- Editing a past record updates insights but never changes its historical shift snapshot.

### Milestone 6 — Attendance insights

Deliverables:

- Current and previous reporting-period selection
- Present, absent, half-day, leave, holiday, and weekly-off counts
- Worked hours and overtime hours
- Shift distribution
- Optional attendance percentage with a visible definition
- Missing and incomplete record warnings
- Tap-through from every total to source records

Exit gate:

- Insights, reports, and test fixtures use the same summary result and show identical totals.

### Milestone 7 — Reports and data portability

Deliverables:

- Calendar-month and custom-cycle attendance reports
- CSV export with spreadsheet-injection protection
- Printable report and Save as PDF flow
- WhatsApp-friendly share text
- Full JSON backup with checksum
- Restore preview, merge/replace choice, transaction, and integrity check

Exit gate:

- A backup round trip recreates all user-owned records, configurations, and historical snapshots.

### Milestone 8 — Google Calendar integration

Deliverables:

- Calendar connection explainer and consent flow
- Dedicated `Sentrio Shifts` secondary calendar
- Least-privilege Google authorization
- Local shift-to-event mapping
- Create, update, and remove queued event operations
- Offline sync queue and visible sync states
- Duplicate prevention, retry/backoff, expired-authorization recovery, and disconnect flow
- Privacy check ensuring private diary notes are never published

Exit gate:

- A Shift C event spans midnight correctly; offline edits synchronize once without duplicates after reconnection.

### Milestone 9 — Quality, beta, and Android release

Deliverables:

- End-to-end tests for critical worker journeys
- Accessibility audit and keyboard/screen-reader checks
- Android device matrix: small/large screens, low-memory device, offline mode, dark mode, Marathi
- Performance and storage-failure testing
- Privacy policy, data-safety disclosure, support information, and delete-data flow
- App icon, screenshots, store description, and release notes
- Android container and signed Android App Bundle
- Internal Play testing track and staged rollout plan

Exit gate:

- Internal testers complete onboarding, a full shift, correction, Insights review, backup, restore, and Calendar sync without a critical failure.

## 4. Recommended release cuts

### Internal Alpha

- Onboarding
- Today
- Quick Mark and Clock Mode
- Offline persistence

### Private Beta

- Full diary
- Attendance insights
- Reports and backups
- Marathi review

### Release Candidate

- Google Calendar
- Android package
- Store compliance
- Device and accessibility testing

## 5. Release-blocking failures

1. Attendance loss after closing or updating the app.
2. Shift C assigned to the wrong work date.
3. Incorrect attendance-cycle boundaries.
4. Different totals between Insights and Reports.
5. Shift configuration changes rewriting historical records.
6. Backup restore losing or partially applying data.
7. Google Calendar publishing private diary information.
8. Duplicate Calendar events after retry.
9. Marathi content clipping or obscuring the primary action.
10. A service-worker update interrupting an attendance form.

## 6. Immediate next implementation batch

1. Approve Milestone 0 attendance fixtures.
2. Create the Penpot design tokens and reusable mobile components.
3. Finalize Welcome, Onboarding, Today, Quick Mark, and Clock Mode screens.
4. Scaffold the React/Vite/TypeScript repository.
5. Implement date, shift, duration, cycle, overtime, and summary primitives with tests.
6. Add the first IndexedDB schema and repositories.
7. Connect onboarding and Today to real local persistence.
8. Verify the first vertical slice offline on an Android device.

## 7. Definition of done

A feature is complete only when:

- Its happy path and failure states are designed.
- English and Marathi strings exist.
- Data validation and migration impact are handled.
- Domain logic has unit tests.
- The mobile layout works at supported widths.
- Offline behavior is verified.
- Accessibility labels and focus behavior are checked.
- No sensitive data is added to logs, notifications, Calendar, or exports unexpectedly.
- Documentation and release notes are updated.
