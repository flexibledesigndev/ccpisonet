'use client';

import { useEffect } from 'react';
import { useTimer } from '@/app/context/TimerContext';
import { useRouter } from 'next/navigation';
import { invoke } from "@tauri-apps/api/core";

export default function CoinTopUp() {
  const router = useRouter();
  const { 
    formatTime, 
    connectionStatus, 
    setConnectionStatus,
    remainingSeconds,
    setRemainingSeconds
  } = useTimer(); 

  useEffect(() => {

    async function getHTML() {
      try {
        const html = await invoke("fetch_html", { url: "http://11.0.0.1/status" });       
        
        // Extract sessiontime from script
        const timeMatch = html.match(/var\s+sessiontime\s*=\s*"(\d+)"/i);
        const parsedTime = timeMatch ? parseInt(timeMatch[1], 10) : null;        
        
        // Extract connection status from DOM
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const statusText = doc.querySelector('#connectionStatus')?.textContent?.trim();

        setConnectionStatus(statusText || 'Disconnected');   
        
        // ✅ Control timer based on connection
        if (statusText === 'Connected') {
          if (parsedTime !== null) {
            setRemainingSeconds(parsedTime);
          }
        } else {
          setRemainingSeconds(null);
        }        

      } catch (err) {
        console.error('❌ Failed to fetch status.html:', err);
        setConnectionStatus('Error');
      }
    }

    getHTML();
    const interval = setInterval(getHTML, 1000); // ⏱️ every 1 second
    return () => clearInterval(interval);      
  }, []);    

  // Countdown every 1 second
  useEffect(() => {
    if (connectionStatus !== 'Connected' || remainingSeconds === null) return;

    const interval = setInterval(() => {
      setRemainingSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [connectionStatus, remainingSeconds]);

  return (
    <div style={{ fontFamily: 'monospace', fontSize: '2rem', padding: '1rem' }}>
      {connectionStatus === 'Connected' ? (
        remainingSeconds !== null ? (
          <span>{connectionStatus}⏳ {formatTime(remainingSeconds)}</span>
        ) : (
          <span>Loading session time...</span>
        )
      ) : (
        <span style={{ color: 'gray' }}>🔌 Not connected</span>
      )}
    </div>
  );
}
