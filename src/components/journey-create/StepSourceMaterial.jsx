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

const MIN_TOPIC_CHARS = 3;
const MIN_MATERIAL_CHARS = 50;

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
  const isTopic = draft.sourceMode === 'topic';
  const minChars = isTopic ? MIN_TOPIC_CHARS : MIN_MATERIAL_CHARS;
  const canBuild = draft.material.trim().length >= minChars && !overCap && !parsing && !isProcessing;

  const setMode = (mode) => {
    updateDraft({
      sourceMode: mode,
      material: mode === 'topic' ? draft.material : draft.material,
      uploadedFileNames: mode === 'upload' ? draft.uploadedFileNames : [],
    });
  };

  const handlePaste = (text) => {
    setParseError(null);
    updateDraft({
      material: trimMaterial(text),
      sourceMode: 'paste',
      uploadedFileNames: [],
    });
  };

  const handleTopicChange = (text) => {
    setParseError(null);
    const trimmed = text.trim();
    updateDraft({
      material: trimmed,
      sourceMode: 'topic',
      uploadedFileNames: [],
      title: draft.title || trimmed,
      subject: draft.subject || trimmed.split(/[,\-–]/)[0]?.trim() || trimmed,
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
        'This will use AI to analyze your material and build your journey. Continue?',
      );
      if (!ok) return;
      setHasConfirmedAi(true);
    }
    onBuild();
  };

  return (
    <div className="create-step">
      <h2 className="create-step-title">Add your material</h2>
      <p className="create-step-desc">
        Upload notes, paste text, or type a topic to get started.
      </p>

      <div className="create-source-tabs" role="tablist">
        {[
          { id: 'upload', label: 'Upload PDF' },
          { id: 'paste', label: 'Paste Notes' },
          { id: 'topic', label: 'Type a Topic' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={draft.sourceMode === tab.id}
            className={`create-source-tab${draft.sourceMode === tab.id ? ' active' : ''}`}
            onClick={() => setMode(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {draft.sourceMode === 'upload' && (
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
      )}

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

      {draft.sourceMode === 'topic' && (
        <>
          <input
            type="text"
            className="create-topic-input"
            value={draft.material}
            placeholder="Thermodynamics and Enthalpy, The Cold War…"
            onChange={(e) => handleTopicChange(e.target.value)}
          />
          <p className="create-topic-hint">
            Fastest way to start. (Note: For the most accurate, hyper-personalized modules, uploading your specific class notes is recommended).
          </p>
        </>
      )}

      {!isTopic && (
        <p className={`create-char-count${overCap ? ' over' : ''}`}>
          {charCount.toLocaleString()} / {MAX_MATERIAL_CHARS.toLocaleString()} characters
          {' · ~'}
          {estimateTokens(draft.material).toLocaleString()} tokens est.
        </p>
      )}

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
          Generate Journey
        </button>
      </div>
    </div>
  );
}
