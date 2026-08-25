import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "danger" | "info" | "outline";
  size?: "xs" | "sm" | "md" | "lg";
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size = "md", dot, removable, onRemove, children, ...props }, ref) => {
    const variants = {
      default: "bg-chipbg text-soft border border-line",
      primary: "bg-accent-light text-accent-dark border border-accent/30 dark:bg-accent-dark/20 dark:text-accent dark:border-accent/30",
      secondary: "bg-surface text-soft border border-inputline",
      success: "bg-success-light text-success border border-success/30 dark:bg-success-light/20 dark:text-success dark:border-success/30",
      warning: "bg-warning-light text-warning border border-warning/30 dark:bg-warning-light/20 dark:text-warning dark:border-warning/30",
      danger: "bg-danger-light text-danger border border-danger/30 dark:bg-danger-light/20 dark:text-danger dark:border-danger/30",
      info: "bg-info-light text-info border border-info/30 dark:bg-info-light/20 dark:text-info dark:border-info/30",
      outline: "bg-transparent text-soft border border-inputline",
    };

    const sizes = {
      xs: "px-1.5 py-0.5 text-xs gap-0.5",
      sm: "px-2 py-0.5 text-xs gap-0.5",
      md: "px-2.5 py-1 text-sm gap-1",
      lg: "px-3 py-1 text-sm gap-1.5",
    };

    const dotColors = {
      default: "bg-faint",
      primary: "bg-accent",
      secondary: "bg-muted",
      success: "bg-success",
      warning: "bg-warning",
      danger: "bg-danger",
      info: "bg-info",
      outline: "bg-muted",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center font-medium rounded-full border transition-colors duration-fast",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {dot && <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", dotColors[variant])} aria-hidden="true" />}
        {children}
        {removable && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className={cn(
              "ml-1 flex h-full items-center justify-center rounded-full p-0.5 transition-colors",
              "hover:bg-black/10 dark:hover:bg-white/10",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            )}
            aria-label="Remover"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge };