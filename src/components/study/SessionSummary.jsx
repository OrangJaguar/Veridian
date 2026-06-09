import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function SessionSummary({
  title,
  stats = [],
  children,
  nextAction,
  returnHref,
  onDone,
}) {
  return (
    <motion.div
      className="study-summary"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <h1 className="study-summary-title">{title}</h1>
      {stats.length > 0 && (
        <div className="study-summary-stats">
          {stats.map((s) => (
            <div key={s.label} className="study-summary-stat">
              <span className="study-summary-stat-value">{s.value}</span>
              <span className="study-summary-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      )}
      {children}
      {nextAction && <p className="study-summary-next">{nextAction}</p>}
      <div className="study-summary-actions">
        {returnHref ? (
          <Link to={returnHref} className="btn btn-primary" onClick={onDone}>
            Done
          </Link>
        ) : (
          <button type="button" className="btn btn-primary" onClick={onDone}>
            Done
          </button>
        )}
      </div>
    </motion.div>
  );
}
