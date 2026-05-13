import { CALENDAR_EVENTS_KEY } from '../lib/constants-storage';
import { S } from '../lib/state';
import { addDays, toLocalDateKey, parseLocalDateKey } from '../lib/utils-date';
import { escapeHtml } from '../lib/utils-text';
import { cloudSaveCalendarEvent, cloudDeleteCalendarEvent, isCloudEnabled } from '../lib/cloudSync';

export function loadCalendarData() {
  try {
    const raw = localStorage.getItem(CALENDAR_EVENTS_KEY);
    S.calendarEvents = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(S.calendarEvents)) S.calendarEvents = [];
  } catch (e) { S.calendarEvents = []; }
}

export function saveCalendarData() {
  localStorage.setItem(CALENDAR_EVENTS_KEY, JSON.stringify(S.calendarEvents));
}

export async function saveCalendarDataCloud(changedEvent) {
  saveCalendarData();
  if (isCloudEnabled() && changedEvent) await cloudSaveCalendarEvent(changedEvent).catch(() => {});
}

export async function deleteCalendarEventCloud(eventId) {
  if (isCloudEnabled()) await cloudDeleteCalendarEvent(eventId).catch(() => {});
}

export function toDateTimeLocalKey(dateObj) {
  const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
  const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0'); const hh = String(d.getHours()).padStart(2, '0'); const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

export function normalizeCalendarEvent(raw) {
  const fallbackColor = '#7f8aa5';
  return {
    id: raw.id || Date.now(), title: raw.title || 'Untitled',
    start: raw.start || toDateTimeLocalKey(new Date()), end: raw.end || toDateTimeLocalKey(addDays(new Date(), 0)),
    allDay: !!raw.allDay, color: raw.color || fallbackColor,
    repeatRule: raw.repeatRule || 'none',
    repeatDays: Array.isArray(raw.repeatDays) ? raw.repeatDays.map(Number).filter(v => v >= 0 && v <= 6) : [],
    notes: raw.notes || ''
  };
}

function startOfWeek(dateObj) {
  const d = new Date(dateObj); d.setHours(0, 0, 0, 0);
  const dow = d.getDay(); const diff = (dow + 6) % 7; d.setDate(d.getDate() - diff); return d;
}

export function getWeekDays(anchor) {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, idx) => addDays(start, idx));
}

export function doesEventOccurOnDay(evt, dayDate) {
  const start = new Date(evt.start); const end = new Date(evt.end);
  const dayStart = new Date(dayDate); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayDate); dayEnd.setHours(23, 59, 59, 999);
  if (evt.repeatRule === 'none') return start <= dayEnd && end >= dayStart;
  if (evt.repeatRule === 'daily') return dayStart >= new Date(start.getFullYear(), start.getMonth(), start.getDate());
  if (evt.repeatRule === 'weekly') return dayDate.getDay() === start.getDay() && dayStart >= new Date(start.getFullYear(), start.getMonth(), start.getDate());
  if (evt.repeatRule === 'weekdays') { const dow = dayDate.getDay(); return dow >= 1 && dow <= 5 && dayStart >= new Date(start.getFullYear(), start.getMonth(), start.getDate()); }
  if (evt.repeatRule === 'custom') { const allowed = Array.isArray(evt.repeatDays) && evt.repeatDays.length ? evt.repeatDays : [start.getDay()]; return allowed.includes(dayDate.getDay()) && dayStart >= new Date(start.getFullYear(), start.getMonth(), start.getDate()); }
  return false;
}

function materializeEventForDay(evt, dayDate) {
  const srcStart = new Date(evt.start); const srcEnd = new Date(evt.end);
  const durMs = Math.max(15 * 60 * 1000, srcEnd.getTime() - srcStart.getTime());
  const dayStart = new Date(dayDate); dayStart.setHours(srcStart.getHours(), srcStart.getMinutes(), 0, 0);
  const dayEnd = new Date(dayStart.getTime() + durMs);
  return { ...evt, displayStart: dayStart, displayEnd: dayEnd };
}

export function getCalendarEventsForWeek(anchor) {
  const days = getWeekDays(anchor); const result = {};
  days.forEach(d => { result[toLocalDateKey(d)] = []; });
  S.calendarEvents.forEach(rawEvt => {
    const evt = normalizeCalendarEvent(rawEvt);
    days.forEach(day => {
      if (!doesEventOccurOnDay(evt, day)) return;
      result[toLocalDateKey(day)].push(materializeEventForDay(evt, day));
    });
  });
  Object.keys(result).forEach(k => { result[k].sort((a, b) => a.displayStart - b.displayStart); });
  return result;
}

export function getMinutesSinceCalendarStart(dateObj) {
  const d = new Date(dateObj); return (d.getHours() * 60 + d.getMinutes()) - 60;
}
export function getTopFromMinutes(min) { return min * (56 / 60); }
export function clampCalendarMinutes(min) { return Math.max(0, Math.min(23 * 60, min)); }

function minutesToLabel(minuteOffset) {
  const total = minuteOffset + 60; const hour = Math.floor(total / 60); const mins = total % 60;
  const base = new Date(); base.setHours(hour % 24, mins, 0, 0);
  return base.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function formatCalendarEventTime(evt) {
  return `${evt.displayStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${evt.displayEnd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
}

function softSnapCalendarMinute(minute) {
  const rounded5 = Math.round(minute / 5) * 5; const nearest15 = Math.round(minute / 15) * 15;
  return Math.abs(rounded5 - nearest15) <= 4 ? nearest15 : rounded5;
}

function getCalendarMinuteFromPointer(laneEl, clientY) {
  const rect = laneEl.getBoundingClientRect();
  return clampCalendarMinutes(Math.round((clientY - rect.top) / (56 / 60)));
}

function getCalendarLaneFromPointerX(clientX) {
  const lanes = [...document.querySelectorAll('#calendarWeekGrid .calendar-day-lane')];
  for (const lane of lanes) { const r = lane.getBoundingClientRect(); if (clientX >= r.left && clientX <= r.right) return lane; }
  return null;
}

export function openCalendarModalForNew(dayDate) {
  const modal = document.getElementById('calendarEventModal');
  const start = new Date(dayDate); start.setHours(8, 0, 0, 0);
  const end = new Date(start.getTime() + 3600000);
  document.getElementById('calendarModalTitle').textContent = 'Add Calendar Event';
  document.getElementById('calendarEventForm').reset();
  document.getElementById('calendarEventId').value = '';
  document.getElementById('calendarFieldStart').value = toDateTimeLocalKey(start);
  document.getElementById('calendarFieldEnd').value = toDateTimeLocalKey(end);
  document.getElementById('calendarFieldColor').value = '#7f8aa5';
  syncCalendarColorSwatches('#7f8aa5');
  setCalendarRepeatDays([start.getDay()]);
  document.getElementById('calendarDeleteBtn').classList.add('hidden');
  modal.classList.remove('hidden');
}

function openCalendarModalFromDrag(dayKey, startMin, endMin) {
  const day = parseLocalDateKey(dayKey); const start = new Date(day); const end = new Date(day);
  const s = softSnapCalendarMinute(Math.floor(Math.min(startMin, endMin)));
  const e = softSnapCalendarMinute(Math.ceil(Math.max(startMin, endMin)));
  start.setHours(1, 0, 0, 0); start.setMinutes(start.getMinutes() + s);
  end.setHours(1, 0, 0, 0); end.setMinutes(end.getMinutes() + Math.max(e, s + 30));
  const modal = document.getElementById('calendarEventModal');
  document.getElementById('calendarModalTitle').textContent = 'Add Calendar Event';
  document.getElementById('calendarEventForm').reset();
  document.getElementById('calendarEventId').value = '';
  document.getElementById('calendarFieldStart').value = toDateTimeLocalKey(start);
  document.getElementById('calendarFieldEnd').value = toDateTimeLocalKey(end);
  document.getElementById('calendarFieldColor').value = '#7f8aa5';
  syncCalendarColorSwatches('#7f8aa5'); setCalendarRepeatDays([start.getDay()]);
  document.getElementById('calendarDeleteBtn').classList.add('hidden');
  modal.classList.remove('hidden');
}

export function openCalendarModalForEdit(evtId) {
  const event = S.calendarEvents.find(e => String(e.id) === String(evtId));
  if (!event) return;
  const modal = document.getElementById('calendarEventModal');
  document.getElementById('calendarModalTitle').textContent = 'Edit Calendar Event';
  document.getElementById('calendarEventId').value = String(event.id);
  document.getElementById('calendarFieldTitle').value = event.title || '';
  document.getElementById('calendarFieldStart').value = event.start || '';
  document.getElementById('calendarFieldEnd').value = event.end || '';
  document.getElementById('calendarFieldColor').value = event.color || '#7f8aa5';
  syncCalendarColorSwatches(event.color || '#7f8aa5');
  document.getElementById('calendarFieldRepeat').value = event.repeatRule || 'none';
  setCalendarRepeatDays((event.repeatDays && event.repeatDays.length) ? event.repeatDays : [new Date(event.start).getDay()]);
  updateCalendarRepeatDaysVisibility();
  document.getElementById('calendarFieldNotes').value = event.notes || '';
  document.getElementById('calendarDeleteBtn').classList.remove('hidden');
  modal.classList.remove('hidden');
}

export function closeCalendarModal() { document.getElementById('calendarEventModal').classList.add('hidden'); }

export function openCalendarDayModal(dayDate) {
  const body = document.getElementById('calendarDayModalBody');
  const title = document.getElementById('calendarDayModalTitle');
  if (!body || !title) return;
  title.textContent = dayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  body.innerHTML = `
    <div class="calendar-week-grid-wrap" style="height: 68vh;">
      <div class="calendar-week-grid" style="grid-template-columns: 70px minmax(0, 1fr); min-width: 0;">
        <div class="calendar-time-corner"></div>
        <div class="calendar-day-head"><span>${dayDate.toLocaleDateString('en-US', { weekday: 'short' })}</span><span class="calendar-day-num">${dayDate.getDate()}</span></div>
        <div class="calendar-time-col" id="calendarDayModalTimeCol"></div>
        <div class="calendar-day-lane" id="calendarDayModalLane"></div>
      </div>
    </div>
  `;
  const lane = document.getElementById('calendarDayModalLane');
  const timeCol = document.getElementById('calendarDayModalTimeCol');
  for (let h = 1; h <= 24; h++) {
    const label = document.createElement('div'); label.className = 'calendar-time-label';
    const dt = new Date(dayDate); dt.setHours(h === 24 ? 0 : h, 0, 0, 0);
    label.textContent = dt.toLocaleTimeString('en-US', { hour: 'numeric' }); timeCol.appendChild(label);
  }
  const key = toLocalDateKey(dayDate);
  const weekEvents = getCalendarEventsForWeek(dayDate)[key] || [];
  weekEvents.forEach(evt => {
    const top = getTopFromMinutes(clampCalendarMinutes(getMinutesSinceCalendarStart(evt.displayStart)));
    const end = getTopFromMinutes(clampCalendarMinutes(getMinutesSinceCalendarStart(evt.displayEnd)));
    const item = document.createElement('button'); item.type = 'button';
    item.className = `calendar-event${evt.__readonly ? ' readonly' : ''}`;
    item.style.top = `${top}px`; item.style.height = `${Math.max(22, end - top)}px`;
    item.innerHTML = `<div class="calendar-event-title">${escapeHtml(evt.title)}</div><div class="calendar-event-time">${escapeHtml(formatCalendarEventTime(evt))}</div>`;
    if (!evt.__readonly) item.onclick = () => openCalendarModalForEdit(evt.id);
    lane.appendChild(item);
  });
  document.getElementById('calendarDayModal').classList.remove('hidden');
}

export function closeCalendarDayModal() { document.getElementById('calendarDayModal').classList.add('hidden'); }

export function setCalendarRepeatDays(daysArr) {
  const chips = document.querySelectorAll('.calendar-repeat-day-chip');
  const set = new Set((daysArr || []).map(Number));
  chips.forEach(ch => ch.classList.toggle('active', set.has(Number(ch.dataset.dow))));
}

export function getCalendarRepeatDaysFromUI() {
  return [...document.querySelectorAll('.calendar-repeat-day-chip.active')].map(ch => Number(ch.dataset.dow));
}

export function updateCalendarRepeatDaysVisibility() {
  const wrap = document.getElementById('calendarRepeatDaysWrap');
  const repeat = document.getElementById('calendarFieldRepeat');
  if (!wrap || !repeat) return;
  wrap.classList.toggle('hidden', repeat.value !== 'custom');
}

export function syncCalendarColorSwatches(hex) {
  document.querySelectorAll('.calendar-color-swatch').forEach(sw => { sw.classList.toggle('active', sw.dataset.color === hex); });
}

export function renderCalendarMonthGrid() {
  const grid = document.getElementById('calendarMonthGrid'); const monthSel = document.getElementById('calendarMonthSelect');
  const yearSel = document.getElementById('calendarYearSelect'); const label = document.getElementById('calendarMonthLabel');
  if (!grid || !monthSel || !yearSel || !label) return;
  const y = S.calendarMonthCursor.getFullYear(); const m = S.calendarMonthCursor.getMonth();
  label.textContent = S.calendarMonthCursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  monthSel.value = String(m); yearSel.value = String(y); grid.innerHTML = '';
  const first = new Date(y, m, 1); const startShift = first.getDay(); const startDate = new Date(y, m, 1 - startShift);
  for (let i = 0; i < 42; i++) {
    const d = addDays(startDate, i); const cell = document.createElement('button'); cell.type = 'button';
    cell.className = `calendar-month-cell${d.getMonth() !== m ? ' muted' : ''}`;
    cell.innerHTML = `<div style="font-weight:700;">${d.getDate()}</div>`;
    cell.onclick = () => { S.calendarAnchorDate = new Date(d); closeCalendarMonthModal(); renderCalendarWeek(); };
    grid.appendChild(cell);
  }
}

export function openCalendarMonthModal() {
  const monthSel = document.getElementById('calendarMonthSelect'); const yearSel = document.getElementById('calendarYearSelect');
  if (monthSel && !monthSel.dataset.init) { monthSel.dataset.init = '1'; monthSel.innerHTML = Array.from({ length: 12 }, (_, i) => `<option value="${i}">${new Date(2026, i, 1).toLocaleDateString('en-US', { month: 'long' })}</option>`).join(''); }
  if (yearSel && !yearSel.dataset.init) { yearSel.dataset.init = '1'; const nowY = new Date().getFullYear(); let html = ''; for (let y = nowY - 10; y <= nowY + 10; y++) html += `<option value="${y}">${y}</option>`; yearSel.innerHTML = html; }
  S.calendarMonthCursor = new Date(S.calendarAnchorDate);
  renderCalendarMonthGrid();
  document.getElementById('calendarMonthModal').classList.remove('hidden');
}

export function closeCalendarMonthModal() { document.getElementById('calendarMonthModal').classList.add('hidden'); }

export function renderCalendarWeek() {
  if (S.appMode !== 'cmd' || S.cmdActiveView !== 'calendar') return;
  const weekDays = getWeekDays(S.calendarAnchorDate);
  const [start, end] = [weekDays[0], weekDays[6]];
  const labelEl = document.getElementById('calendarRangeLabel');
  if (labelEl) labelEl.textContent = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  const grid = document.getElementById('calendarWeekGrid');
  if (!grid) return;
  const wrap = document.getElementById('calendarWeekGridWrap');
  const eventsByDay = getCalendarEventsForWeek(S.calendarAnchorDate);
  grid.innerHTML = '';
  const corner = document.createElement('div'); corner.className = 'calendar-time-corner'; grid.appendChild(corner);
  weekDays.forEach((day, idx) => {
    const head = document.createElement('button'); head.type = 'button'; head.className = 'calendar-day-head';
    head.style.gridColumn = String(idx + 2); head.style.gridRow = '1';
    head.innerHTML = `<span>${day.toLocaleDateString('en-US', { weekday: 'short' })}</span><span class="calendar-day-num">${day.getDate()}</span>`;
    head.onclick = () => openCalendarDayModal(day); grid.appendChild(head);
  });
  const timeCol = document.createElement('div'); timeCol.className = 'calendar-time-col';
  timeCol.style.gridColumn = '1'; timeCol.style.gridRow = '2';
  for (let h = 1; h <= 24; h++) {
    const lbl = document.createElement('div'); lbl.className = 'calendar-time-label';
    const dt = new Date(); dt.setHours(h === 24 ? 0 : h, 0, 0, 0);
    lbl.textContent = dt.toLocaleTimeString('en-US', { hour: 'numeric' }); timeCol.appendChild(lbl);
  }
  grid.appendChild(timeCol);
  const hlWrap = document.createElement('div'); hlWrap.className = 'calendar-hour-lines';
  for (let h = 0; h < 23; h++) { const hl = document.createElement('div'); hl.className = 'calendar-hour-line'; hl.style.top = `${h*56}px`; hlWrap.appendChild(hl); }
  grid.appendChild(hlWrap);
  weekDays.forEach((day, idx) => {
    const key = toLocalDateKey(day);
    const lane = document.createElement('div'); lane.className = 'calendar-day-lane';
    lane.style.gridColumn = String(idx + 2); lane.style.gridRow = '2'; lane.dataset.dayKey = key;
    const list = eventsByDay[key] || [];
    list.forEach(evt => {
      const top = getTopFromMinutes(clampCalendarMinutes(getMinutesSinceCalendarStart(evt.displayStart)));
      const endPx = getTopFromMinutes(clampCalendarMinutes(getMinutesSinceCalendarStart(evt.displayEnd)));
      const item = document.createElement('button'); item.type = 'button';
      item.className = `calendar-event${evt.__readonly ? ' readonly' : ''}`;
      item.style.background = evt.color ? `${evt.color}cc` : '';
      item.style.top = `${top}px`; item.style.height = `${Math.max(22, endPx - top)}px`;
      item.dataset.eventId = String(evt.id); item.dataset.dayIndex = String(idx);
      item.dataset.startMin = String(clampCalendarMinutes(getMinutesSinceCalendarStart(evt.displayStart)));
      item.dataset.endMin = String(clampCalendarMinutes(getMinutesSinceCalendarStart(evt.displayEnd)));
      item.innerHTML = `<div class="calendar-event-title">${escapeHtml(evt.title)}</div><div class="calendar-event-time">${escapeHtml(formatCalendarEventTime(evt))}</div>`;
      if (evt.__readonly) { item.title = 'Linked from Agenda'; }
      else {
        item.onclick = (ev) => { if (item.dataset.dragging === '1') return; const rect = item.getBoundingClientRect(); const y = ev.clientY - rect.top; if (y <= rect.height / 3) return; ev.stopPropagation(); openCalendarModalForEdit(evt.id); };
        item.onmousemove = (ev) => { if (S.calendarEventDragState) return; const rect = item.getBoundingClientRect(); const y = ev.clientY - rect.top; if (y <= 7 || y >= rect.height - 7) item.style.cursor = 'ns-resize'; else if (y <= rect.height / 3) item.style.cursor = 'grab'; else item.style.cursor = 'pointer'; };
        item.onmouseleave = () => { if (!S.calendarEventDragState) item.style.cursor = 'pointer'; };
        item.onmousedown = (ev) => {
          if (ev.button !== 0) return;
          const rect = item.getBoundingClientRect(); const y = ev.clientY - rect.top;
          if (y > rect.height / 3 && y > 7 && y < rect.height - 7) return;
          ev.stopPropagation(); ev.preventDefault();
          const startMin = Number(item.dataset.startMin); const endMin = Number(item.dataset.endMin);
          const mode = y <= 7 ? 'resize-start' : (y >= rect.height - 7 ? 'resize-end' : 'move');
          const dayIndex = Number(item.dataset.dayIndex); const eventId = item.dataset.eventId;
          const originalEvt = S.calendarEvents.find(ei => String(ei.id) === String(eventId));
          if (!originalEvt) return;
          S.calendarEventDragState = { mode, eventId, item, lane, dayIndex, origDayIndex: dayIndex, startMin, endMin, origStartMin: startMin, origEndMin: endMin, duration: Math.max(15, endMin - startMin), grabOffset: startMin - getCalendarMinuteFromPointer(lane, ev.clientY), timeEl: item.querySelector('.calendar-event-time') };
          item.classList.add(mode === 'move' ? 'is-moving' : 'is-resizing');
          item.dataset.dragging = '1';
        };
      }
      lane.appendChild(item);
    });
    lane.onmousedown = (ev) => {
      if (ev.button !== 0 || ev.target.closest('.calendar-event')) return;
      const rect = lane.getBoundingClientRect();
      const startMin = clampCalendarMinutes(Math.round((ev.clientY - rect.top) / (56 / 60)));
      const ghost = document.createElement('div'); ghost.className = 'calendar-drag-preview';
      ghost.style.top = `${getTopFromMinutes(startMin)}px`; ghost.style.height = '2px';
      ghost.textContent = `${minutesToLabel(startMin)} - ${minutesToLabel(startMin + 30)}`;
      lane.appendChild(ghost);
      S.calendarDragState = { lane, dayKey: key, startMin, endMin: startMin, ghost };
      ev.preventDefault();
    };
    grid.appendChild(lane);
  });
  const now = new Date(); const nowKey = toLocalDateKey(now);
  const laneNow = grid.querySelector(`.calendar-day-lane[data-day-key="${nowKey}"]`);
  if (laneNow) {
    const nowMin = clampCalendarMinutes(getMinutesSinceCalendarStart(now));
    const y = getTopFromMinutes(nowMin);
    const line = document.createElement('div'); line.className = 'calendar-now-line'; line.style.top = `${y}px`;
    line.innerHTML = '<span class="calendar-now-dot"></span>'; laneNow.appendChild(line);
  }
  if (wrap && !wrap.dataset.scrolledInit) { wrap.dataset.scrolledInit = '1'; wrap.scrollTop = getTopFromMinutes(8 * 60); }
}

export function bindCalendarChrome() {
  const prev = document.getElementById('calendarPrevWeekBtn'); const next = document.getElementById('calendarNextWeekBtn');
  const today = document.getElementById('calendarTodayBtn'); const monthBtn = document.getElementById('calendarMonthViewBtn');
  if (prev) prev.onclick = () => { S.calendarAnchorDate = addDays(S.calendarAnchorDate, -7); renderCalendarWeek(); };
  if (next) next.onclick = () => { S.calendarAnchorDate = addDays(S.calendarAnchorDate, 7); renderCalendarWeek(); };
  if (today) today.onclick = () => { S.calendarAnchorDate = new Date(); renderCalendarWeek(); };
  if (monthBtn) monthBtn.onclick = () => openCalendarMonthModal();
}

export function bindCalendarDragGlobal() {
  if (window.__axiomCalendarDragBound) return;
  window.__axiomCalendarDragBound = true;
  document.addEventListener('mousemove', (ev) => {
    if (S.calendarEventDragState) {
      const st = S.calendarEventDragState;
      let lane = st.lane;
      if (st.mode === 'move') { const laneByX = getCalendarLaneFromPointerX(ev.clientX); if (laneByX) lane = laneByX; }
      if (!lane) return;
      const laneRect = lane.getBoundingClientRect();
      const pointerMin = getCalendarMinuteFromPointer(lane, ev.clientY);
      let nextStart = st.startMin; let nextEnd = st.endMin;
      if (st.mode === 'move') {
        nextStart = softSnapCalendarMinute(pointerMin + st.grabOffset);
        nextEnd = nextStart + st.duration;
        if (nextEnd > clampCalendarMinutes(23 * 60)) { nextEnd = clampCalendarMinutes(23 * 60); nextStart = nextEnd - st.duration; }
      } else if (st.mode === 'resize-start') { nextStart = softSnapCalendarMinute(pointerMin); nextStart = Math.min(nextStart, st.endMin - 15); }
      else if (st.mode === 'resize-end') { nextEnd = softSnapCalendarMinute(pointerMin); nextEnd = Math.max(nextEnd, st.startMin + 15); }
      nextStart = clampCalendarMinutes(nextStart); nextEnd = clampCalendarMinutes(nextEnd);
      if (nextEnd <= nextStart) nextEnd = nextStart + 15;
      if (st.item.parentNode !== lane) lane.appendChild(st.item);
      st.lane = lane; st.dayIndex = Number(lane.style.gridColumn) - 2;
      st.startMin = nextStart; st.endMin = nextEnd;
      st.item.style.top = `${getTopFromMinutes(nextStart)}px`;
      st.item.style.height = `${Math.max(22, getTopFromMinutes(nextEnd) - getTopFromMinutes(nextStart))}px`;
      if (st.timeEl) st.timeEl.textContent = `${minutesToLabel(nextStart)} - ${minutesToLabel(nextEnd)}`;
      st.item.style.left = '6px'; st.item.style.right = '6px';
      if (st.mode !== 'move' || (ev.clientX >= laneRect.left && ev.clientX <= laneRect.right)) { st.item.style.cursor = st.mode === 'move' ? 'grabbing' : 'ns-resize'; }
      return;
    }
    if (!S.calendarDragState) return;
    const rect = S.calendarDragState.lane.getBoundingClientRect();
    S.calendarDragState.endMin = clampCalendarMinutes(Math.round((ev.clientY - rect.top) / (56 / 60)));
    const s = Math.min(S.calendarDragState.startMin, S.calendarDragState.endMin);
    const e = Math.max(S.calendarDragState.startMin, S.calendarDragState.endMin);
    S.calendarDragState.ghost.style.top = `${getTopFromMinutes(s)}px`;
    S.calendarDragState.ghost.style.height = `${Math.max(2, getTopFromMinutes(e) - getTopFromMinutes(s))}px`;
    S.calendarDragState.ghost.textContent = `${minutesToLabel(softSnapCalendarMinute(s))} - ${minutesToLabel(Math.max(softSnapCalendarMinute(s) + 30, softSnapCalendarMinute(e)))}`;
  });
  document.addEventListener('mouseup', () => {
    if (S.calendarEventDragState) {
      const st = S.calendarEventDragState; S.calendarEventDragState = null;
      st.item.classList.remove('is-moving', 'is-resizing');
      setTimeout(() => { st.item.dataset.dragging = '0'; }, 0);
      const dayShift = st.dayIndex - st.origDayIndex;
      const idx = S.calendarEvents.findIndex(ei => String(ei.id) === String(st.eventId));
      if (idx >= 0) {
        const current = S.calendarEvents[idx];
        let baseStart = new Date(current.start); let baseEnd = new Date(current.end);
        if (st.mode === 'move') { const minuteShift = st.startMin - st.origStartMin; baseStart = new Date(baseStart.getTime() + dayShift * 86400000 + minuteShift * 60000); baseEnd = new Date(baseEnd.getTime() + dayShift * 86400000 + minuteShift * 60000); }
        else if (st.mode === 'resize-start') { const startDiff = st.startMin - st.origStartMin; baseStart = new Date(baseStart.getTime() + startDiff * 60000); if (Math.round((baseEnd - baseStart) / 60000) < 15) baseStart = new Date(baseEnd.getTime() - 15 * 60000); }
        else { const endDiff = st.endMin - st.origEndMin; baseEnd = new Date(baseEnd.getTime() + endDiff * 60000); if (Math.round((baseEnd - baseStart) / 60000) < 15) baseEnd = new Date(baseStart.getTime() + 15 * 60000); }
        S.calendarEvents[idx] = normalizeCalendarEvent({ ...current, start: toDateTimeLocalKey(baseStart), end: toDateTimeLocalKey(baseEnd) });
        saveCalendarData();
      }
      renderCalendarWeek(); return;
    }
    if (!S.calendarDragState) return;
    const st = S.calendarDragState; S.calendarDragState = null;
    if (st.ghost && st.ghost.parentNode) st.ghost.parentNode.removeChild(st.ghost);
    if (Math.abs(st.endMin - st.startMin) < 5) return;
    openCalendarModalFromDrag(st.dayKey, st.startMin, st.endMin);
  });
}

export function getDebriefItemsForToday() {
  const now = new Date(); const todayKey = toLocalDateKey(now);
  const dayStart = parseLocalDateKey(todayKey); const dayEnd = addDays(dayStart, 1);
  const items = [];
  const weekEvents = getCalendarEventsForWeek(now)[todayKey] || [];
  weekEvents.forEach(evt => { items.push({ kind: evt.__readonly ? 'linked' : 'event', title: evt.title || 'Untitled event', start: evt.displayStart, end: evt.displayEnd }); });
  S.agendaTasks.forEach(t => {
    if (t.completed) return; if (!t.due) return;
    const due = new Date(t.due);
    if (due >= dayStart && due < dayEnd) { items.push({ kind: 'task', title: t.title || 'Untitled task', start: due, end: due }); }
  });
  items.sort((a, b) => (a.start?.getTime?.() || 0) - (b.start?.getTime?.() || 0));
  return items;
}