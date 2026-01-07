"use client"

import { useEffect, useState } from "react"
import { useTimer } from "@/app/context/TimerContext"
import { useTauriFetch } from "@/hooks/useTauriFetch"
import { Button } from "./ui/button"

export default function CoinTopUp() {
  const {
    formatTime,
    remainingSeconds,
    setRemainingSeconds,
    setResetTimer,
    statusUrl,
    gatewayLoading,
    gatewayError,
    refreshGateway,
  } = useTimer()

  const [fetchPerSec, setFetchPerSec] = useState(null)

  // Fetch status page only when statusUrl is available
  const { data: html, error, connected, retry } = useTauriFetch(statusUrl, {
    retries: 3,
    retryDelay: 500,
    pollInterval: 5000,
    enabled: !!statusUrl,
  })

  // Parse session time
  useEffect(() => {
    if (connected === true && html) {
      const timeMatch = html.match(/var\s+sessiontime\s*=\s*"(\d+)"/i)
      const parsedTime = timeMatch ? parseInt(timeMatch[1], 10) : null

      if (parsedTime !== null && Number.isFinite(parsedTime)) {
        setRemainingSeconds(parsedTime)
        setFetchPerSec(parsedTime)
        setResetTimer(true)
      } else {
        setResetTimer(false)
        setRemainingSeconds(null)
        setFetchPerSec(null)
      }
    } else {
      setResetTimer(false)
      setRemainingSeconds(null)
      setFetchPerSec(null)
    }
  }, [connected, html, setResetTimer, setRemainingSeconds])

  // Countdown (null-safe)
  useEffect(() => {
    if (remainingSeconds === null || remainingSeconds < 1) return

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null) return null
        return prev > 0 ? prev - 1 : 0
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [remainingSeconds, setRemainingSeconds])

  /* fetch per seconds */
  useEffect(() => {
    if (fetchPerSec === null || fetchPerSec < 1) return

    const interval = setInterval(() => {
      setFetchPerSec((prev) => {
        if (prev === null) return null
        return prev > 0 ? prev - 1 : 0
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [fetchPerSec, setFetchPerSec])

  // Audio warning
  useEffect(() => {
    if (remainingSeconds === 60) {
      const audio = new Audio("/minute-warning.mp3")
      audio.play().catch(console.error)
    }
  }, [remainingSeconds])

  return (
    <div className="pt-2 text-xs text-secondary-foreground space-y-4 text-center">
      <div className="font-bold">
        {fetchPerSec !== null && fetchPerSec > 0 ? (
          <>
            ⏳ Session time:{" "}
            <span className="text-2xl block mt-2 font-mono">
              {formatTime(fetchPerSec)}
            </span>
          </>
        ) : null }
      </div>

      <div className="space-y-1">
        {/* Gateway status */}
        {gatewayLoading && <p>Detecting gateway...</p>}
        {gatewayError && <p style={{ color: "red" }}>Gateway error: {gatewayError}</p>}

        {/* If gateway failed, allow retry gateway detection */}
        {!gatewayLoading && gatewayError && (
          <div className="space-y-1">
            <Button onClick={refreshGateway}>Retry gateway detection</Button>
          </div>
        )}

        {/* Connection status */}
        {connected === false && (
          <div className="space-y-1">
            <p style={{ color: "red" }}>❌ Disconnected</p>
            <Button onClick={retry}>Reconnect Now</Button>
          </div>
        )}

        {/* Optional: show fetch error */}
        {error && <p style={{ color: "red" }}>{String(error)}</p>}
      </div>
    </div>
  )
}
