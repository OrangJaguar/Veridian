/** Canonical failure mode identifiers (5 modes + retention). */
export const FAILURE_MODE_IDS = [
  'understanding_gap',
  'verbatim_trap',
  'transfer_failure',
  'interference',
  'pressure_collapse',
  'retention_decay',
];

export const FAILURE_EVIDENCE_VERSION = 1;

export const EMERGING_EVIDENCE_HITS = 2;
export const CONFIRMED_EVIDENCE_HITS = 4;

export const MAX_PROCESSED_SESSION_IDS = 50;
export const MAX_SAMPLES_PER_MODE = 5;
export const RECENCY_BOOST_DAYS = 7;
export const RECENCY_WEIGHT = 1.5;

export const BACKFILL_SESSION_LIMIT = 20;
