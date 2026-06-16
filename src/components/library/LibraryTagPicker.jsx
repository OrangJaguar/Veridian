import { LIBRARY_TAGS } from '@/lib/library/libraryTags';

export default function LibraryTagPicker({ value = [], onChange, max = 5 }) {
  const toggle = (tag) => {
    if (value.includes(tag)) {
      onChange(value.filter((t) => t !== tag));
    } else if (value.length < max) {
      onChange([...value, tag]);
    }
  };

  return (
    <div className="library-tag-picker">
      <p className="library-tag-picker-hint">Select up to {max} tags (required to publish)</p>
      <div className="library-tag-picker-grid">
        {LIBRARY_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            className={`library-tag-option${value.includes(tag) ? ' selected' : ''}`}
            onClick={() => toggle(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
