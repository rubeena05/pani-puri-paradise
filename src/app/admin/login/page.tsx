"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDatabase } from "@/context/DatabaseContext";
import { auth as firebaseAuth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Compass, ShieldCheck, AlertCircle, Eye, EyeOff } from "lucide-react";


export default function AdminLoginPage() {
  const router = useRouter();
  const { dbMode } = useDatabase();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to admin panel
  useEffect(() => {
    if (typeof window !== "undefined") {
      const localLoggedIn = localStorage.getItem("ppp_admin_auth") === "true";
      if (localLoggedIn) {
        router.push("/admin");
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (dbMode === "firebase" && firebaseAuth) {
        // Firebase Auth Mode
        await signInWithEmailAndPassword(firebaseAuth, email, password);
        localStorage.setItem("ppp_admin_auth", "true");
        router.push("/admin");
      } else {
        // Local Mode: Fallback Credentials
        if (email === "admin" && password === "admin") {
          localStorage.setItem("ppp_admin_auth", "true");
          router.push("/admin");
        } else {
          setError("Invalid credentials. In Local Mode, use Username: 'admin' and Password: 'admin'.");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Authentication failed. Please check your network or credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Glow backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary/10 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full filter blur-[150px] pointer-events-none animate-pulse" />

      <div className="w-full max-w-md space-y-6 z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-primary/10 border border-primary/20 mb-2">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Admin <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Login</span>
          </h1>
          <p className="text-xs text-slate-400">
            Sign in to access order management, kitchen display, menu editing, and database settings.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border-white/5 space-y-4 shadow-2xl">
          {dbMode === "local" && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs text-center font-medium leading-relaxed">
              💡 Running in Simulated Local Mode. <br />
              Use Username: <strong className="text-white">admin</strong> and Password: <strong className="text-white">admin</strong>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email/Username field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">
                {dbMode === "firebase" ? "Email Address" : "Username / Email"}
              </label>
              <input
                type={dbMode === "firebase" ? "email" : "text"}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={dbMode === "firebase" ? "admin@panipuriparadise.com" : "admin"}
                className="w-full bg-slate-950 border border-white/5 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Password field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-white/5 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-3 rounded-2xl transition-all shadow-lg shadow-primary/10 text-sm disabled:bg-slate-900 disabled:text-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? "Authenticating..." : "Authorize Access"}
            </button>
          </form>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center text-xs text-slate-400 hover:text-white transition-colors"
          >
            ← Back to Customer Home
          </Link>
        </div>
      </div>
    </div>
  );
}
