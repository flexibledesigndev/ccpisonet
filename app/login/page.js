"use client";
import { useState } from "react";
import { useTimer } from "../context/TimerContext";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { timeLeft, formatTime, settings } = useTimer(); 

  const handleLogin = (e) => {
    e.preventDefault();

    if (username === settings.username && password === settings.password) {
      router.push("/settings");
    } else {
      setError("Invalid credentials");
    }
  };

  const handleBack = () => {
    router.push("/");
  };

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-md">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-secondary-foreground">
              Login
            </h1>
            <button
              onClick={handleBack}
              className="flex items-center rounded bg-gray-800 px-4 py-2 text-white transition-colors duration-300 hover:bg-gray-700"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Home
            </button>
          </div>

          <div className="space-y-8 rounded-lg bg-white p-6">     
            <Logo />

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="username"
                    className="mb-2 block text-sm font-medium text-secondary-foreground"
                  >
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="w-full rounded border border-gray-600 bg-gray-700 p-2 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-secondary-foreground"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="w-full rounded border border-gray-600 bg-gray-700 p-2 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded bg-red-500 p-3 text-sm text-white">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded bg-cyan-500 px-4 py-2 font-bold text-white transition-colors duration-300 hover:bg-cyan-600"
              >
                Login
              </button>
            </form>

            {/* Timer Display */}
            <div className="space-y-2 text-center">
              <div className="text-xl text-secondary-foreground">
                This computer will shutdown in:
              </div>
              <div className="font-mono text-4xl font-bold text-secondary-foreground">
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
