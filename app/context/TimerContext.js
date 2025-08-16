'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { invoke } from "@tauri-apps/api/core";

const TimerContext = createContext();

export function TimerProvider({ children }) {
  const [pcName, setPcName] = useState("Loading...");

  const [resetTimer, setResetTimer] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  

  const [settings, setSettings] = useState({
    timerDuration: 180,
    warningTime: 60,
    username: 'admin',
    password: 'ccPisonetAdmin',
    repeatPassword: "ccPisonetAdmin",
    logoType: 'image',
    logoText: 'Cara & Casey Pisonet',
    logoImage: null,
    relaunchOnClose: true,
    serverIp: '192.168.3.1'
  });

  // ✅ Add remainingSeconds
  const [timeLeft, setTimeLeft] = useState(180);
  const [remainingSeconds, setRemainingSeconds] = useState(null);


  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await invoke('get_settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setSettings(prev => ({ ...prev, ...parsed }));
          setTimeLeft(parsed.timerDuration || 180);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);  


  useEffect(() => {
    if (resetTimer) return; // <-- also respect disabled timer

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          invoke('shutdown_pc');
          return 0;
        }
        if (prev === settings.warningTime) {
          setShowWarning(true);
          setTimeout(() => setShowWarning(false), 5000);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [settings.warningTime, resetTimer]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

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


  return (
    <TimerContext.Provider value={{
      pcName,
      timeLeft, 
      setTimeLeft,      
      settings, 
      setSettings,
      setResetTimer,
      formatTime,
      showWarning,      
      remainingSeconds,
      setRemainingSeconds
    }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  return useContext(TimerContext);
}
