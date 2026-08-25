import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  fullWidth?: boolean;
  showCharCount?: boolean;
  maxLength?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, hint, error, fullWidth, showCharCount, maxLength, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const value = props.value ?? "";
    const length = Array.isArray(value) ? value.join("").length : String(value).length;

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        <div className="flex items-baseline justify-between gap-2">
          {label && (
            <label htmlFor={textareaId} className="text-sm font-medium text-soft">
              {label}
            </label>
          )}
          {showCharCount && maxLength && (
            <span className={cn("text-xs text-faint", length > maxLength && "text-danger")}>
              {length}/{maxLength}
            </span>
          )}
        </div>
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "w-full rounded-lg border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition-all duration-fast resize-y min-h-[100px]",
            "placeholder:text-faint",
            "hover:border-muted",
            "focus:border-accent focus:ring-2 focus:ring-accent/20",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-danger focus:border-danger focus:ring-danger/20",
            className
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
          maxLength={maxLength}
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className="text-xs text-danger" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${textareaId}-hint`} className="text-xs text-faint">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };