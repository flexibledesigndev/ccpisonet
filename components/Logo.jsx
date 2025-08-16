import { useTimer } from "@/app/context/TimerContext";

export default function Logo() {
    const { settings, remainingSeconds } = useTimer();
    return (
        <div className="flex justify-center">
        {/* Brand Name/Logo */}
        <div className="text-5xl uppercase font-black tracking-wider text-secondary-foreground">
          {settings.logoType === "text" ? (
            settings.logoText
          ) : settings.logoImage ? (
            <img
              src={settings.logoImage}
              alt="Logo"
              className={`${(remainingSeconds > 0) ? 'max-h-22': 'max-h-32'} object-contain`}
            />
           
          ) : (
              <img
              src="/CaseyCara-logo.png"
              alt="Logo"
              className={`${(remainingSeconds > 0) ? 'max-h-22': 'max-h-32'} object-contain`}
            />
          )}
        </div>        
    </div>
    );
}