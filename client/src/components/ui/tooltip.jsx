import { Tooltip as RadixTooltip, TooltipContent as RadixContent, TooltipTrigger } from "@radix-ui/react-tooltip";

/** Small brand-styled hover tooltip; content is also announced on focus for accessibility. */
const Tooltip = ({ content, children, side = "bottom" }) =>
  !content ? (
    children
  ) : (
    <RadixTooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <RadixContent
        side={side}
        sideOffset={8}
        className="z-[110] px-3 py-1.5 rounded-lg border border-border bg-popover text-popover-foreground text-xs font-medium shadow-lg data-[state=delayed-open]:animate-fade-in"
      >
        {content}
      </RadixContent>
    </RadixTooltip>
  );

export default Tooltip;
