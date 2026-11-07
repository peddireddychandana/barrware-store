import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { categoryService, productService } from "@/services";
import { getErrorMessage } from "@/services/api";
import ImageUploader from "./ImageUploader";
import { Field, Toggle, ghostButtonClass, inputClass, primaryButtonClass } from "./AdminUi";
import {
  PRODUCT_TYPES,
  buildProductPayload,
  discountPercent,
  emptyProductForm,
  formFromProduct,
  validateProductForm,
} from "./productFormModel";

const Section = ({ title, children }) => (
  <fieldset className="space-y-4">
    <legend className="text-xl font-display text-primary mb-1">{title}</legend>
    {children}
  </fieldset>
);

const PairRows = ({ rows, onChange, keyPlaceholder, valuePlaceholder, canAdd }) => {
  const update = (index, field, value) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));

  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div key={index} className="flex gap-2">
          <input
            aria-label={`${keyPlaceholder} ${index + 1}`}
            value={row.key}
            onChange={(e) => update(index, "key", e.target.value)}
            placeholder={keyPlaceholder}
            className={inputClass}
          />
          <input
            aria-label={`${valuePlaceholder} ${index + 1}`}
            value={row.value}
            onChange={(e) => update(index, "value", e.target.value)}
            placeholder={valuePlaceholder}
            className={inputClass}
          />
          {canAdd && (
            <button
              type="button"
              aria-label="Remove row"
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
              className="p-2 text-muted-foreground hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      {canAdd && (
        <button
          type="button"
          onClick={() => onChange([...rows, { key: "", value: "" }])}
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <Plus className="w-4 h-4" /> Add row
        </button>
      )}
    </div>
  );
};

const FeatureRows = ({ features, onChange }) => (
  <div className="space-y-2">
    {features.map((feature, index) => (
      <div key={index} className="flex gap-2">
        <input
          aria-label={`Feature ${index + 1}`}
          value={feature}
          onChange={(e) => onChange(features.map((f, i) => (i === index ? e.target.value : f)))}
          placeholder="e.g. Leak-proof lid"
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

const FLAG_TOGGLES = [
  { field: "featured", label: "Featured" },
  { field: "bestSeller", label: "Best seller" },
  { field: "premium", label: "Premium" },
  { field: "isActive", label: "Active (visible in store)" },
];

const ProductForm = ({ product, onDone }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => (product ? formFromProduct(product) : emptyProductForm()));
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoryService.list,
  });

  const createCategory = useMutation({
    mutationFn: (name) => categoryService.create({ name }),
    onSuccess: (category) => {
      toast.success("Category created");
      queryClient.setQueryData(["categories"], (old = []) => [...old, category]);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      setForm((prev) => ({ ...prev, category: category._id }));
      setNewCategoryName("");
      setShowNewCategory(false);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const handleCreateCategory = () => {
    const name = newCategoryName.trim();
    if (name.length < 2) {
      toast.error("Category name must be at least 2 characters");
      return;
    }
    createCategory.mutate(name);
  };

  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const setValue = (field) => (value) => setForm((prev) => ({ ...prev, [field]: value }));

  const save = useMutation({
    mutationFn: () => {
      const payload = buildProductPayload(form);
      return product ? productService.update(product._id, payload) : productService.create(payload);
    },
    onSuccess: () => {
      toast.success(product ? "Product updated" : "Product created");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onDone();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const problem = validateProductForm(form);
    if (problem) {
      toast.error(problem);
      return;
    }
    save.mutate();
  };

  const discount = discountPercent(form.price, form.originalPrice);

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-8">
      <Section title="BASICS">
        <Field label="Name">
          <input value={form.name} onChange={setField("name")} className={inputClass} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-end gap-2">
              <Field label="Category" className="flex-1">
                <select value={form.category} onChange={setField("category")} className={inputClass}>
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
                aria-expanded={showNewCategory}
                className={`${ghostButtonClass} shrink-0 px-4`}
              >
                <Plus className="w-4 h-4" /> New
              </button>
            </div>
            {showNewCategory && (
              <div className="mt-3 flex gap-2">
                <input
                  autoFocus
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateCategory();
                    }
                  }}
                  placeholder="New category name"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={createCategory.isPending || newCategoryName.trim().length < 2}
                  className={primaryButtonClass}
                >
                  {createCategory.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Create"
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
        <Field label="Short description" hint={`${form.shortDescription.length}/300`}>
          <textarea
            value={form.shortDescription}
            onChange={setField("shortDescription")}
            rows={2}
            maxLength={300}
            className={inputClass}
          />
        </Field>
        <Field label="Long description">
          <textarea
            value={form.description}
            onChange={setField("description")}
            rows={5}
            maxLength={4000}
            className={inputClass}
          />
        </Field>
      </Section>

      <Section title="PRICING & STOCK">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Price (₹)">
            <input
              type="number"
              min="0"
              value={form.price}
              onChange={setField("price")}
              className={inputClass}
            />
          </Field>
          <Field label="Original price (₹)" hint={discount ? `${discount}% off` : "No discount"}>
            <input
              type="number"
              min="0"
              value={form.originalPrice}
              onChange={setField("originalPrice")}
              className={inputClass}
            />
          </Field>
          <Field label="Stock">
            <input
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={setField("stock")}
              className={inputClass}
            />
          </Field>
          <Field label="SKU" hint={product ? undefined : "Optional, auto-generated"}>
            <input value={form.sku} onChange={setField("sku")} className={inputClass} />
          </Field>
        </div>
      </Section>

      <Section title="DETAILS">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {["material", "colour", "size", "capacity", "weight"].map((field) => (
            <Field key={field} label={field}>
              <input value={form[field]} onChange={setField(field)} className={inputClass} />
            </Field>
          ))}
        </div>
      </Section>

      <Section title="SPECIFICATIONS">
        <PairRows
          canAdd
          rows={form.specifications}
          onChange={setValue("specifications")}
          keyPlaceholder="Label"
          valuePlaceholder="Value"
        />
      </Section>

      <Section title="FEATURES">
        <FeatureRows features={form.features} onChange={setValue("features")} />
      </Section>

      <Section title="HIGHLIGHTS (3)">
        <PairRows
          rows={form.highlights}
          onChange={setValue("highlights")}
          keyPlaceholder="Title"
          valuePlaceholder="Detail"
        />
      </Section>

      <Section title="IMAGES">
        <ImageUploader images={form.images} onChange={setValue("images")} />
      </Section>

      <Section title="VISIBILITY">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FLAG_TOGGLES.map(({ field, label }) => (
            <div
              key={field}
              className="flex items-center justify-between bg-secondary/50 rounded-lg px-4 py-3"
            >
              <span className="text-sm">{label}</span>
              <Toggle checked={form[field]} onChange={setValue(field)} label={label} />
            </div>
          ))}
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-6 -mb-8 px-6 py-4 bg-card border-t border-border flex justify-start gap-3">
        <button type="button" onClick={onDone} className={ghostButtonClass}>
          Cancel
        </button>
        <button type="submit" disabled={save.isPending} className={primaryButtonClass}>
          {save.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {product ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
