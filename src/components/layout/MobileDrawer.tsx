"use client";

import { ReactNode } from "react";
import { useSidebar } from "./SidebarContext";

interface MobileDrawerProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ children, isOpen, onClose }: MobileDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        id="mobile-drawer"
        className="fixed inset-y-0 left-0 z-50 w-72 fundo-papel border-r border-line shadow-xl transform transition-transform duration-300 ease-in-out translate-x-0"
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between px-4 border-b border-line">
            <span className="font-bold text-lg">Menu</span>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-hoverbg transition-colors"
              aria-label="Fechar menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4">{children}</div>
        </div>
      </aside>
    </>
  );
}