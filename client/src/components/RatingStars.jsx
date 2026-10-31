import { Star } from "lucide-react";

const RatingStars = ({ value, size = "w-4 h-4" }) => (
  <div className="flex items-center gap-0.5" aria-label={`${Number(value).toFixed(1)} out of 5`}>
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`${size} ${i < Math.round(value) ? "fill-primary text-primary" : "fill-muted text-muted"}`}
      />
    ))}
  </div>
);

export default RatingStars;
