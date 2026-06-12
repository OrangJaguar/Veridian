import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function DetailBackButton({ to, label }) {
  return (
    <Link
      to={to}
      className="detail-back-btn"
      aria-label={label}
      data-label={label}
    >
      <ArrowLeft size={18} strokeWidth={2} aria-hidden />
      <span className="detail-back-btn-tooltip">{label}</span>
    </Link>
  );
}
