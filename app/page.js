"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RefreshCcw, Settings } from "lucide-react"
import { useRef } from "react"
import CoinTopUp from "@/components/CoinTopUp"
import { useTimer } from "./context/TimerContext"
import { useRouter } from "next/navigation"
import { useAppGlobalEffects } from "@/hooks/globalEffects"
import Logo from "@/components/Logo"

export default function Home() {
  const router = useRouter()
  useAppGlobalEffects()

  const {
    formatTime,
    timeLeft,
    settings,
    showWarning,
    pcName,
    remainingSeconds,
    statusUrl,
    gatewayLoading,
    gatewayError,
  } = useTimer()

  const iframeRef = useRef(null)

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src
    }
  }

  const handleSettingsClick = () => {
    router.push("/login")
  }

  return (
    <main
      className={`flex flex-col min-h-screen items-center 
      ${remainingSeconds > 0 ? "gap-2 px-2 py-0" : "gap-10"} 
      py-5 justify-center text-white`}
    >
      <Logo />

      <div
        className={`mx-auto grid ${
          remainingSeconds > 0 ? "w-full grid-cols-1" : "w-3xl grid-cols-2"
        }`}
      >
        <div
          className={`flex flex-col items-center ${
            remainingSeconds > 0 ? "space-y-2" : "space-y-4"
          }`}
        >
          {/* PC Name */}
          <div
            className={`text-center font-bold tracking-wider text-secondary-foreground ${
              remainingSeconds > 0 ? "text-lg" : "text-4xl"
            }`}
          >
            {pcName}
          </div>

          {/* Settings + Refresh */}
          <div className="flex gap-3">
            {remainingSeconds < 1 && (
              <Button onClick={handleSettingsClick} size="icon">
                <Settings className="h-2 w-2" />
              </Button>
            )}

            <Button onClick={handleRefresh} size="icon">
              <RefreshCcw className="h-2 w-2" />
            </Button>
          </div>

          {remainingSeconds < 1 && (
            <>
              {/* Timer */}
              <div className="space-y-2">
                <div className="space-y-2 text-center">
                  <div className="text-xl text-secondary-foreground">
                    This computer will shutdown in:
                  </div>
                  <div className="font-mono text-6xl font-bold text-primary">
                    {formatTime(timeLeft)}
                  </div>
                </div>
              </div>

              {/* Warning */}
              {showWarning && (
                <div className="animate-pulse rounded-lg bg-red-500 p-4 text-center text-white">
                  Warning: Computer will shutdown in {settings.warningTime} seconds!
                </div>
              )}
            </>
          )}

          <CoinTopUp />
        </div>

        <div className="flex flex-col items-center space-y-4">
          <Card className="w-full p-0">
            <CardContent
              className={`p-0 ${remainingSeconds > 0 ? "h-[230px]" : "h-[470px]"}`}
            >
              {gatewayLoading ? (
                <div className="h-full w-full rounded bg-gray-800">
                  <div className="flex h-full items-center justify-center">
                    <div className="text-2xl font-bold text-secondary-foreground">
                      Detecting gateway...
                    </div>
                  </div>
                </div>
              ) : gatewayError ? (
                <div className="h-full w-full rounded bg-gray-800">
                  <div className="flex h-full items-center justify-center px-6 text-center">
                    <div className="text-lg font-bold text-secondary-foreground">
                      Gateway error: {gatewayError}
                    </div>
                  </div>
                </div>
              ) : statusUrl ? (
                <iframe
                  ref={iframeRef}
                  src={statusUrl}
                  className="h-full w-full rounded"
                  frameBorder="0"
                  title="Device Status"
                />
              ) : (
                <div className="h-full w-full rounded bg-gray-800">
                  <div className="flex h-full items-center justify-center">
                    <div className="text-lg font-bold text-secondary-foreground">
                      Gateway not found.
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
