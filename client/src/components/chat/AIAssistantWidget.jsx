import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { Bot, MessageCircle, Send, Sparkles, Trash2, X } from "lucide-react";
import { useAIAssistant } from "@/context/AIAssistantContext";

const WELCOME_MESSAGE =
  "Hi! I'm your Barware AI Assistant. Ask me anything about our products.";

const SUGGESTION_KEYS = [
  "summarize",
  "features",
  "material",
  "special",
  "usage",
  "contents",
  "beginner",
  "specifications",
];

const AIAssistantWidget = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const {
    isOpen,
    openChat,
    closeChat,
    product,
    messages,
    isLoading,
    error,
    compareProductId,
    setCompareProductId,
    sendMessage,
    clearChat,
    retry,
  } = useAIAssistant();
  const [draft, setDraft] = useState("");
  const messagesRef = useRef(null);

  useEffect(() => {
    const node = messagesRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, isLoading, isOpen]);

  if (pathname.startsWith("/admin")) return null;

  const submit = (event) => {
    event.preventDefault();
    if (!draft.trim() || !product?.id || isLoading) return;
    sendMessage(draft);
    setDraft("");
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.section
            role="dialog"
            aria-label={t("chat.title")}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="card-shadow fixed bottom-4 right-4 z-[70] flex h-[min(72vh,620px)] w-[calc(100vw-2rem)] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-border bg-card sm:bottom-6 sm:right-6"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border bg-secondary/40 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full gradient-neon text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate font-display text-lg uppercase leading-none tracking-wider">
                    {t("chat.title")}
                  </h2>
                  <p className="mt-1 truncate text-[10px] uppercase tracking-widest text-muted-foreground">
                    {t("chat.subtitle")}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={clearChat}
                  aria-label={t("chat.clear")}
                  title={t("chat.clear")}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={closeChat}
                  aria-label={t("common.close")}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="border-b border-border px-4 py-2 text-xs text-muted-foreground">
              {product?.id ? (
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="shrink-0">{t("chat.discussing")}</span>
                  <strong className="truncate font-medium text-foreground">
                    {product.name}
                  </strong>
                </span>
              ) : (
                <span>{t("chat.noProduct")}</span>
              )}
            </div>

            {product?.id && product.relatedProducts?.length > 0 && (
              <div className="flex items-center gap-2 border-b border-border px-4 py-2">
                <label
                  htmlFor="ai-compare-product"
                  className="shrink-0 text-[10px] uppercase tracking-widest text-muted-foreground"
                >
                  {t("chat.compareLabel")}
                </label>
                <select
                  id="ai-compare-product"
                  value={compareProductId}
                  onChange={(event) => setCompareProductId(event.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-border bg-secondary/50 px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">{t("chat.compareNone")}</option>
                  {product.relatedProducts.map((item) => (
                    <option key={item._id || item.id} value={item._id || item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div
              ref={messagesRef}
              aria-live="polite"
              className="scrollbar-hide flex-1 space-y-3 overflow-y-auto px-4 py-4"
            >
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Bot className="h-3.5 w-3.5" />
                </span>
                <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-border bg-secondary/70 px-3 py-2 text-sm leading-relaxed">
                  {WELCOME_MESSAGE}
                </p>
              </div>

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "items-start gap-2"
                  }`}
                >
                  {message.role !== "user" && (
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Bot className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      message.role === "user"
                        ? "gradient-neon rounded-br-sm text-primary-foreground"
                        : "rounded-bl-sm border border-border bg-secondary/70 text-foreground"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Bot className="h-3.5 w-3.5" />
                  </span>
                  <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-border bg-secondary/70 px-3 py-3">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        style={{ animationDelay: `${delay}ms` }}
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
                      />
                    ))}
                    <span className="sr-only">{t("chat.thinking")}</span>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mx-3 mb-2 flex items-start justify-between gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={retry}
                  className="shrink-0 font-semibold underline"
                >
                  {t("chat.retry")}
                </button>
              </div>
            )}

            {messages.length === 0 && product?.id && !isLoading && (
              <div className="scrollbar-hide flex gap-2 overflow-x-auto border-t border-border px-4 py-2">
                {SUGGESTION_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => sendMessage(t(`chat.suggestions.${key}`))}
                    className="shrink-0 rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    {t(`chat.suggestions.${key}`)}
                  </button>
                ))}
                {compareProductId && (
                  <button
                    type="button"
                    onClick={() => sendMessage(t("chat.comparePrompt"))}
                    className="shrink-0 rounded-full border border-primary bg-primary/10 px-3 py-1 text-[11px] text-primary"
                  >
                    {t("chat.comparePrompt")}
                  </button>
                )}
              </div>
            )}

            <form
              onSubmit={submit}
              className="flex items-center gap-2 border-t border-border p-3"
            >
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                disabled={!product?.id || isLoading}
                aria-label={t("chat.placeholder")}
                placeholder={t("chat.placeholder")}
                className="min-w-0 flex-1 rounded-full border border-border bg-secondary/50 px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!draft.trim() || !product?.id || isLoading}
                aria-label={t("chat.send")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full gradient-neon text-primary-foreground neon-glow disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.button
          type="button"
          onClick={openChat}
          aria-label={t("chat.open")}
          whileTap={{ scale: 0.94 }}
          className="gradient-neon neon-glow fixed bottom-24 right-4 z-[70] flex h-14 w-14 items-center justify-center rounded-full text-primary-foreground sm:bottom-6 sm:right-6"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card text-primary">
            <Sparkles className="h-3 w-3" />
          </span>
        </motion.button>
      )}
    </>
  );
};

export default AIAssistantWidget;
