"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useDatabase } from "@/context/DatabaseContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Volume2, 
  VolumeX, 
  MessageSquare, 
  Star, 
  ChevronRight,
  ArrowLeft,
  Coffee,
  Check
} from "lucide-react";

interface TrackClientPageProps {
  id: string;
}

export default function TrackClientPage({ id }: TrackClientPageProps) {
  const { orders, updateOrderStatus, addFeedback } = useDatabase();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Review states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewerName, setReviewerName] = useState("");

  const order = orders.find((o) => o.id === id);
  const prevStatusRef = useRef<string | null>(null);

  // Synthesize notification sound using Web Audio API
  const playNotificationSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Beep 1
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      gain1.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.25);
      
      // Beep 2
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        gain2.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.35);
      }, 150);
    } catch (e) {
      console.warn("AudioContext block or error:", e);
    }
  };

  // Play sound when status changes to 'Ready'
  useEffect(() => {
    if (order) {
      if (prevStatusRef.current && prevStatusRef.current !== order.status && order.status === "Ready") {
        playNotificationSound();
      }
      prevStatusRef.current = order.status;
    }
  }, [order?.status]);

  if (!order) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-950">
        <Navbar />
        <div className="flex-grow max-w-md w-full mx-auto px-4 py-20 flex flex-col justify-center items-center text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-rose-500 animate-pulse" />
          <h2 className="text-2xl font-bold text-white">Order Not Found</h2>
          <p className="text-sm text-slate-400">
            We couldn't locate any order with ID "{id}". It may have been cleared from local memory.
          </p>
          <Link
            href="/track"
            className="inline-flex items-center text-primary font-bold hover:underline text-sm"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Go back to search
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Calculate timelines & percentages
  const statuses = [
    { name: "Pending", label: "Order Received", desc: "Waiting for kitchen to start", progress: 15 },
    { name: "Preparing", label: "Preparing", desc: "Frying puris & mixing sweet-mint water", progress: 50 },
    { name: "Ready", label: "Ready to Serve", desc: "Collect your platter at the counter!", progress: 85 },
    { name: "Completed", label: "Enjoying Platter", desc: "Delivered! Savor every bite", progress: 100 }
  ];

  const currentIdx = statuses.findIndex((s) => s.name === order.status);
  const activeStatus = statuses[currentIdx] || statuses[0];

  // Dynamic estimated wait details
  let minutesLeft = 0;
  if (order.status === "Pending") minutesLeft = 6;
  else if (order.status === "Preparing") minutesLeft = 3;
  else minutesLeft = 0;

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim()) return;
    await addFeedback(reviewerName, rating, comment);
    setFeedbackSubmitted(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      <Navbar />

      <main className="flex-grow max-w-2xl w-full mx-auto px-4 py-8 sm:px-6">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex justify-between items-center">
          <Link
            href="/track"
            className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Tracker
          </Link>

          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) {
                // Test sound
                playNotificationSound();
              }
            }}
            className="inline-flex items-center gap-1 bg-slate-900 border border-white/5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="h-4 w-4 text-primary" />
                <span>Alert Sound On</span>
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4 text-slate-500" />
                <span>Sound Muted</span>
              </>
            )}
          </button>
        </div>

        {/* Live Tracking Header Block */}
        <div className="glass-panel p-6 rounded-3xl border-white/5 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Clock className="h-32 w-32 text-primary" />
          </div>
          
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Customer Ticket</span>
              <h2 className="text-3xl font-black text-white glow-text-primary">Token #{order.token}</h2>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span>{order.branch}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Est. Wait Time</span>
              {minutesLeft > 0 ? (
                <div className="text-3xl font-black text-secondary mt-1 animate-pulse">
                  {minutesLeft} <span className="text-sm font-semibold">min</span>
                </div>
              ) : order.status === "Ready" ? (
                <span className="inline-flex items-center rounded-lg bg-green-500/10 px-3 py-1.5 text-sm font-bold text-green-400 ring-1 ring-inset ring-green-500/20 animate-bounce">
                  Ready!
                </span>
              ) : (
                <span className="inline-flex items-center rounded-lg bg-slate-500/10 px-3 py-1.5 text-sm font-bold text-slate-400 ring-1 ring-inset ring-slate-500/20">
                  Served
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Platter status: <strong className="text-white capitalize">{order.status}</strong></span>
              <span>{activeStatus.progress}% Complete</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${activeStatus.progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="bg-gradient-to-r from-primary to-secondary h-full rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Real-Time Status Timeline */}
        <div className="glass-panel p-6 rounded-3xl border-white/5 mt-6 space-y-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3">Live Progress Checklist</h3>
          
          <div className="relative border-l-2 border-white/5 ml-3 pl-6 space-y-8">
            {statuses.map((step, idx) => {
              const isPast = idx < currentIdx;
              const isCurrent = idx === currentIdx;
              
              return (
                <div key={step.name} className="relative">
                  {/* Indicator Dot */}
                  <span className={`absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border ${
                    isPast
                      ? "bg-primary border-primary text-white"
                      : isCurrent
                      ? "bg-slate-950 border-primary animate-pulse-glow"
                      : "bg-slate-950 border-white/10"
                  }`}>
                    {isPast && <Check className="h-2.5 w-2.5" />}
                    {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </span>

                  {/* Text Details */}
                  <div className="space-y-0.5">
                    <h4 className={`text-sm font-bold ${
                      isPast ? "text-slate-300" : isCurrent ? "text-primary font-extrabold" : "text-slate-500"
                    }`}>
                      {step.label}
                    </h4>
                    <p className={`text-xs ${isCurrent ? "text-slate-300" : "text-slate-500"}`}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details Platter */}
        <div className="glass-panel p-6 rounded-3xl border-white/5 mt-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3">Platter Summary</h3>
          
          <div className="space-y-3">
            {order.items.map((it) => (
              <div key={it.id} className="flex justify-between items-center text-sm">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs text-primary bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5">
                    {it.quantity}x
                  </span>
                  <span className="text-slate-200 font-medium">{it.name}</span>
                </div>
                <span className="text-slate-300 font-bold">₹{it.price * it.quantity}</span>
              </div>
            ))}

            {order.notes && (
              <div className="p-3 bg-slate-900/50 border border-white/5 rounded-xl text-xs text-secondary-400 mt-2">
                <strong>Cooking Note:</strong> {order.notes}
              </div>
            )}

            <div className="border-t border-white/5 pt-3 flex justify-between items-center text-sm font-bold text-white">
              <span>Grand Total</span>
              <span className="text-primary text-base">₹{order.amount}</span>
            </div>
          </div>
        </div>

        {/* Completed Feedback Panel */}
        {order.status === "Completed" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 rounded-3xl border-white/5 mt-6 space-y-4"
          >
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-3">
              <MessageSquare className="h-4 w-4 text-primary" />
              Rate Your Street Food Experience
            </h3>

            {feedbackSubmitted ? (
              <div className="text-center py-6 text-slate-300 text-sm font-semibold space-y-2">
                <p>✓ Feedback submitted. Thank you for making us part of your day!</p>
                <Link href="/" className="text-xs text-primary hover:underline">Return to Home</Link>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">Rating:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star className={`h-5 w-5 ${
                          star <= rating ? "text-secondary fill-secondary" : "text-slate-600"
                        }`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Your Name</label>
                  <input
                    type="text"
                    required
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Comment</label>
                  <textarea
                    rows={2}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="How was the mint water? Were the puris crispy?"
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-2 rounded-xl text-xs transition-all"
                >
                  Submit Review
                </button>
              </form>
            )}
          </motion.div>
        )}

        {/* WhatsApp Notification Simulator */}
        {order.phone && (
          <div className="mt-6 text-center">
            <Link
              href={`https://api.whatsapp.com/send?phone=${order.phone}&text=Hi%20${order.customerName},%20your%20Pani%20Puri%20Paradise%20token%20is%20%23${order.token}.%20Current%20status%20is%20${order.status}.`}
              target="_blank"
              className="inline-flex items-center text-xs text-slate-400 hover:text-white transition-colors underline"
            >
              Simulate WhatsApp Notification
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
