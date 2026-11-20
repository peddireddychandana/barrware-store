import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Check,
  Heading2,
  Heading3,
  Link2,
  List,
  ListOrdered,
  Table2,
  Unlink,
  X,
} from "lucide-react";

const ToolButton = ({ label, active, disabled, onClick, children }) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    aria-pressed={Boolean(active)}
    disabled={disabled}
    onClick={onClick}
    className={`flex h-8 min-w-8 items-center justify-center gap-1 rounded-md px-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
      active
        ? "bg-primary/15 text-primary"
        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
    }`}
  >
    {children}
  </button>
);

const normalizeHref = (value) => {
  const href = value.trim();
  if (!href) return "";
  if (/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(href)) return href;
  if (/^[\w.-]+@[\w.-]+\.\w+$/.test(href)) return `mailto:${href}`;
  return `https://${href}`;
};

const RichTextEditor = ({ value = "", onChange, placeholder = "Write product details..." }) => {
  const onChangeRef = useRef(onChange);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { target: "_blank", rel: "noopener noreferrer nofollow" },
        },
      }),
      TableKit,
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "rte-content product-rich-text",
        "aria-label": "Long description",
      },
    },
    onUpdate: ({ editor: instance }) => onChangeRef.current?.(instance.getHTML()),
  });

  useEffect(() => {
    if (!editor || value === editor.getHTML()) return;
    editor.commands.setContent(value || "", { emitUpdate: false });
  }, [editor, value]);

  const active = useEditorState({
    editor,
    selector: ({ editor: instance, transactionNumber }) => ({
      transactionNumber,
      bold: instance.isActive("bold"),
      h2: instance.isActive("heading", { level: 2 }),
      h3: instance.isActive("heading", { level: 3 }),
      bullet: instance.isActive("bulletList"),
      ordered: instance.isActive("orderedList"),
      table: instance.isActive("table"),
      link: instance.isActive("link"),
    }),
  });

  const run = (command) => () => {
    if (!editor) return;
    command(editor.chain().focus()).run();
  };

  const openLinkInput = () => {
    if (!editor) return;
    setLinkValue(editor.getAttributes("link").href || "");
    setLinkOpen(true);
  };

  const applyLink = () => {
    if (!editor) return;
    const href = normalizeHref(linkValue);
    const chain = editor.chain().focus().extendMarkRange("link");
    if (href) chain.setLink({ href }).run();
    else chain.unsetLink().run();
    setLinkOpen(false);
  };

  const removeLink = () => {
    editor?.chain().focus().extendMarkRange("link").unsetLink().run();
    setLinkOpen(false);
  };

  return (
    <div className="rich-text-editor rounded-lg border border-border bg-secondary/30 overflow-hidden transition-all focus-within:border-primary">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-secondary/50 px-2 py-1.5">
        <ToolButton
          label="Bold"
          active={active?.bold}
          disabled={!editor}
          onClick={run((chain) => chain.toggleBold())}
        >
          <Bold className="h-4 w-4" />
        </ToolButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <ToolButton
          label="Heading 2"
          active={active?.h2}
          disabled={!editor}
          onClick={run((chain) => chain.toggleHeading({ level: 2 }))}
        >
          <Heading2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          label="Heading 3"
          active={active?.h3}
          disabled={!editor}
          onClick={run((chain) => chain.toggleHeading({ level: 3 }))}
        >
          <Heading3 className="h-4 w-4" />
        </ToolButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <ToolButton
          label="Bullet list"
          active={active?.bullet}
          disabled={!editor}
          onClick={run((chain) => chain.toggleBulletList())}
        >
          <List className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          label="Numbered list"
          active={active?.ordered}
          disabled={!editor}
          onClick={run((chain) => chain.toggleOrderedList())}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <ToolButton
          label="Insert table"
          disabled={!editor}
          onClick={run((chain) => chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }))}
        >
          <Table2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Insert link" active={active?.link} disabled={!editor} onClick={openLinkInput}>
          <Link2 className="h-4 w-4" />
        </ToolButton>
      </div>

      {linkOpen && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-secondary/30 px-3 py-2">
          <input
            type="text"
            value={linkValue}
            autoFocus
            placeholder="https://example.com"
            aria-label="Link URL"
            onChange={(event) => setLinkValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyLink();
              }
              if (event.key === "Escape") setLinkOpen(false);
            }}
            className="min-w-[180px] flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={applyLink}
            className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/25"
          >
            <Check className="h-3.5 w-3.5" /> Apply
          </button>
          {active?.link && (
            <button
              type="button"
              onClick={removeLink}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Unlink className="h-3.5 w-3.5" /> Remove
            </button>
          )}
          <button
            type="button"
            aria-label="Cancel"
            onClick={() => setLinkOpen(false)}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <EditorContent editor={editor} className="rte-wrapper" />
    </div>
  );
};

export default RichTextEditor;
