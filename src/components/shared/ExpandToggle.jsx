import { ChevronDown } from 'lucide-react';

export default function ExpandToggle({
  expanded,
  onClick,
  children,
  className = '',
  ...props
}) {
  return (
    <button
      type="button"
      className={`expand-toggle${expanded ? ' expanded' : ''} ${className}`.trim()}
      onClick={onClick}
      aria-expanded={expanded}
      {...props}
    >
      <span className="expand-toggle-label">{children}</span>
      <ChevronDown className="expand-toggle-chevron" size={16} strokeWidth={2} aria-hidden />
    </button>
  );
}
