import { useRef, useState } from 'react';
import { useJourneyCreateStore } from '@/store/journeyCreateStore';
import {
  extractTextFromPdfFiles,
  extractTextFromTxt,
  MAX_PDF_FILES,
} from '@/utils/pdf/extractTextFromPdf';
import {
  MAX_MATERIAL_CHARS,
  estimateTokens,
  trimMaterial,
} from '@/api/ai/tokenEstimate';

export default function StepSourceMaterial({ onBack, onBuild }) {
  const draft = useJourneyCreateStore((s) => s.draft);
  const updateDraft = useJourneyCreateStore((s) => s.updateDraft);
  const isProcessing = useJourneyCreateStore((s) => s.isProcessing);
  const hasConfirmedAi = useJourneyCreateStore((s) => s.hasConfirmedAi);
  const setHasConfirmedAi = useJourneyCreateStore((s) => s.setHasConfirmedAi);

  const fileRef = useRef(null);
  const [parseError, setParseError] = useState(null);
  const [parsing, setParsing] = useState(false);

  const charCount = draft.material.length;
  const overCap = charCount > MAX_MATERIAL_CHARS;
  const canBuild = draft.material.trim().length >= 50 && !overCap && !parsing && !isProcessing;

  const handlePaste = (text) => {
    setParseError(null);
    updateDraft({
      material: trimMaterial(text),
      sourceMode: 'paste',
      uploadedFileNames: [],
    });
  };

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
          throw new Error(`Unsupported file type: ${file.name}`);
        }
      }

      const combined = trimMaterial(texts.join('\n\n'));
      updateDraft({
        material: combined,
        sourceMode: 'upload',
        uploadedFileNames: list.map((f) => f.name),
      });
    } catch (err) {
      setParseError(err.message || 'Could not read file');
    } finally {
      setParsing(false);
    }
  };

  const handleBuildClick = () => {
    if (!hasConfirmedAi) {
      const ok = window.confirm(
        'This will use AI to analyze your material and propose modules. Continue?',
      );
      if (!ok) return;
      setHasConfirmedAi(true);
    }
    onBuild();
  };

  return (
    <div className="create-step">
      <h2 className="create-step-title">Upload source material</h2>
      <p className="create-step-desc">
        Add PDFs or paste notes. Raw source is not saved — only the extracted knowledge map.
      </p>

      <div className="create-upload-zone">
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain"
          multiple
          className="create-upload-input"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          className="btn btn-secondary"
          disabled={parsing}
          onClick={() => fileRef.current?.click()}
        >
          {parsing ? 'Reading files…' : 'Choose PDF or .txt files'}
        </button>
        <p className="create-upload-hint">Up to {MAX_PDF_FILES} files, 20MB each</p>
        {draft.uploadedFileNames.length > 0 && (
          <ul className="create-file-list">
            {draft.uploadedFileNames.map((name) => (
              <li key={name}>✓ {name}</li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        className="create-link-btn"
        onClick={() => updateDraft({ sourceMode: draft.sourceMode === 'paste' ? 'upload' : 'paste' })}
      >
        {draft.sourceMode === 'paste' ? 'Use file upload instead' : 'Paste your notes instead'}
      </button>

      {draft.sourceMode === 'paste' && (
        <label className="create-field">
          <span>Your notes</span>
          <textarea
            rows={12}
            value={draft.material}
            placeholder="Paste lecture notes, textbook excerpts, or study guides…"
            onChange={(e) => handlePaste(e.target.value)}
          />
        </label>
      )}

      <p className={`create-char-count${overCap ? ' over' : ''}`}>
        {charCount.toLocaleString()} / {MAX_MATERIAL_CHARS.toLocaleString()} characters
        {' · ~'}
        {estimateTokens(draft.material).toLocaleString()} tokens est.
      </p>

      {parseError && <p className="create-error">{parseError}</p>}
      {overCap && (
        <p className="create-error">Material exceeds the maximum length. Shorten your input.</p>
      )}

      <div className="create-step-actions">
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!canBuild}
          onClick={handleBuildClick}
        >
          Build My Journey
        </button>
      </div>
    </div>
  );
}
