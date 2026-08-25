"use client";

import { useEffect } from "react";
import { useSidebar } from "./SidebarContext";

export function useKeyboardShortcuts() {
  const { toggleCollapsed } = useSidebar();

  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      const isMeta = event.metaKey || event.ctrlKey;

      if (isMeta && event.key === "b") {
        event.preventDefault();
        toggleCollapsed();
      }

      if (isMeta && event.key === "k") {
        event.preventDefault();
        console.log("Command palette triggered (placeholder)");
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggleCollapsed]);
}