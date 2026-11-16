import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { productService, reviewService } from "@/services";
import { getErrorMessage } from "@/services/api";
import FormField from "@/components/FormField";
import RatingStars from "@/components/RatingStars";

const EMPTY_REVIEW = { rating: 0, title: "", comment: "", images: [] };
const MAX_PHOTOS = 5;

const StarPicker = ({ value, onChange }) => (
  <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
    {[1, 2, 3, 4, 5].map((rating) => (
      <button
        key={rating}
        type="button"
        role="radio"
        aria-checked={value === rating}
        aria-label={`${rating} star${rating > 1 ? "s" : ""}`}
        onClick={() => onChange(rating)}
      >
        <Star
          className={`w-7 h-7 transition-colors ${
            rating <= value ? "fill-primary text-primary" : "fill-muted text-muted"
          }`}
        />
      </button>
    ))}
  </div>
);

const PhotoPicker = ({ images, onChange }) => {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    const remaining = MAX_PHOTOS - images.length;
    if (remaining <= 0) return toast.error(`You can add up to ${MAX_PHOTOS} photos`);
    setIsUploading(true);
    try {
      const urls = await reviewService.uploadImages(files.slice(0, remaining));
      onChange([...images, ...urls]);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <span className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
        {t("reviews.photos")} ({images.length}/{MAX_PHOTOS})
      </span>
      <div className="flex flex-wrap gap-2">
        {images.map((url) => (
          <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(images.filter((item) => item !== url))}
              aria-label="Remove photo"
              className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-background/90 text-destructive"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {images.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="w-16 h-16 rounded-lg border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ImagePlus className="w-5 h-5" />
            )}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={handleFiles}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{t("reviews.addPhotos")}</p>
    </div>
  );
};

const ReviewForm = ({ product, onSubmitted }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY_REVIEW);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.rating) return toast.error("Please select a star rating");
    if (!form.title.trim() || !form.comment.trim())
      return toast.error("Please add a title and a comment");
    setIsSubmitting(true);
    try {
      await reviewService.create({ productId: product._id, ...form });
      toast.success("Thanks for your review!");
      setForm(EMPTY_REVIEW);
      await onSubmitted();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-border rounded-2xl p-6 space-y-4"
    >
      <h3 className="text-2xl font-display uppercase">{t("reviews.writeReview")}</h3>
      <StarPicker value={form.rating} onChange={(rating) => setForm((prev) => ({ ...prev, rating }))} />
      <FormField
        label={t("reviews.reviewTitle")}
        value={form.title}
        onChange={setField("title")}
        maxLength={100}
        placeholder="Sum it up"
      />
      <FormField
        as="textarea"
        rows={4}
        label={t("reviews.yourReview")}
        value={form.comment}
        onChange={setField("comment")}
        maxLength={1000}
        placeholder="What did you like or dislike?"
      />
      <PhotoPicker
        images={form.images}
        onChange={(images) => setForm((prev) => ({ ...prev, images }))}
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="gradient-neon text-primary-foreground px-8 py-3 font-semibold uppercase tracking-wide rounded-full neon-glow disabled:opacity-60"
      >
        {isSubmitting ? t("common.loading") : t("reviews.submit")}
      </button>
    </form>
  );
};

const Distribution = ({ summary }) => {
  const { t } = useTranslation();
  if (!summary?.total) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6">
        <div className="text-center">
          <p className="text-5xl font-display">{Number(summary.average).toFixed(1)}</p>
          <RatingStars value={summary.average} />
          <p className="text-xs text-muted-foreground mt-1">
            {t("reviews.totalReviews", { count: summary.total })}
          </p>
        </div>
        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = summary.distribution?.[rating] ?? 0;
            const percent = summary.total ? Math.round((count / summary.total) * 100) : 0;
            return (
              <div key={rating} className="flex items-center gap-2 text-xs">
                <span className="w-8 text-muted-foreground">{rating} ★</span>
                <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="w-8 text-right text-muted-foreground">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/** Review list for a product plus a write-a-review form for signed-in customers. */
const ProductReviews = ({ product }) => {
  const { t } = useTranslation();
  const { isLoggedIn, openLoginModal } = useAuth();
  const queryClient = useQueryClient();
  const [sort, setSort] = useState("recent");
  const reviewsKey = ["product-reviews", product._id, sort];
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: reviewsKey,
    queryFn: () => productService.reviews(product._id, { sort, limit: 50 }),
  });
  const { data: summary } = useQuery({
    queryKey: ["product-reviews-summary", product._id],
    queryFn: () => productService.reviewsSummary(product._id),
  });

  const refreshAfterReview = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["product-reviews", product._id] }),
      queryClient.invalidateQueries({ queryKey: ["product-reviews-summary", product._id] }),
      queryClient.invalidateQueries({ queryKey: ["product", product.slug] }),
      queryClient.invalidateQueries({ queryKey: ["products"] }),
    ]);

  return (
    <section className="mt-16">
      <h2 className="text-3xl md:text-4xl font-display mb-8">
        CUSTOMER <span className="text-gradient">REVIEWS</span>
      </h2>
      <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
        <div className="space-y-5">
          {summary?.total > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <Distribution summary={summary} />
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {summary?.total
                ? t("reviews.averageRating", { rating: Number(summary.average).toFixed(1) })
                : t("reviews.noReviews")}
            </p>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              {t("reviews.sort")}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-lg border border-border bg-secondary px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
              >
                <option value="recent">{t("reviews.mostRecent")}</option>
                <option value="highest">{t("reviews.highestRating")}</option>
                <option value="lowest">{t("reviews.lowestRating")}</option>
              </select>
            </label>
          </div>

          {isLoading && <p className="text-muted-foreground">Loading reviews...</p>}
          {!isLoading && reviews.length === 0 && (
            <p className="text-muted-foreground bg-card border border-border rounded-2xl p-6">
              {t("reviews.noReviews")}
            </p>
          )}
          {reviews.map((review) => (
            <article key={review._id} className="bg-card border border-border rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <RatingStars value={review.rating} />
                  {review.verifiedPurchase && (
                    <span className="text-[10px] uppercase tracking-widest bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                      {t("reviews.verifiedPurchase")}
                    </span>
                  )}
                </div>
                <time className="text-xs text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </time>
              </div>
              <h3 className="font-medium mb-1">{review.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{review.comment}</p>
              {review.images?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {review.images.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-20 h-20 rounded-lg overflow-hidden border border-border block"
                    >
                      <img src={url} alt="Customer review" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              )}
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {review.user?.name}
              </p>
            </article>
          ))}
        </div>

        {isLoggedIn ? (
          <ReviewForm product={product} onSubmitted={refreshAfterReview} />
        ) : (
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <p className="text-muted-foreground mb-4">{t("reviews.signInToReview")}</p>
            <button
              onClick={openLoginModal}
              className="gradient-neon text-primary-foreground px-8 py-3 font-semibold uppercase tracking-wide rounded-full neon-glow"
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductReviews;
