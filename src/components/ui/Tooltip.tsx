"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  delay?: number;
  offset?: number;
}

export function Tooltip({ content, children, side = "top", align = "center", delay = 200, offset = 8 }: TooltipProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(true), delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(false);
  };

  const childProps = {
    onMouseEnter: showTooltip,
    onMouseLeave: hideTooltip,
    onFocus: showTooltip,
    onBlur: hideTooltip,
  };

  const clonedChild = React.cloneElement(children, childProps);

  if (!isOpen) return clonedChild;

  const sideStyles = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const alignStyles = {
    start: { top: "left-0 -translate-x-0", bottom: "left-0 -translate-x-0", left: "top-0 -translate-y-0", right: "top-0 -translate-y-0" },
    center: { top: "left-1/2 -translate-x-1/2", bottom: "left-1/2 -translate-x-1/2", left: "top-1/2 -translate-y-1/2", right: "top-1/2 -translate-y-1/2" },
    end: { top: "right-0 -translate-x-0", bottom: "right-0 -translate-x-0", left: "bottom-0 -translate-y-0", right: "bottom-0 -translate-y-0" },
  };

  return (
    <>
      {clonedChild}
      <div
        className={cn(
          "fixed z-tooltip px-2.5 py-1.5 text-xs font-medium text-onaccent bg-accent rounded-lg shadow-lg",
          "animate-in fade-in-0 zoom-in-95 duration-fast",
          sideStyles[side],
          alignStyles[align][side]
        )}
        role="tooltip"
      >
        {content}
        <div className={cn(
          "absolute h-2 w-2 rotate-45 bg-accent",
          side === "top" && "top-full left-1/2 -translate-x-1/2 -translate-y-1/2",
          side === "bottom" && "bottom-full left-1/2 -translate-x-1/2 translate-y-1/2",
          side === "left" && "left-full top-1/2 -translate-y-1/2 -translate-x-1/2",
          side === "right" && "right-full top-1/2 -translate-y-1/2 translate-x-1/2"
        )} aria-hidden="true" />
      </div>
    </>
  );
}

export interface PopoverProps {
  content: React.ReactNode;
  children: React.ReactElement<Record<string, unknown>>;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  offset?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Popover({ content, children, side = "bottom", align = "start", offset = 8, open: controlledOpen, onOpenChange }: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? onOpenChange : setUncontrolledOpen;
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen?.(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, setOpen]);

  const handleTriggerClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setOpen?.(!open);
    const childProps = children.props as React.HTMLAttributes<HTMLElement> & { onClick?: (e: React.MouseEvent<HTMLElement>) => void };
    childProps.onClick?.(e);
  };

  const clonedChild = React.cloneElement(children, {
    ref: triggerRef,
    onClick: handleTriggerClick,
    "aria-expanded": open,
    "aria-haspopup": "dialog",
  });

  if (!open || !triggerRef.current) return clonedChild;

  const sideStyles = {
    top: "bottom-full left-0 mb-2",
    bottom: "top-full left-0 mt-2",
    left: "right-full top-0 mr-2",
    right: "left-full top-0 ml-2",
  };

  const alignStyles = {
    start: { top: "left-0", bottom: "left-0", left: "top-0", right: "top-0" },
    center: { top: "left-1/2 -translate-x-1/2", bottom: "left-1/2 -translate-x-1/2", left: "top-1/2 -translate-y-1/2", right: "top-1/2 -translate-y-1/2" },
    end: { top: "right-0", bottom: "right-0", left: "bottom-0", right: "bottom-0" },
  };

  return (
    <>
      {clonedChild}
      <div
        ref={popoverRef}
        className={cn(
          "fixed z-popover w-64 bg-surface rounded-xl border border-line shadow-2xl p-2",
          "animate-in fade-in-0 zoom-in-95 duration-fast",
          sideStyles[side],
          alignStyles[align][side]
        )}
        role="dialog"
      >
        {content}
      </div>
    </>
  );
}