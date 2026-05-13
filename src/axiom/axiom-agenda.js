import { AGENDA_TASKS_KEY, AGENDA_TASK_ORDER_KEY, DEFAULT_AGENDA_TASKS } from '../lib/constants-storage';
import { S } from '../lib/state';
import { escapeHtml } from '../lib/utils-text';

export function loadAgendaData() {
  try {
    const rawT = localStorage.getItem(AGENDA_TASKS_KEY);
    const rawO = localStorage.getItem(AGENDA_TASK_ORDER_KEY);
    S.agendaTasks = rawT ? JSON.parse(rawT) : JSON.parse(JSON.stringify(DEFAULT_AGENDA_TASKS));
    S.agendaTaskOrder = rawO ? JSON.parse(rawO) : [];
    if (!rawT) saveAgendaData();
  } catch (e) {
    S.agendaTasks = JSON.parse(JSON.stringify(DEFAULT_AGENDA_TASKS));
    S.agendaTaskOrder = [];
    saveAgendaData();
  }
}

export function saveAgendaData() {
  localStorage.setItem(AGENDA_TASKS_KEY, JSON.stringify(S.agendaTasks));
  localStorage.setItem(AGENDA_TASK_ORDER_KEY, JSON.stringify(S.agendaTaskOrder));
}

function toDatetimeLocalValue(d) {
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatAgendaDateTime(date) {
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

function getAgendaDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.agenda-item:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset, element: child };
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updateAgendaTaskOrderFromDom() {
  const list = document.getElementById('agendaPanelTasks');
  if (!list) return;
  const newOrder = [];
  list.querySelectorAll('.agenda-item[data-agenda-id]').forEach(el => {
    const id = Number(el.dataset.agendaId);
    if (!Number.isNaN(id)) newOrder.push(id);
  });
  S.agendaTaskOrder = newOrder;
}

function onAgendaPanelDragOver(e, cmdContent) {
  const list = e.target.closest('#agendaPanelTasks');
  if (!list || !document.querySelector('.agenda-item.dragging')) return;
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
  const afterElement = getAgendaDragAfterElement(list, e.clientY);
  const drag = document.querySelector('.agenda-item.dragging');
  if (!drag) return;
  if (afterElement == null) { if (list.lastElementChild !== drag) list.appendChild(drag); }
  else if (afterElement !== drag && afterElement.previousElementSibling !== drag) { list.insertBefore(drag, afterElement); }
  list.querySelectorAll('.agenda-item.drag-hover').forEach(el => el.classList.remove('drag-hover'));
  if (afterElement) afterElement.classList.add('drag-hover');
}

function onAgendaPanelDrop(e, renderAgendaLists) {
  const list = e.target.closest('#agendaPanelTasks');
  if (!list) return;
  e.preventDefault();
  list.querySelectorAll('.agenda-item.drag-hover').forEach(el => el.classList.remove('drag-hover'));
  updateAgendaTaskOrderFromDom();
  saveAgendaData();
  renderAgendaLists();
}

export function ensureAgendaDnDDelegates(cmdContent, renderAgendaLists) {
  if (window.__axiomAgendaDnDBound) return;
  window.__axiomAgendaDnDBound = true;
  cmdContent.addEventListener('dragover', e => onAgendaPanelDragOver(e, cmdContent));
  cmdContent.addEventListener('drop', e => onAgendaPanelDrop(e, renderAgendaLists));
}

export function createAgendaItemElement(item, callbacks) {
  const { toggleAgendaItemComplete, openAgendaModalEdit, deleteAgendaItem } = callbacks;
  const row = document.createElement('div');
  row.className = `agenda-item${item.completed ? ' completed' : ''}`;
  row.dataset.agendaId = String(item.id);
  const dueDate = item.due ? new Date(item.due) : null;
  const dueString = dueDate ? formatAgendaDateTime(dueDate) : 'No due date';
  const classString = item.class ? ` • ${item.class}` : '';
  const notesHint = item.notes ? `<span style="opacity:0.85"> · ${escapeHtml(item.notes.slice(0, 80))}${item.notes.length > 80 ? '…' : ''}</span>` : '';
  const canDrag = item.type === 'task' && !item.completed && S.agendaUiFilter === 'tasks';
  if (canDrag) row.draggable = true;
  row.innerHTML = `
    <input type="checkbox" class="agenda-check-input" ${item.completed ? 'checked' : ''}>
    <div class="agenda-main">
      <div class="agenda-title-row"><span class="agenda-title">${escapeHtml(item.title)}</span></div>
      <div class="agenda-meta">${escapeHtml(dueString)}${escapeHtml(classString)}${notesHint}</div>
    </div>
    ${item.type === 'task' ? `<span class="agenda-dot ${item.priority === 'high' ? 'red' : item.priority === 'low' ? 'green' : 'yellow'}" aria-hidden="true"></span>` : '<span class="agenda-dot-spacer" aria-hidden="true"></span>'}
    <div class="agenda-right">
      <button type="button" class="agenda-icon-btn agenda-edit-btn" title="Edit" aria-label="Edit"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
      <button type="button" class="agenda-icon-btn agenda-delete-btn" title="Delete" aria-label="Delete"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
    </div>
  `;
  row.querySelector('.agenda-check-input').addEventListener('change', () => toggleAgendaItemComplete(item.id));
  row.querySelector('.agenda-edit-btn').addEventListener('click', (ev) => { ev.stopPropagation(); openAgendaModalEdit(item.id); });
  row.querySelector('.agenda-delete-btn').addEventListener('click', (ev) => { ev.stopPropagation(); deleteAgendaItem(item.id); });
  if (canDrag) {
    row.addEventListener('dragstart', (ev) => {
      S.agendaDragSource = row;
      ev.dataTransfer.setData('text/plain', String(item.id));
      ev.dataTransfer.effectAllowed = 'move';
      if (ev.dataTransfer && ev.dataTransfer.setDragImage) ev.dataTransfer.setDragImage(row, 16, 16);
      row.classList.add('dragging');
    });
    row.addEventListener('dragend', () => {
      row.classList.remove('dragging');
      document.querySelectorAll('.agenda-item.drag-hover').forEach(el => el.classList.remove('drag-hover'));
      updateAgendaTaskOrderFromDom();
      saveAgendaData();
      callbacks.renderAgendaLists();
      S.agendaDragSource = null;
    });
  }
  return row;
}

export function toggleAgendaItemComplete(id, renderAgendaLists, renderCalendarWeek) {
  const taskIndex = S.agendaTasks.findIndex(t => t.id === id);
  if (taskIndex === -1) return;
  const item = S.agendaTasks[taskIndex];
  const becomingComplete = !item.completed;
  if (becomingComplete && S.agendaUiFilter !== 'completed') {
    const row = document.querySelector(`.agenda-item[data-agenda-id="${id}"]`);
    if (row) {
      const cb = row.querySelector('.agenda-check-input');
      if (cb) cb.disabled = true;
      row.classList.add('agenda-complete-flash');
      window.setTimeout(() => {
        item.completed = true; item.completedAt = new Date().toISOString();
        S.agendaTaskOrder = S.agendaTaskOrder.filter(oid => oid !== id);
        saveAgendaData(); renderAgendaLists();
      }, 520);
      return;
    }
  }
  item.completed = !item.completed;
  if (item.completed) { item.completedAt = new Date().toISOString(); S.agendaTaskOrder = S.agendaTaskOrder.filter(oid => oid !== id); }
  else { delete item.completedAt; if (!S.agendaTaskOrder.includes(id)) S.agendaTaskOrder.push(id); }
  saveAgendaData(); renderAgendaLists(); renderCalendarWeek();
}

export function deleteAgendaItem(id, renderAgendaLists, renderCalendarWeek) {
  S.agendaTasks = S.agendaTasks.filter(t => t.id !== id);
  S.agendaTaskOrder = S.agendaTaskOrder.filter(oid => oid !== id);
  saveAgendaData(); renderAgendaLists(); renderCalendarWeek();
}

export function addAgendaItem(itemData, type, renderAgendaLists, renderCalendarWeek) {
  const newItem = { id: Date.now(), title: itemData.title, due: itemData.due, priority: itemData.priority || '', class: itemData.class || '', notes: itemData.notes || '', type, completed: false, createdAt: new Date().toISOString() };
  S.agendaTasks.push(newItem); S.agendaTaskOrder.push(newItem.id);
  saveAgendaData(); renderAgendaLists(); renderCalendarWeek();
}

export function updateAgendaItem(id, itemData, renderAgendaLists, renderCalendarWeek) {
  const taskIndex = S.agendaTasks.findIndex(t => t.id === id);
  if (taskIndex === -1) return;
  S.agendaTasks[taskIndex] = { ...S.agendaTasks[taskIndex], ...itemData };
  saveAgendaData(); renderAgendaLists(); renderCalendarWeek();
}

export function openAgendaModalEdit(id) {
  const task = S.agendaTasks.find(t => t.id === id);
  if (!task) return;
  const modal = document.getElementById('agendaItemModal');
  document.getElementById('agendaModalTitle').textContent = `Edit ${task.type === 'task' ? 'Task' : 'Event'}`;
  document.getElementById('agendaItemId').value = String(task.id);
  document.getElementById('agendaItemType').value = task.type;
  document.getElementById('agendaFieldTitle').value = task.title;
  document.getElementById('agendaFieldDue').value = task.due ? task.due.substring(0, 16) : '';
  document.getElementById('agendaFieldPriority').value = task.priority || 'medium';
  document.getElementById('agendaFieldClass').value = task.class || '';
  document.getElementById('agendaFieldNotes').value = task.notes || '';
  document.querySelectorAll('.agenda-priority-field, .agenda-class-field').forEach(el => { el.style.display = task.type === 'event' ? 'none' : 'block'; });
  modal.classList.remove('hidden');
}

export function openAgendaModalNewTask() {
  const modal = document.getElementById('agendaItemModal');
  document.getElementById('agendaModalTitle').textContent = 'Add Task';
  document.getElementById('agendaItemForm').reset();
  document.getElementById('agendaItemId').value = '';
  document.getElementById('agendaItemType').value = 'task';
  document.querySelectorAll('.agenda-priority-field, .agenda-class-field').forEach(el => { el.style.display = 'block'; });
  const now = new Date(); now.setHours(23, 59, 0, 0);
  document.getElementById('agendaFieldDue').value = toDatetimeLocalValue(now);
  modal.classList.remove('hidden');
}

export function closeAgendaModal() {
  document.getElementById('agendaItemModal').classList.add('hidden');
}

export function renderAgendaLists(createAgendaItemElementFn) {
  if (S.appMode !== 'cmd' || S.cmdActiveView !== 'agenda') return;
  const panelTasks = document.getElementById('agendaPanelTasks');
  const panelDone = document.getElementById('agendaPanelCompleted');
  if (!panelTasks || !panelDone) return;
  panelTasks.innerHTML = ''; panelDone.innerHTML = '';
  let filteredItems = [];
  if (S.agendaUiFilter === 'tasks') {
    filteredItems = S.agendaTasks.filter(item => item.type === 'task' && !item.completed);
    if (S.agendaTaskOrder.length > 0) {
      const taskMap = {};
      filteredItems.forEach(item => { taskMap[item.id] = item; });
      const orderedTasks = [];
      for (const oid of S.agendaTaskOrder) { if (taskMap[oid] && !taskMap[oid].completed) { orderedTasks.push(taskMap[oid]); delete taskMap[oid]; } }
      for (const id in taskMap) { if (!taskMap[id].completed) orderedTasks.push(taskMap[id]); }
      filteredItems = orderedTasks;
    } else {
      filteredItems.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1, '': 0 };
        if (priorityOrder[b.priority] !== priorityOrder[a.priority]) return priorityOrder[b.priority] - priorityOrder[a.priority];
        if (a.due && b.due) return new Date(a.due) - new Date(b.due);
        return a.due ? -1 : 1;
      });
    }
    if (filteredItems.length === 0) { panelTasks.innerHTML = '<div class="agenda-empty-hint">No tasks found</div>'; }
    else { filteredItems.forEach(item => panelTasks.appendChild(createAgendaItemElementFn(item))); }
    return;
  }
  if (S.agendaUiFilter === 'completed') {
    filteredItems = S.agendaTasks.filter(item => item.completed);
    filteredItems.sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0));
    if (filteredItems.length === 0) { panelDone.innerHTML = '<div class="agenda-empty-hint">No completed items</div>'; }
    else { filteredItems.forEach(item => panelDone.appendChild(createAgendaItemElementFn(item))); }
  }
}