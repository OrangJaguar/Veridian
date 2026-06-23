import { useState } from 'react';
import { toast } from 'sonner';

export default function ShareLinkButton({
  url,
  label = 'Copy share link',
  className = 'btn btn-secondary btn-sm',
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  };

  return (
    <button type="button" className={className} onClick={handleCopy}>
      {copied ? 'Copied!' : label}
    </button>
  );
}
