import { generateId } from '../utils-text';

export function createScheduleBlock(partial) {
  return { id: generateId(), ...partial };
}

export function sortBlocksByTime(blocks) {
  return [...blocks].sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    return a.startTime.localeCompare(b.startTime);
  });
}

export function getBlocksForDay(blocks, day) {
  return blocks.filter(b => b.day === day);
}

export function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function blockDurationMinutes(block) {
  return timeToMinutes(block.endTime) - timeToMinutes(block.startTime);
}