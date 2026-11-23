import { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * A highly tactile, accessible Select component.
 * Features:
 * - Spring-loaded rotating chevron with playful hover bob and click compression
 * - Floating dropdown menu with spring entrance and micro-slide hover options
 * - Animated checkmark on the selected option
 * - Full keyboard navigation (Arrow keys, Enter, Space, Escape, Home, End, Tab)
 * - Synchronized hidden native <select> for 100% form, script, and test compatibility
 */
export default function Select({
  id: explicitId,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
}) {
  const generatedId = useId();
  const id = explicitId || generatedId;
  const menuId = `${id}-menu`;

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const hiddenSelectRef = useRef(null);

  // Normalize options into { value, label } format
  const normalizedOptions = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selectedIndex = normalizedOptions.findIndex((opt) => opt.value === value);
  const selectedOption = normalizedOptions[selectedIndex] || null;
  const [highlightedIndex, setHighlightedIndex] = useState(
    selectedIndex >= 0 ? selectedIndex : 0
  );

  // Keep highlighted index in sync when value changes or menu opens
  useEffect(() => {
    if (selectedIndex >= 0) {
      setHighlightedIndex(selectedIndex);
    }
  }, [selectedIndex, isOpen]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Scroll highlighted item into view if list is long
  useEffect(() => {
    if (isOpen && listRef.current && highlightedIndex >= 0) {
      const item = listRef.current.children[highlightedIndex];
      if (item && item.scrollIntoView) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen, highlightedIndex]);

  function commitValue(nextVal) {
    if (onChange) {
      const syntheticEvent = {
        target: { value: nextVal, id, name },
        currentTarget: { value: nextVal, id, name },
      };
      onChange(syntheticEvent);
    }
    setIsOpen(false);
    buttonRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) =>
            prev < normalizedOptions.length - 1 ? prev + 1 : prev
          );
        }
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        }
        break;
      }
      case 'Home': {
        if (isOpen) {
          e.preventDefault();
          setHighlightedIndex(0);
        }
        break;
      }
      case 'End': {
        if (isOpen) {
          e.preventDefault();
          setHighlightedIndex(normalizedOptions.length - 1);
        }
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        if (isOpen) {
          if (highlightedIndex >= 0 && highlightedIndex < normalizedOptions.length) {
            commitValue(normalizedOptions[highlightedIndex].value);
          }
        } else {
          setIsOpen(true);
        }
        break;
      }
      case 'Escape': {
        if (isOpen) {
          e.preventDefault();
          setIsOpen(false);
          buttonRef.current?.focus();
        }
        break;
      }
      case 'Tab': {
        if (isOpen) {
          setIsOpen(false);
        }
        break;
      }
      default: {
        // Quick type-ahead search for single alphanumeric keys
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const char = e.key.toLowerCase();
          const matchIndex = normalizedOptions.findIndex((opt) =>
            opt.label.toLowerCase().startsWith(char)
          );
          if (matchIndex >= 0) {
            if (!isOpen) {
              commitValue(normalizedOptions[matchIndex].value);
            } else {
              setHighlightedIndex(matchIndex);
            }
          }
        }
        break;
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className={`select-container ${isOpen ? 'is-open' : ''} ${className}`}
    >
      {/* Hidden native <select> kept in sync for form submissions, label focus, and test runners */}
      <select
        ref={hiddenSelectRef}
        id={id}
        name={name}
        value={value}
        tabIndex={-1}
        aria-hidden="true"
        className="select-native-hidden"
        onChange={(e) => commitValue(e.target.value)}
        disabled={disabled}
      >
        {normalizedOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Accessible, custom-rendered trigger button */}
      <button
        ref={buttonRef}
        type="button"
        className="select-trigger"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={menuId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
      >
        <span className="select-value-text">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="select-arrow-well" aria-hidden="true">
          <ChevronDown size={18} strokeWidth={2.4} className="select-arrow-icon" />
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <ul
          ref={listRef}
          id={menuId}
          role="listbox"
          tabIndex={-1}
          className="select-menu"
        >
          {normalizedOptions.map((opt, idx) => {
            const isSelected = opt.value === value;
            const isHighlighted = idx === highlightedIndex;

            return (
              <li
                key={opt.value}
                id={`${id}-opt-${idx}`}
                role="option"
                aria-selected={isSelected}
                className={`select-option ${isSelected ? 'is-selected' : ''} ${
                  isHighlighted ? 'is-highlighted' : ''
                }`}
                onMouseEnter={() => setHighlightedIndex(idx)}
                onClick={() => commitValue(opt.value)}
              >
                <span className="select-option-label">{opt.label}</span>
                {isSelected && (
                  <Check
                    size={16}
                    strokeWidth={2.5}
                    className="select-check-icon"
                    aria-hidden="true"
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
