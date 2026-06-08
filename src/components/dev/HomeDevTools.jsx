import { toast } from 'sonner';
import {
  useSeedSampleJourney,
  useSeedDueTodayDemo,
  useSeedFutureDueJourney,
  useSeedWeakModuleJourney,
} from '@/hooks/mutations/useJourneyMutations';

export default function HomeDevTools() {
  const seedScaffold = useSeedSampleJourney();
  const seedDueToday = useSeedDueTodayDemo();
  const seedFuture = useSeedFutureDueJourney();
  const seedWeak = useSeedWeakModuleJourney();

  if (!import.meta.env.DEV) return null;

  const run = (mutation, successMsg) => {
    mutation.mutate(undefined, {
      onSuccess: () => toast.success(successMsg),
      onError: (err) => toast.error(err.message || 'Seed failed'),
    });
  };

  const busy =
    seedScaffold.isPending
    || seedDueToday.isPending
    || seedFuture.isPending
    || seedWeak.isPending;

  return (
    <div className="home-dev-tools">
      <span className="home-dev-tools-label">Dev tools</span>
      <button
        type="button"
        className="btn btn-secondary"
        disabled={busy}
        onClick={() => run(seedScaffold, 'Journey scaffold seeded')}
      >
        Seed Journey (scaffold)
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        disabled={busy}
        onClick={() => run(seedDueToday, 'Flashcard deck (due today) seeded')}
      >
        Seed deck (due today)
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        disabled={busy}
        onClick={() => run(seedFuture, 'Deck due tomorrow seeded')}
      >
        Seed deck (due tomorrow)
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        disabled={busy}
        onClick={() => run(seedWeak, 'Weak-module journey seeded')}
      >
        Seed weak-module journey
      </button>
    </div>
  );
}
