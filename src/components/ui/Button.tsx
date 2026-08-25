import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline" | "link";
  size?: "xs" | "sm" | "md" | "lg" | "icon";
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, fullWidth, disabled, children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
      primary: "bg-accent text-onaccent hover:bg-accent-hover shadow-sm hover:shadow-md active:scale-[0.98]",
      secondary: "bg-surface border border-inputline text-foreground hover:bg-hoverbg hover:border-soft active:bg-hoverbg",
      ghost: "text-soft hover:bg-hoverbg hover:text-foreground active:bg-hoverbg",
      danger: "bg-danger text-white hover:bg-danger-hover shadow-sm hover:shadow-md active:scale-[0.98]",
      outline: "border border-inputline bg-transparent text-foreground hover:bg-hoverbg hover:border-soft",
      link: "text-accent underline-offset-2 hover:underline",
    };

    const sizes = {
      xs: "h-7 px-2.5 text-xs gap-1",
      sm: "h-8 px-3 text-sm gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2",
      icon: "h-10 w-10",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], fullWidth && "w-full", className)}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };