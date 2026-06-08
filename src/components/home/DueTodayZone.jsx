import DueTodayCard from '@/components/home/DueTodayCard';
import DueTodayCaughtUp from '@/components/home/DueTodayCaughtUp';

export default function DueTodayZone({ items = [], loading, firstJourneyId }) {
  return (
    <section className="home-due-today" aria-labelledby="due-today-heading">
      <div className="home-due-today-header">
        <h2 id="due-today-heading" className="home-due-today-title">Due Today</h2>
        {!loading && items.length > 0 && (
          <span className="home-due-today-count">
            {items.length} session{items.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {loading && <p className="journeys-status">Loading due items…</p>}

      {!loading && items.length === 0 && (
        <DueTodayCaughtUp firstJourneyId={firstJourneyId} />
      )}

      {!loading && items.length > 0 && (
        <div className={`home-due-stack${items.length === 1 ? ' single' : ''}`}>
          {items.map((item) => (
            <DueTodayCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
