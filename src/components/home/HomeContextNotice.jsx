import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { getHomeContextLine } from '@/utils/home/homeContext';

const DISMISS_KEY = 'veridian_home_context_dismissed';

export default function HomeContextNotice({ dueItems = [], journeys = [] }) {
  const message = getHomeContextLine({ dueItems, journeys });
  const [visible, setVisible] = useState(
    () => typeof window !== 'undefined' && sessionStorage.getItem(DISMISS_KEY) !== '1',
  );

  if (!visible || !message) return null;

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  return createPortal(
    <div className="home-context-toast" role="status">
      <div className="home-context-toast-bubble">
        <p className="home-context-toast-text">{message}</p>
        <button
          type="button"
          className="home-context-toast-dismiss"
          onClick={dismiss}
          aria-label="Dismiss"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>
    </div>,
    document.body,
  );
}
