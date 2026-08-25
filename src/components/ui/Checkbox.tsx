import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
  fullWidth?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, fullWidth, id, ...props }, ref) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={cn("flex items-start gap-3", fullWidth && "w-full")}>
        <div className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-fast">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={cn(
              "peer h-5 w-5 appearance-none rounded-md border border-inputline bg-surface",
              "checked:bg-accent checked:border-accent checked:text-onaccent",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "hover:border-muted",
              className
            )}
            {...props}
          />
          <svg
            className={cn(
              "absolute h-4 w-4 text-onaccent transition-all duration-fast",
              "peer-checked:opacity-100 peer-checked:scale-100",
              "opacity-0 scale-50"
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="flex flex-col gap-0.5 text-sm leading-relaxed">
          {label && (
            <label htmlFor={checkboxId} className="font-medium text-foreground cursor-pointer select-none">
              {label}
            </label>
          )}
          {description && <p className="text-faint">{description}</p>}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };