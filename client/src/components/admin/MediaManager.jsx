import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, Star, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { adminService } from "@/services";
import { getErrorMessage } from "@/services/api";
import { Field, inputClass } from "./AdminUi";
import { ASSET_TYPES, emptyAsset } from "./productEditorModel";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

const validateImage = (file) => {
  if (!ALLOWED_TYPES.includes(file.type))
    return `${file.name}: only JPG, PNG or WebP images are allowed`;
  if (file.size > MAX_SIZE_BYTES) return `${file.name}: must be 5 MB or smaller`;
  return null;
};

const move = (list, from, to) => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

const MediaManager = ({ assets, onChange, max = 10 }) => {
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    if (assets.length + files.length > max) {
      toast.error(`You can add up to ${max} media assets`);
      return;
    }
    const problem = files.map(validateImage).find(Boolean);
    if (problem) {
      toast.error(problem);
      return;
    }
    setIsUploading(true);
    try {
      const uploaded = await adminService.uploadWebpImages(files);
      const next = uploaded.map((asset, index) => ({
        ...emptyAsset(),
        ...asset,
        assetType: assets.length === 0 && index === 0 ? "hero" : "gallery",
        order: assets.length + index,
      }));
      onChange([...assets, ...next]);
      toast.success(`${uploaded.length} image${uploaded.length > 1 ? "s" : ""} optimized`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  };

  const update = (index, field, value) =>
    onChange(
      assets.map((asset, i) => (i === index ? { ...asset, [field]: value } : asset)),
    );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {assets.map((asset, index) => (
          <div
            key={asset._id ?? `${asset.webpUrl}-${index}`}
            className="rounded-xl border border-border bg-secondary/40 overflow-hidden"
          >
            <div className="relative aspect-[4/3] bg-background">
              <img
                src={asset.thumbnailUrl || asset.webpUrl}
                alt={asset.altText || `Product media ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {index === 0 && (
                <span className="absolute top-2 left-2 px-2 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-widest">
                  Cover
                </span>
              )}
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  type="button"
                  aria-label="Move left"
                  disabled={index === 0}
                  onClick={() => onChange(move(assets, index, index - 1))}
                  className="p-1.5 rounded-full bg-background/80 text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Move right"
                  disabled={index === assets.length - 1}
                  onClick={() => onChange(move(assets, index, index + 1))}
                  className="p-1.5 rounded-full bg-background/80 text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={() => onChange(assets.filter((_, i) => i !== index))}
                  className="p-1.5 rounded-full bg-background/80 text-destructive hover:opacity-80"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {index !== 0 && (
                <button
                  type="button"
                  onClick={() => onChange(move(assets, index, 0))}
                  className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-background/80 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary"
                >
                  <Star className="w-3 h-3" /> Set cover
                </button>
              )}
            </div>
            <div className="p-3 space-y-3">
              <Field label="Alt text">
                <input
                  value={asset.altText ?? ""}
                  onChange={(event) => update(index, "altText", event.target.value)}
                  placeholder="Describe the image for SEO"
                  className={inputClass}
                />
              </Field>
              <Field label="Asset type">
                <select
                  value={asset.assetType ?? "gallery"}
                  onChange={(event) => update(index, "assetType", event.target.value)}
                  className={inputClass}
                >
                  {ASSET_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </Field>
              {asset.width > 0 && (
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {asset.width} × {asset.height}px ·{" "}
                  {(Number(asset.fileSize || 0) / 1024).toFixed(0)} KB WebP
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading || assets.length >= max}
        className="w-full h-28 rounded-xl border border-dashed border-border text-muted-foreground hover:border-primary hover:text-foreground flex flex-col items-center justify-center gap-1 text-sm disabled:opacity-50 transition-colors"
      >
        {isUploading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Upload className="w-5 h-5" />
        )}
        {isUploading ? "Optimizing to WebP..." : "Upload product media"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        multiple
        onChange={handleFiles}
        className="hidden"
        aria-label="Upload product media"
      />
      <p className="text-xs text-muted-foreground">
        JPG, PNG or WebP up to 5 MB. Every upload is converted into responsive WebP
        renditions (2000 / 1600 / 800 / 400 px). First asset is the cover.
      </p>
    </div>
  );
};

export default MediaManager;
