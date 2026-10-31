import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { adminService } from "@/services";
import { getErrorMessage } from "@/services/api";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

/** Returns an error message for a file the server would reject, or null when it is fine. */
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

const ImageUploader = ({ images, onChange, max = 8 }) => {
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;

    if (images.length + files.length > max) {
      toast.error(`You can add up to ${max} images`);
      return;
    }
    const problem = files.map(validateImage).find(Boolean);
    if (problem) {
      toast.error(problem);
      return;
    }

    setIsUploading(true);
    try {
      const urls = await adminService.uploadImages(files);
      onChange([...images, ...urls]);
      toast.success(`${urls.length} image${urls.length > 1 ? "s" : ""} uploaded`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {images.map((url, index) => (
          <div
            key={url}
            className="w-28 rounded-lg border border-border bg-secondary/50 overflow-hidden"
          >
            <img src={url} alt={`Product image ${index + 1}`} className="w-28 h-28 object-cover" />
            <div className="flex items-center justify-between p-1">
              <button
                type="button"
                aria-label="Move image left"
                disabled={index === 0}
                onClick={() => onChange(move(images, index, index - 1))}
                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => onChange(images.filter((_, i) => i !== index))}
                className="p-1 text-destructive hover:opacity-80"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Move image right"
                disabled={index === images.length - 1}
                onClick={() => onChange(move(images, index, index + 1))}
                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {index === 0 && (
              <p className="text-[10px] text-center uppercase tracking-widest text-primary pb-1">
                Cover
              </p>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading || images.length >= max}
          className="w-28 h-28 rounded-lg border border-dashed border-border text-muted-foreground hover:border-primary hover:text-foreground flex flex-col items-center justify-center gap-1 text-xs disabled:opacity-50 transition-colors"
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Upload className="w-5 h-5" />
          )}
          {isUploading ? "Uploading" : "Add images"}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        multiple
        onChange={handleFiles}
        className="hidden"
        aria-label="Upload images"
      />
      <p className="text-xs text-muted-foreground mt-2">
        JPG, PNG or WebP, up to 5 MB each. First image is the cover.
      </p>
    </div>
  );
};

export default ImageUploader;
