import { useRef, useState } from "react";
import { ImagePlus, Loader2, Plus, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { adminService } from "@/services";
import { getErrorMessage } from "@/services/api";
import { Field, Toggle, ghostButtonClass, inputClass } from "./AdminUi";
import { emptyVariant, inventoryState } from "./productEditorModel";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

const makeSku = (title, index, baseSku) => {
  if (baseSku) {
    const suffix = String(index + 1).padStart(2, "0");
    return `${baseSku}-${suffix}`;
  }
  const initials = String(title || "BW")
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 3)
    .toUpperCase();
  return `BW-${initials || "VAR"}-${String(index + 1).padStart(3, "0")}`;
};

const VariantImages = ({ images, onChange }) => {
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    const invalid = files.find(
      (file) =>
        !ALLOWED_TYPES.includes(file.type) || file.size > MAX_SIZE_BYTES,
    );
    if (invalid) {
      toast.error(`${invalid.name}: use JPG, PNG or WebP up to 5 MB`);
      return;
    }
    setIsUploading(true);
    try {
      const assets = await adminService.uploadWebpImages(files);
      onChange([...images, ...assets.map((asset) => asset.webpUrl)]);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {images.map((url, index) => (
        <div key={`${url}-${index}`} className="relative w-14 h-14">
          <img
            src={url}
            alt={`Variant ${index + 1}`}
            className="w-14 h-14 rounded-lg object-cover border border-border"
          />
          <button
            type="button"
            aria-label="Remove variant image"
            onClick={() => onChange(images.filter((_, i) => i !== index))}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="w-14 h-14 rounded-lg border border-dashed border-border text-muted-foreground hover:border-primary hover:text-foreground flex items-center justify-center disabled:opacity-50"
        aria-label="Add variant image"
      >
        {isUploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ImagePlus className="w-4 h-4" />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        multiple
        onChange={handleFiles}
        className="hidden"
        aria-label="Upload variant images"
      />
    </div>
  );
};

const VariantManager = ({
  enabled,
  onEnabledChange,
  variants,
  onChange,
  productTitle,
  baseSku,
}) => {
  const update = (index, field, value) =>
    onChange(
      variants.map((variant, i) =>
        i === index ? { ...variant, [field]: value } : variant,
      ),
    );

  const addVariant = () => {
    const index = variants.length;
    onChange([
      ...variants,
      {
        ...emptyVariant(),
        variantName: `Variant ${index + 1}`,
        sku: makeSku(productTitle, index, baseSku),
      },
    ]);
  };

  const removeVariant = (index) => onChange(variants.filter((_, i) => i !== index));

  const totalStock = variants.reduce(
    (sum, variant) => sum + (Number(variant.stock) || 0),
    0,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 rounded-xl bg-secondary/50 px-4 py-3">
        <div>
          <p className="text-sm font-medium">This product has multiple variants</p>
          <p className="text-xs text-muted-foreground">
            Enable to manage finish, colour, size or pack options with independent
            pricing and stock.
          </p>
        </div>
        <Toggle
          checked={enabled}
          onChange={onEnabledChange}
          label="Enable variants"
        />
      </div>

      {enabled && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {variants.length} variant{variants.length === 1 ? "" : "s"} ·{" "}
              {totalStock} units total
            </p>
            <button type="button" onClick={addVariant} className={ghostButtonClass}>
              <Plus className="w-4 h-4" /> Add variant
            </button>
          </div>

          {variants.length === 0 && (
            <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              No variants yet. Add your first colour or finish option.
            </p>
          )}

          <div className="space-y-4">
            {variants.map((variant, index) => {
              const state = inventoryState(
                variant.stock,
                variant.lowStockThreshold,
              );
              return (
                <div
                  key={variant._id ?? index}
                  className="rounded-xl border border-border bg-secondary/30 p-4 space-y-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-full border border-border"
                        style={{ backgroundColor: variant.colorHex || "#1a1a1a" }}
                      />
                      <p className="text-sm font-medium">
                        {variant.variantName || variant.colorName || `Variant ${index + 1}`}
                      </p>
                      <span className={`text-[10px] uppercase tracking-widest ${state.className}`}>
                        {state.label}
                      </span>
                    </div>
                    <button
                      type="button"
                      aria-label="Remove variant"
                      onClick={() => removeVariant(index)}
                      className="p-2 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field label="Variant name">
                      <input
                        value={variant.variantName}
                        onChange={(event) =>
                          update(index, "variantName", event.target.value)
                        }
                        placeholder="e.g. Matte Black"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Colour name">
                      <input
                        value={variant.colorName}
                        onChange={(event) =>
                          update(index, "colorName", event.target.value)
                        }
                        placeholder="e.g. Black"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Swatch colour">
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={variant.colorHex || "#1a1a1a"}
                          onChange={(event) =>
                            update(index, "colorHex", event.target.value)
                          }
                          className="h-10 w-12 rounded-lg border border-border bg-secondary/50"
                          aria-label="Swatch colour"
                        />
                        <input
                          value={variant.colorHex}
                          onChange={(event) =>
                            update(index, "colorHex", event.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field label="Finish type">
                      <input
                        value={variant.finishType}
                        onChange={(event) =>
                          update(index, "finishType", event.target.value)
                        }
                        placeholder="e.g. Brushed"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="SKU">
                      <div className="flex gap-2">
                        <input
                          value={variant.sku}
                          onChange={(event) => update(index, "sku", event.target.value)}
                          className={inputClass}
                        />
                        <button
                          type="button"
                          aria-label="Generate SKU"
                          onClick={() =>
                            update(
                              index,
                              "sku",
                              makeSku(productTitle, index, baseSku),
                            )
                          }
                          className="shrink-0 p-2.5 rounded-lg bg-secondary text-muted-foreground hover:text-primary"
                        >
                          <Wand2 className="w-4 h-4" />
                        </button>
                      </div>
                    </Field>
                    <Field label="Barcode / EAN">
                      <input
                        value={variant.barcode}
                        onChange={(event) =>
                          update(index, "barcode", event.target.value)
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <Field label="Selling price (₹)">
                      <input
                        type="number"
                        min="0"
                        value={variant.sellingPrice}
                        onChange={(event) =>
                          update(index, "sellingPrice", event.target.value)
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Compare at (₹)">
                      <input
                        type="number"
                        min="0"
                        value={variant.compareAtPrice}
                        onChange={(event) =>
                          update(index, "compareAtPrice", event.target.value)
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Cost / item (₹)">
                      <input
                        type="number"
                        min="0"
                        value={variant.costPerItem}
                        onChange={(event) =>
                          update(index, "costPerItem", event.target.value)
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Stock">
                      <input
                        type="number"
                        min="0"
                        value={variant.stock}
                        onChange={(event) => update(index, "stock", event.target.value)}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Low stock alert">
                      <input
                        type="number"
                        min="0"
                        value={variant.lowStockThreshold}
                        onChange={(event) =>
                          update(index, "lowStockThreshold", event.target.value)
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <Field label="Variant images">
                      <VariantImages
                        images={variant.images}
                        onChange={(images) => update(index, "images", images)}
                      />
                    </Field>
                    <Field label="Status" className="w-40">
                      <select
                        value={variant.status}
                        onChange={(event) =>
                          update(index, "status", event.target.value)
                        }
                        className={inputClass}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </Field>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default VariantManager;
