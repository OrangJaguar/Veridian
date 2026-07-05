/**
 * Wrap a short topic string into material suitable for AI propose pipeline.
 */
export function buildTopicMaterial(topic, title, subject) {
  const t = String(topic ?? '').trim();
  const line = t.length >= 3 ? t : 'General study topic';
  return [
    `Study topic: ${line}`,
    `Course/subject: ${subject || 'General'}`,
    `Journey title: ${title || line}`,
    '',
    'Generate a structured knowledge map covering the major concepts a student would need to master for this topic at a high school or introductory college level.',
    'Include definitions, relationships between ideas, and common exam pitfalls.',
  ].join('\n');
}
