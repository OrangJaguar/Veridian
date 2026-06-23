export const MAI_SURVEY_VERSION = 'MAI_monitoring_v1';

export const MAI_ITEMS = [
  'I ask myself periodically if I am meeting my goals.',
  'I ask myself if I have considered all options when solving a problem.',
  'I check my work while I am doing it.',
  'I ask myself how well I accomplished my goals once I\'m finished.',
  'I am aware of what strategies I use when studying.',
];

export const MAI_SCALE_MIN = 1;
export const MAI_SCALE_MAX = 5;
export const MAI_SCALE_LABELS = {
  min: 'Not at all like me',
  max: 'Very much like me',
};

export function computeMaiTotalScore(responses) {
  return responses.reduce((sum, r) => sum + (r.response ?? 0), 0);
}
