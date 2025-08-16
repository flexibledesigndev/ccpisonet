"use client";

import { useTimer } from '@/app/context/TimerContext';
import { useTauriFetch } from "@/hooks/useTauriFetch";
import { useEffect } from "react";
import { Button } from './ui/button';

export default function CoinTopUp() {
  const { 
    formatTime, 
    connectionStatus, 
    setConnectionStatus,
    remainingSeconds,
    setRemainingSeconds,
    setResetTimer,    
    settings
  } = useTimer(); 

  const { data: html, error, loading, connected, retry } = useTauriFetch(
    `http://${settings.serverIp}/status`,
    { retries: 3, retryDelay: 500, pollInterval: 2000 }
  );

  // ✅ Parse connection status only when html/connected changes
  useEffect(() => {
    if (connected === true && html) {
      const timeMatch = html.match(/var\s+sessiontime\s*=\s*"(\d+)"/i);
      const parsedTime = timeMatch ? parseInt(timeMatch[1], 10) : null;        

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const statusText = doc.querySelector('#connectionStatus')?.textContent?.trim();

      setConnectionStatus(statusText || 'Disconnected');   

      if (statusText === 'Connected') {
        setResetTimer(true);
        if (parsedTime !== null) setRemainingSeconds(parsedTime);
      } else {
        setResetTimer(false);
        setRemainingSeconds(null);
      }
    } else {
      setConnectionStatus('Disconnected');
      setResetTimer(false);
      setRemainingSeconds(null);
    }
  }, [connected, html, setConnectionStatus, setResetTimer, setRemainingSeconds]);

  // ✅ Countdown
  useEffect(() => {
    if (remainingSeconds < 1 || remainingSeconds === null) return;
    const interval = setInterval(() => {
      setRemainingSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [remainingSeconds]);

  // ✅ Audio warning
  useEffect(() => {
    if (remainingSeconds === 60) {
      const audio = new Audio('/minute-warning.mp3');
      audio.play().catch(err => console.error(err));
    }
  }, [remainingSeconds]);    

  return (
    <div className="pt-2 text-xs text-secondary-foreground space-y-4 text-center">
      <div className='font-bold'>
        {remainingSeconds > 0 && (
          remainingSeconds !== null ? (
            <>
              ⏳ Session time: <span className='text-2xl block mt-2 font-mono'>{formatTime(remainingSeconds)}</span>
            </>
          ) : (
            <span>Loading session time...</span>
          )
        )}
      </div>      
      <div className='space-y-1'>
        {settings.serverIp === "" && <p>Server IP is not set</p>}
        {/* {loading && <p>Checking server connection...</p>} */}
        {connected === false && (
          <div className='space-y-1'>
            <p style={{ color: "red" }}>❌ Disconnected</p>
            <Button onClick={retry} disabled={connected}>Reconnect Now</Button>
          </div>
        )}        
      </div>
    </div>
  );
}
