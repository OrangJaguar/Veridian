import React, { useState } from 'react';
import { useAxiomStore } from '../../store/useAxiomStore';
import { getMonthDates, MONTH_NAMES, DAY_NAMES, getTodayISO } from '../../lib/utils-date';

export default function CalendarMain() {
  const { tasks, journal } = useAxiomStore();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(getTodayISO());

  const dates = getMonthDates(year, month);
  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const getDateStr = (d) => d.toISOString().split('T')[0];

  const selectedTasks = selected ? tasks.filter(t => t.dueDate?.startsWith(selected)) : [];
  const selectedEntry = selected ? journal.find(e => e.date.startsWith(selected)) : null;

  return (
    <div className="axiom-view axiom-calendar">
      <div className="axiom-calendar-header">
        <button className="axiom-btn" onClick={prevMonth}>‹</button>
        <h2>{MONTH_NAMES[month]} {year}</h2>
        <button className="axiom-btn" onClick={nextMonth}>›</button>
      </div>
      <div className="axiom-calendar-grid">
        {DAY_NAMES.map(d => <div key={d} className="axiom-cal-day-name axiom-muted">{d}</div>)}
        {dates.map((d, i) => {
          const str = getDateStr(d);
          const isCurrentMonth = d.getMonth() === month;
          const isToday = str === getTodayISO();
          const isSelected = str === selected;
          const hasTasks = tasks.some(t => t.dueDate?.startsWith(str));
          const hasJournal = journal.some(e => e.date.startsWith(str));
          return (
            <div key={i}
              className={`axiom-cal-cell ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelected(str)}>
              <span className="axiom-cal-date">{d.getDate()}</span>
              <div className="axiom-cal-dots">
                {hasTasks && <span className="axiom-cal-dot tasks" />}
                {hasJournal && <span className="axiom-cal-dot journal" />}
              </div>
            </div>
          );
        })}
      </div>
      {selected && (
        <div className="axiom-calendar-detail">
          <h3>{selected}</h3>
          {selectedTasks.length > 0 && (
            <div>
              <p className="axiom-muted">Tasks due:</p>
              {selectedTasks.map(t => <div key={t.id} className={`axiom-task-chip priority-${t.priority}`}>{t.title}</div>)}
            </div>
          )}
          {selectedEntry && <p className="axiom-muted">Journal entry exists ✎</p>}
          {selectedTasks.length === 0 && !selectedEntry && <p className="axiom-muted">Nothing on this day</p>}
        </div>
      )}
    </div>
  );
}