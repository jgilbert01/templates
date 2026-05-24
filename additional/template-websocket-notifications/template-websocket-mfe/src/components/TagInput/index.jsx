import React, { useState, useRef } from 'react';

/**
 * Component to manage a list of tags (event type filters) for the WebSocket connection.
 * Users can add new tags by typing and pressing Enter or comma, and can remove existing tags.
 * The input is disabled when the WebSocket connection is active to prevent changes while connected.
 * @param {Object} param0 - The props object.
 * @param {Array} param0.tags - The current list of tags.
 * @param {Function} param0.onChange - The function to update the list of tags.
 * @param {boolean} param0.disabled - Indicates if the input should be disabled (when connected).
 * @param {string} [param0.placeholder] - The placeholder text for the input when there are no tags.
 * @returns {JSX.Element} The tag input element.
 */
export default function TagInput({ tags, onChange, disabled, placeholder = 'e.g. thing-updated' }) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);

  const commit = (raw) => {
    const value = raw.trim();
    if (value && !tags.includes(value)) {
      onChange([...tags, value]);
    }
    setDraft('');
  };

  const handleKeyDown = (e) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      commit(draft);
    } else if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const handleBlur = () => {
    if (draft.trim()) commit(draft);
  };

  const handleChange = (e) => {
    const raw = e.target.value;
    if (raw.endsWith(',')) {
      commit(raw.slice(0, -1));
    } else {
      setDraft(raw);
    }
  };

  const removeTag = (index) => {
    onChange(tags.filter((_, i) => i !== index));
    inputRef.current?.focus();
  };

  return (
    <div
      className={`wsc-tag-input${disabled ? ' wsc-tag-input--disabled' : ''}`}
      onClick={() => !disabled && inputRef.current?.focus()}
    >
      {tags.map((tag, i) => (
        <span key={tag} className="wsc-tag">
          {tag}
          {!disabled && (
            <button
              className="wsc-tag-remove"
              onClick={(e) => { e.stopPropagation(); removeTag(i); }}
              aria-label={`Remove ${tag}`}
              tabIndex={-1}
            >
              ×
            </button>
          )}
        </span>
      ))}
      {!disabled && (
        <input
          ref={inputRef}
          className="wsc-tag-input-field"
          value={draft}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={tags.length === 0 ? placeholder : ''}
          aria-label="Add event type filter"
        />
      )}
    </div>
  );
}
