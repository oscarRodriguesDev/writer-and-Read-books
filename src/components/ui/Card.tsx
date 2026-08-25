import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "elevated" | "outlined" | "interactive";
  padding?: "none" | "sm" | "md" | "lg";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "elevated", padding = "md", children, ...props }, ref) => {
    const variants = {
      elevated: "bg-surface shadow-md border border-line/50",
      outlined: "bg-surface border border-line shadow-sm",
      interactive: "bg-surface border border-line shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-normal cursor-pointer",
    };

    const paddings = {
      none: "",
      sm: "p-4",
      md: "p-5",
      lg: "p-6",
    };

    return (
      <div
        ref={ref}
        className={cn("rounded-xl", variants[variant], paddings[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("mb-4 flex flex-col gap-1", className)} {...props}>
      {children}
    </div>
  )
);

CardHeader.displayName = "CardHeader";

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = "h3", children, ...props }, ref) => (
    <Component ref={ref} className={cn("text-lg font-semibold text-foreground", className)} {...props}>
      {children}
    </Component>
  )
);

CardTitle.displayName = "CardTitle";

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted", className)} {...props}>
      {children}
    </p>
  )
);

CardDescription.displayName = "CardDescription";

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn(className)} {...props}>
      {children}
    </div>
  )
);

CardContent.displayName = "CardContent";

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("mt-4 flex items-center gap-2", className)} {...props}>
      {children}
    </div>
  )
);

CardFooter.displayName = "CardFooter";

export { Card };