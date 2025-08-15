"use client";

import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTimer } from "@/app/context/TimerContext";



export function useAppGlobalEffects() {

    const [tauriWindow, setTauriWindow] = useState(null);
    const [LogicalSize, setLogicalSize] = useState(null);

    const { setTimeLeft, settings, connectionStatus } = useTimer();

    // Reset auto shutdown timer
    useEffect(() => {
        if (connectionStatus === "Connected") {
          setTimeLeft(settings.timerDuration);
        }
      }, [connectionStatus, setTimeLeft, settings.timerDuration]);    
    
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

    const stopBlocker = async () => {
      try {
        if (connectionStatus === "Connected") {
          await tauriWindow.setAlwaysOnTop(false);
          await tauriWindow.setFullscreen(false); 
          await invoke("start_windowscc");
          await invoke("stop_blocker");     
          await tauriWindow.setSize(new LogicalSize(380, 550));
          await tauriWindow.center();                 
        } else {
          await tauriWindow.setAlwaysOnTop(true);
          await tauriWindow.setFullscreen(true);
          await invoke("stop_windowscc");
          await invoke("start_blocker");
        }
      } catch (error) {
        console.error("Failed to stop/start blocker:", error);
      }
    };

    stopBlocker();
  }, [connectionStatus, tauriWindow, LogicalSize]);

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
