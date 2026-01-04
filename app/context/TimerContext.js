"use client"

import { createContext, useContext, useEffect, useMemo, useCallback, useState } from "react"
import { invoke } from "@tauri-apps/api/core"

const TimerContext = createContext()

export function TimerProvider({ children }) {
  const [pcName, setPcName] = useState("Loading...")

  const [resetTimer, setResetTimer] = useState(false)
  const [showWarning, setShowWarning] = useState(false)

  // ✅ Removed serverIp completely
  const [settings, setSettings] = useState({
    timerDuration: 180,
    warningTime: 60,
    username: "admin",
    password: "ccPisonetAdmin",
    repeatPassword: "ccPisonetAdmin",
    logoType: "image",
    logoText: "Cara & Casey Pisonet",
    logoImage: null,
    relaunchOnClose: true,
  })

  const [timeLeft, setTimeLeft] = useState(180)
  const [remainingSeconds, setRemainingSeconds] = useState(null)

  // ✅ Default gateway state (reusable everywhere)
  const [gateway, setGateway] = useState(null)
  const [gatewayLoading, setGatewayLoading] = useState(true)
  const [gatewayError, setGatewayError] = useState(null)

  const refreshGateway = useCallback(async () => {
    try {
      setGatewayLoading(true)
      setGatewayError(null)
      const gw = await invoke("get_default_gateway_ip")
      setGateway(String(gw))
      return String(gw)
    } catch (e) {
      setGateway(null)
      setGatewayError(e instanceof Error ? e.message : String(e))
      return null
    } finally {
      setGatewayLoading(false)
    }
  }, [])

  // Fetch gateway on mount
  useEffect(() => {
    refreshGateway()
  }, [refreshGateway])

  // ✅ Load settings from file (and strip serverIp if it exists in old saved json)
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await invoke("get_settings")
        if (!savedSettings) return

        const parsed = JSON.parse(savedSettings)

        // Remove serverIp if it's still present from older versions
        const { serverIp, ...cleaned } = parsed || {}

        setSettings((prev) => ({ ...prev, ...cleaned }))

        const duration = cleaned?.timerDuration ?? 180
        setTimeLeft(duration)

        // Optional: persist the cleaned version back to disk (so serverIp is truly removed)
        if (typeof serverIp !== "undefined") {
          try {
            await invoke("save_settings", { settings: JSON.stringify({ ...settings, ...cleaned }) })
          } catch {
            // ignore save cleanup error
          }
        }
      } catch (error) {
        console.error("Failed to load settings:", error)
      }
    }

    loadSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ✅ Shutdown countdown timer
  useEffect(() => {
    if (resetTimer) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer)
          invoke("shutdown_pc")
          return 0
        }

        if (prev === settings.warningTime) {
          setShowWarning(true)
          setTimeout(() => setShowWarning(false), 5000)
        }

        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [settings.warningTime, resetTimer])

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  // ✅ Get PC name
  useEffect(() => {
    const getPCName = async () => {
      try {
        const hostname = await invoke("get_hostname")
        setPcName(hostname)
      } catch (error) {
        console.error("Failed to get hostname:", error)
        setPcName("Unknown PC")
      }
    }
    getPCName()
  }, [])

  // ✅ Handy derived URLs for reuse
  const baseUrl = useMemo(() => (gateway ? `http://${gateway}` : null), [gateway])
  const statusUrl = useMemo(() => (gateway ? `http://${gateway}/status` : null), [gateway])

  return (
    <TimerContext.Provider
      value={{
        pcName,

        // timer
        timeLeft,
        setTimeLeft,
        resetTimer,
        setResetTimer,
        showWarning,

        // settings (no serverIp)
        settings,
        setSettings,

        // session remaining
        remainingSeconds,
        setRemainingSeconds,

        // helpers
        formatTime,

        // ✅ gateway helpers available everywhere
        gateway,
        gatewayLoading,
        gatewayError,
        refreshGateway,
        baseUrl,
        statusUrl,
      }}
    >
      {children}
    </TimerContext.Provider>
  )
}

export function useTimer() {
  return useContext(TimerContext)
}
