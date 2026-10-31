export const inputClass =
  "w-full px-4 py-3.5 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-60";

/** Labelled input with an inline validation message. */
const FormField = ({ label, error, className = "", as: Tag = "input", ...inputProps }) => (
  <label className={`block ${className}`}>
    <span className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
      {label}
    </span>
    <Tag
      aria-invalid={Boolean(error)}
      className={`${inputClass} ${error ? "border-destructive" : ""}`}
      {...inputProps}
    />
    {error && <span className="block mt-1 text-xs text-destructive">{error}</span>}
  </label>
);

export default FormField;
