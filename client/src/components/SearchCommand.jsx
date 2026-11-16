import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Command } from "cmdk";
import { Search, ArrowRight, TrendingUp, LayoutGrid } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@/lib/navigation";
import { useCategories, useProducts } from "@/hooks/useCatalog";
import { formatPrice } from "@/utils/format";

const trending = ["Shaker", "Strainer", "Jigger", "Shot Glass", "Tool Set"];

const SEARCH_DEBOUNCE_MS = 250;

const SearchCommand = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const navigate = useNavigate();
  const { data: categories = [] } = useCategories();

  useEffect(() => {
    const down = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    const openEvt = () => setOpen(true);
    window.addEventListener("keydown", down);
    window.addEventListener("barware:open-search", openEvt);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("barware:open-search", openEvt);
    };
  }, []);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const { data } = useProducts(
    debouncedQuery ? { search: debouncedQuery, limit: 8 } : { featured: true, limit: 6 },
    { enabled: open },
  );
  const products = data?.products ?? [];

  const go = (href) => {
    setOpen(false);
    navigate(href);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-background/70 backdrop-blur-md flex items-start justify-center pt-[10vh] px-4"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ y: -30, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -20, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl bg-card border border-border rounded-2xl overflow-hidden card-shadow"
          >
            <Command loop shouldFilter={false}>
              <div className="flex items-center gap-3 px-5 border-b border-border">
                <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                <Command.Input
                  autoFocus
                  value={query}
                  onValueChange={setQuery}
                  placeholder={t("search.placeholder")}
                  className="flex-1 py-5 bg-transparent outline-none text-base placeholder:text-muted-foreground"
                />
                <kbd className="hidden sm:inline text-xs px-2 py-1 rounded bg-secondary text-muted-foreground">
                  ESC
                </kbd>
              </div>

              <Command.List className="max-h-[60vh] overflow-y-auto p-3">
                {debouncedQuery && products.length === 0 && (
                  <div className="py-10 text-center">
                    <p className="text-sm text-muted-foreground mb-1">
                      {t("search.noResults", { query })}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mb-4">
                      {t("search.noResultsHint")}
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {trending.map((trend) => (
                        <button
                          key={trend}
                          onClick={() => setQuery(trend)}
                          className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          {trend}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!query && (
                  <Command.Group
                    heading={t("search.trending")}
                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-muted-foreground"
                  >
                    {trending.map((trend) => (
                      <Command.Item
                        key={trend}
                        value={`trending ${trend}`}
                        onSelect={() => setQuery(trend)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer data-[selected=true]:bg-secondary transition-colors"
                      >
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="text-sm">{trend}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {products.length > 0 && (
                  <Command.Group
                    heading={debouncedQuery ? t("search.products") : t("search.popularPicks")}
                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-muted-foreground"
                  >
                    {products.map((p) => (
                      <Command.Item
                        key={p._id}
                        value={p._id}
                        onSelect={() => go(`/products/${p.slug}`)}
                        className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer data-[selected=true]:bg-secondary transition-colors"
                      >
                        <img
                          src={p.image}
                          alt=""
                          loading="lazy"
                          className="w-11 h-11 rounded-md object-cover bg-secondary shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{p.name}</div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {p.material} · {p.category}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-primary shrink-0">
                          {formatPrice(p.price)}
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </Command.Item>
                    ))}
                    {debouncedQuery && (
                      <Command.Item
                        value="view-all-results"
                        onSelect={() => go(`/products?search=${encodeURIComponent(debouncedQuery)}`)}
                        className="flex items-center justify-center gap-2 mt-1 px-3 py-3 rounded-lg cursor-pointer data-[selected=true]:bg-secondary transition-colors text-sm font-medium text-primary"
                      >
                        <Search className="w-4 h-4" />
                        {t("search.viewAll")}
                      </Command.Item>
                    )}
                  </Command.Group>
                )}

                <Command.Group
                  heading={t("search.categories")}
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-muted-foreground"
                >
                  {[{ name: t("footer.allProducts"), slug: null }, ...categories].map((l) => (
                    <Command.Item
                      key={l.slug ?? "all"}
                      value={l.name}
                      onSelect={() => go(l.slug ? `/category/${l.slug}` : "/products")}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer data-[selected=true]:bg-secondary transition-colors"
                    >
                      <LayoutGrid className="w-4 h-4 text-primary" />
                      <span className="text-sm">{l.name}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>

              <div className="border-t border-border px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>
                    {debouncedQuery
                      ? t("search.results", { count: products.length })
                      : t("search.typeToSearch")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-secondary">↑↓</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-secondary">↵</kbd>
                  <span>navigate</span>
                </div>
              </div>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchCommand;
