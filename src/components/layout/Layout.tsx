"use client";

import { ReactNode, useEffect, useState } from "react";
import { SidebarProvider, useSidebar } from "./SidebarContext";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

function LayoutContent({ children, obraId, obraTitulo }: { children: ReactNode; obraId?: string; obraTitulo?: string }) {
  const { isCollapsed, isMobileOpen, setMobileOpen } = useSidebar();
  const [mounted, setMounted] = useState(false);

  useKeyboardShortcuts();

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed top-0 left-0 right-0 h-16 border-b border-line bg-surface/80 backdrop-blur-sm" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
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
        <div className="w-full">{children}</div>
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