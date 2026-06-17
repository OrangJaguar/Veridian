export default function JourneyDetailSkeleton() {
  return (
    <div className="journey-detail-page journey-detail-skeleton" aria-hidden="true">
      <div className="skeleton-block skeleton-journey-title" />
      <div className="skeleton-block skeleton-journey-meta" />
      <div className="skeleton-section-box">
        <div className="skeleton-block skeleton-section-title" />
        <div className="skeleton-block skeleton-module-row" />
        <div className="skeleton-block skeleton-module-row" />
        <div className="skeleton-block skeleton-module-row skeleton-module-row-short" />
      </div>
      <div className="skeleton-section-box">
        <div className="skeleton-block skeleton-section-title" />
        <div className="skeleton-block skeleton-plan-line" />
        <div className="skeleton-block skeleton-plan-line" />
      </div>
    </div>
  );
}
