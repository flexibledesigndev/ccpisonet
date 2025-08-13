// hooks/useTauriFetch.js
"use client";

import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect, useRef, useCallback } from "react";

export function useTauriFetch(url, { retries = 3, retryDelay = 500, enabled = true, pollInterval = null } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(null); // ✅ null = unknown, true/false for status
  const abortRef = useRef(false);

  const fetchWithRetry = useCallback(
    async (attempt = 1) => {
      if (!url) return;
      abortRef.current = false;
      setLoading(true);
      setError(null);

      try {
        const html = await invoke("fetch_html", { url });
        setData(html);
        setConnected(true); // ✅ connection OK
        setLoading(false);
      } catch (err) {
        if (attempt < retries) {
          setTimeout(() => fetchWithRetry(attempt + 1), retryDelay * attempt);
        } else {
          setError(err);
          setConnected(false); // ❌ connection lost
          setLoading(false);
        }
      }
    },
    [url, retries, retryDelay]
  );

  useEffect(() => {
    if (!enabled || !url) return;

    fetchWithRetry();

    let intervalId;
    if (pollInterval) {
      intervalId = setInterval(() => fetchWithRetry(), pollInterval);
    }

    return () => {
      abortRef.current = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [url, enabled, fetchWithRetry, pollInterval]);

  return { data, error, loading, connected, retry: () => fetchWithRetry() };
}
