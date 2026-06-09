"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useDatabase } from "@/context/DatabaseContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  TrendingUp, 
  Users, 
  Coins, 
  UtensilsCrossed, 
  ArrowRight, 
  CheckCircle,
  Play, 
  MessageSquare, 
  Clock,
  ShieldCheck
} from "lucide-react";

export default function LandingPage() {
  const { orders, settings, feedback } = useDatabase();
  const [stats, setStats] = useState({
    activeOrdersCount: 0,
    todayRevenue: 0,
    activeCustomers: 0,
    completionRate: 100,
  });

  // Calculate stats in real-time
  useEffect(() => {
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const active = orders.filter(o => o.status !== "Completed");
    const todayCompleted = orders.filter(o => o.status === "Completed" && o.createdAt >= todayStart);
    const revenue = todayCompleted.reduce((sum, o) => sum + o.amount, 0);
    
    const totalOrdersToday = orders.filter(o => o.createdAt >= todayStart).length;
    const completedTodayCount = todayCompleted.length;
    const rate = totalOrdersToday > 0 ? Math.round((completedTodayCount / totalOrdersToday) * 100) : 100;

    setStats({
      activeOrdersCount: active.length,
      todayRevenue: revenue,
      activeCustomers: active.length,
      completionRate: rate,
    });
  }, [orders]);

  // Activity feed: extract 4 most recent orders/status changes
  const recentActivities = orders
    .slice(0, 4)
    .map((order) => {
      let message = "";
      let color = "text-amber-400";
      
      if (order.status === "Pending") {
        message = `New order #${order.token} placed by ${order.customerName}`;
        color = "text-amber-400";
      } else if (order.status === "Preparing") {
        message = `Order #${order.token} is now being prepared in the kitchen`;
        color = "text-orange-400";
      } else if (order.status === "Ready") {
        message = `Order #${order.token} is READY for collection!`;
        color = "text-green-400";
      } else if (order.status === "Completed") {
        message = `Order #${order.token} served successfully`;
        color = "text-slate-400";
      }

      return {
        id: order.id,
        message,
        time: new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status: order.status,
        color,
      };
    });

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-slate-950">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-80 h-80 bg-secondary/5 rounded-full filter blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-primary/5 rounded-full filter blur-[120px] pointer-events-none" />

      <Navbar />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-4 pt-10 pb-16 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-12 z-10">
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs text-secondary-400">
            <Sparkles className="h-4 w-4 text-secondary animate-bounce" />
            <span className="text-secondary font-medium">Welcome to the Future of Street Food</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Craving Crispy? <br />
            <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Pani Puri Paradise
            </span>
          </h1>
          
          <p className="text-lg text-slate-300 max-w-xl mx-auto lg:mx-0">
            Order online, track your token in real-time, and watch our live kitchen scoreboard advance your order from frying to serving instantly!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link
              href="/menu"
              className="inline-flex items-center justify-center bg-primary hover:bg-primary/95 text-white font-bold px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-primary/25 hover:shadow-primary/45 group hover:scale-[1.02]"
            >
              <UtensilsCrossed className="mr-2 h-5 w-5" />
              Order Digital Menu
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/track"
              className="inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-semibold border border-white/10 px-6 py-3.5 rounded-xl transition-all hover:scale-[1.02]"
            >
              <Clock className="mr-2 h-5 w-5 text-secondary" />
              Track Your Token
            </Link>
          </div>
        </div>

        {/* Hero Banner / Preview */}
        <div className="flex-1 w-full max-w-lg lg:max-w-none relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-3xl filter blur-xl opacity-30" />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="glass-panel border-white/10 rounded-3xl overflow-hidden p-2 shadow-2xl relative"
          >
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
              <img
                src="/assets/images/hero-bg.png"
                alt="Delicious Crispy Pani Puri Platter"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to high quality unsplash if local image fails
                  e.currentTarget.src = "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=1000";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              
              {/* Floating Live Serve Indicator */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center bg-slate-900/90 backdrop-blur-md border border-white/10 p-4 rounded-xl">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
                    <span className="text-[10px] uppercase font-bold text-success tracking-wider">Now Serving</span>
                  </div>
                  <div className="text-2xl font-black text-white glow-text-primary mt-0.5">
                    #{settings.currentToken}
                  </div>
                </div>
                <Link
                  href="/dashboard"
                  className="bg-primary text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center hover:bg-accent transition-colors"
                >
                  <Play className="h-3 w-3 mr-1 fill-white" />
                  Live TV View
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Statistics Cards */}
      <section className="mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8 z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Serving Token */}
          <motion.div
            whileHover={{ y: -5 }}
            className="glass-panel glass-panel-hover p-6 rounded-2xl border-white/5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <UtensilsCrossed className="h-16 w-16 text-primary" />
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-semibold uppercase tracking-wider">Now Serving</p>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 glow-text-primary">
              #{settings.currentToken}
            </h3>
            <div className="flex items-center text-xs text-success mt-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse mr-1.5" />
              <span>Live counter</span>
            </div>
          </motion.div>

          {/* Card 2: Today's Revenue */}
          <motion.div
            whileHover={{ y: -5 }}
            className="glass-panel glass-panel-hover p-6 rounded-2xl border-white/5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Coins className="h-16 w-16 text-secondary" />
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-semibold uppercase tracking-wider">Today's Revenue</p>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 glow-text-secondary">
              ₹{stats.todayRevenue}
            </h3>
            <div className="flex items-center text-xs text-slate-400 mt-2">
              <TrendingUp className="h-3 w-3 mr-1 text-primary" />
              <span>From live orders</span>
            </div>
          </motion.div>

          {/* Card 3: Active Customers */}
          <motion.div
            whileHover={{ y: -5 }}
            className="glass-panel glass-panel-hover p-6 rounded-2xl border-white/5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Users className="h-16 w-16 text-cyan-400" />
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-semibold uppercase tracking-wider">Active Customers</p>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 text-cyan-400">
              {stats.activeCustomers}
            </h3>
            <div className="flex items-center text-xs text-slate-400 mt-2">
              <span>Waiting for food</span>
            </div>
          </motion.div>

          {/* Card 4: Fulfilled Rate */}
          <motion.div
            whileHover={{ y: -5 }}
            className="glass-panel glass-panel-hover p-6 rounded-2xl border-white/5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <CheckCircle className="h-16 w-16 text-green-400" />
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-semibold uppercase tracking-wider">Success Rate</p>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 text-green-400">
              {stats.completionRate}%
            </h3>
            <div className="flex items-center text-xs text-slate-400 mt-2">
              <ShieldCheck className="h-3 w-3 mr-1 text-green-400" />
              <span>Hygienic & On-Time</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Real-Time Activity Feed & Quick Actions */}
      <section className="mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8 z-10">
        {/* Live Activity Feed */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border-white/5 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse mr-2.5" />
                Real-Time Activity Feed
              </h2>
              <p className="text-xs text-slate-400 mt-1">Live order updates from the kitchen counter</p>
            </div>
            <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-md px-2 py-0.5 uppercase tracking-wide">
              Live
            </span>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {recentActivities.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-10 text-center text-slate-400 text-sm"
                >
                  No active orders at the moment. Try placing an order in the Menu!
                </motion.div>
              ) : (
                recentActivities.map((act) => (
                  <motion.div
                    key={act.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/50 border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg bg-slate-950 flex items-center justify-center`}>
                        <UtensilsCrossed className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${act.color}`}>
                          {act.message}
                        </p>
                        <span className="text-[10px] text-slate-400">{act.time}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      act.status === "Ready" 
                        ? "bg-green-500/10 text-green-400" 
                        : act.status === "Preparing"
                        ? "bg-orange-500/10 text-orange-400"
                        : act.status === "Pending"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-slate-500/10 text-slate-400"
                    }`}>
                      {act.status}
                    </span>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* QR Code and Quick Tracker Panel */}
        <div className="glass-panel p-6 rounded-3xl border-white/5 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center">
              <Sparkles className="h-5 w-5 text-secondary mr-2" />
              Quick QR Access
            </h2>
            <p className="text-sm text-slate-300">
              Scan this QR code with your mobile device to view the digital menu and place your order instantly from your table!
            </p>
            <div className="flex justify-center bg-slate-900 border border-white/5 p-4 rounded-2xl w-40 h-40 mx-auto items-center relative group">
              {/* QR Code SVG Generation */}
              <svg className="w-32 h-32 text-white" viewBox="0 0 29 29" fill="currentColor">
                <path d="M0 0h9v9H0zm1 1h7v7H1zm1 1h5v5H2zm7 0h2v2H9zm2 2h2v2h-2zm-2 2h2v2H9zm11-6h9v9h-9zm1 1h7v7h-7zm1 1h5v5h-5zm7 0h2v2h-2zm2 2h2v2h-2zm-2 2h2v2h-2zm-20 11h9v9H0zm1 1h7v7H1zm1 1h5v5H2zm7 0h2v2H9zm2 2h2v2h-2zm-2 2h2v2H9zm11-6h2v2h-2zm2 2h2v2h-2zm-2 2h2v2h-2zm2-4h2v2h-2zm2 2h2v2h-2zm2-2h2v2h-2zm-4 4h2v2h-2zm4 2h2v2h-2zm-2 2h2v2h-2zm-8-2h2v2h-2zm2 2h2v2h-2zm2-2h2v2h-2z"/>
              </svg>
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
                <Link
                  href="/menu"
                  className="bg-primary text-white text-xs font-bold px-3 py-2 rounded-xl"
                >
                  Open Menu
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-4">
            <Link
              href="/track"
              className="w-full inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl border border-white/5 hover:border-white/15 transition-all text-sm"
            >
              Search Your Token Track
            </Link>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8 z-10">
        <h2 className="text-2xl font-bold text-white text-center mb-8 flex items-center justify-center">
          <MessageSquare className="h-6 w-6 text-primary mr-2.5" />
          What Street Food Lovers Say
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {feedback.slice(0, 3).map((fb) => (
            <motion.div
              key={fb.id}
              whileHover={{ scale: 1.01 }}
              className="glass-panel p-6 rounded-2xl border-white/5 flex flex-col justify-between"
            >
              <p className="text-sm text-slate-300 italic">"{fb.comment}"</p>
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{fb.customerName}</span>
                <div className="flex text-secondary text-xs">
                  {Array.from({ length: fb.rating }).map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
