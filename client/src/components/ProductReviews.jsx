import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { productService, reviewService } from "@/services";
import { getErrorMessage } from "@/services/api";
import FormField from "@/components/FormField";
import RatingStars from "@/components/RatingStars";

const EMPTY_REVIEW = { rating: 0, title: "", comment: "" };

const ReviewForm = ({ product, onSubmitted }) => {
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
      <h3 className="text-2xl font-display">WRITE A REVIEW</h3>
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={form.rating === value}
            aria-label={`${value} star${value > 1 ? "s" : ""}`}
            onClick={() => setForm((prev) => ({ ...prev, rating: value }))}
          >
            <Star
              className={`w-7 h-7 transition-colors ${
                value <= form.rating ? "fill-primary text-primary" : "fill-muted text-muted"
              }`}
            />
          </button>
        ))}
      </div>
      <FormField
        label="Title"
        value={form.title}
        onChange={setField("title")}
        maxLength={100}
        placeholder="Sum it up"
      />
      <FormField
        as="textarea"
        rows={4}
        label="Your review"
        value={form.comment}
        onChange={setField("comment")}
        maxLength={1000}
        placeholder="What did you like or dislike?"
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="gradient-neon text-primary-foreground px-8 py-3 font-semibold uppercase tracking-wide rounded-full neon-glow disabled:opacity-60"
      >
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
};

/** Review list for a product plus a write-a-review form for signed-in customers. */
const ProductReviews = ({ product }) => {
  const { isLoggedIn, openLoginModal } = useAuth();
  const queryClient = useQueryClient();
  const reviewsKey = ["product-reviews", product._id];
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: reviewsKey,
    queryFn: () => productService.reviews(product._id),
  });

  const refreshAfterReview = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: reviewsKey }),
      queryClient.invalidateQueries({ queryKey: ["product", product.slug] }),
      queryClient.invalidateQueries({ queryKey: ["products"] }),
    ]);

  return (
    <section className="mt-16">
      <h2 className="text-3xl md:text-4xl font-display mb-8">
        CUSTOMER <span className="text-gradient">REVIEWS</span>
      </h2>
      <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
        <div className="space-y-4">
          {isLoading && <p className="text-muted-foreground">Loading reviews...</p>}
          {!isLoading && reviews.length === 0 && (
            <p className="text-muted-foreground bg-card border border-border rounded-2xl p-6">
              No reviews yet. Be the first to share your thoughts.
            </p>
          )}
          {reviews.map((review) => (
            <article key={review._id} className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between gap-3 mb-2">
                <RatingStars value={review.rating} />
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
            <p className="text-muted-foreground mb-4">Sign in to write a review.</p>
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
