import { LIBRARY_CATEGORIES } from '@/lib/library/libraryTags';

export default function LibrarySearchBar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  sort,
  onSortChange,
}) {
  return (
    <div className="library-toolbar">
      <input
        type="search"
        className="library-search-input"
        placeholder="Search title, subject, tags…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label="Search library"
      />
      <div className="library-filters">
        <div className="library-category-chips" role="group" aria-label="Category">
          <button
            type="button"
            className={`library-chip${category === 'all' ? ' active' : ''}`}
            onClick={() => onCategoryChange('all')}
          >
            All
          </button>
          {LIBRARY_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`library-chip${category === cat.id ? ' active' : ''}`}
              onClick={() => onCategoryChange(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <select
          className="library-sort-select"
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          aria-label="Sort"
        >
          <option value="cloned">Most cloned</option>
          <option value="newest">Newest</option>
        </select>
      </div>
    </div>
  );
}
