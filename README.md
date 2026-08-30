# Sentrio

Sentrio is an offline-first shift diary and self-attendance Progressive Web App for industrial and manufacturing workers. It combines shift tracking, custom attendance cycles, overtime hours, reports, Google Calendar integration, and a Marathi pocket-diary experience.

The product is independent and is not affiliated with Tata Motors or any other employer. Employer-specific schedules can be represented as user-configurable presets without using employer branding.

## Current status

The architecture is documented and the first working product slice is available in [`app`](app). It includes first-run profile and shift setup, the responsive Today dashboard, Quick Mark Attendance, all six attendance statuses, editable A/B/C/G timings, custom attendance cycles, and IndexedDB persistence.

The agreed foundation is:

- React and TypeScript using Vinext and Vite
- Tailwind CSS and Lucide icons
- Installable offline PWA
- IndexedDB-backed local-first data
- English and Marathi presentation
- JSON backup/restore plus CSV, iCalendar, print/PDF, and share-text exports

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
3. Attendance-cycle and overtime totals are deterministic, explainable, and testable.
4. Existing records do not change when a shift configuration changes later.
5. Sentrio tracks personal attendance only; it does not calculate salary or act as an employer attendance system.
