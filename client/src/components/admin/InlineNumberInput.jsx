import { useState } from "react";

/** Number cell that saves on blur or Enter when the value changed; Escape reverts. */
const InlineNumberInput = ({
  value,
  onCommit,
  label,
  prefix,
  integer,
  disabled,
  className = "",
}) => {
  const [draft, setDraft] = useState(String(value));
  const [editedFrom, setEditedFrom] = useState(value);

  if (editedFrom !== value) {
    setEditedFrom(value);
    setDraft(String(value));
  }

  const commit = () => {
    const next = Number(draft);
    const isValid = draft !== "" && next >= 0 && (!integer || Number.isInteger(next));
    if (!isValid) return setDraft(String(value));
    if (next !== value) onCommit(next);
  };

  return (
    <span className="inline-flex items-center gap-1">
      {prefix && <span className="text-muted-foreground">{prefix}</span>}
      <input
        type="number"
        min="0"
        aria-label={label}
        disabled={disabled}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") setDraft(String(value));
        }}
        className={`w-20 px-2 py-1 rounded-md bg-secondary/50 border border-border text-sm focus:outline-none focus:border-primary disabled:opacity-50 ${className}`}
      />
    </span>
  );
};

export default InlineNumberInput;
