import { S } from '../../lib/state';

export function CmdPanel({ view, journalStorageExpanded }) {
  const journalExpanded = journalStorageExpanded ?? S.journalStorageExpanded;

  switch (view) {
    case 'dashboard':
      return <CmdDashboard />;
    case 'agenda':
      return <CmdAgenda />;
    case 'focus':
      return <CmdFocus />;
    case 'calendar':
      return <CmdCalendar />;
    case 'journal':
      return <CmdJournal expanded={journalExpanded} />;
    case 'grades':
      return <CmdGrades />;
    default:
      return (
        <div className="cmd-box">
          <div className="cmd-title">{view}</div>
          <div className="cmd-value-sm">Coming soon</div>
        </div>
      );
  }
}

function CmdDashboard() {
  return (
    <div className="cmd-shell cmd-shell-dashboard">
      <div className="cmd-grid-top">
        <div className="cmd-box">
          <div className="cmd-title">Current Class</div>
          <div className="cmd-value-sm" id="cmdDashCurrentClass">
            —
          </div>
        </div>
        <div className="cmd-box">
          <div className="cmd-title">Current Mod</div>
          <div
            className="cmd-value-sm cmd-clickable"
            id="cmdDashCurrentMod"
            data-cmd-open="mod"
            role="button"
            tabIndex={0}
          >
            —
          </div>
        </div>
        <div className="cmd-box">
          <div className="cmd-title">Class Time</div>
          <div className="cmd-value-sm" id="cmdDashTimeRange">
            —
          </div>
        </div>
      </div>
      <div
        className="cmd-box cmd-countdown-area"
        id="cmdDashCountdownWrap"
        data-cmd-open="countdown"
        style={{ minHeight: '106px' }}
        role="button"
        tabIndex={0}
      >
        <div className="cmd-value" id="cmdDashCountdown" style={{ textAlign: 'center' }}>
          --:--
        </div>
      </div>
      <div className="cmd-box" style={{ minHeight: '106px' }}>
        <div className="cmd-title">Next Class</div>
        <div className="cmd-value-sm" id="cmdDashNextClass">
          —
        </div>
      </div>
      <div className="cmd-dashboard-actions">
        <button type="button" className="btn btn-primary" data-cmd-open="debrief">
          Daily Debrief
        </button>
      </div>
    </div>
  );
}

function CmdAgenda() {
  return (
    <div className="agenda-shell">
      <div className="agenda-tabs">
        <button type="button" className="agenda-tab active" data-agenda-tab="tasks">
          Tasks
        </button>
        <button type="button" className="agenda-tab" data-agenda-tab="completed">
          Completed (All)
        </button>
      </div>
      <div className="agenda-list" data-agenda-panel="tasks" id="agendaPanelTasks" />
      <div className="agenda-list hidden" data-agenda-panel="completed" id="agendaPanelCompleted" />
      <div className="agenda-footer">
        <button type="button" className="agenda-btn" id="agendaAddTaskBtn">
          Add New Task
        </button>
      </div>
    </div>
  );
}

function CmdFocus() {
  return (
    <div className="focus-shell">
      <div className="focus-tabs">
        <button type="button" className="focus-tab active" data-focus-tab="current">
          Current
        </button>
        <button type="button" className="focus-tab" data-focus-tab="pomodoro">
          Pomodoro
        </button>
      </div>
      <div className="focus-center-stage">
        <div className="focus-card" data-focus-panel="current">
          <div className="focus-current-body">
            <div>
              <div id="focusCurrentClock" className="segment-clock">
                00:00:00
              </div>
              <div className="ampm-stack">
                <div id="focusAmPill" className="ampm-pill">
                  AM
                </div>
                <div id="focusPmPill" className="ampm-pill">
                  PM
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="focus-card hidden" data-focus-panel="pomodoro">
          <div id="focusPomodoroLayout" className="focus-pomodoro-layout">
            <div className="focus-pomodoro-controls">
              <div className="focus-top-controls">
                <label htmlFor="focusWorkInput">Work (min)</label>
                <input id="focusWorkInput" type="number" defaultValue={25} min={0.1} max={999} step={0.1} />
                <label htmlFor="focusBreakInput">Break (min)</label>
                <input id="focusBreakInput" type="number" defaultValue={5} min={0.1} max={999} step={0.1} />
              </div>
            </div>
            <div className="focus-pomodoro-timer">
              <div>
                <div
                  id="S.focusPomodoroPhase"
                  style={{ color: '#cfd2de', textAlign: 'center', fontWeight: 700, marginBottom: '0.7rem' }}
                >
                  Work session
                </div>
                <div id="focusPomodoroClock" className="segment-clock">
                  25:00
                </div>
              </div>
            </div>
            <div id="focusZoneContext" className="focus-zone-context hidden">
              <div id="focusZoneList" />
            </div>
            <div className="focus-pomodoro-footer">
              <div className="focus-actions">
                <button type="button" className="focus-btn" id="focusPomoStartBtn">
                  <i className="fas fa-play" /> Start
                </button>
                <button type="button" className="focus-btn hidden" id="focusPomoPauseBtn">
                  <i className="fas fa-pause" /> Pause
                </button>
                <button type="button" className="focus-btn" id="focusPomoResetBtn">
                  <i className="fas fa-redo" /> Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CmdCalendar() {
  return (
    <div className="calendar-shell">
      <div className="calendar-head">
        <button type="button" id="calendarPrevWeekBtn" className="calendar-nav-btn" aria-label="Previous week">
          ‹
        </button>
        <button type="button" id="calendarNextWeekBtn" className="calendar-nav-btn" aria-label="Next week">
          ›
        </button>
        <button type="button" id="calendarTodayBtn" className="btn" style={{ padding: '0.35rem 0.85rem' }}>
          Today
        </button>
        <div id="calendarRangeLabel" className="calendar-range-label">
          Week
        </div>
        <button type="button" id="calendarMonthViewBtn" className="btn btn-primary" style={{ padding: '0.35rem 0.85rem' }}>
          Month View
        </button>
      </div>
      <div className="calendar-week-grid-wrap">
        <div id="calendarWeekGridWrap" style={{ minHeight: '100%' }}>
          <div id="calendarWeekGrid" className="calendar-week-grid" />
        </div>
      </div>
    </div>
  );
}

function CmdJournal({ expanded }) {
  return (
    <div id="journalShell" className={`journal-shell${expanded ? ' storage-expanded' : ''}`}>
      <section className="journal-main">
        <div className="journal-main-head">
          <h3 id="journalDateHeading">Today</h3>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
            }}
          >
            <div className="journal-toolbar">
              <button type="button" id="journalBoldBtn" className="journal-tool-btn" aria-label="Bold">
                B
              </button>
              <button type="button" id="journalItalicBtn" className="journal-tool-btn" aria-label="Italic">
                <em>I</em>
              </button>
              <button type="button" id="journalUnderlineBtn" className="journal-tool-btn" aria-label="Underline">
                <u>U</u>
              </button>
            </div>
            <span id="journalSaveStatus" className="journal-status">
              <span className="journal-cloud">☁</span>
              <span>Saved</span>
            </span>
            <span id="journalStreakPill" className="journal-streak-pill">
              🔥 0
            </span>
          </div>
        </div>
        <div
          id="journalText"
          className="journal-text"
          contentEditable
          data-placeholder="Quick reflection. 1-2 paragraphs. What's on your mind, what went well, what changes tomorrow?"
        />
        <div className="journal-meta-row">
          <span className="journal-meta-hint">
            Only <strong>today</strong> is edited here. Month or the list below opens a read-only pop-up. Days with no saved
            text are not listed.
          </span>
          <span id="journalWordCount">0 words</span>
        </div>
      </section>
      <aside className="journal-storage">
        <div className="journal-storage-head">
          <strong style={{ fontSize: '0.86rem' }}>Past entries</strong>
          <input id="journalSearchInput" className="journal-search" type="text" placeholder="Search past entries" />
          <button type="button" id="journalMonthBtn" className="journal-month-btn">
            Month
          </button>
          <button type="button" id="journalStorageToggle" className="journal-storage-toggle" aria-label="Toggle entries panel">
            {expanded ? '▾' : '▴'}
          </button>
        </div>
        <div id="journalEntryList" className="journal-list" />
      </aside>
    </div>
  );
}

function CmdGrades() {
  return (
    <div className="cmd-grades-soon">
      <div className="cmd-box">
        <div className="cmd-title">Grades</div>
        <div className="cmd-value-sm">Coming soon</div>
      </div>
    </div>
  );
}