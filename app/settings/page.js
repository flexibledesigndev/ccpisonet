"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTimer } from "../context/TimerContext";
import { invoke } from "@tauri-apps/api/core";

export default function Settings() {
  const router = useRouter();
  const { setTimeLeft, setSettings, settings, setResetTimer } = useTimer();
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    // Set in settings flag and reset timer when entering settings
    setResetTimer(true);
    setTimeLeft(settings.timerDuration);

    // Cleanup when leaving settings
    return () => {
      setResetTimer(false);
    };
  }, [setResetTimer, setTimeLeft, settings.timerDuration]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await invoke("get_settings");
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setSettings((prev) => ({
            ...prev,
            ...parsed,
            repeatPassword: parsed.password,
          }));
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    if (settings.password !== settings.repeatPassword) {
      setMessage({ text: "Passwords do not match", type: "error" });
      return;
    }

    try {
      const settingsToSave = { ...settings };
      await invoke("save_settings", {
        settings: JSON.stringify(settingsToSave),
      });
      setSettings(settingsToSave);
      setTimeLeft(settingsToSave.timerDuration);
      setMessage({ text: "Settings saved successfully!", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (error) {
      setMessage({ text: "Failed to save settings", type: "error" });
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings((prev) => ({ ...prev, logoImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-secondary-foreground">
              Settings
            </h1>
            <button
              onClick={() => router.push("/")}
              className="rounded bg-gray-800 px-4 py-2 text-white transition-colors duration-300 hover:bg-gray-700"
            >
              Back to Home
            </button>
          </div>

          {message.text && (
            <div
              className={`mb-6 rounded p-4 ${
                message.type === "success" ? "bg-green-500" : "bg-red-500"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="space-y-8 rounded-lg bg-white p-6">
            {/* Timer Settings */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-secondary-foreground">
                Timer Settings
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-secondary-foreground">
                    Timer Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={Math.floor(settings.timerDuration / 60)}
                    onChange={(e) =>
                      handleSettingChange(
                        "timerDuration",
                        parseInt(e.target.value) * 60,
                      )
                    }
                    className="w-full rounded border border-gray-600 bg-gray-700 p-2 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none"
                    min="1"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-secondary-foreground">
                    Warning Time (seconds)
                  </label>
                  <input
                    type="number"
                    value={settings.warningTime}
                    onChange={(e) =>
                      handleSettingChange(
                        "warningTime",
                        parseInt(e.target.value),
                      )
                    }
                    className="w-full rounded border border-gray-600 bg-gray-700 p-2 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none"
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Piso Wifi Server Settings */}
            <div className="space-y-4">
              <label className="text-xl font-bold text-secondary-foreground">
                    Server IP
                  </label>
                <input
                  type="text"
                  value={settings.serverIp || ""}
                  onChange={(e) =>
                    handleSettingChange("serverIp", e.target.value)
                  }
                  className="w-full rounded border border-gray-600 bg-gray-700 p-2 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none"
                  placeholder="Enter server IP"
                />
            </div>

            {/* User Settings */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-secondary-foreground">
                User Settings
              </h2>
              <div className="space-y-4 rounded bg-gray-700 p-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Username
                  </label>
                  <input
                    type="text"
                    value={settings.username}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                    className="w-full rounded border border-gray-500 bg-gray-600 p-2 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Password
                  </label>
                  <input
                    type="password"
                    value={settings.password}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    className="w-full rounded border border-gray-500 bg-gray-600 p-2 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Repeat Password
                  </label>
                  <input
                    type="password"
                    value={settings.repeatPassword}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        repeatPassword: e.target.value,
                      }))
                    }
                    className="w-full rounded border border-gray-500 bg-gray-600 p-2 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Logo Settings */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-secondary-foreground">
                Logo Settings
              </h2>
              <div className="space-y-4 rounded bg-gray-700 p-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Logo Type
                  </label>
                  <select
                    value={settings.logoType}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        logoType: e.target.value,
                      }))
                    }
                    className="w-full rounded border border-gray-500 bg-gray-600 p-2 focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="text">Text Logo</option>
                    <option value="image">Image Logo</option>
                  </select>
                </div>
                {settings.logoType === "text" && (
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Logo Text
                    </label>
                    <input
                      type="text"
                      value={settings.logoText}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          logoText: e.target.value,
                        }))
                      }
                      className="w-full rounded border border-gray-500 bg-gray-600 p-2 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                )}
                {settings.logoType === "image" && (
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Upload Logo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="w-full rounded border border-gray-500 bg-gray-600 p-2 focus:border-cyan-400 focus:outline-none"
                    />
                    {settings.logoImage && (
                      <div className="mt-4">
                        <img
                          src={settings.logoImage}
                          alt="Logo Preview"
                          className="max-h-32 object-contain"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                className="rounded bg-cyan-500 px-6 py-2 font-bold text-white transition-colors duration-300 hover:bg-cyan-600"
              >
                Save Settings
              </button>
            </div>
            {/* Relaunch on Close Toggle */}
            <div className="mt-6 flex items-center">
              <input
                id="relaunchOnClose"
                type="checkbox"
                checked={settings.relaunchOnClose}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    relaunchOnClose: e.target.checked,
                  }))
                }
                className="mr-2"
              />
              <label
                htmlFor="relaunchOnClose"
                className="font-medium text-secondary-foreground"
              >
                Relaunch app when closed
              </label>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
