import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, fullWidth, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-soft">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-lg border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition-all duration-fast",
            "placeholder:text-faint",
            "hover:border-muted",
            "focus:border-accent focus:ring-2 focus:ring-accent/20",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-danger focus:border-danger focus:ring-danger/20",
            className
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-danger" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-faint">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };