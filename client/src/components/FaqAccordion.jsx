import { ChevronDown } from "lucide-react";

const FaqAccordion = ({ faqs = [], className = "" }) => {
  if (!faqs.length) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {faqs.map(({ question, answer }) => (
        <details
          key={question}
          className="group bg-card border border-border rounded-xl px-5 py-4 open:border-primary/40"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
            {question}
            <ChevronDown className="w-4 h-4 shrink-0 text-primary transition-transform group-open:rotate-180" />
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {answer}
          </p>
        </details>
      ))}
    </div>
  );
};

export default FaqAccordion;
