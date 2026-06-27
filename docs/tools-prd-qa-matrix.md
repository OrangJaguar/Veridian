# Tools PRD QA Matrix (non-AI scope)

Manual pass/fail checklist mapping PRD sections to implementation. Run after deploying updated Base44 entities.

| Tool | PRD section | Expected | Pass |
|------|-------------|----------|------|
| **Catalog** | Tool discovery | `/tools/catalog` lists all tools with pin/unpin | |
| **Catalog** | Sidebar pin | Pinned tools appear in sidebar; order persists | |
| **Catalog** | Drag reorder | N+1 gap slots reorder pinned tools | |
| **Catalog** | Immersive mode | Chrome toggle hides app nav; tools fill viewport | |
| **Dashboard** | NOW / UNTIL / NEXT | Stat cards driven by `schedule-engine.js` | |
| **Dashboard** | Inline timeline | Click stat card expands today timeline; current block highlighted | |
| **Dashboard** | Countdown | HH:MM:SS in-block / until-next / live clock states | |
| **Dashboard** | No schedule | Cards hidden; live clock; intel panel expanded | |
| **Dashboard** | A/B day type | Chip toggles `dayTypeOverride` when templates enabled | |
| **Dashboard** | Intelligence panel | Collapsed summary; expand shows timeline, free time, study, tasks | |
| **Dashboard** | Debrief clipboard | Copy summary in panel footer (no standalone modal) | |
| **Settings** | Schedule editor | CRUD recurring blocks; save to ToolsSchedule | |
| **Settings** | Buffers / widgets | Sleep/travel buffers; quote/habit toggles persist | |
| **Settings** | Categories | Custom categories flow to Tasks modal filter | |
| **Tasks** | Layout | Tabs left, filters right, bottom Add FAB | |
| **Tasks** | Overdue | Red header section; non-draggable | |
| **Tasks** | Row display | Estimated time, category, subtask progress | |
| **Tasks** | Subtasks | Expand/collapse; parent completion rules | |
| **Tasks** | Sort modes | Manual / due / priority / category | |
| **Tasks** | Completed tab | 30-day window, count, uncomplete | |
| **Tasks** | Recurrence | Spawn next on complete; delete this vs future | |
| **Calendar** | Week grid | Sunday–Saturday | |
| **Calendar** | Scroll to now | Week grid centers current time on load | |
| **Calendar** | Drag-create | Ghost block with live times | |
| **Calendar** | Modal | All-day, every X weeks, linked journeys | |
| **Calendar** | Interaction zones | Top move / edge resize / bottom edit | |
| **Calendar** | Repeat prompts | This instance vs all future on move/delete | |
| **Calendar** | Overlap | Side-by-side tiling for overlapping events | |
| **Calendar** | Notes | Truncated on block; hover tooltip | |
| **Calendar** | Month view | Header button + month/year navigation | |
| **Focus** | Setup flow | Preset chips, custom duration, goal, Start | |
| **Focus** | Session UI | Timer, pause/end, live clock overlay | |
| **Focus** | Phases | Work/break transitions; manual resume after break | |
| **Focus** | Context panel | Pinned task, expandable tasks/events, study launch | |
| **Focus** | Summary | Stats + goal Yes/No; persist ToolsFocusSession | |
| **Focus** | Ambient audio | 6 tracks + volume; prefs persistence | |
| **Journal** | Streak | Min words, color shift, 1 grace / 30 days | |
| **Journal** | Limits | 2000 warn, 2500 block | |
| **Journal** | Mood / tags | Chips persisted; `#tag` autocomplete | |
| **Journal** | PIN lock | Optional 4-digit gate with lockout | |
| **Journal** | On This Day | Prior-year same-date banner | |
| **Journal** | Day popup | 3-column layout with tasks/events snapshot | |
| **Journal** | Comments | Highlight + comment on past entries | |
| **Cross-tool** | Dashboard ↔ Tasks | Priority checkboxes complete tasks | |
| **Cross-tool** | Focus ↔ Tasks | Pin task from list | |
| **Cross-tool** | Calendar ↔ Study | Linked journeys in modal | |
| **Cross-tool** | Dashboard/Focus ↔ Study | Launch due cards to `/study/:id` | |
| **Mobile** | All tools | Usable layouts at narrow widths | |

## Entity deploy checklist

Sync these Base44 entity schemas before server persistence works:

- `ToolsSchedule` (recurringBlocks, templates, exceptions)
- `ToolsTask` (estimatedMinutes, subtasks, recurrence)
- `ToolsCalendarEvent` (repeatIntervalWeeks, linkedJourneyIds, instanceOverrides)
- `ToolsJournalEntry` (mood, tags, comments)
- `ToolsFocusSession` (new)
- `UserPreferences` (tools buffers, widgets, journal/focus prefs)

Project ID: `69f7f418be004e32dd4e8acc` (`base44/.app.jsonc`).
