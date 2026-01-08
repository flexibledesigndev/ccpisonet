"use client";

import { useEffect, useRef, useState } from "react";
import CoinTopUp from "@/components/CoinTopUp";

export default function WarningPage() {
  const [tauriWindow, setTauriWindow] = useState(null);
  const [LogicalSize, setLogicalSize] = useState(null);
  const [PhysicalPosition, setPhysicalPosition] = useState(null);
  const [currentMonitorFn, setCurrentMonitorFn] = useState(null);
  const [primaryMonitorFn, setPrimaryMonitorFn] = useState(null);

  const movedToBottomRightRef = useRef(false);

  // Load tauri window api
  useEffect(() => {
    (async () => {
      const winApi = await import("@tauri-apps/api/window");
      setTauriWindow(winApi.Window.getCurrent());
      setLogicalSize(() => winApi.LogicalSize);
      setPhysicalPosition(() => winApi.PhysicalPosition);
      setCurrentMonitorFn(() => winApi.currentMonitor);
      setPrimaryMonitorFn(() => winApi.primaryMonitor);
    })();
  }, []);

  // Setup warning window (size + bottom-right + always on top) once
  useEffect(() => {
    if (
      !tauriWindow ||
      !LogicalSize ||
      !PhysicalPosition ||
      !currentMonitorFn ||
      !primaryMonitorFn
    )
      return;

    const run = async () => {
      try {
        await tauriWindow.setSize(new LogicalSize(200, 90));

        if (movedToBottomRightRef.current) return;
        movedToBottomRightRef.current = true;

        await tauriWindow.setAlwaysOnTop(true);

        const monitor = (await currentMonitorFn()) ?? (await primaryMonitorFn());
        if (!monitor) return;

        const margin = 12;

        // Prefer workArea so it doesn't go behind taskbar
        const areaPos = monitor.workArea?.position ?? monitor.position;
        const areaSize = monitor.workArea?.size ?? monitor.size;

        const winSize = await tauriWindow.outerSize(); // PhysicalSize

        const x = areaPos.x + areaSize.width - winSize.width - margin;
        const y = areaPos.y + areaSize.height - winSize.height - margin;

        await tauriWindow.setPosition(
          new PhysicalPosition(Math.max(areaPos.x, x), Math.max(areaPos.y, y))
        );
      } catch (e) {
        console.error("Warning window setup failed:", e);
      }
    };

    run();
  }, [tauriWindow, LogicalSize, PhysicalPosition, currentMonitorFn, primaryMonitorFn]);

  // After 10s: stop on-top → minimize → hard reload to "/"
  useEffect(() => {
    if (!tauriWindow) return;

    const t = setTimeout(() => {
      (async () => {
        try {
          await tauriWindow.setAlwaysOnTop(false);
          await tauriWindow.minimize();

          // small delay so minimize happens first
          setTimeout(() => window.location.replace("/"), 150);
        } catch (e) {
          console.error(e);
          window.location.replace("/");
        }
      })();
    }, 10_000);

    return () => clearTimeout(t);
  }, [tauriWindow]);

  const goHomeHard = async () => {
    try {
      await tauriWindow?.setAlwaysOnTop(false);
    } catch {}
    window.location.replace("/");
  };

  return (
    <main
      onClick={goHomeHard}
      className="flex flex-col min-h-screen items-center bg-black text-center justify-center animate-pulse pt-1 *:text-red-500 cursor-pointer select-none"
      title="Click to return to Home"
    >
      <CoinTopUp timeHeading="Warning Remaining Time:" />
    </main>
  );
}
