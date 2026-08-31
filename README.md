# Sentrio

Sentrio is an offline-first shift diary and self-attendance Progressive Web App for industrial and manufacturing workers. It combines shift tracking, custom attendance cycles, reports, and a Marathi pocket-diary experience.

The product is independent and is not affiliated with Tata Motors or any other employer. Employer-specific schedules can be represented as user-configurable presets without using employer branding.

## Current status

The working product is available in [`app`](app). It includes first-run profile and shift setup, a responsive Today dashboard, Clock Mode, Quick Mark Attendance, a monthly Diary calendar, a repeating shift-rotation planner, all six attendance statuses, editable A/B/C/G timings, custom attendance cycles, Insights, printable reports, verified JSON backup/restore, Marathi/English presentation, and IndexedDB persistence.

The agreed foundation is:

- React and TypeScript using Vinext and Vite
- Tailwind CSS and Lucide icons
- Installable offline PWA
- IndexedDB-backed local-first data
- English and Marathi presentation
- Verified JSON backup/restore and print/PDF reports
- No payroll, salary, GPS, biometric, account, or calendar-export features

## Documentation

- [Product specification](docs/PRODUCT_SPEC.md)
- [Application architecture](docs/ARCHITECTURE.md)
- [Domain model and calculation rules](docs/DOMAIN_MODEL.md)
- [Simple application flow](docs/USER_FLOW.md)
- [Development plan](docs/DEVELOPMENT_PLAN.md)

## Run locally

```bash
cd app
npm install
npm run dev
```

## Product principles

1. A worker must be able to mark a shift in a few seconds.
2. Attendance remains usable without an account or internet connection.
3. Attendance-cycle and worked-time totals are deterministic and explainable.
4. Existing records do not change when a shift configuration changes later.
5. Sentrio tracks personal attendance only; it does not calculate salary or act as an employer attendance system.
