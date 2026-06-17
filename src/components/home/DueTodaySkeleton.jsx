export default function DueTodaySkeleton() {
  return (
    <div className="due-today-skeleton" aria-hidden="true">
      <div className="skeleton-block skeleton-due-progress" />
      <div className="skeleton-block skeleton-due-focus" />
      <div className="skeleton-block skeleton-due-row" />
      <div className="skeleton-block skeleton-due-row skeleton-due-row-short" />
    </div>
  );
}
