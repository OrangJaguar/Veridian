import { ArrowLeft } from 'lucide-react';

export default function StudyBackButton({ onClick, label = 'Back' }) {
  return (
    <button
      type="button"
      className="detail-back-btn"
      onClick={onClick}
      aria-label={label}
    >
      <ArrowLeft size={18} strokeWidth={2} aria-hidden />
      <span className="detail-back-btn-tooltip">{label}</span>
    </button>
  );
}
