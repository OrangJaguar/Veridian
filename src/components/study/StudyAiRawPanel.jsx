import { useState } from 'react';
import { toast } from 'sonner';

export default function StudyAiRawPanel({
  text,
  title = 'Raw AI response (unparsed)',
  subtitle = 'This is exactly what AI returned — no parsing or validation applied.',
  onExit,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text ?? '');
      setCopied(true);
      toast.success('Raw response copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy — select the text manually');
    }
  };

  if (!text) return null;

  return (
    <div className="study-mode-view study-ai-raw-panel">
      <div className="study-ai-raw-panel-inner">
        <h2 className="study-ai-raw-title">{title}</h2>
        <p className="study-ai-raw-subtitle">{subtitle}</p>
        <p className="study-ai-raw-meta">{text.length.toLocaleString()} characters</p>
        <textarea
          className="study-ai-raw-textarea"
          readOnly
          value={text}
          spellCheck={false}
        />
        <div className="study-ai-error-actions">
          <button type="button" className="btn btn-primary" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy full response'}
          </button>
          {onExit && (
            <button type="button" className="btn btn-secondary" onClick={onExit}>
              Go back
            </button>
          )}
        </div>
        <p className="study-ai-debug-hint">
          Also available in console: <code>veridianAiDebug.lastRaw()</code> or <code>veridianAiDebug.printRaw()</code>
        </p>
      </div>
    </div>
  );
}