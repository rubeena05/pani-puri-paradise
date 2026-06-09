"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useDatabase } from "@/context/DatabaseContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Tv, 
  Clock, 
  CheckCircle2, 
  ChefHat, 
  Volume2, 
  VolumeX, 
  Home
} from "lucide-react";

export default function TVDashboardPage() {
  const { orders, settings } = useDatabase();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevTokenRef = useRef<number | null>(null);

  // Group tokens by status
  const preparingTokens = orders
    .filter((o) => o.status === "Preparing")
    .map((o) => o.token)
    .reverse(); // Show oldest first

  const readyTokens = orders
    .filter((o) => o.status === "Ready")
    .map((o) => o.token)
    .reverse();

  const completedTokens = orders
    .filter((o) => o.status === "Completed")
    .slice(0, 8) // Show recent 8 completed
    .map((o) => o.token);

  // Synthesize custom token announcement beep
  const playServingBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Chime note 1: C5
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); 
      gain1.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.3);
      
      // Chime note 2: E5
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime); 
        gain2.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.3);
      }, 150);

      // Chime note 3: G5
      setTimeout(() => {
        const osc3 = audioCtx.createOscillator();
        const gain3 = audioCtx.createGain();
        osc3.type = "sine";
        osc3.frequency.setValueAtTime(783.99, audioCtx.currentTime); 
        gain3.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain3.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc3.connect(gain3);
        gain3.connect(audioCtx.destination);
        osc3.start();
        osc3.stop(audioCtx.currentTime + 0.5);
      }, 300);
    } catch (e) {
      console.warn("AudioContext audio call blocked:", e);
    }
  };

  // Trigger sound when serving token changes
  useEffect(() => {
    if (prevTokenRef.current !== null && prevTokenRef.current !== settings.currentToken) {
      playServingBeep();
    }
    prevTokenRef.current = settings.currentToken;
  }, [settings.currentToken]);

  return (
    <div className="h-screen w-screen bg-slate-950 text-white overflow-hidden flex flex-col font-sans select-none relative">
      {/* Background neon glows */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full filter blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-secondary/5 rounded-full filter blur-[180px] pointer-events-none" />

      {/* Header bar */}
      <header className="h-16 px-6 bg-slate-900/60 backdrop-blur-md border-b border-white/5 flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <Link href="/" className="p-2 rounded-lg bg-slate-950 border border-white/5 hover:border-white/10 transition-colors">
            <Home className="h-4 w-4 text-slate-400 hover:text-white" />
          </Link>
          <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            PANI PURI PARADISE
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 text-[10px] font-bold text-success border border-success/20 uppercase tracking-widest animate-pulse">
            Live Order Feed
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {/* Audio toggle button */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 bg-slate-950 border border-white/5 rounded-xl text-slate-400 hover:text-white flex items-center gap-1 text-xs"
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 text-primary" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
            <span className="hidden sm:inline font-semibold">
              {soundEnabled ? "Chime On" : "Chime Muted"}
            </span>
          </button>
          
          <div className="text-right">
            <div className="text-xs text-slate-400 font-semibold">
              {new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
            <div className="text-sm font-black text-white font-mono mt-0.5">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </header>

      {/* Main split display layout */}
      <main className="flex-grow flex overflow-hidden z-10">
        
        {/* Left Side: Giant Now Serving Panel */}
        <section className="w-5/12 bg-gradient-to-br from-slate-900/40 via-slate-950 to-slate-950 p-8 flex flex-col justify-center items-center border-r border-white/5 text-center relative overflow-hidden">
          {/* Pulse ring overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[80%] aspect-square rounded-full border border-primary/5 animate-pulse-glow" />
          </div>
          
          <div className="space-y-4 relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-black text-primary border border-primary/20 uppercase tracking-widest animate-pulse">
              <Sparkles className="h-4.5 w-4.5 text-primary" />
              Now Serving
            </span>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={settings.currentToken}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="text-8xl sm:text-9xl lg:text-[13rem] font-black text-white leading-none tracking-tight font-mono glow-text-primary"
              >
                #{settings.currentToken}
              </motion.div>
            </AnimatePresence>
            
            <p className="text-sm sm:text-base text-slate-400 font-semibold max-w-xs mx-auto">
              Please present your token at the counter to collect your delicious crispy platter!
            </p>
          </div>
        </section>

        {/* Right Side: Columns for Preparing, Ready, Completed */}
        <section className="w-7/12 grid grid-cols-3 gap-6 p-6 overflow-hidden">
          
          {/* Column 1: Preparing */}
          <div className="glass-panel border-white/5 rounded-3xl p-5 flex flex-col overflow-hidden">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-3 flex-shrink-0">
              <ChefHat className="h-4 w-4 text-orange-400" />
              Preparing
            </h3>
            <div className="flex-grow overflow-y-auto pt-4 space-y-3 no-scrollbar">
              <AnimatePresence>
                {preparingTokens.length === 0 ? (
                  <div className="text-xs text-slate-500 italic text-center py-8">
                    Kitchen caught up!
                  </div>
                ) : (
                  preparingTokens.map((tok) => (
                    <motion.div
                      key={tok}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="p-3 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-center"
                    >
                      <span className="text-3xl font-extrabold text-orange-400 font-mono">
                        #{tok}
                      </span>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Column 2: Ready */}
          <div className="glass-panel border-white/5 rounded-3xl p-5 flex flex-col overflow-hidden relative">
            <div className="absolute inset-0 bg-green-500/2 rounded-3xl pointer-events-none" />
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-3 flex-shrink-0">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              Ready
            </h3>
            <div className="flex-grow overflow-y-auto pt-4 space-y-3 no-scrollbar">
              <AnimatePresence>
                {readyTokens.length === 0 ? (
                  <div className="text-xs text-slate-500 italic text-center py-8">
                    Waiting for chef
                  </div>
                ) : (
                  readyTokens.map((tok) => (
                    <motion.div
                      key={tok}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.1 }}
                      className="p-3.5 bg-green-950/40 border border-green-500/20 rounded-2xl flex items-center justify-center animate-pulse shadow-md shadow-green-500/5"
                    >
                      <span className="text-4xl font-black text-green-400 font-mono glow-text-success">
                        #{tok}
                      </span>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Column 3: Completed */}
          <div className="glass-panel border-white/5 rounded-3xl p-5 flex flex-col overflow-hidden">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-3 flex-shrink-0">
              <Clock className="h-4 w-4 text-slate-400" />
              Served
            </h3>
            <div className="flex-grow overflow-y-auto pt-4 space-y-3 no-scrollbar">
              <AnimatePresence>
                {completedTokens.length === 0 ? (
                  <div className="text-xs text-slate-500 italic text-center py-8">
                    No items served
                  </div>
                ) : (
                  completedTokens.map((tok) => (
                    <motion.div
                      key={tok}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.4 }}
                      exit={{ opacity: 0 }}
                      className="p-3 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-center"
                    >
                      <span className="text-2xl font-bold text-slate-300 font-mono line-through decoration-slate-600">
                        #{tok}
                      </span>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}
