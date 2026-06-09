import { useState } from 'react';
import VoiceInputButton from '@/components/study/shared/VoiceInputButton';

export default function OpenResponseEditor({ value, onChange, placeholder, rows = 8 }) {
  const [text, setText] = useState(value ?? '');

  const update = (v) => {
    setText(v);
    onChange(v);
  };

  return (
    <div className="study-open-response">
      <textarea
        className="study-textarea"
        rows={rows}
        placeholder={placeholder}
        value={text}
        onChange={(e) => update(e.target.value)}
      />
      <VoiceInputButton onTranscript={(t) => update(text ? `${text} ${t}` : t)} />
    </div>
  );
}
