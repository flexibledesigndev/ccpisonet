'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { invoke } from "@tauri-apps/api/core";

const TimerContext = createContext();

export function TimerProvider({ children }) {

  const [resetTimer, setResetTimer] = useState(false);

  const [settings, setSettings] = useState({
    timerDuration: 180,
    warningTime: 30,
    username: 'admin',
    password: 'admin',
    repeatPassword: "admin",
    logoType: 'text',
    logoText: 'Cara & Cassey Pisonet',
    logoImage: null,
    relaunchOnClose: true,
    serverIp: '',
  });

  // ✅ Add connectionStatus and remainingSeconds
  const [timeLeft, setTimeLeft] = useState(180);
  const [connectionStatus, setConnectionStatus] = useState('unknown');
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

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };


  return (
    <TimerContext.Provider value={{ 
      timeLeft, 
      setTimeLeft,      
      settings, 
      setSettings,
      setResetTimer, 
      formatTime,
      remainingSeconds,
      setRemainingSeconds,
      connectionStatus,
      setConnectionStatus
    }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  return useContext(TimerContext);
}
