import { useState } from 'react';
import FocusNowCard from '@/components/home/FocusNowCard';
import DueTodayQueueRow from '@/components/home/DueTodayQueueRow';
import DueTodayCaughtUp from '@/components/home/DueTodayCaughtUp';
import HomeDailyProgress from '@/components/home/HomeDailyProgress';
import ExpandToggle from '@/components/shared/ExpandToggle';
import VeridianLoading from '@/components/shared/VeridianLoading';

const COMPLETED_TODAY = 0;

export default function DueTodayZone({ items = [], loading, firstJourneyId }) {
  const [expanded, setExpanded] = useState(false);
  const focusItem = items[0] ?? null;
  const queueItems = items.slice(1);
  const totalToday = items.length;

  return (
    <section className="home-due-today" aria-labelledby="due-today-heading">
      <h2 id="due-today-heading" className="home-due-today-title">Due Today</h2>

      {loading && <VeridianLoading size="sm" className="home-due-loading" />}

      {!loading && items.length === 0 && (
        <DueTodayCaughtUp firstJourneyId={firstJourneyId} />
      )}

      {!loading && focusItem && (
        <>
          <HomeDailyProgress completed={COMPLETED_TODAY} total={totalToday} />
          <FocusNowCard item={focusItem} />
          {queueItems.length > 0 && (
            <div className="home-due-queue">
              <ExpandToggle
                expanded={expanded}
                onClick={() => setExpanded(!expanded)}
                className="home-due-queue-toggle"
              >
                {queueItems.length} more session{queueItems.length === 1 ? '' : 's'} today
              </ExpandToggle>
              {expanded && (
                <div className="home-due-queue-list">
                  {queueItems.map((item) => (
                    <DueTodayQueueRow key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
