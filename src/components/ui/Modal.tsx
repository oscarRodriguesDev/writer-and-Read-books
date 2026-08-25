"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({ open, onClose, title, description, children, size = "md", showCloseButton = true, closeOnOverlayClick = true, closeOnEscape = true, ...props }, ref) => {
    const overlayRef = React.useRef<HTMLDivElement>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);
    const previousActiveElement = React.useRef<HTMLElement | null>(null);

    React.useEffect(() => {
      if (open) {
        previousActiveElement.current = document.activeElement as HTMLElement;
        document.body.style.overflow = "hidden";
        contentRef.current?.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === "Escape" && closeOnEscape) {
            onClose();
          }
          if (e.key === "Tab") {
            const focusableElements = contentRef.current?.querySelectorAll<HTMLElement>(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (!focusableElements?.length) return;
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            if (e.shiftKey && document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
          document.removeEventListener("keydown", handleKeyDown);
          document.body.style.overflow = "";
          previousActiveElement.current?.focus();
        };
      }
    }, [open, closeOnEscape, onClose]);

    if (!open) return null;

    const sizes = {
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
      full: "max-w-4xl",
    };

    return (
      <div className="fixed inset-0 z-modal-backdrop flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={title ? "modal-title" : undefined} aria-describedby={description ? "modal-description" : undefined}>
        <div
          ref={overlayRef}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-fast"
          onClick={closeOnOverlayClick ? onClose : undefined}
          aria-hidden="true"
        />
        <div
          ref={contentRef}
          tabIndex={-1}
          className={cn(
            "relative z-modal w-full bg-surface rounded-2xl shadow-2xl overflow-hidden transition-all duration-normal",
            sizes[size]
          )}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between gap-4 p-5 border-b border-line">
              <div>
                {title && (
                  <h2 id="modal-title" className="text-lg font-semibold text-foreground">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id="modal-description" className="mt-1 text-sm text-muted">
                    {description}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  aria-label="Fechar"
                  className="text-muted hover:text-foreground"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              )}
            </div>
          )}
          <div className="p-5">{children}</div>
        </div>
      </div>
    );
  }
);

Modal.displayName = "Modal";

export { Modal };