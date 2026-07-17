import { useState } from 'react';
import { usePreferences } from '@/hooks/queries/usePreferences';
import { useCommitmentAdherence } from '@/hooks/queries/useStudyCommitments';
import { useAcceptWeeklyCommitments } from '@/hooks/mutations/useStudyCommitmentMutations';
import { useClearWeekOverrides } from '@/hooks/mutations/usePlanOverrideMutations';
import { runRecoveryReplan, invalidateGlobalPlan } from '@/api/entities/globalPlan';
import { useQueryClient } from '@tanstack/react-query';
import { getWeekKey } from '@/utils/weeklyPlan/weekKey';
import { toast } from 'sonner';

export default function WeeklyCommitmentCard() {
  const weekKey = getWeekKey();
  const { data: preferences } = usePreferences();
  const { adherence, isPending } = useCommitmentAdherence(weekKey);
  const accept = useAcceptWeeklyCommitments();
  const clearOverrides = useClearWeekOverrides();
  const queryClient = useQueryClient();
  const [sessions, setSessions] = useState(
    preferences?.weeklyTargetSessions ?? 5,
  );
  const [recovering, setRecovering] = useState(false);

  const accepted = preferences?.commitmentWeekKey === weekKey
    && preferences?.commitmentAcceptedAt;

  const handleAccept = () => {
    accept.mutate(/** @type {any} */ ({
      weeklyTargetSessions: Number(sessions) || 5,
      weeklyTargetMinutes: preferences?.weeklyTargetMinutes,
      weekKey,
    }));
  };

  const handleRecovery = async () => {
    setRecovering(true);
    try {
      await runRecoveryReplan();
      invalidateGlobalPlan(queryClient);
      toast.success('Remaining week repacked');
    } catch {
      toast.error("Couldn't run recovery replan");
    } finally {
      setRecovering(false);
    }
  };

  return (
    <section className="weekly-commitment-card detail-section-box">
      <div className="weekly-commitment-header">
        <h2 className="weekly-commitment-title">Weekly commitment</h2>
        {accepted && adherence?.adherencePercent != null && (
          <span className="weekly-commitment-rate">
            {adherence.adherencePercent}% kept
          </span>
        )}
      </div>

      {!accepted ? (
        <>
          <p className="weekly-commitment-lead">
            Promise a realistic number of sessions this week. Adherence tracks completed work,
            not app opens.
          </p>
          <label className="weekly-commitment-field">
            <span>Sessions this week</span>
            <input
              type="number"
              min={1}
              max={21}
              value={sessions}
              onChange={(e) => setSessions(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={accept.isPending}
            onClick={handleAccept}
          >
            {accept.isPending ? 'Saving…' : 'Commit to this week'}
          </button>
        </>
      ) : (
        <>
          <p className="weekly-commitment-lead">
            {isPending
              ? 'Loading adherence…'
              : `${adherence.completed} of ${adherence.planned} promised sessions completed`
                + (adherence.missed ? ` · ${adherence.missed} missed` : '')}
          </p>
          <div className="weekly-commitment-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={recovering}
              onClick={handleRecovery}
            >
              {recovering ? 'Repacking…' : 'Recover remaining week'}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={clearOverrides.isPending}
              onClick={() => clearOverrides.mutate(/** @type {any} */ (weekKey))}
            >
              Reset plan overrides
            </button>
          </div>
        </>
      )}
    </section>
  );
}
