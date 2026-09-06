"use client";

import { ReactNode } from "react";
import { SidebarProvider, useSidebar } from "./SidebarContext";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

function LayoutContent({ children, obraId, obraTitulo }: { children: ReactNode; obraId?: string; obraTitulo?: string }) {
  const { isCollapsed, isMobileOpen, setMobileOpen } = useSidebar();
  useKeyboardShortcuts();

  return (
    <div className="min-h-screen flex">
      <Sidebar obraId={obraId} />
      <TopBar obraId={obraId} obraTitulo={obraTitulo} />
      <main
        id="main-content"
        className={`flex-1 min-w-0 transition-all duration-300 ${
          isCollapsed ? "lg:pl-16" : "lg:pl-64"
        }`}
        role="main"
        tabIndex={-1}
      >
        <div className="w-full pt-16">{children}</div>
      </main>
      {isMobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Fechar menu"
        />
      )}
    </div>
  );
}

interface LayoutProps {
  children: ReactNode;
  obraId?: string;
  obraTitulo?: string;
}

export default function Layout({ children, obraId, obraTitulo }: LayoutProps) {
  return (
    <SidebarProvider>
      <LayoutContent children={children} obraId={obraId} obraTitulo={obraTitulo} />
    </SidebarProvider>
  );
}
