import React, { useState, useRef, useEffect } from "react";

const CustomSelect = ({
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (selectRef.current && !selectRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (disabled) return;

    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        setIsOpen(!isOpen);
        break;
      case "Escape":
        setIsOpen(false);
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) setIsOpen(true);
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isOpen) setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  // Inline styles
  const styles = {
    container: {
      position: "relative",
      display: "inline-block",
      width: "100%",
      fontFamily: "inherit",
      opacity: disabled ? 0.6 : 1,
      pointerEvents: disabled ? "none" : "auto",
    },
    trigger: {
      width: "100%",
      padding: "8px 12px",
      background: "#fff",
      border: `1px solid ${isOpen ? "#3b82f6" : "#ccc"}`,
      borderRadius: 6,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      cursor: "pointer",
      fontSize: 14,
      boxShadow: isOpen ? "0 0 0 2px rgba(59, 130, 246, 0.2)" : "none",
      transition: "border-color 0.2s, box-shadow 0.2s",
    },
    value: {
      color: !selectedOption ? "#9ca3af" : "#111827",
    },
    arrow: {
      transition: "transform 0.3s ease",
      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
    },
    dropdown: {
      position: "absolute",
      width: "100%",
      background: "#fff",
      border: "1px solid #ccc",
      borderRadius: 6,
      marginTop: 4,
      maxHeight: 200,
      overflowY: "auto",
      zIndex: 1000,
      boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
      padding: "4px 0",
    },
    option: (selected) => ({
      padding: "8px 12px",
      cursor: selected ? "default" : "pointer",
      fontSize: 14,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      transition: "background 0.2s",
      backgroundColor: selected ? "#e0f2fe" : "transparent",
      color: selected ? "#3b82f6" : "#111827",
    }),
    checkIcon: {
      marginLeft: 8,
      color: "#3b82f6",
    },
    disabledOption: {
      color: "#9ca3af",
      cursor: "not-allowed",
    },
  };

  return (
    <div style={styles.container} ref={selectRef}>
      <button
        type="button"
        style={styles.trigger}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span style={styles.value}>{displayLabel}</span>
        <svg
          style={styles.arrow}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && !disabled && (
        <ul role="listbox" style={styles.dropdown}>
          {options.length > 0 ? (
            options.map((option) => (
              <li
                key={option.value}
                onClick={() => handleSelect(option.value)}
                role="option"
                aria-selected={option.value === value}
                style={option.value === value ? styles.option(true) : styles.option(false)}
              >
                {option.label}
                {option.value === value && (
                  <svg
                    style={styles.checkIcon}
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M13.3333 4L6 11.3333L2.66667 8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </li>
            ))
          ) : (
            <li style={styles.disabledOption}>No options available</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default CustomSelect;
