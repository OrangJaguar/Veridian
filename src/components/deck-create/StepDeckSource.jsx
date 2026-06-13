import { useRef, useState } from 'react';
import { ChoicePresetButton } from '@/components/shared/ChoiceControl';
import { useDeckCreateStore } from '@/store/deckCreateStore';
import {
  extractTextFromPdfFiles,
  extractTextFromTxt,
  MAX_PDF_FILES,
} from '@/utils/pdf/extractTextFromPdf';
import { trimMaterial, MAX_MATERIAL_CHARS } from '@/api/ai/tokenEstimate';

const SOURCE_MODES = [
  { id: 'quizlet', label: 'Quizlet import' },
  { id: 'pdf', label: 'PDF upload' },
  { id: 'notes', label: 'Your notes' },
];

export default function StepDeckSource({ onBack, onNext }) {
  const draft = useDeckCreateStore((s) => s.draft);
  const updateDraft = useDeckCreateStore((s) => s.updateDraft);
  const isProcessing = useDeckCreateStore((s) => s.isProcessing);
  const fileRef = useRef(null);
  const [parseError, setParseError] = useState(null);
  const [parsing, setParsing] = useState(false);

  const charCount = draft.rawContent.length;
  const overCap = charCount > MAX_MATERIAL_CHARS;
  const canNext = draft.rawContent.trim().length >= 20 && !overCap && !parsing;

  const handleFiles = async (files) => {
    setParseError(null);
    setParsing(true);
    try {
      const list = Array.from(files).slice(0, MAX_PDF_FILES);
      const texts = [];
      for (const file of list) {
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          texts.push(await extractTextFromPdfFiles([file]));
        } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
          texts.push(await extractTextFromTxt(file));
        } else {
          throw new Error(`Unsupported file: ${file.name}`);
        }
      }
      updateDraft({
        rawContent: trimMaterial(texts.join('\n\n')),
        sourceMode: 'pdf',
      });
    } catch (err) {
      setParseError(err.message || 'Could not read file');
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="create-step">
      <h2 className="create-step-title">Add your content</h2>
      <p className="create-step-desc">
        Provide the material for your deck. AI will prioritize this over module context.
      </p>

      <div className="study-setup-section">
        <span className="study-setup-label">Source type</span>
        <div className="study-setup-presets">
          {SOURCE_MODES.map((m) => (
            <ChoicePresetButton
              key={m.id}
              selected={draft.sourceMode === m.id}
              onClick={() => updateDraft({ sourceMode: m.id, rawContent: '', parsedPairs: [] })}
            >
              {m.label}
            </ChoicePresetButton>
          ))}
        </div>
      </div>

      {draft.sourceMode === 'pdf' && (
        <div className="create-upload-zone">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt"
            className="create-upload-input"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>
            {parsing ? 'Reading file…' : 'Choose PDF or text file'}
          </button>
          <p className="create-upload-hint">We&apos;ll extract testable content and show a preview next.</p>
        </div>
      )}

      {draft.sourceMode === 'quizlet' && (
        <p className="create-field-hint deck-source-hint">
          Paste Quizlet export: tab-separated, &quot;term - definition&quot;, or alternating lines.
        </p>
      )}

      {draft.sourceMode === 'notes' && (
        <p className="create-field-hint deck-source-hint">
          Paste class notes, a study guide, or bullet points — AI will turn them into cards.
        </p>
      )}

      {(draft.sourceMode !== 'pdf' || draft.rawContent) && (
        <label className="create-field">
          <span>{draft.sourceMode === 'quizlet' ? 'Paste import' : 'Content'}</span>
          <textarea
            rows={12}
            value={draft.rawContent}
            placeholder={
              draft.sourceMode === 'quizlet'
                ? 'mitochondria\tpowerhouse of the cell\n...'
                : 'Paste your notes here…'
            }
            onChange={(e) => updateDraft({ rawContent: e.target.value })}
          />
          <span className={`create-char-count${overCap ? ' over' : ''}`}>
            {charCount.toLocaleString()} / {MAX_MATERIAL_CHARS.toLocaleString()}
          </span>
        </label>
      )}

      {parseError && <p className="create-error">{parseError}</p>}

      <div className="create-step-actions">
        <button type="button" className="btn btn-secondary" onClick={onBack} disabled={isProcessing}>
          Back
        </button>
        <button type="button" className="btn btn-primary" disabled={!canNext || isProcessing} onClick={onNext}>
          Next
        </button>
      </div>
    </div>
  );
}
