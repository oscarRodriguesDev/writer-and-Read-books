import * as React from "react";
import { cn } from "@/lib/utils";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <label ref={ref} className={cn("text-sm font-medium text-soft", className)} {...props}>
      {children}
      {required && <span className="text-danger ml-1" aria-hidden="true">*</span>}
    </label>
  )
);

Label.displayName = "Label";

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
}

export function FormField({ className, label, hint, error, required, htmlFor, children, ...props }: FormFieldProps) {
  const fieldId = htmlFor || label?.toLowerCase().replace(/\s+/g, "-");
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)} {...props}>
      {label && (
        <Label htmlFor={fieldId} required={required}>
          {label}
        </Label>
      )}
      <div>
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return child;
          const childProps = child.props as Record<string, unknown>;
          return React.cloneElement(child as React.ReactElement<any>, {
            id: (childProps.id as string) || fieldId,
            "aria-describedby": [hintId, errorId].filter(Boolean).join(" ") || undefined,
            "aria-invalid": error ? "true" : "false",
          });
        })}
      </div>
      {error && <p id={errorId!} className="text-xs text-danger" role="alert">{error}</p>}
      {hint && !error && <p id={hintId!} className="text-xs text-faint">{hint}</p>}
    </div>
  );
}

export interface FormSectionProps extends React.HTMLAttributes<HTMLFieldSetElement> {
  title?: string;
  description?: string;
}

export function FormSection({ className, title, description, children, ...props }: FormSectionProps) {
  return (
    <fieldset className={cn("border border-line rounded-xl p-5", className)} {...props}>
      {(title || description) && (
        <legend className="mb-4">
          {title && <h3 className="text-lg font-semibold text-foreground">{title}</h3>}
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </legend>
      )}
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}

export interface FormRowProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | 4;
}

export function FormRow({ className, columns = 2, children, ...props }: FormRowProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)} {...props}>
      {children}
    </div>
  );
}

export interface FormActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end" | "between";
}

export function FormActions({ className, align = "end", children, ...props }: FormActionsProps) {
  const alignClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-3 pt-4 mt-4 border-t border-line", alignClasses[align], className)} {...props}>
      {children}
    </div>
  );
}

export interface InputAdornmentProps extends React.HTMLAttributes<HTMLSpanElement> {
  position?: "start" | "end";
}

export const InputAdornment = React.forwardRef<HTMLSpanElement, InputAdornmentProps>(
  ({ className, position = "end", children, ...props }, ref) => (
    <span ref={ref} className={cn("flex items-center text-faint", position === "start" ? "mr-2" : "ml-2", className)} {...props}>
      {children}
    </span>
  )
);

InputAdornment.displayName = "InputAdornment";