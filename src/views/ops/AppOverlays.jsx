export function PromptAndPreviewModals() {
  return (
    <>
      <div id="promptModal" className="modal-overlay hidden">
        <div className="modal-content">
          <div className="modal-header">
            <h2>LLM Injection Prompt</h2>
            <button
              type="button"
              className="close-modal-btn"
              onClick={() => document.getElementById('promptModal')?.classList.add('hidden')}
            >
              ×
            </button>
          </div>
          <div className="modal-body">
            <p>
              Axiom utilizes a strict heuristic parser. To generate decks instantly using ChatGPT or Claude, append this
              exact system prompt to your request.
            </p>

            <div className="prompt-box">
              <button id="copyPromptBtn" type="button" className="copy-btn">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
              <span id="promptText">
                Generate a comprehensive study deck about the requested topic. You MUST format the output EXACTLY
                according to these rules: 1. Separate each flashcard/question block with exactly one blank line. 2. For
                standard Q&amp;A (Flashcards): Line 1 is the Front/Term, Line 2 is the Back/Definition. 3. For Multiple
                Choice: Line 1 is the question. The following lines are options. Prefix the correct option with an
                asterisk (*). Prefix wrong options/distractors with a hyphen (-). Provide ONLY the raw formatted text. Do
                not include markdown code fences or conversational filler.
              </span>
            </div>
            <div
              id="promptCopyFeedback"
              className="hidden"
              style={{ color: 'var(--correct-border)', fontSize: '0.8rem', marginTop: '0.5rem', textAlign: 'right' }}
            >
              Copied to clipboard!
            </div>
          </div>
        </div>
      </div>

      <div id="previewModal" className="modal-overlay hidden">
        <div className="modal-content" style={{ maxWidth: '800px', height: '80vh' }}>
          <div className="modal-header">
            <h2>Deck Preview</h2>
            <button
              type="button"
              className="close-modal-btn"
              onClick={() => document.getElementById('previewModal')?.classList.add('hidden')}
            >
              ×
            </button>
          </div>
          <div className="modal-body" id="previewContainer" />
        </div>
      </div>
    </>
  );
}

export function CmdAndAgendaModals() {
  return (
    <>
      <div id="cmdModModal" className="modal-overlay hidden">
        <div className="modal-content" style={{ maxWidth: '440px' }}>
          <div className="modal-header">
            <h2>Mod Details</h2>
            <button type="button" className="close-modal-btn" data-cmd-modal-close="cmdModModal">
              ×
            </button>
          </div>
          <div className="modal-body">
            <div className="cmd-modal-rows">
              <div className="cmd-modal-row">
                <div>
                  <div className="cmd-title">Current Mod</div>
                  <div className="cmd-value-sm" id="cmdModDetailMod">
                    —
                  </div>
                </div>
                <div>
                  <div className="cmd-title">Class</div>
                  <div className="cmd-value-sm" id="cmdModDetailClass">
                    —
                  </div>
                </div>
              </div>
              <div>
                <div className="cmd-title">Mod Time</div>
                <div className="cmd-value-sm" id="cmdModDetailTimeRange">
                  —
                </div>
              </div>
              <div className="cmd-modal-countdown" id="cmdModDetailCountdown">
                --:--
              </div>
              <div>
                <div className="cmd-title">Next Mod</div>
                <div className="cmd-value-sm" id="cmdModDetailNextMod">
                  —
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="cmdClassCountdownModal" className="modal-overlay hidden">
        <div className="modal-content" style={{ maxWidth: '440px' }}>
          <div className="modal-header">
            <h2>Class Countdown</h2>
            <button type="button" className="close-modal-btn" data-cmd-modal-close="cmdClassCountdownModal">
              ×
            </button>
          </div>
          <div className="modal-body">
            <div className="cmd-class-countdown-display" id="cmdClassCountdownDisplay">
              --:--
            </div>
            <div>
              <div className="cmd-title">Next Class</div>
              <div className="cmd-value-sm" id="cmdClassCountdownNextClass">
                —
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="cmdDailyDebriefModal" className="modal-overlay hidden">
        <div className="modal-content" style={{ maxWidth: '760px' }}>
          <div className="modal-header">
            <h2>Daily Debrief</h2>
            <button type="button" className="close-modal-btn" data-cmd-modal-close="cmdDailyDebriefModal">
              ×
            </button>
          </div>
          <div className="modal-body">
            <div id="cmdDebriefMetrics" className="cmd-debrief-metrics" />
            <div id="cmdDebriefList" className="cmd-debrief-list" />
            <div className="calendar-form-actions" style={{ marginTop: '0.7rem' }}>
              <button type="button" className="btn" id="cmdDebriefCopyBtn">
                Copy Debrief
              </button>
            </div>
          </div>
        </div>
      </div>

      <div id="agendaItemModal" className="modal-overlay hidden">
        <div className="modal-content" style={{ maxWidth: '440px' }}>
          <div className="modal-header">
            <h2 id="agendaModalTitle">Add Task</h2>
            <button type="button" className="close-modal-btn" data-agenda-modal-close>
              ×
            </button>
          </div>
          <div className="modal-body">
            <form id="agendaItemForm">
              <input type="hidden" id="agendaItemId" defaultValue="" />
              <input type="hidden" id="agendaItemType" defaultValue="task" />
              <div className="agenda-modal-field">
                <label htmlFor="agendaFieldTitle">Title</label>
                <input type="text" id="agendaFieldTitle" required autoComplete="off" />
              </div>
              <div className="agenda-modal-field">
                <label htmlFor="agendaFieldDue">Due date</label>
                <input type="datetime-local" id="agendaFieldDue" />
              </div>
              <div className="agenda-modal-field agenda-priority-field">
                <label htmlFor="agendaFieldPriority">Priority</label>
                <select id="agendaFieldPriority">
                  <option value="low">Low</option>
                  <option value="medium" selected>
                    Medium
                  </option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="agenda-modal-field agenda-class-field">
                <label htmlFor="agendaFieldClass">Class (optional)</label>
                <select id="agendaFieldClass">
                  <option value="">Select a class</option>
                  <option value="AP Chemistry">AP Chemistry</option>
                  <option value="AP Calculus BC">AP Calculus BC</option>
                  <option value="AP American Studies">AP American Studies</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Guidance Help">Guidance Help</option>
                  <option value="Chamber Orchestra">Chamber Orchestra</option>
                </select>
              </div>
              <div className="agenda-modal-field">
                <label htmlFor="agendaFieldNotes">Notes</label>
                <textarea id="agendaFieldNotes" rows={3} />
              </div>
              <div className="agenda-modal-actions">
                <button type="button" className="btn" id="agendaModalCancel">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export function CalendarModals() {
  return (
    <>
      <div id="calendarEventModal" className="modal-overlay hidden">
        <div className="modal-content" style={{ maxWidth: '500px' }}>
          <div className="modal-header">
            <h2 id="calendarModalTitle">Add Calendar Event</h2>
            <button type="button" className="close-modal-btn" data-calendar-modal-close>
              ×
            </button>
          </div>
          <div className="modal-body">
            <form id="calendarEventForm">
              <input type="hidden" id="calendarEventId" defaultValue="" />
              <div className="agenda-modal-field">
                <label htmlFor="calendarFieldTitle">Title</label>
                <input type="text" id="calendarFieldTitle" required autoComplete="off" />
              </div>
              <div className="calendar-modal-grid">
                <div className="agenda-modal-field">
                  <label htmlFor="calendarFieldStart">Start</label>
                  <input type="datetime-local" id="calendarFieldStart" required />
                </div>
                <div className="agenda-modal-field">
                  <label htmlFor="calendarFieldEnd">End</label>
                  <input type="datetime-local" id="calendarFieldEnd" required />
                </div>
              </div>
              <div className="calendar-modal-grid">
                <div className="agenda-modal-field">
                  <label htmlFor="calendarFieldColor">Color</label>
                  <div className="calendar-color-row">
                    <button type="button" className="calendar-color-swatch" data-color="#7f8aa5" style={{ background: '#7f8aa5' }} />
                    <button type="button" className="calendar-color-swatch" data-color="#8b7fa5" style={{ background: '#8b7fa5' }} />
                    <button type="button" className="calendar-color-swatch" data-color="#7fa597" style={{ background: '#7fa597' }} />
                    <button type="button" className="calendar-color-swatch" data-color="#a59f7f" style={{ background: '#a59f7f' }} />
                    <button type="button" className="calendar-color-swatch" data-color="#a57f7f" style={{ background: '#a57f7f' }} />
                    <input
                      id="calendarFieldColor"
                      type="color"
                      defaultValue="#7f8aa5"
                      title="Custom color"
                      style={{ width: 32, height: 24, border: 'none', background: 'transparent', cursor: 'pointer' }}
                    />
                  </div>
                </div>
                <div className="agenda-modal-field">
                  <label htmlFor="calendarFieldRepeat">Repeat</label>
                  <select id="calendarFieldRepeat">
                    <option value="none">Does not repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="weekdays">Weekdays</option>
                    <option value="custom">Custom days</option>
                  </select>
                  <div id="calendarRepeatDaysWrap" className="calendar-repeat-days hidden">
                    <button type="button" className="calendar-repeat-day-chip" data-dow="0">
                      Sun
                    </button>
                    <button type="button" className="calendar-repeat-day-chip" data-dow="1">
                      Mon
                    </button>
                    <button type="button" className="calendar-repeat-day-chip" data-dow="2">
                      Tue
                    </button>
                    <button type="button" className="calendar-repeat-day-chip" data-dow="3">
                      Wed
                    </button>
                    <button type="button" className="calendar-repeat-day-chip" data-dow="4">
                      Thu
                    </button>
                    <button type="button" className="calendar-repeat-day-chip" data-dow="5">
                      Fri
                    </button>
                    <button type="button" className="calendar-repeat-day-chip" data-dow="6">
                      Sat
                    </button>
                  </div>
                </div>
              </div>
              <div className="agenda-modal-field">
                <label htmlFor="calendarFieldNotes">Notes</label>
                <textarea id="calendarFieldNotes" rows={3} />
              </div>
              <div className="calendar-form-actions">
                <button type="button" className="btn btn-danger hidden" id="calendarDeleteBtn">
                  Delete
                </button>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="btn" id="calendarModalCancel">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div id="calendarDayModal" className="modal-overlay hidden">
        <div className="modal-content" style={{ maxWidth: '920px' }}>
          <div className="modal-header">
            <h2 id="calendarDayModalTitle">Day View</h2>
            <button type="button" className="close-modal-btn" data-calendar-day-close>
              ×
            </button>
          </div>
          <div className="modal-body">
            <div id="calendarDayModalBody" className="calendar-day-modal-shell" />
          </div>
        </div>
      </div>

      <div id="calendarMonthModal" className="modal-overlay hidden">
        <div className="modal-content" style={{ maxWidth: '760px' }}>
          <div className="modal-header">
            <h2>Month View</h2>
            <button type="button" className="close-modal-btn" data-calendar-month-close>
              ×
            </button>
          </div>
          <div className="modal-body">
            <div className="calendar-head" style={{ marginBottom: '0.5rem' }}>
              <button type="button" id="calendarMonthPrevBtn" className="calendar-nav-btn" aria-label="Previous month">
                ‹
              </button>
              <button type="button" id="calendarMonthNextBtn" className="calendar-nav-btn" aria-label="Next month">
                ›
              </button>
              <div id="calendarMonthLabel" className="calendar-range-label">
                Month
              </div>
              <select id="calendarMonthSelect" className="btn" style={{ padding: '0.35rem 0.5rem' }} />
              <select id="calendarYearSelect" className="btn" style={{ padding: '0.35rem 0.5rem' }} />
            </div>
            <div className="calendar-month-head">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>
            <div id="calendarMonthGrid" className="calendar-month-grid" />
          </div>
        </div>
      </div>
    </>
  );
}

export function JournalAndSettingsModals() {
  return (
    <>
      <div id="journalEntryModal" className="modal-overlay hidden">
        <div className="modal-content" style={{ maxWidth: '680px' }}>
          <div className="modal-header">
            <h2 id="journalEntryModalTitle">Journal Entry</h2>
            <button type="button" className="close-modal-btn" data-journal-entry-close>
              ×
            </button>
          </div>
          <div className="modal-body">
            <div
              id="journalEntryModalBody"
              style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--text-main)', maxHeight: '58vh', overflow: 'auto' }}
            />
            <p id="journalEntryModalHint" className="journal-modal-readonly-hint" />
          </div>
        </div>
      </div>

      <div id="journalMonthModal" className="modal-overlay hidden">
        <div className="modal-content" style={{ maxWidth: '760px' }}>
          <div className="modal-header">
            <h2>Journal Month</h2>
            <button type="button" className="close-modal-btn" data-journal-month-close>
              ×
            </button>
          </div>
          <div className="modal-body">
            <div className="calendar-head" style={{ marginBottom: '0.5rem' }}>
              <button type="button" id="journalMonthPrevBtn" className="calendar-nav-btn" aria-label="Previous month">
                ‹
              </button>
              <button type="button" id="journalMonthNextBtn" className="calendar-nav-btn" aria-label="Next month">
                ›
              </button>
              <div id="journalMonthLabel" className="calendar-range-label">
                Month
              </div>
              <select id="journalMonthSelect" className="btn" style={{ padding: '0.35rem 0.5rem' }} />
              <select id="journalYearSelect" className="btn" style={{ padding: '0.35rem 0.5rem' }} />
            </div>
            <div className="calendar-month-head">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>
            <div id="journalMonthGrid" className="calendar-month-grid" />
          </div>
        </div>
      </div>

      <div id="settingsCenterModal" className="modal-overlay hidden">
        <div className="modal-content" style={{ maxWidth: '420px' }}>
          <div className="modal-header">
            <h2>Settings</h2>
            <button
              type="button"
              className="close-modal-btn"
              onClick={() => document.getElementById('settingsCenterModal')?.classList.add('hidden')}
            >
              ×
            </button>
          </div>
          <div className="modal-body">
            <div className="settings-row" style={{ marginBottom: '0.9rem' }}>
              <span>Dark Mode</span>
              <label className="switch-toggle">
                <input type="checkbox" id="themeToggle" defaultChecked />
                <span className="slider" />
              </label>
            </div>
            <div className="settings-row" style={{ marginBottom: '0.9rem' }}>
              <span>Haptic Feedback</span>
              <label className="switch-toggle">
                <input type="checkbox" id="hapticToggle" defaultChecked />
                <span className="slider" />
              </label>
            </div>
            <div className="settings-row" style={{ marginBottom: '0.9rem' }}>
              <span>Audio Effects</span>
              <label className="switch-toggle">
                <input type="checkbox" id="audioToggle" defaultChecked />
                <span className="slider" />
              </label>
            </div>
            <div className="settings-row">
              <span>Strict Quiz Mode</span>
              <label className="switch-toggle">
                <input type="checkbox" id="strictModeToggle" />
                <span className="slider" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function CmdSidebarOverlay() {
  return (
    <div id="cmdSidebarOverlay" className="cmd-sidebar-overlay hidden">
      <div id="cmdSidebar" className="cmd-sidebar">
        <button type="button" className="cmd-sidebar-item active" data-cmd-view="dashboard">
          Dashboard
        </button>
        <button type="button" className="cmd-sidebar-item" data-cmd-view="agenda">
          Tasks
        </button>
        <button type="button" className="cmd-sidebar-item" data-cmd-view="calendar">
          Calendar
        </button>
        <button type="button" className="cmd-sidebar-item" data-cmd-view="focus">
          Focus
        </button>
        <button type="button" className="cmd-sidebar-item" data-cmd-view="grades">
          Grades
        </button>
        <button type="button" className="cmd-sidebar-item" data-cmd-view="journal">
          Journal
        </button>
      </div>
    </div>
  );
}
