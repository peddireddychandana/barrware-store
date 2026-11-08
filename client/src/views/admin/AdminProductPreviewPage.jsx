import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Eye, Loader2, Pencil, Send } from "lucide-react";
import { toast } from "sonner";
import { useParams, useRouter } from "@/lib/router";
import { productService } from "@/services";
import { getErrorMessage } from "@/services/api";
import { formatPrice, normalizeProduct } from "@/utils/format";
import PageShell from "@/components/PageShell";
import ProductCard from "@/components/ProductCard";
import { Spinner } from "@/components/admin/AdminUi";

const AdminProductPreviewPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedVariantId, setSelectedVariantId] = useState("");

  const query = useQuery({
    queryKey: ["admin", "preview", id],
    queryFn: () => productService.preview(id),
  });

  const publish = useMutation({
    mutationFn: () => productService.publish(id),
    onSuccess: () => {
      toast.success("Product published");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "preview", id] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (query.isLoading) return <Spinner />;
  if (query.isError) {
    return (
      <div className="py-24 text-center text-muted-foreground">
        {getErrorMessage(query.error)}
      </div>
    );
  }

  const product = query.data;
  const variants = (product.variants ?? []).filter(
    (variant) => variant.status !== "inactive",
  );
  const selectedVariant =
    variants.find((variant) => String(variant._id) === String(selectedVariantId)) ??
    (variants.length ? variants[0] : null);
  const price = selectedVariant ? selectedVariant.sellingPrice : product.price;
  const originalPrice = selectedVariant
    ? selectedVariant.compareAtPrice || selectedVariant.sellingPrice
    : product.originalPrice;
  const stock = selectedVariant ? selectedVariant.stock : product.stock;
  const images =
    selectedVariant?.images?.length > 0 ? selectedVariant.images : product.images;
  const discount =
    originalPrice > price && originalPrice > 0
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  return (
    <div className="-m-4 md:-m-8">
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/95 backdrop-blur px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => router.push(`/admin/products/${id}/edit`)}
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" /> Back to editor
          </button>
          <span className="px-2 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-[10px] uppercase tracking-widest text-amber-400">
            <Eye className="w-3 h-3 inline mr-1" />
            Preview · {product.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push(`/admin/products/${id}/edit`)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-sm text-muted-foreground hover:text-foreground"
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
          <button
            type="button"
            onClick={() => publish.mutate()}
            disabled={publish.isPending || product.status === "active"}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full gradient-neon text-primary-foreground text-sm font-medium uppercase tracking-wide disabled:opacity-60"
          >
            {publish.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {product.status === "active" ? "Published" : "Publish"}
          </button>
        </div>
      </div>

      <PageShell>
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14">
          <div>
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-secondary border border-border">
              {images?.[0] ? (
                <img
                  src={images[0]}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  No image
                </div>
              )}
              {discount > 0 && (
                <span className="absolute top-4 left-4 px-3 py-1 bg-destructive text-destructive-foreground text-[10px] font-semibold uppercase tracking-widest rounded-full">
                  -{discount}%
                </span>
              )}
            </div>
            {images?.length > 1 && (
              <div className="flex gap-3 mt-4">
                {images.map((src, index) => (
                  <img
                    key={`${src}-${index}`}
                    src={src}
                    alt=""
                    className="w-20 h-20 rounded-xl object-cover border border-border"
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
              {product.category?.name ?? product.category}
            </p>
            <h1 className="text-4xl md:text-5xl font-display mb-3">
              {product.title || product.name}
            </h1>
            {product.subtitle && (
              <p className="text-muted-foreground mb-4">{product.subtitle}</p>
            )}

            {variants.length > 0 && (
              <div className="mb-5">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Finish / Variant
                </p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((variant) => {
                    const active =
                      String(variant._id) === String(selectedVariant?._id);
                    return (
                      <button
                        key={variant._id}
                        type="button"
                        onClick={() => setSelectedVariantId(String(variant._id))}
                        className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm ${
                          active
                            ? "border-primary bg-primary/10"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-border"
                          style={{ backgroundColor: variant.colorHex || "#1a1a1a" }}
                        />
                        {variant.variantName || variant.colorName || "Default"}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-semibold">{formatPrice(price)}</span>
              {originalPrice > price && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(originalPrice)}
                  </span>
                  <span className="px-3 py-1 bg-destructive text-destructive-foreground text-[10px] font-semibold uppercase tracking-widest rounded-full">
                    Save {discount}%
                  </span>
                </>
              )}
            </div>
            <p className={`text-sm font-medium mb-6 ${stock > 0 ? "text-primary" : "text-destructive"}`}>
              {stock > 0 ? `In stock · ${stock} units` : "Out of stock"}
            </p>

            <div className="flex gap-3 mb-8">
              <button
                type="button"
                disabled
                className="flex-1 h-11 gradient-neon text-primary-foreground rounded-full text-sm font-semibold uppercase tracking-widest opacity-60"
              >
                Add to Cart
              </button>
              <span className="text-xs text-muted-foreground self-center">
                Preview only
              </span>
            </div>

            {product.keyFeatures?.length > 0 && (
              <div>
                <h2 className="text-2xl font-display mb-3">FEATURES</h2>
                <ul className="space-y-2">
                  {product.keyFeatures.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 mt-14">
          <section>
            <h2 className="text-3xl font-display mb-4">DESCRIPTION</h2>
            {/<[a-z][\s\S]*>/i.test(product.description || "") ? (
              <div
                className="product-rich-text text-muted-foreground space-y-3"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            ) : (
              <p className="text-muted-foreground whitespace-pre-line">
                {product.description}
              </p>
            )}
            {product.giftPackaging?.enabled && (
              <div className="mt-6 rounded-2xl border border-primary/40 bg-primary/5 px-5 py-4">
                <p className="text-xs uppercase tracking-widest text-primary mb-1">
                  Complimentary Gift Packaging
                </p>
                <p className="text-sm text-muted-foreground">
                  {product.giftPackaging.description ||
                    "Presented in a signature luxury gift box."}
                </p>
              </div>
            )}
          </section>
          <section>
            <h2 className="text-3xl font-display mb-4">SPECIFICATIONS</h2>
            <dl className="bg-card border border-border rounded-2xl divide-y divide-border">
              {[
                ["Material", product.material],
                ["Colour", product.colour],
                ["Size", product.size],
                ["Capacity", product.capacity],
                ["Weight", product.weight],
                ["SKU", product.sku],
              ]
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between gap-4 px-5 py-3 text-sm"
                  >
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium text-right">{value}</dd>
                  </div>
                ))}
            </dl>
          </section>
        </div>

        {product.relatedProducts?.length > 0 && (
          <section className="mt-16">
            <h2 className="text-3xl md:text-4xl font-display mb-8">
              YOU MAY ALSO <span className="text-gradient">LIKE</span>
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {product.relatedProducts.map((related) => (
                <ProductCard
                  key={related._id}
                  product={normalizeProduct(related)}
                />
              ))}
            </div>
          </section>
        )}
      </PageShell>
    </div>
  );
};

export default AdminProductPreviewPage;
