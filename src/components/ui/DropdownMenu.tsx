"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export type DropdownMenuItem =
  | { type: "item"; label: string; value?: string; icon?: React.ReactNode; disabled?: boolean; danger?: boolean; shortcut?: string; dividerAfter?: boolean }
  | { type: "divider" }
  | { type: "label"; label: string };

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
  align?: "start" | "end";
  side?: "bottom" | "top" | "left" | "right";
  offset?: number;
}

function DropdownMenuContent({ items, onClose }: { items: DropdownMenuItem[]; onClose: () => void }) {
  return (
    <div className="py-1" role="menu">
      {items.map((item, index) => {
        if (item.type === "divider") {
          return <div key={index} className="h-px bg-line my-1" role="separator" />;
        }
        if (item.type === "label") {
          return <div key={index} className="px-3 py-1.5 text-xs font-medium text-faint uppercase tracking-wider" role="none">{item.label}</div>;
        }
        return (
          <button
            key={index}
            type="button"
            role="menuitem"
            tabIndex={-1}
            disabled={item.disabled}
            onClick={() => {
              onClose();
            }}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground transition-colors duration-fast",
              "hover:bg-hoverbg focus-visible:outline-none focus-visible:bg-hoverbg",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              item.danger && "text-danger hover:bg-danger/10",
              item.dividerAfter && "border-b border-line"
            )}
          >
            {item.icon && <span className="flex h-4 w-4 shrink-0" aria-hidden="true">{item.icon}</span>}
            <span className="flex-1 text-left">{item.label}</span>
            {item.shortcut && <span className="text-xs text-faint font-mono">{item.shortcut}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function DropdownMenu({ trigger, items, align = "start", side = "bottom", offset = 4 }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    const focusableItems = menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)');
    if (!focusableItems?.length) return;

    const currentIndex = Array.from(focusableItems).findIndex((item) => item === document.activeElement);

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % focusableItems.length;
        focusableItems[nextIndex].focus();
        break;
      case "ArrowUp":
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + focusableItems.length) % focusableItems.length;
        focusableItems[prevIndex].focus();
        break;
      case "Escape":
      case "Tab":
        setOpen(false);
        triggerRef.current?.focus();
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        (document.activeElement as HTMLButtonElement)?.click();
        break;
    }
  };

  const sideStyles = {
    bottom: "top-full mt-1.5",
    top: "bottom-full mb-1.5",
    left: "right-full mr-1.5",
    right: "left-full ml-1.5",
  };

  const alignStyles = {
    start: "left-0",
    end: "right-0",
  };

  return (
    <div className="relative inline-block" onKeyDown={handleKeyDown}>
      <Button
        ref={triggerRef}
        variant="ghost"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="gap-1.5"
      >
        {trigger}
        <svg className={cn("h-4 w-4 transition-transform duration-fast", open && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {open && (
        <div
          ref={menuRef}
          className={cn(
            "fixed z-dropdown min-w-[180px] bg-surface rounded-lg border border-line shadow-xl overflow-hidden",
            "animate-in fade-in-0 zoom-in-95 duration-fast",
            sideStyles[side],
            alignStyles[align]
          )}
          role="menu"
        >
          <DropdownMenuContent items={items} onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

export interface DropdownMenuCheckboxItem {
  type: "checkbox";
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export interface DropdownMenuRadioItem {
  type: "radio";
  label: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function DropdownMenuWithControls({ trigger, items, align = "start", side = "bottom" }: DropdownMenuProps & {
  checkboxItems?: DropdownMenuCheckboxItem[];
  radioItems?: DropdownMenuRadioItem[];
}) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div className="relative inline-block">
      <Button
        ref={triggerRef}
        variant="ghost"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="gap-1.5"
      >
        {trigger}
        <svg className={cn("h-4 w-4 transition-transform duration-fast", open && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {open && (
        <div
          ref={menuRef}
          className={cn(
            "fixed z-dropdown min-w-[200px] bg-surface rounded-lg border border-line shadow-xl overflow-hidden",
            "animate-in fade-in-0 zoom-in-95 duration-fast",
            side === "bottom" && "top-full mt-1.5",
            side === "top" && "bottom-full mb-1.5",
            align === "start" && "left-0",
            align === "end" && "right-0"
          )}
          role="menu"
        >
          <div className="py-1">
            {items.map((item, index) => {
              if (item.type === "divider") {
                return <div key={index} className="h-px bg-line my-1" role="separator" />;
              }
              if (item.type === "label") {
                return <div key={index} className="px-3 py-1.5 text-xs font-medium text-faint uppercase tracking-wider" role="none">{item.label}</div>;
              }
              return (
                <button
                  key={index}
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  disabled={item.disabled}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground",
                    "hover:bg-hoverbg focus-visible:outline-none focus-visible:bg-hoverbg",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    item.danger && "text-danger hover:bg-danger/10"
                  )}
                >
                  {item.icon && <span className="flex h-4 w-4 shrink-0" aria-hidden="true">{item.icon}</span>}
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.shortcut && <span className="text-xs text-faint font-mono">{item.shortcut}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}