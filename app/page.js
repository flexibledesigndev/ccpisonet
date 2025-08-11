"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCcw, Settings } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export default function Home() {
    const [pcName, setPcName] = useState("Loading...");
    const [connectionStatus, setConnectionStatus] = useState(null);

    const iframeRef = useRef(null);
    
    useEffect(() => {

      async function getHTML() {
        try {
          const html = await invoke("fetch_html", { url: "http://11.0.0.1/status" });        
          
          // Extract connection status from DOM
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const statusText = doc.querySelector('#connectionStatus')?.textContent?.trim();

          setConnectionStatus(statusText || 'Disconnected');          

        } catch (err) {
          console.error("Failed to fetch HTML:", err);
        }
      }

      getHTML();
      const interval = setInterval(getHTML, 1000); // ⏱️ every 1 second
      return () => clearInterval(interval);      
    }, []);    


    useEffect(() => {
      // Get PC name
      const getPCName = async () => {
        try {
          const hostname = await invoke("get_hostname");
          setPcName(hostname);
        } catch (error) {
          console.error("Failed to get hostname:", error);
          setPcName("Unknown PC");
        }
      };
  
      getPCName();
    }, []);    
  
    const handleRefresh = () => {
      if (iframeRef.current) {
        // Reload the iframe content
        iframeRef.current.src = iframeRef.current.src;
      }
    }; 

  return (
    <main className="flex min-h-screen items-center justify-center text-white">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-10">
        <div className="flex flex-col items-center space-y-8">
          {/* PC Name */}
          <div className="text-4xl text-center font-bold tracking-wider text-secondary-foreground">
            {pcName}
          </div>

          {/* Settings Icon */}
          <button
            // onClick={handleSettingsClick}
            className="rounded-full bg-gray-800 p-3 transition-all duration-300 hover:scale-110 hover:bg-gray-700"
          >
            <Settings className="h-8 w-8 text-secondary" />
          </button>

          {/* Timer */}
          <div className="space-y-2">
              <div className="space-y-2 text-center">
                <div className="text-xl text-secondary-foreground">
                  This computer will shutdown in:
                </div>
                <div className="font-mono text-6xl font-bold tracking-wider text-secondary-foreground">
                  {/* {formatTime(timeLeft)} */}
                  {connectionStatus}
                </div>
              </div>
          </div>

          {/* Warning Message */}
          {/* {showWarning && (
            <div className="animate-pulse rounded-lg bg-red-500 p-4 text-center text-white">
              Warning: Computer will shutdown in {settings.warningTime} seconds!
            </div>
          )} */}
        </div>
        <div className="flex flex-col items-center space-y-4">
          {/* Brand Name/Logo */}
          <div className="text-3xl font-bold tracking-wider text-secondary-foreground">
            {/* {settings.logoType === "text" ? (
              settings.logoText
            ) : settings.logoImage ? (
              <img
                src={settings.logoImage}
                alt="Logo"
                className="max-h-32 object-contain"
              />
            ) : (
              "Cara & Cassey Pisonet"
            )} */}
            Cara & Cassey Pisonet
          </div>
          <Button
          onClick={handleRefresh}
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
          <Card className="w-full p-0">
            <CardContent className="p-0 h-[400px]">
              {/* {settings.serverIp === "" ? (
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
              )} */}

              {/* <CoinTopUp /> */}



              <iframe
                  ref={iframeRef}
                  src="http://11.0.0.1/status"
                  className="h-full w-full rounded"
                  title="Device Status"
                  ></iframe>              
            </CardContent>
          </Card>
        </div>
      </div>
    </main> 
  );
}
