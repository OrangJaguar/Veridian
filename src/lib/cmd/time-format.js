export function formatTime12(time24) {
  const [hourStr, minStr] = time24.split(':');
  let hour = parseInt(hourStr, 10);
  const min = minStr ?? '00';
  const period = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${min} ${period}`;
}

export function getCurrentTimeString() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function getTimeSlots(startHour = 6, endHour = 23, intervalMin = 30) {
  const slots = [];
  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += intervalMin) {
      if (h === endHour && m > 0) break;
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
}