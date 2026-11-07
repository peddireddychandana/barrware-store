import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, Loader2, Trash2 } from "lucide-react";
import { getErrorMessage } from "@/services/api";

export const inputClass =
  "w-full px-4 py-2.5 rounded-lg bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary input-glow transition-all text-sm";

export const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full gradient-neon text-primary-foreground font-medium uppercase tracking-wide text-sm neon-glow disabled:opacity-60 disabled:cursor-not-allowed transition-all";

export const ghostButtonClass =
  "inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-secondary text-muted-foreground hover:text-foreground font-medium uppercase tracking-wide text-sm disabled:opacity-60 transition-all";

export const PageHeader = ({ title, accent, subtitle, action }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8"
  >
    <div>
      <h1 className="text-4xl md:text-5xl font-display">
        {title} <span className="text-gradient">{accent}</span>
      </h1>
      {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
    </div>
    {action}
  </motion.div>
);

export const Panel = ({ title, action, children, className = "" }) => (
  <section
    className={`bg-card border border-border rounded-2xl card-shadow overflow-hidden ${className}`}
  >
    {(title || action) && (
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="text-2xl font-display">{title}</h2>
        {action}
      </div>
    )}
    {children}
  </section>
);

export const Field = ({ label, hint, children, className = "" }) => (
  <label className={`block ${className}`}>
    <span className="block text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1.5">
      {label}
    </span>
    {children}
    {hint && <span className="block text-xs text-muted-foreground mt-1">{hint}</span>}
  </label>
);

export const Toggle = ({ checked, onChange, label, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative w-10 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50 ${
      checked ? "bg-primary" : "bg-muted"
    }`}
  >
    <span
      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-foreground transition-transform ${
        checked ? "translate-x-4" : ""
      }`}
    />
  </button>
);

export const Spinner = ({ className = "" }) => (
  <div className={`flex justify-center py-16 ${className}`} role="status" aria-label="Loading">
    <Loader2 className="w-8 h-8 text-primary animate-spin" />
  </div>
);

export const ErrorState = ({ error, onRetry }) => (
  <div className="flex flex-col items-center gap-3 py-16 text-center px-4">
    <AlertTriangle className="w-8 h-8 text-destructive" />
    <p className="text-muted-foreground">{getErrorMessage(error)}</p>
    {onRetry && (
      <button onClick={onRetry} className={ghostButtonClass}>
        Try again
      </button>
    )}
  </div>
);

export const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
    <Inbox className="w-8 h-8" />
    <p>{message}</p>
  </div>
);

/** Renders loading / error / empty states for a react-query result, otherwise its children. */
export const QueryState = ({ query, isEmpty, emptyMessage, children }) => {
  if (query.isLoading) return <Spinner />;
  if (query.isError) return <ErrorState error={query.error} onRetry={query.refetch} />;
  if (isEmpty) return <EmptyState message={emptyMessage} />;
  return children;
};

export const TableScroll = ({ children }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm text-left min-w-[640px]">{children}</table>
  </div>
);

export const Th = ({ children, className = "" }) => (
  <th
    className={`px-4 py-3 text-xs font-medium uppercase tracking-widest text-muted-foreground whitespace-nowrap ${className}`}
  >
    {children}
  </th>
);

export const Td = ({ children, className = "" }) => (
  <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>
);

export const rowClass = "border-t border-border hover:bg-secondary/30 transition-colors";

export const DeleteIconButton = ({ onClick, label = "Delete" }) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
  >
    <Trash2 className="w-4 h-4" />
  </button>
);

export const Pagination = ({ pagination, onPage }) => {
  if (!pagination || pagination.pages <= 1) return null;
  const { page, pages, total } = pagination;
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border text-sm text-muted-foreground">
      <span>
        Page {page} of {pages} · {total} total
      </span>
      <div className="flex gap-2">
        <button
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="p-2 rounded-full bg-secondary hover:text-foreground disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          aria-label="Next page"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="p-2 rounded-full bg-secondary hover:text-foreground disabled:opacity-40"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = "Delete",
  isBusy,
  onConfirm,
  onCancel,
}) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={isBusy ? undefined : onCancel}
        className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
      >
        <motion.div
          role="alertdialog"
          aria-label={title}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-card border border-border rounded-2xl p-6 card-shadow"
        >
          <h3 className="text-3xl font-display mb-2">{title}</h3>
          <p className="text-muted-foreground mb-6">{message}</p>
          <div className="flex justify-end gap-3">
            <button onClick={onCancel} disabled={isBusy} className={ghostButtonClass}>
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isBusy}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-destructive text-destructive-foreground font-medium uppercase tracking-wide text-sm disabled:opacity-60"
            >
              {isBusy && <Loader2 className="w-4 h-4 animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

/** Right-hand slide-over used by the product and category forms. */
export const Drawer = ({ open, title, onClose, children }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-md"
      >
        <motion.aside
          role="dialog"
          aria-label={title}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-0 h-full w-full max-w-2xl bg-card border-l border-border flex flex-col"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-3xl font-display">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="px-3 py-1 rounded-full bg-secondary text-muted-foreground hover:text-foreground text-sm"
            >
              Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">{children}</div>
        </motion.aside>
      </motion.div>
    )}
  </AnimatePresence>
);
