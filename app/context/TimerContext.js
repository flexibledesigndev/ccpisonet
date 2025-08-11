'use client';
import { createContext, useContext, useState } from 'react';

const TimerContext = createContext();

export function TimerProvider({ children }) {

  // ✅ Add connectionStatus and remainingSeconds
  const [timeLeft, setTimeLeft] = useState(180);
  const [connectionStatus, setConnectionStatus] = useState('unknown');
  const [remainingSeconds, setRemainingSeconds] = useState(null);


  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };


  return (
    <TimerContext.Provider value={{ 
      timeLeft, 
      setTimeLeft,      
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
