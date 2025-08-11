import localFont from 'next/font/local';
import "./globals.css";
import { TimerProvider } from './context/TimerContext';

const inter = localFont({
  src: [
    {
      path: './fonts/Inter.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/Inter.ttf',
      weight: '700',
      style: 'normal',
    }
  ],
  display: 'swap',
});

export const metadata = {
  title: "Cara & Cassey Pisonet",
  description: "Auto Shutdown Timer",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={inter.className}
      >
        <TimerProvider>
            {children}
        </TimerProvider>
      </body>
    </html>
  );
}
