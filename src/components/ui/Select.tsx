import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  fullWidth?: boolean;
  options: SelectOption[];
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, hint, error, fullWidth, options, placeholder, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-soft">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "w-full appearance-none rounded-lg border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition-all duration-fast",
              "hover:border-muted",
              "focus:border-accent focus:ring-2 focus:ring-accent/20",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "pr-10",
              error && "border-danger focus:border-danger focus:ring-danger/20",
              className
            )}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-faint">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && (
          <p id={`${selectId}-error`} className="text-xs text-danger" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${selectId}-hint`} className="text-xs text-faint">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };