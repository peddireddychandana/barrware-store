import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  Circle,
  Eye,
  Globe,
  Image as ImageIcon,
  Loader2,
  Package,
  Plus,
  Save,
  Search,
  Send,
  Tag,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useParams, useRouter } from "@/lib/router";
import { adminService, categoryService, productService } from "@/services";
import { getErrorMessage } from "@/services/api";
import { formatPrice } from "@/utils/format";
import MediaManager from "@/components/admin/MediaManager";
import VariantManager from "@/components/admin/VariantManager";
import {
  Field,
  Panel,
  Spinner,
  Toggle,
  ghostButtonClass,
  inputClass,
  primaryButtonClass,
} from "@/components/admin/AdminUi";
import {
  COLLECTIONS,
  GST_RATES,
  PRODUCT_TYPES,
  SALES_CHANNELS,
  STATUS_OPTIONS,
  buildEditorPayload,
  calcPricing,
  emptyEditorForm,
  formFromProduct,
  inventoryState,
  slugify,
  validateEditor,
} from "@/components/admin/productEditorModel";

const TABS = [
  { id: "basics", label: "Basics" },
  { id: "media", label: "Media" },
  { id: "pricing", label: "Pricing" },
  { id: "inventory", label: "Inventory" },
  { id: "variants", label: "Variants" },
  { id: "shipping", label: "Shipping" },
  { id: "related", label: "Related" },
  { id: "seo", label: "SEO" },
  { id: "gift", label: "Gift Packaging" },
];

const STOREFRONT_PLACEMENTS = [
  { field: "featured", label: "Featured products" },
  { field: "bestSeller", label: "Best sellers (Shop the Bar)" },
  { field: "premium", label: "Premium collection (The Premium Edit)" },
];

const StatusBadge = ({ status }) => {
  const styles = {
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    draft: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    archived: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={`px-3 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-widest ${
        styles[status] ?? styles.draft
      }`}
    >
      {status}
    </span>
  );
};

const TagsInput = ({ value, onChange }) => {
  const [text, setText] = useState((value ?? []).join(", "));
  useEffect(() => {
    setText((value ?? []).join(", "));
  }, [value]);
  const commit = () =>
    onChange(
      text
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    );
  return (
    <input
      value={text}
      onChange={(event) => setText(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit();
        }
      }}
      placeholder="shaker, gift, home-bar"
      className={inputClass}
    />
  );
};

const FeatureList = ({ features, onChange }) => (
  <div className="space-y-2">
    {features.map((feature, index) => (
      <div key={index} className="flex gap-2">
        <input
          aria-label={`Key feature ${index + 1}`}
          value={feature}
          onChange={(event) =>
            onChange(
              features.map((item, i) => (i === index ? event.target.value : item)),
            )
          }
          placeholder="e.g. Leak-proof silicone seal"
          className={inputClass}
        />
        <button
          type="button"
          aria-label="Remove feature"
          onClick={() => onChange(features.filter((_, i) => i !== index))}
          className="p-2 text-muted-foreground hover:text-destructive"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    ))}
    <button
      type="button"
      onClick={() => onChange([...features, ""])}
      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
    >
      <Plus className="w-4 h-4" /> Add feature
    </button>
  </div>
);

const ChecklistItem = ({ done, children }) => (
  <li className="flex items-center gap-2 text-xs">
    {done ? (
      <Check className="w-3.5 h-3.5 text-emerald-400" />
    ) : (
      <Circle className="w-3.5 h-3.5 text-muted-foreground" />
    )}
    <span className={done ? "text-muted-foreground" : ""}>{children}</span>
  </li>
);

const AdminProductEditorPage = () => {
  const { id } = useParams();
  const isNew = !id;
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState(emptyEditorForm);
  const [activeTab, setActiveTab] = useState("basics");
  const [isDirty, setIsDirty] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [relatedSearch, setRelatedSearch] = useState("");
  const loadedId = useRef(null);

  const productQuery = useQuery({
    queryKey: ["admin", "product", id],
    queryFn: () => productService.getAdmin(id),
    enabled: !isNew,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoryService.list,
  });
  const relatedQuery = useQuery({
    queryKey: ["admin", "products", "picker"],
    queryFn: () => adminService.products({ limit: 100 }),
  });

  useEffect(() => {
    if (!productQuery.data || loadedId.current === productQuery.data._id) return;
    loadedId.current = productQuery.data._id;
    setForm(formFromProduct(productQuery.data));
    setIsDirty(false);
  }, [productQuery.data]);

  const patch = (changes) => {
    setForm((previous) => ({ ...previous, ...changes }));
    setIsDirty(true);
  };

  const setField = (field) => (event) => patch({ [field]: event.target.value });

  const handleTitleChange = (event) => {
    const title = event.target.value;
    setForm((previous) => ({
      ...previous,
      title,
      slug: previous.slugManual ? previous.slug : slugify(title),
    }));
    setIsDirty(true);
  };

  const slugQuery = useQuery({
    queryKey: ["slug-check", form.slug, id],
    queryFn: () => productService.slugCheck(form.slug, id),
    enabled: form.slug.trim().length > 1,
    retry: false,
  });

  const createCategory = useMutation({
    mutationFn: (name) => categoryService.create({ name }),
    onSuccess: (category) => {
      toast.success("Category created");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      patch({ category: category._id });
      setNewCategoryName("");
      setShowNewCategory(false);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const saveMutation = useMutation({
    mutationFn: async ({ status }) => {
      const payload = buildEditorPayload({ ...form, status });
      if (isNew) {
        const created = await productService.create(payload);
        if (status === "active") await productService.publish(created._id);
        return created;
      }
      await productService.update(id, payload);
      if (status === "active") await productService.publish(id);
      return { _id: id };
    },
    onSuccess: (saved, variables) => {
      toast.success(
        variables.status === "active" ? "Product published" : "Product saved",
      );
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      setIsDirty(false);
      setForm((previous) => ({ ...previous, status: variables.status }));
      if (isNew && saved?._id) router.replace(`/admin/products/${saved._id}/edit`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const submit = (status) => {
    const problem = validateEditor(form, { publishing: status === "active" });
    if (problem) {
      toast.error(problem);
      return;
    }
    saveMutation.mutate({ status });
  };

  const handlePreview = () => {
    if (isNew) {
      toast.error("Save the product before previewing");
      return;
    }
    router.push(`/admin/products/${id}/preview`);
  };

  const pricing = calcPricing(form);
  const totalVariantStock = form.variants.reduce(
    (sum, variant) => sum + (Number(variant.stock) || 0),
    0,
  );
  const stock = form.variantsEnabled
    ? totalVariantStock
    : Number(form.stock) || 0;
  const stockState = inventoryState(stock, form.lowStockThreshold);
  const hasStorefrontPlacement = STOREFRONT_PLACEMENTS.some(
    ({ field }) => form[field],
  );
  const cover =
    form.mediaAssets[0]?.thumbnailUrl ||
    form.mediaAssets[0]?.webpUrl ||
    form.images[0];

  const relatedProducts = relatedQuery.data?.items ?? [];
  const relatedMap = useMemo(
    () => new Map(relatedProducts.map((item) => [item._id, item])),
    [relatedProducts],
  );
  const filteredRelated = relatedProducts
    .filter((item) => item._id !== id)
    .filter((item) =>
      relatedSearch
        ? `${item.name} ${item.sku}`.toLowerCase().includes(relatedSearch.toLowerCase())
        : true,
    )
    .slice(0, 24);

  if (!isNew && productQuery.isLoading) return <Spinner />;

  if (!isNew && productQuery.isError) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        {getErrorMessage(productQuery.error)}
      </div>
    );
  }

  const metaTitle = form.seo.metaTitle || form.title;
  const metaDescription = form.seo.metaDescription || form.subtitle;

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            aria-label="Back to products"
            className="mt-1 p-2 rounded-full bg-secondary text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl md:text-4xl font-display">
                {isNew ? "NEW PRODUCT" : form.title || "EDIT PRODUCT"}
              </h1>
              <StatusBadge status={form.status} />
              {isDirty && (
                <span className="text-[10px] uppercase tracking-widest text-amber-400">
                  Unsaved changes
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {isNew
                ? "Build a conversion-ready barware listing."
                : `SKU ${form.sku || "pending"} · ${form.collections.join(", ") || "No collection"}`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePreview}
            className={ghostButtonClass}
            disabled={isNew}
          >
            <Eye className="w-4 h-4" /> Preview
          </button>
          <button
            type="button"
            onClick={() => submit("draft")}
            disabled={saveMutation.isPending}
            className={ghostButtonClass}
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save draft
          </button>
          <button
            type="button"
            onClick={() => submit("active")}
            disabled={saveMutation.isPending}
            className={primaryButtonClass}
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Publish
          </button>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1fr_320px] gap-6 items-start">
        <div>
          <div className="flex flex-wrap gap-1 mb-4 border-b border-border">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-medium uppercase tracking-wide sm:tracking-widest whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "basics" && (
            <div className="space-y-6">
              <Panel title="Product identity" className="p-5 space-y-4">
                <Field label="Product title">
                  <input
                    value={form.title}
                    onChange={handleTitleChange}
                    placeholder="e.g. Hawthorne Strainer"
                    className={inputClass}
                  />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="URL slug"
                    hint={
                      slugQuery.data
                        ? slugQuery.data.available
                          ? "Available"
                          : "Already used by another product"
                        : "Lowercase, hyphenated"
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">/products/</span>
                      <input
                        value={form.slug}
                        onChange={(event) =>
                          patch({ slug: slugify(event.target.value), slugManual: true })
                        }
                        className={inputClass}
                      />
                    </div>
                  </Field>
                  <Field label="Subtitle">
                    <input
                      value={form.subtitle}
                      onChange={setField("subtitle")}
                      placeholder="One line that sells the piece"
                      className={inputClass}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-end gap-2">
                      <Field label="Category" className="flex-1">
                        <select
                          value={form.category}
                          onChange={setField("category")}
                          className={inputClass}
                        >
                          <option value="">Select category</option>
                          {categories.map((category) => (
                            <option key={category._id} value={category._id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <button
                        type="button"
                        onClick={() => setShowNewCategory((value) => !value)}
                        className={`${ghostButtonClass} shrink-0 px-4`}
                      >
                        <Plus className="w-4 h-4" /> New
                      </button>
                    </div>
                    {showNewCategory && (
                      <div className="mt-2 flex gap-2">
                        <input
                          value={newCategoryName}
                          onChange={(event) => setNewCategoryName(event.target.value)}
                          placeholder="New category"
                          className={inputClass}
                        />
                        <button
                          type="button"
                          disabled={newCategoryName.trim().length < 2}
                          onClick={() => createCategory.mutate(newCategoryName.trim())}
                          className={primaryButtonClass}
                        >
                          {createCategory.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Add"
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  <Field label="Product type">
                    <select
                      value={form.productType}
                      onChange={setField("productType")}
                      className={inputClass}
                    >
                      <option value="">Select type</option>
                      {PRODUCT_TYPES.map((type) => (
                        <option key={type.slug} value={type.slug}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Brand">
                    <input
                      value={form.brand}
                      onChange={setField("brand")}
                      placeholder="Barware Store"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Vendor">
                    <input
                      value={form.vendor}
                      onChange={setField("vendor")}
                      className={inputClass}
                    />
                  </Field>
                </div>
                <Field label="Collections">
                  <div className="flex flex-wrap gap-2">
                    {COLLECTIONS.map((collection) => {
                      const active = form.collections.includes(collection);
                      return (
                        <button
                          key={collection}
                          type="button"
                          onClick={() =>
                            patch({
                              collections: active
                                ? form.collections.filter((item) => item !== collection)
                                : [...form.collections, collection],
                            })
                          }
                          className={`px-3 py-1.5 rounded-full border text-xs transition-colors ${
                            active
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          {collection}
                        </button>
                      );
                    })}
                  </div>
                </Field>
                <Field label="Tags">
                  <TagsInput value={form.tags} onChange={(tags) => patch({ tags })} />
                </Field>
              </Panel>

              <Panel title="Description" className="p-5 space-y-4">
                <Field label="Key features">
                  <FeatureList
                    features={form.keyFeatures}
                    onChange={(features) => patch({ keyFeatures: features })}
                  />
                </Field>
                <Field label="Long description">
                  <textarea
                    value={form.description}
                    onChange={setField("description")}
                    rows={10}
                    placeholder="Paste or write the full product details here..."
                    className={inputClass}
                  />
                </Field>
              </Panel>

              <Panel title="Sales channels" className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {SALES_CHANNELS.map((channel) => {
                    const active = form.salesChannels.includes(channel.value);
                    return (
                      <button
                        key={channel.value}
                        type="button"
                        onClick={() =>
                          patch({
                            salesChannels: active
                              ? form.salesChannels.filter((item) => item !== channel.value)
                              : [...form.salesChannels, channel.value],
                          })
                        }
                        className={`flex items-center justify-between gap-2 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                          active
                            ? "border-primary bg-primary/10"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {channel.label}
                        {active && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </Panel>
            </div>
          )}

          {activeTab === "media" && (
            <Panel title="Media library" className="p-5">
              <MediaManager
                assets={form.mediaAssets}
                onChange={(mediaAssets) => patch({ mediaAssets })}
              />
            </Panel>
          )}

          {activeTab === "pricing" && (
            <div className="space-y-6">
              <Panel title="Pricing" className="p-5 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Field label="Selling price (₹)">
                    <input
                      type="number"
                      min="0"
                      value={form.price}
                      onChange={setField("price")}
                      className={inputClass}
                      disabled={form.variantsEnabled}
                    />
                  </Field>
                  <Field label="Compare at price (₹)">
                    <input
                      type="number"
                      min="0"
                      value={form.originalPrice}
                      onChange={setField("originalPrice")}
                      className={inputClass}
                      disabled={form.variantsEnabled}
                    />
                  </Field>
                  <Field label="Cost per item (₹)">
                    <input
                      type="number"
                      min="0"
                      value={form.costPerItem}
                      onChange={setField("costPerItem")}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="GST rate">
                    <select
                      value={form.gstRate}
                      onChange={setField("gstRate")}
                      className={inputClass}
                    >
                      {GST_RATES.map((rate) => (
                        <option key={rate} value={rate}>
                          {rate}%
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3">
                  <div>
                    <p className="text-sm">Prices include GST</p>
                    <p className="text-xs text-muted-foreground">
                      Uncheck to add GST at checkout for this product.
                    </p>
                  </div>
                  <Toggle
                    checked={form.taxInclusive}
                    onChange={(taxInclusive) => patch({ taxInclusive })}
                    label="Tax inclusive pricing"
                  />
                </div>
                {form.variantsEnabled && (
                  <p className="text-xs text-amber-400">
                    Variants are enabled. Base price is calculated automatically from
                    variant pricing.
                  </p>
                )}
              </Panel>

              <Panel title="Profitability" className="p-5">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="rounded-xl bg-secondary/50 p-4">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                      Gross profit
                    </p>
                    <p className="text-xl font-semibold">{formatPrice(pricing.grossProfit)}</p>
                  </div>
                  <div className="rounded-xl bg-secondary/50 p-4">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                      Margin
                    </p>
                    <p className="text-xl font-semibold">{pricing.margin.toFixed(1)}%</p>
                  </div>
                  <div className="rounded-xl bg-secondary/50 p-4">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                      Discount
                    </p>
                    <p className="text-xl font-semibold">{pricing.discount.toFixed(0)}%</p>
                  </div>
                </div>
              </Panel>
            </div>
          )}

          {activeTab === "inventory" && (
            <div className="space-y-6">
              <Panel title="Inventory" className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="SKU" hint={isNew ? "Leave blank to auto-generate" : undefined}>
                    <input
                      value={form.sku}
                      onChange={setField("sku")}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Barcode / EAN">
                    <input
                      value={form.barcode}
                      onChange={setField("barcode")}
                      className={inputClass}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Stock quantity">
                    <input
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={setField("stock")}
                      className={inputClass}
                      disabled={form.variantsEnabled}
                    />
                  </Field>
                  <Field label="Low stock alert at">
                    <input
                      type="number"
                      min="0"
                      value={form.lowStockThreshold}
                      onChange={setField("lowStockThreshold")}
                      className={inputClass}
                    />
                  </Field>
                  <div className="flex items-end pb-1">
                    <span className={`text-sm font-medium ${stockState.className}`}>
                      {stockState.label} · {stock} units
                    </span>
                  </div>
                </div>
                {form.variantsEnabled && (
                  <p className="text-xs text-amber-400">
                    Stock is tracked per variant. Open the Variants tab to adjust.
                  </p>
                )}
              </Panel>

              <Panel title="Product details" className="p-5 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    ["material", "Material"],
                    ["colour", "Colour"],
                    ["size", "Size"],
                    ["capacity", "Capacity"],
                    ["weight", "Weight"],
                  ].map(([field, label]) => (
                    <Field key={field} label={label}>
                      <input
                        value={form[field]}
                        onChange={setField(field)}
                        className={inputClass}
                      />
                    </Field>
                  ))}
                </div>
              </Panel>
            </div>
          )}

          {activeTab === "variants" && (
            <Panel title="Variants" className="p-5">
              <VariantManager
                enabled={form.variantsEnabled}
                onEnabledChange={(variantsEnabled) => {
                  patch({ variantsEnabled });
                  if (variantsEnabled && form.variants.length === 0) {
                    setActiveTab("variants");
                  }
                }}
                variants={form.variants}
                onChange={(variants) => patch({ variants })}
                productTitle={form.title}
                baseSku={form.sku}
              />
            </Panel>
          )}

          {activeTab === "shipping" && (
            <div className="space-y-6">
              <Panel title="Package dimensions" className="p-5 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Field label="Package weight (g)">
                    <input
                      type="number"
                      min="0"
                      value={form.packageWeight}
                      onChange={setField("packageWeight")}
                      className={inputClass}
                    />
                  </Field>
                  {[
                    ["length", "Length (cm)"],
                    ["width", "Width (cm)"],
                    ["height", "Height (cm)"],
                  ].map(([field, label]) => (
                    <Field key={field} label={label}>
                      <input
                        type="number"
                        min="0"
                        value={form.dimensions[field]}
                        onChange={(event) =>
                          patch({
                            dimensions: {
                              ...form.dimensions,
                              [field]: event.target.value,
                            },
                          })
                        }
                        className={inputClass}
                      />
                    </Field>
                  ))}
                </div>
              </Panel>

              <Panel title="Handling" className="p-5 space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3">
                  <div>
                    <p className="text-sm">Fragile item</p>
                    <p className="text-xs text-muted-foreground">
                      Adds extra protective packaging at dispatch.
                    </p>
                  </div>
                  <Toggle
                    checked={form.fragile}
                    onChange={(fragile) => patch({ fragile })}
                    label="Fragile item"
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3">
                  <div>
                    <p className="text-sm">Print warning on label</p>
                    <p className="text-xs text-muted-foreground">
                      Show a handling warning on the shipping label.
                    </p>
                  </div>
                  <Toggle
                    checked={form.printLabelWarning}
                    onChange={(printLabelWarning) => patch({ printLabelWarning })}
                    label="Print label warning"
                  />
                </div>
              </Panel>
            </div>
          )}

          {activeTab === "related" && (
            <Panel title="Cross-sell products" className="p-5 space-y-4">
              <div className="flex flex-wrap gap-2">
                {form.relatedProducts.map((relatedId) => {
                  const item = relatedMap.get(relatedId);
                  return (
                    <span
                      key={relatedId}
                      className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs"
                    >
                      {item?.name ?? "Linked product"}
                      <button
                        type="button"
                        aria-label="Remove related product"
                        onClick={() =>
                          patch({
                            relatedProducts: form.relatedProducts.filter(
                              (value) => value !== relatedId,
                            ),
                          })
                        }
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
                {form.relatedProducts.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No cross-sell products selected yet.
                  </p>
                )}
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={relatedSearch}
                  onChange={(event) => setRelatedSearch(event.target.value)}
                  placeholder="Search the catalogue"
                  className={`${inputClass} pl-11`}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                {filteredRelated.map((item) => {
                  const selected = form.relatedProducts.includes(item._id);
                  return (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() =>
                        patch({
                          relatedProducts: selected
                            ? form.relatedProducts.filter((value) => value !== item._id)
                            : [...form.relatedProducts, item._id].slice(0, 8),
                        })
                      }
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        selected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {item.images?.[0] ? (
                        <img
                          src={item.images[0]}
                          alt=""
                          className="w-9 h-9 rounded-md object-cover"
                        />
                      ) : (
                        <span className="w-9 h-9 rounded-md bg-secondary" />
                      )}
                      <span className="flex-1 min-w-0">
                        <span className="block truncate">{item.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {formatPrice(item.price)}
                        </span>
                      </span>
                      {selected && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </Panel>
          )}

          {activeTab === "seo" && (
            <div className="space-y-6">
              <Panel title="Search engine listing" className="p-5 space-y-4">
                <Field
                  label="Meta title"
                  hint={`${metaTitle.length}/60 characters`}
                >
                  <input
                    value={form.seo.metaTitle}
                    onChange={(event) =>
                      patch({
                        seo: { ...form.seo, metaTitle: event.target.value },
                      })
                    }
                    placeholder={form.title}
                    maxLength={70}
                    className={inputClass}
                  />
                </Field>
                <Field
                  label="Meta description"
                  hint={`${metaDescription.length}/160 characters`}
                >
                  <textarea
                    value={form.seo.metaDescription}
                    onChange={(event) =>
                      patch({
                        seo: { ...form.seo, metaDescription: event.target.value },
                      })
                    }
                    rows={3}
                    maxLength={180}
                    className={inputClass}
                  />
                </Field>
              </Panel>
              <Panel title="Google preview" className="p-5">
                <div className="rounded-lg bg-background border border-border p-4">
                  <p className="text-xs text-emerald-400 mb-1">
                    barwarestore.in › products › {form.slug || "your-product"}
                  </p>
                  <p className="text-lg text-blue-400 leading-snug">
                    {metaTitle || "Product title"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {metaDescription || "Add a meta description to control this snippet."}
                  </p>
                </div>
              </Panel>
            </div>
          )}

          {activeTab === "gift" && (
            <div className="space-y-6">
              <Panel title="Gift packaging" className="p-5 space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3">
                  <div>
                    <p className="text-sm">Offer gift packaging</p>
                    <p className="text-xs text-muted-foreground">
                      Show the luxury gift box option on the product page.
                    </p>
                  </div>
                  <Toggle
                    checked={form.giftPackaging.enabled}
                    onChange={(enabled) =>
                      patch({
                        giftPackaging: { ...form.giftPackaging, enabled },
                      })
                    }
                    label="Gift packaging enabled"
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3">
                  <div>
                    <p className="text-sm">Eligible for gift wrapping</p>
                    <p className="text-xs text-muted-foreground">
                      Allow this item in gift hampers and wrap-at-checkout.
                    </p>
                  </div>
                  <Toggle
                    checked={form.giftPackaging.eligible}
                    onChange={(eligible) =>
                      patch({
                        giftPackaging: { ...form.giftPackaging, eligible },
                      })
                    }
                    label="Gift wrap eligible"
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3">
                  <div>
                    <p className="text-sm">Include gift card</p>
                    <p className="text-xs text-muted-foreground">
                      Add a hand-written note card with this item.
                    </p>
                  </div>
                  <Toggle
                    checked={form.giftPackaging.giftCard}
                    onChange={(giftCard) =>
                      patch({
                        giftPackaging: { ...form.giftPackaging, giftCard },
                      })
                    }
                    label="Gift card"
                  />
                </div>
                <Field label="Gift packaging description">
                  <textarea
                    value={form.giftPackaging.description}
                    onChange={(event) =>
                      patch({
                        giftPackaging: {
                          ...form.giftPackaging,
                          description: event.target.value,
                        },
                      })
                    }
                    rows={3}
                    className={inputClass}
                  />
                </Field>
                <Field label="Additional gift information">
                  <textarea
                    value={form.giftPackaging.additionalInfo}
                    onChange={(event) =>
                      patch({
                        giftPackaging: {
                          ...form.giftPackaging,
                          additionalInfo: event.target.value,
                        },
                      })
                    }
                    rows={2}
                    className={inputClass}
                  />
                </Field>
              </Panel>
            </div>
          )}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6">
          <Panel title="Publish" className="p-5 space-y-4">
            <Field label="Status">
              <select
                value={form.status}
                onChange={setField("status")}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => submit(form.status)}
                disabled={saveMutation.isPending}
                className={primaryButtonClass}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save changes
              </button>
              <button
                type="button"
                onClick={handlePreview}
                disabled={isNew}
                className={ghostButtonClass}
              >
                <Eye className="w-4 h-4" /> Preview storefront
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Draft products stay hidden from the storefront until published.
            </p>
          </Panel>

          <Panel title="Summary" className="p-5 space-y-4">
            <div className="flex gap-3">
              {cover ? (
                <img
                  src={cover}
                  alt=""
                  className="w-16 h-16 rounded-lg object-cover border border-border"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {form.title || "Untitled product"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {form.collections[0] || "No collection"}
                </p>
                <p className="text-sm text-primary mt-1">
                  {formatPrice(form.price)}
                  {form.originalPrice > form.price && (
                    <span className="ml-2 text-xs text-muted-foreground line-through">
                      {formatPrice(form.originalPrice)}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-muted-foreground uppercase tracking-widest text-[10px] mb-1">
                  Inventory
                </p>
                <p className={stockState.className}>
                  {stock} units · {stockState.label}
                </p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-muted-foreground uppercase tracking-widest text-[10px] mb-1">
                  Variants
                </p>
                <p>{form.variantsEnabled ? form.variants.length : "Single"}</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-muted-foreground uppercase tracking-widest text-[10px] mb-1">
                  Media
                </p>
                <p>{form.mediaAssets.length} assets</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-muted-foreground uppercase tracking-widest text-[10px] mb-1">
                  Margin
                </p>
                <p>{pricing.margin.toFixed(1)}%</p>
              </div>
            </div>
          </Panel>

          <Panel title="Readiness" className="p-5">
            <ul className="space-y-2">
              <ChecklistItem done={Boolean(form.title.trim())}>
                Product title
              </ChecklistItem>
              <ChecklistItem done={Boolean(form.category && form.productType)}>
                Category and type
              </ChecklistItem>
              <ChecklistItem done={form.mediaAssets.length > 0}>
                At least one image
              </ChecklistItem>
              <ChecklistItem
                done={
                  form.variantsEnabled
                    ? form.variants.length > 0
                    : Number(form.price) > 0
                }
              >
                Pricing configured
              </ChecklistItem>
              <ChecklistItem done={stock > 0}>Stock available</ChecklistItem>
              <ChecklistItem done={Boolean(form.seo.metaDescription.trim())}>
                SEO description
              </ChecklistItem>
              <ChecklistItem done={slugQuery.data?.available !== false}>
                Unique URL slug
              </ChecklistItem>
            </ul>
          </Panel>

          <Panel title="Storefront display" className="p-5 space-y-3">
            <Field label="Show product in (select one or more)">
              <div className="flex flex-wrap gap-2">
                {STOREFRONT_PLACEMENTS.map(({ field, label }) => {
                  const active = Boolean(form[field]);
                  return (
                    <button
                      key={field}
                      type="button"
                      aria-pressed={active}
                      onClick={() => patch({ [field]: !active })}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-colors ${
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {active && <Check className="w-3.5 h-3.5" />}
                      {label}
                    </button>
                  );
                })}
              </div>
            </Field>
            <p className="text-xs text-muted-foreground">
              {hasStorefrontPlacement
                ? "The product appears in every selected storefront section once it is active."
                : "No section selected — the product stays in the catalogue only."}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
              <Globe className="w-3.5 h-3.5" />
              {form.salesChannels.length} sales channel
              {form.salesChannels.length === 1 ? "" : "s"} connected
            </div>
          </Panel>

          <Panel title="Quick facts" className="p-5">
            <div className="space-y-2 text-xs">
              <p className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> SKU
                </span>
                <span>{form.sku || "Auto"}</span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" /> Package
                </span>
                <span>{form.packageWeight ? `${form.packageWeight} g` : "—"}</span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" /> Cover
                </span>
                <span>{cover ? "Ready" : "Missing"}</span>
              </p>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
};

export default AdminProductEditorPage;
