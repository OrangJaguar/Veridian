import {
  BookOpen,
  Repeat,
  Shuffle,
  GitBranch,
  Timer,
  TrendingDown,
} from 'lucide-react';
import { FAILURE_MODE_IDS } from '@/utils/failures/constants';
import { getFailureModeMeta } from '@/utils/failures/taxonomy';

const ICON_MAP = {
  BookOpen,
  Repeat,
  Shuffle,
  GitBranch,
  Timer,
  TrendingDown,
};

/** CSS modifier class suffix per mode, e.g. failure-mode--understanding_gap */
export function getFailureModeClassName(modeId) {
  if (!modeId) return 'failure-mode--unknown';
  return `failure-mode--${modeId}`;
}

export function getFailureModeIcon(modeId) {
  const iconKey = getFailureModeMeta(modeId)?.iconKey;
  return ICON_MAP[iconKey] ?? BookOpen;
}

export function getFailureModeCssToken(modeId) {
  return `--failure-${modeId}`;
}

export function allModesHaveVisuals() {
  return FAILURE_MODE_IDS.every((modeId) => {
    const meta = getFailureModeMeta(modeId);
    return meta?.iconKey && ICON_MAP[meta.iconKey] && getFailureModeClassName(modeId);
  });
}
