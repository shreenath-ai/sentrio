# Calendar and timer fixes

- Calendar dates open the attendance editor directly.
- Working-day labels show attendance and saved shift, such as P · B; the OT marker is preserved.
- New entries have no preselected shift and require an explicit choice before saving.
- Removed default-shift controls from setup and Settings. The legacy stored field remains for backup compatibility but is no longer used to assign daily shifts.
- Dashboard shift selection is scoped to today; no automatic rotation or next-day selection.
- Running timer renders inline in Dashboard, with elapsed time, edit and finish controls. No timer dialog remains.

Validation: TypeScript check and production build passed; all 13 existing tests passed. Local browser checks confirmed date-tap editing, immediate A-to-B label update, no selected shift on a blank date, and an inline running timer. These checks used local test data, not live attendance. Physical Android testing remains outstanding. GitHub push remains pending approval; Sites publication uses its separate repository.
