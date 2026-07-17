import { useRef, useState, useMemo } from 'react';
import { useJourneyCreateStore } from '@/store/journeyCreateStore';
import { extractTextFromFile, MAX_PDF_FILES } from '@/utils/extract';
import { extractTextFromImages } from '@/utils/extract/extractTextFromImages';
import { fetchLinkContent } from '@/utils/extract/fetchLinkContent';
import { isValidUrl, isYouTubeUrl } from '@/utils/extract/validateUrl';
import { MAX_IMAGE_FILES } from '@/utils/extract/convertImageForOcr';
import {
  MAX_MATERIAL_CHARS,
  estimateTokens,
  trimMaterial,
} from '@/api/ai/tokenEstimate';

const MIN_TOPIC_CHARS = 3;
const MIN_MATERIAL_CHARS = 50;

const SOURCE_TABS = [
  { id: 'upload', label: 'Files' },
  { id: 'paste', label: 'Paste Text' },
  { id: 'topic', label: 'Topic' },
  { id: 'link', label: 'Link' },
  { id: 'image', label: 'Image' },
];

const FILE_ACCEPT = '.pdf,.txt,.docx,.pptx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation';
const IMAGE_ACCEPT = '.png,.jpg,.jpeg,.webp,.bmp,.gif,.heic,.heif,.tiff,.tif,.avif';

export default function StepSourceMaterial({ onBack, onBuild }) {
  const draft = useJourneyCreateStore((s) => s.draft);
  const updateDraft = useJourneyCreateStore((s) => s.updateDraft);
  const isProcessing = useJourneyCreateStore((s) => s.isProcessing);
  const hasConfirmedAi = useJourneyCreateStore((s) => s.hasConfirmedAi);
  const setHasConfirmedAi = useJourneyCreateStore((s) => s.setHasConfirmedAi);

  const fileRef = useRef(null);
  const imageRef = useRef(null);
  const [parseError, setParseError] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [linkType, setLinkType] = useState(null);
  const [ocrProgress, setOcrProgress] = useState(null);
  const [imageThumbs, setImageThumbs] = useState([]);
  const [switchWarning, setSwitchWarning] = useState(false);
  const [pendingMode, setPendingMode] = useState(null);

  const charCount = draft.material.length;
  const overCap = charCount > MAX_MATERIAL_CHARS;
  const isTopic = draft.sourceMode === 'topic';
  const minChars = isTopic ? MIN_TOPIC_CHARS : MIN_MATERIAL_CHARS;
  const canBuild = draft.material.trim().length >= minChars
    && !overCap && !parsing && !fetching && !isProcessing;

  const urlIsYouTube = useMemo(
    () => isYouTubeUrl(draft.sourceUrl),
    [draft.sourceUrl],
  );

  const setMode = (mode) => {
    if (mode === draft.sourceMode) return;

    if (draft.material.trim().length > 0) {
      setSwitchWarning(true);
      setPendingMode(mode);
      return;
    }

    applyModeSwitch(mode);
  };

  const applyModeSwitch = (mode) => {
    setSwitchWarning(false);
    setPendingMode(null);
    setParseError(null);
    setLinkType(null);
    setOcrProgress(null);
    setImageThumbs([]);
    updateDraft({
      sourceMode: mode,
      material: '',
      uploadedFileNames: [],
      sourceUrl: mode === 'link' ? draft.sourceUrl : '',
    });
  };

  const confirmSwitch = () => {
    if (pendingMode) applyModeSwitch(pendingMode);
  };

  const cancelSwitch = () => {
    setSwitchWarning(false);
    setPendingMode(null);
  };

  // --- File upload handler ---
  const handleFiles = async (files) => {
    setParseError(null);
    setParsing(true);
    try {
      const list = Array.from(files).slice(0, MAX_PDF_FILES);
      const texts = [];

      for (const file of list) {
        texts.push(await extractTextFromFile(file));
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

  // --- Paste handler ---
  const handlePaste = (text) => {
    setParseError(null);
    updateDraft({
      material: trimMaterial(text),
      sourceMode: 'paste',
      uploadedFileNames: [],
    });
  };

  // --- Topic handler ---
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

  // --- Link handler ---
  const handleFetchLink = async () => {
    const url = draft.sourceUrl?.trim();
    if (!url || !isValidUrl(url)) {
      setParseError('Please enter a valid URL starting with http:// or https://');
      return;
    }
    setParseError(null);
    setFetching(true);
    setLinkType(null);
    try {
      const result = await fetchLinkContent(url);
      setLinkType(result.type);
      updateDraft({
        material: trimMaterial(result.content),
        sourceMode: 'link',
      });
      if (result.title && !draft.title) {
        updateDraft({ title: result.title.slice(0, 120) });
      }
    } catch (err) {
      setParseError(err.message || 'Could not fetch content from this URL.');
    } finally {
      setFetching(false);
    }
  };

  // --- Image/OCR handler ---
  const handleImages = async (files) => {
    setParseError(null);
    setParsing(true);
    setOcrProgress(null);

    const list = Array.from(files).slice(0, MAX_IMAGE_FILES);

    const thumbs = list.map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
    }));
    setImageThumbs(thumbs);

    try {
      const text = await extractTextFromImages(list, (progress) => {
        setOcrProgress(progress);
      });

      const combined = trimMaterial(text);
      if (combined.length < MIN_MATERIAL_CHARS) {
        setParseError(
          'Not enough text could be extracted. Try uploading clearer images or paste text manually.',
        );
      }

      updateDraft({
        material: combined,
        sourceMode: 'image',
        uploadedFileNames: list.map((f) => f.name),
      });
    } catch (err) {
      setParseError(err.message || 'Could not process images');
    } finally {
      setParsing(false);
      setOcrProgress(null);
    }
  };

  // --- Build/Generate handler ---
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
        Upload files, paste text, enter a topic, drop a link, or snap photos of your notes.
      </p>

      {/* Mode-switch warning */}
      {switchWarning && (
        <div className="create-switch-warning">
          <span>Switching will replace your current material.</span>
          <button type="button" className="btn btn-small" onClick={confirmSwitch}>
            Switch
          </button>
          <button type="button" className="btn btn-small btn-secondary" onClick={cancelSwitch}>
            Cancel
          </button>
        </div>
      )}

      {/* Source mode tabs */}
      <div className="create-source-tabs" role="tablist">
        {SOURCE_TABS.map((tab) => (
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

      {/* === FILE UPLOAD PANEL === */}
      {draft.sourceMode === 'upload' && (
        <div className="create-upload-zone">
          <input
            ref={fileRef}
            type="file"
            accept={FILE_ACCEPT}
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
            {parsing ? 'Reading files…' : 'Choose files (PDF, DOCX, PPTX, TXT)'}
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

      {/* === PASTE TEXT PANEL === */}
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

      {/* === TOPIC PANEL === */}
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

      {/* === LINK PANEL === */}
      {draft.sourceMode === 'link' && (
        <div className="create-link-zone">
          <div className="create-link-input-row">
            <input
              type="url"
              className="create-link-input"
              value={draft.sourceUrl}
              placeholder="Paste a web page or YouTube link…"
              onChange={(e) => {
                updateDraft({ sourceUrl: e.target.value });
                setParseError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleFetchLink();
                }
              }}
            />
            <button
              type="button"
              className="btn btn-secondary create-link-fetch-btn"
              disabled={fetching || !draft.sourceUrl?.trim()}
              onClick={handleFetchLink}
            >
              {fetching ? 'Fetching…' : 'Fetch'}
            </button>
          </div>

          {urlIsYouTube && !fetching && !linkType && (
            <p className="create-link-hint">YouTube video detected — will extract transcript</p>
          )}

          {fetching && (
            <p className="create-link-hint">Extracting content…</p>
          )}

          {linkType && draft.material && (
            <div className="create-link-result">
              <span className="create-link-badge">
                {linkType === 'youtube' ? 'YouTube transcript' : 'Web page'}
              </span>
              <p className="create-preview-text">
                {draft.material.slice(0, 500)}
                {draft.material.length > 500 ? '…' : ''}
              </p>
            </div>
          )}
        </div>
      )}

      {/* === IMAGE / OCR PANEL === */}
      {draft.sourceMode === 'image' && (
        <div className="create-image-zone">
          <input
            ref={imageRef}
            type="file"
            accept={IMAGE_ACCEPT}
            multiple
            className="create-upload-input"
            onChange={(e) => {
              if (e.target.files?.length) handleImages(e.target.files);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            className="btn btn-secondary"
            disabled={parsing}
            onClick={() => imageRef.current?.click()}
          >
            {parsing ? 'Processing…' : `Choose images (up to ${MAX_IMAGE_FILES})`}
          </button>
          <p className="create-upload-hint">
            PNG, JPEG, WebP, HEIC, TIFF, BMP, GIF — up to 10MB each
          </p>

          {/* OCR progress bar */}
          {parsing && ocrProgress && (
            <div className="create-image-progress">
              <div
                className="create-image-progress-bar"
                style={{ width: `${Math.round((((ocrProgress.current - 1) + ocrProgress.fileProgress) / ocrProgress.total) * 100)}%` }}
              />
              <p className="create-image-progress-label">
                Processing image {ocrProgress.current} of {ocrProgress.total}…
                {' '}({Math.round(ocrProgress.fileProgress * 100)}%)
              </p>
            </div>
          )}

          {/* Thumbnails */}
          {imageThumbs.length > 0 && (
            <div className="create-image-thumbs">
              {imageThumbs.map((t) => (
                <img
                  key={t.name}
                  src={t.url}
                  alt={t.name}
                  className="create-image-thumb"
                />
              ))}
            </div>
          )}

          {/* Extracted text preview */}
          {!parsing && draft.material && draft.sourceMode === 'image' && (
            <div className="create-link-result">
              <span className="create-link-badge">OCR result</span>
              <p className="create-preview-text">
                {draft.material.slice(0, 500)}
                {draft.material.length > 500 ? '…' : ''}
              </p>
            </div>
          )}

          <p className="create-topic-hint">
            Tip: For best results, use well-lit photos with clear, legible text.
          </p>
        </div>
      )}

      {/* === SHARED BOTTOM SECTION === */}
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
