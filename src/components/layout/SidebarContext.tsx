"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type SidebarState = {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggleCollapsed: () => void;
  setMobileOpen: (open: boolean) => void;
};

const SidebarContext = createContext<SidebarState | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("sidebar:collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("sidebar:collapsed", String(isCollapsed));
    }
  }, [isCollapsed, mounted]);

  const toggleCollapsed = () => setIsCollapsed((prev) => !prev);

  return (
    <SidebarContext.Provider
      value={{ isCollapsed, isMobileOpen, toggleCollapsed, setMobileOpen: setIsMobileOpen }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}