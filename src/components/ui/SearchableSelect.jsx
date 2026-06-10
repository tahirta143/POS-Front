import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Field } from "../layout/PageShell.jsx";

export default function SearchableSelect({
  label,
  required = false,
  value,
  onChange,
  options = [],
  placeholder = "Select option",
  disabled = false,
  className = "",
  inputClassName = "",
  listClassName = "",
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const selectId = `searchable-select-${String(label || placeholder)
    .toLowerCase()
    .replace(/\s+/g, "-")}`;

  const selectedOption = useMemo(
    () => options.find((option) => String(option.value) === String(value)),
    [options, value],
  );

  useEffect(() => {
    if (!isOpen) {
      setQuery(selectedOption?.label || "");
    }
  }, [selectedOption?.label, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setQuery(selectedOption?.label || "");
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedOption?.label]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (
      !normalizedQuery ||
      normalizedQuery === (selectedOption?.label || "").toLowerCase()
    ) {
      return options;
    }

    return options.filter((option) =>
      String(option.label || "").toLowerCase().includes(normalizedQuery),
    );
  }, [options, query, selectedOption?.label]);

  useEffect(() => {
    if (!isOpen || filteredOptions.length === 0) {
      setHighlightedIndex(-1);
      return;
    }

    setHighlightedIndex((currentIndex) => {
      if (currentIndex >= 0 && currentIndex < filteredOptions.length) {
        return currentIndex;
      }

      const selectedIndex = filteredOptions.findIndex(
        (option) => String(option.value) === String(value),
      );

      return selectedIndex >= 0 ? selectedIndex : 0;
    });
  }, [filteredOptions, isOpen, value]);

  const handleSelect = (option) => {
    onChange(option.value);
    setQuery(option.label);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleInputClick = () => {
    if (disabled) return;
    setIsOpen(true);
    setQuery("");
  };

  const handleInputFocus = () => {
    if (disabled) return;
    setIsOpen(true);
    setQuery("");
  };

  const handleKeyDown = (event) => {
    if (disabled) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      if (filteredOptions.length === 0) return;
      setHighlightedIndex((currentIndex) =>
        currentIndex < filteredOptions.length - 1 ? currentIndex + 1 : 0,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      if (filteredOptions.length === 0) return;
      setHighlightedIndex((currentIndex) =>
        currentIndex > 0 ? currentIndex - 1 : filteredOptions.length - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      if (!isOpen) return;
      event.preventDefault();
      const optionToSelect =
        highlightedIndex >= 0
          ? filteredOptions[highlightedIndex]
          : filteredOptions[0];
      if (optionToSelect) {
        handleSelect(optionToSelect);
      }
      return;
    }

    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      setIsOpen(false);
      setQuery(selectedOption?.label || "");
      setHighlightedIndex(-1);
    }
  };

  return (
    <Field label={label} required={required}>
      <div ref={containerRef} className={`relative ${className}`}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onClick={handleInputClick}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={selectedOption?.label || placeholder}
          className={`h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 pr-8 text-[12px] text-slate-800 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:disabled:bg-slate-800/50 sm:h-8 ${inputClassName}`}
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={selectId}
          aria-activedescendant={
            highlightedIndex >= 0
              ? `${selectId}-option-${highlightedIndex}`
              : undefined
          }
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={handleInputClick}
          className="absolute inset-y-0 right-0 flex w-8 items-center justify-center text-slate-400 dark:text-slate-500"
        >
          <svg
            className={`h-3.5 w-3.5 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        <AnimatePresence>
          {isOpen && !disabled && (
            <motion.ul
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className={`absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 ${listClassName}`}
              id={selectId}
              role="listbox"
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <li key={option.value}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelect(option)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      id={`${selectId}-option-${index}`}
                      role="option"
                      aria-selected={String(option.value) === String(value)}
                      className={`flex w-full items-center justify-between px-2.5 py-2.5 text-left text-[12px] dark:hover:bg-slate-800 ${
                        highlightedIndex === index
                          ? "bg-teal-100 text-teal-800 dark:bg-slate-800 dark:text-teal-300"
                          : String(option.value) === String(value)
                            ? "bg-teal-50 font-semibold text-teal-700 dark:bg-slate-800/80 dark:text-teal-400"
                            : "text-slate-700 hover:bg-teal-50 dark:text-slate-200"
                      }`}
                    >
                      <span>{option.label}</span>
                      {String(option.value) === String(value) && (
                        <span className="text-[10px] uppercase tracking-wide text-teal-600">
                          Selected
                        </span>
                      )}
                    </button>
                  </li>
                ))
              ) : (
                <li className="px-2.5 py-2.5 text-[12px] text-slate-500 dark:text-slate-400">
                  No matching options
                </li>
              )}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </Field>
  );
}
