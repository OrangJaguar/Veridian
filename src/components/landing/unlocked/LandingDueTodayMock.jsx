export default function LandingDueTodayMock() {
  return (
    <div className="home-due-today landing-due-mock" aria-hidden="true">
      <div className="due-today-plan-header">
        <h2 className="home-due-today-title">Due Today</h2>
        <span className="due-today-time-estimate">Today&apos;s plan · ~15 min</span>
      </div>
      <div className="home-due-queue-list">
        <div className="due-today-queue-row landing-due-mock-row">
          <div className="due-today-row-main">
            <span className="due-today-row-type">Interference Drill</span>
            <strong className="due-today-row-title">AP Chem Unit 4</strong>
          </div>
          <span className="due-today-row-meta">15 min</span>
        </div>
      </div>
    </div>
  );
}
