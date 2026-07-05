import { useState } from 'react';
import FocusNowCard from '@/components/home/FocusNowCard';
import DueTodayQueueRow from '@/components/home/DueTodayQueueRow';
import DueTodayCaughtUp from '@/components/home/DueTodayCaughtUp';
import DueTodaySkeleton from '@/components/home/DueTodaySkeleton';
import HomeDailyProgress from '@/components/home/HomeDailyProgress';
import ExpandToggle from '@/components/shared/ExpandToggle';
import JourneyProcessingCard from '@/components/home/JourneyProcessingCard';
import JourneyBaselineReadyCard from '@/components/home/JourneyBaselineReadyCard';

export default function DueTodayZone({
  items = [],
  loading,
  firstJourneyId,
  completedToday = 0,
  journeys = [],
}) {
  const [expanded, setExpanded] = useState(false);
  const [alsoExpanded, setAlsoExpanded] = useState(false);

  const processingJourneys = journeys.filter((j) => j.generationStatus === 'processing');
  const readyForBaseline = journeys.filter(
    (j) => j.generationStatus === 'completed' && !j.diagnosticSkipped && !j.diagnosticSummary,
  );

  const focusItem = items.find((i) => i.tier === 'focus') ?? items[0] ?? null;
  const primaryItems = items.filter(
    (i) => i !== focusItem && i.tier !== 'overflow' && i.tier !== 'focus',
  );
  const overflowItems = items.filter((i) => i.tier === 'overflow');
  const totalMin = items.reduce((sum, i) => sum + (i.estimatedMin ?? 0), 0);
  const totalToday = items.length;

  return (
    <section className="home-due-today" aria-labelledby="due-today-heading">
      {processingJourneys.map((j) => (
        <JourneyProcessingCard key={j.journeyId} journey={j} />
      ))}

      {readyForBaseline.map((j) => (
        <JourneyBaselineReadyCard key={j.journeyId} journey={j} />
      ))}

      <div className="due-today-plan-header">
        <h2 id="due-today-heading" className="home-due-today-title">Due Today</h2>
        {totalToday > 0 && (
          <span className="due-today-time-estimate">Today&apos;s plan · ~{totalMin} min</span>
        )}
      </div>

      {loading && <DueTodaySkeleton />}

      {!loading && items.length === 0 && !processingJourneys.length && (
        <DueTodayCaughtUp firstJourneyId={firstJourneyId} />
      )}

      {!loading && focusItem && (
        <>
          <HomeDailyProgress completed={completedToday} total={totalToday} />
          <FocusNowCard item={focusItem} />
          {primaryItems.length > 0 && (
            <div className="home-due-queue">
              <ExpandToggle
                expanded={expanded}
                onClick={() => setExpanded(!expanded)}
                className="home-due-queue-toggle"
              >
                {primaryItems.length} more session{primaryItems.length === 1 ? '' : 's'} today
              </ExpandToggle>
              {expanded && (
                <div className="home-due-queue-list">
                  {primaryItems.map((item) => (
                    <DueTodayQueueRow key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          )}
          {overflowItems.length > 0 && (
            <div className="due-today-also-section">
              <ExpandToggle
                expanded={alsoExpanded}
                onClick={() => setAlsoExpanded(!alsoExpanded)}
                className="home-due-queue-toggle"
              >
                Also today ({overflowItems.length})
              </ExpandToggle>
              {alsoExpanded && (
                <div className="home-due-queue-list">
                  {overflowItems.map((item) => (
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
