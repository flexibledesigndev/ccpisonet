"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCcw, Settings } from "lucide-react";
import { useRef } from "react";
import CoinTopUp from "@/components/CoinTopUp";
import { useTimer } from "./context/TimerContext";
import { useRouter } from "next/navigation";
import { useAppGlobalEffects } from "@/hooks/globalEffects";
import Logo from "@/components/Logo";

export default function Home() {
  
    const router = useRouter();

    useAppGlobalEffects();

    const{ formatTime, timeLeft, settings, showWarning, pcName, connectionStatus } = useTimer();

    const iframeRef = useRef(null);
  
    const handleRefresh = () => {
      if (iframeRef.current) {
        // Reload the iframe content
        iframeRef.current.src = iframeRef.current.src;
      }
    }; 

    const handleSettingsClick = () => {
      router.push("/login");
    };
  return (
    <main className="flex flex-col min-h-screen items-center gap-10 pt-5 justify-center text-white">
      <Logo />
      <div className="mx-auto grid w-3xl grid-cols-2">
        <div className="flex flex-col items-center space-y-4">
          {/* PC Name */}
          <div className="text-4xl text-center font-bold tracking-wider text-secondary-foreground">
            {pcName}
          </div>

          {/* Settings Icon */}
          <div className="flex gap-3">
            {
                (connectionStatus != 'Connected') && <>
                    <Button onClick={handleSettingsClick}>
                      <Settings className="h-4 w-4" />
                    </Button>
                </> 
              }
              <Button
                onClick={handleRefresh}
              >
              <RefreshCcw className="h-4 w-4" />
            </Button>             
          </div>

          {
            (connectionStatus != 'Connected') && <>
                  {/* Timer */}
                  <div className="space-y-2">
                      <div className="space-y-2 text-center">
                        <div className="text-xl text-secondary-foreground">
                          This computer will shutdown in:
                        </div>
                        <div className="font-mono text-6xl font-bold tracking-wider text-primary">
                          {formatTime(timeLeft)}
                        </div>
                      </div>
                  </div>

                  {/* Warning Message */}
                  {showWarning && (
                    <div className="animate-pulse rounded-lg bg-red-500 p-4 text-center text-white">
                      Warning: Computer will shutdown in {settings.warningTime} seconds!
                    </div>
                  )}
            </> 
          }

          <CoinTopUp />

        </div>


        <div className="flex flex-col items-center space-y-4">
          <Card className="w-full p-0">
            <CardContent className="p-0 h-[470px]">
              {settings.serverIp === "" ? (
                <div className="h-full w-full rounded bg-gray-800">
                  <div className="flex h-full items-center justify-center">
                    <div className="text-2xl font-bold text-secondary-foreground">
                      Please set the server IP in the settings.
                    </div>
                  </div>
                </div>
              ) : (
                  <iframe
                  ref={iframeRef}
                  src={`http://${settings.serverIp}/status`}
                  className="h-full w-full rounded"
                  frameBorder="0"
                  title="Device Status"
                  ></iframe>
              )}

              

            </CardContent>
          </Card>
        </div>
      </div>
    </main> 
  );
}
