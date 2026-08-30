# Sentrio Simple Application Flow

## 1. Full app flow

```mermaid
flowchart TD
    Start[Open Sentrio] --> First{First time?}
    First -- Yes --> Language[Choose Marathi or English]
    Language --> Profile[Create work profile]
    Profile --> Shifts[Confirm shift timings A, B, C, G]
    Shifts --> Cycle[Choose attendance cycle]
    Cycle --> CalendarChoice{Connect Google Calendar now?}
    CalendarChoice -- Yes --> GoogleConsent[Google consent]
    GoogleConsent --> CreateCalendar[Create Sentrio Shifts calendar]
    CalendarChoice -- Later --> Home
    CreateCalendar --> Home[Today screen]
    First -- No --> Home

    Home --> Mark[Quick mark attendance]
    Home --> Clock[Start or end shift]
    Home --> Diary[Open diary calendar]
    Home --> Insights[View attendance insights]

    Mark --> Save[Save locally]
    Clock --> Save
    Diary --> Edit[Add or edit a day]
    Edit --> Save
    Save --> Queue{Calendar connected?}
    Queue -- Yes --> SyncQueue[Queue Calendar update]
    Queue -- No --> Updated[Diary and insights update]
    SyncQueue --> Network{Online and authorized?}
    Network -- Yes --> GoogleSync[Sync planned shift event]
    Network -- No --> Pending[Keep safely pending]
    GoogleSync --> Updated
    Pending --> Updated

    Insights --> Summary[Status counts + hours + overtime]
    Summary --> Sources[Open source records]
    Sources --> Export[Share or export report]
```

## 2. Everyday worker flow

The application should feel much smaller than its feature list:

```text
Open app -> See today's shift -> Tap one main action -> Confirm -> Done
```

### Quick attendance

```text
Today -> Mark attendance -> Present/Half day/Leave/etc. -> Save
```

### Clock-based attendance

```text
Today -> Start shift -> optional break -> End shift -> Review hours -> Save
```

### Correction

```text
Diary -> Select date -> Edit shift/status/time/note -> Save
```

### Attendance review

```text
Insights -> Select period -> Status counts -> Worked/overtime hours -> Source records
```

## 3. Navigation model

Use four bottom-navigation destinations and one secondary menu:

1. **Today** — the only daily action screen.
2. **Diary** — calendar history and corrections.
3. **Insights** — attendance totals, hours, overtime, and shift patterns.
4. **Reports** — exports, sharing, and backup.
5. **Settings** — profile, shifts, attendance cycle, Calendar, language, theme, and data tools; opened from the top-right control.

## 4. Google Calendar flow

```mermaid
flowchart TD
    Settings[Settings] --> Calendar[Calendar integration]
    Calendar --> Consent[Explain exactly what is shared]
    Consent --> Approve{User approves?}
    Approve -- No --> Local[Continue local-only]
    Approve -- Yes --> Dedicated[Create Sentrio Shifts calendar]
    Dedicated --> Sync[Publish planned shifts]
    Sync --> Status[Show last synced time]
    Status --> Change[Shift changes in Sentrio]
    Change --> Queue[Save first, then queue sync]
    Queue --> SyncNow[Sync while authorized or via Sync now]
```

Google Calendar is a display/reminder destination in the first release. Users edit attendance and shift truth inside Sentrio.

## 5. Professional simplicity rules

- One dominant action per screen.
- Today's shift and status appear before statistics.
- Advanced fields stay behind `More details`.
- Save locally immediately; sync never blocks the user.
- Use plain worker language.
- Every insight can open the records used to calculate it.
- Use consistent colors for shifts, but pair every color with a letter and label.
- Never show advertisements between attendance actions.
- Use Marathi and English copy reviewed by humans.
- Show helpful empty states rather than empty dashboards.
- Ask for Google permission only when the user activates Calendar integration.
- Do not introduce salary or payroll fields.

## 6. Suggested first-run defaults

- Language: device language, with a visible switch.
- Theme: device theme.
- Shift presets: A, B, C, and G, all editable.
- Attendance cycle: calendar month, with 26th–25th available.
- Google Calendar: skipped initially and available later in Settings.
- Attendance method: Quick Mark, with Clock Mode available.
- Reports and advanced insights stay unobtrusive until attendance exists.
