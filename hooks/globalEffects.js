"use client";

import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTimer } from "@/app/context/TimerContext";

export function useAppGlobalEffects() {

  const [tauriWindow, setTauriWindow] = useState(null);
  const [LogicalSize, setLogicalSize] = useState(null);
  const lastModeRef = useRef(null); // tracks "unlocked" or "locked"

  const { setTimeLeft, settings, remainingSeconds } = useTimer();

  // Reset auto shutdown timer
  useEffect(() => {
    if (remainingSeconds < 1 || remainingSeconds === null) {
      setTimeLeft(settings.timerDuration);
    }
  }, [remainingSeconds, setTimeLeft, settings.timerDuration]);

  useEffect(() => {
    (async () => {
      const { Window, LogicalSize } = await import("@tauri-apps/api/window");
      setTauriWindow(Window.getCurrent());
      setLogicalSize(() => LogicalSize); // store class in state
    })();
  }, []);

  // Blocker control effect
  useEffect(() => {
    if (!tauriWindow || !LogicalSize) return;

    const newMode = remainingSeconds > 0 ? "unlocked" : "locked";
    const modeChanged = lastModeRef.current !== newMode;
    lastModeRef.current = newMode;

    const applyMode = async () => {
      try {
        if (newMode === "unlocked") {
          // Always enforce these (lightweight, ensures correct state)
          await tauriWindow.setAlwaysOnTop(false);
          await tauriWindow.setFullscreen(false);
          await invoke("start_windowscc");
          await invoke("stop_blocker");
          // Only resize/center on mode transition (prevents flash)
          if (modeChanged) {
            await tauriWindow.setSize(new LogicalSize(380, 550));
            await tauriWindow.center();
          }
        } else {
          // Locked mode (no time)
          await invoke("stop_windowscc");
          await invoke("start_blocker");
          await tauriWindow.setAlwaysOnTop(true);
          await tauriWindow.setFullscreen(true);
        }
      } catch (error) {
        console.error("Failed to stop/start blocker:", error);
      }
    };

    applyMode();
  }, [remainingSeconds, tauriWindow, LogicalSize]);

  // Disable refresh keys & right-click
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === "F5" ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r")
      ) {
        e.preventDefault();
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);
}