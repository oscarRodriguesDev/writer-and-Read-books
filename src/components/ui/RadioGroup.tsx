"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
  fullWidth?: boolean;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
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

export interface RadioGroupProps extends Omit<React.FieldsetHTMLAttributes<HTMLFieldSetElement>, "onChange"> {
  label: string;
  description?: string;
  options: Array<{ value: string; label: string; description?: string; disabled?: boolean }>;
  value?: string;
  onChange?: (value: string) => void;
  orientation?: "vertical" | "horizontal";
  fullWidth?: boolean;
  error?: string;
  required?: boolean;
}

export const RadioGroup = React.forwardRef<HTMLFieldSetElement, RadioGroupProps>(
  ({ className, label, description, options, value, onChange, orientation = "vertical", fullWidth, error, required, ...props }, ref) => {
    return (
      <fieldset ref={ref} className={cn("flex flex-col gap-2", fullWidth && "w-full", className)} {...props}>
        <legend className="text-sm font-medium text-soft">{label}{required && <span className="text-danger ml-1" aria-hidden="true">*</span>}</legend>
        {description && <p className="text-xs text-faint">{description}</p>}
        <div className={cn("flex gap-4", orientation === "horizontal" && "flex-wrap")} role="radiogroup" aria-label={label}>
          {options.map((option) => (
            <Radio
              key={option.value}
              name={label.toLowerCase().replace(/\s+/g, "-")}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange?.(e.target.value)}
              disabled={option.disabled}
              label={option.label}
              description={option.description}
            />
          ))}
        </div>
        {error && <p className="text-xs text-danger" role="alert">{error}</p>}
      </fieldset>
    );
  }
);

RadioGroup.displayName = "RadioGroup";