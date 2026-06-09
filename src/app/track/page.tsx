"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useDatabase } from "@/context/DatabaseContext";
import { Search, Compass, AlertCircle, ArrowRight } from "lucide-react";

export default function TrackSearchPage() {
  const router = useRouter();
  const { orders } = useDatabase();
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!query.trim()) {
      setError("Please enter a token number or order ID");
      return;
    }

    const cleanQuery = query.trim().toUpperCase();
    
    // Check if there is an order with this ID or Token
    const foundOrder = orders.find(
      (o) => o.id === cleanQuery || o.token.toString() === cleanQuery || o.id === `PPP-${cleanQuery}`
    );

    if (foundOrder) {
      router.push(`/track/${foundOrder.id}`);
    } else {
      setError("Order not found. Please double-check your receipt or token number.");
    }
  };

  // Find recent active orders for quick tracking links
  const recentActiveOrders = orders
    .filter((o) => o.status !== "Completed")
    .slice(0, 5);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      <Navbar />

      <main className="flex-grow max-w-md w-full mx-auto px-4 py-16 flex flex-col justify-center space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 border border-primary/20 mb-2">
            <Compass className="h-8 w-8 text-primary animate-spin-slow" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Live Order <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Tracker</span>
          </h1>
          <p className="text-sm text-slate-400">
            Enter the token number or order ID from your receipt to track your street food platter in real-time.
          </p>
        </div>

        {/* Search Form */}
        <div className="glass-panel p-6 rounded-3xl border-white/5 space-y-4 shadow-xl">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Enter Token # (e.g. 101) or ID"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-slate-950 border border-white/5 rounded-2xl pl-11 pr-4 py-3.5 text-base text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-primary/15 text-sm"
            >
              Track Order Status
            </button>
          </form>
        </div>

        {/* Quick click suggestions */}
        {recentActiveOrders.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
              Active Orders In Progress
            </h3>
            <div className="space-y-2">
              {recentActiveOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => router.push(`/track/${order.id}`)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-white/5 hover:border-white/10 hover:bg-slate-900/70 transition-all text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 rounded px-2 py-0.5">
                      #{order.token}
                    </span>
                    <span className="text-sm font-medium text-slate-300">
                      {order.customerName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 group-hover:text-white transition-colors">
                    <span className="capitalize">{order.status}</span>
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
