import * as React from "react";
import { cn } from "@/lib/utils";

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
  fullWidth?: boolean;
}

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, description, fullWidth, id, ...props }, ref) => {
    const radioId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={cn("flex items-start gap-3", fullWidth && "w-full")}>
        <div className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-fast">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            className={cn(
              "peer h-5 w-5 appearance-none rounded-full border border-inputline bg-surface",
              "checked:border-accent",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "hover:border-muted",
              className
            )}
            {...props}
          />
          <span className={cn(
            "absolute block h-2 w-2 rounded-full bg-accent transition-all duration-fast",
            "peer-checked:opacity-100 peer-checked:scale-100",
            "opacity-0 scale-0"
          )} aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-0.5 text-sm leading-relaxed">
          {label && (
            <label htmlFor={radioId} className="font-medium text-foreground cursor-pointer select-none">
              {label}
            </label>
          )}
          {description && <p className="text-faint">{description}</p>}
        </div>
      </div>
    );
  }
);

Radio.displayName = "Radio";

export { Radio };