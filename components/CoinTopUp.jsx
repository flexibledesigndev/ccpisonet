'use client';

import { useEffect, useState } from 'react';
import { useTimer } from '@/app/context/TimerContext';
import { invoke } from "@tauri-apps/api/core";

export default function CoinTopUp() {
  const [warningMessage, setWarningMessage] = useState('');
  const { 
    formatTime, 
    connectionStatus, 
    setConnectionStatus,
    remainingSeconds,
    setRemainingSeconds,
    setResetTimer,
    settings,
    gateway
  } = useTimer(); 

  useEffect(() => {

    async function getHTML() {
      try {
        if (!settings?.serverIp) return; // Wait until serverIp is ready
        
        const html = await invoke("fetch_html", { url: `http://${settings.serverIp}/status` });
        
        // Extract sessiontime from script
        const timeMatch = html.match(/var\s+sessiontime\s*=\s*"(\d+)"/i);
        const parsedTime = timeMatch ? parseInt(timeMatch[1], 10) : null;        
        
        // Extract connection status from DOM
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const statusText = doc.querySelector('#connectionStatus')?.textContent?.trim();
        console.log("sdfjs"+html)
        setConnectionStatus(statusText || 'Disconnected');   
        
        // ✅ Control timer based on connection
        if (statusText === 'Connected') {
          setResetTimer(true);
          if (parsedTime !== null) {
            setRemainingSeconds(parsedTime);
          }
        } else {
          setResetTimer(false);
          setRemainingSeconds(null);
        }        

      } catch (err) {
        console.error('❌ Failed to fetch status.html:', err);
        setConnectionStatus('Error');
        setResetTimer(false);
        setWarningMessage("⚠️ Unable to connect to server. Please check your network.");
      }
    }

    getHTML();
    const interval = setInterval(getHTML, 1000); // ⏱️ every 1 second
    return () => clearInterval(interval);      
  }, [settings.serverIp]);    

  // Countdown every 1 second
  useEffect(() => {
    if (connectionStatus !== 'Connected' || remainingSeconds === null) return;

    const interval = setInterval(() => {
      setRemainingSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [connectionStatus, remainingSeconds]);

  useEffect(() => {
    if (remainingSeconds === 60) {
      const audio = new Audio('/minute-warning.mp3');
      audio.play().catch(err => console.error(err));
    }
  }, [remainingSeconds]);  

  return (
    <div className="pt-5 text-xl font-bold text-center">
      {warningMessage && <div className="text-red-500 text-sm">{warningMessage}</div>}
      {connectionStatus === 'Connected' ? (
        remainingSeconds !== null ? (
          <span>⏳ {formatTime(remainingSeconds)}</span>
        ) : (
          <span>Loading session time...</span>
        )
      ) : (
        <span style={{ color: 'gray' }}>🔌 Not connected</span>
      )}
    </div>
  );
}