"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useDatabase } from "@/context/DatabaseContext";
import { ShoppingBag, Menu, X, Sparkles, Monitor, ShieldAlert, Compass } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { cartCount } = useCart();
  const { settings, dbMode } = useDatabase();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/", icon: Compass },
    { name: "Menu", href: "/menu", icon: Sparkles },
    { name: "Track Order", href: "/track", icon: Monitor },
    { name: "TV Dashboard", href: "/dashboard", icon: Monitor },
    { name: "Admin Portal", href: "/admin", icon: ShieldAlert },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-slate-950/70 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
                Pani Puri <span className="text-accent">Paradise</span>
              </span>
              {settings.restaurantStatus === "Open" ? (
                <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success ring-1 ring-inset ring-success/20 animate-pulse">
                  Open
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-400 ring-1 ring-inset ring-rose-500/20">
                  Closed
                </span>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary/15 text-primary border border-primary/20"
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <Icon className="mr-1.5 h-4 w-4" />
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Cart Badge & Mobile Toggle */}
          <div className="flex items-center space-x-2">
            {/* Live Database Mode Badge */}
            <span className={`hidden sm:inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
              dbMode === "firebase" 
                ? "bg-cyan-400/10 text-cyan-400 ring-cyan-400/30" 
                : "bg-amber-400/10 text-amber-400 ring-amber-400/30"
            }`}>
              {dbMode === "firebase" ? "Firestore Mode" : "Simulated Local"}
            </span>

            <Link
              href="/menu"
              className="relative p-2 text-slate-300 hover:text-white rounded-full bg-slate-900 border border-white/5 transition-all hover:scale-105"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white ring-2 ring-slate-950 animate-bounce">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex md:hidden items-center justify-center p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-900 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-b border-white/5 bg-slate-950/95 backdrop-blur-lg px-2 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center px-4 py-3 rounded-lg text-base font-semibold transition-all ${
                  isActive
                    ? "bg-primary/20 text-primary border-l-4 border-primary"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {link.name}
              </Link>
            );
          })}
          <div className="pt-4 px-4 flex justify-between items-center border-t border-white/5">
            <span className="text-xs text-slate-400">Database Connection</span>
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
              dbMode === "firebase" 
                ? "bg-cyan-400/10 text-cyan-400 ring-cyan-400/30" 
                : "bg-amber-400/10 text-amber-400 ring-amber-400/30"
            }`}>
              {dbMode === "firebase" ? "Firestore Mode" : "Simulated Local"}
            </span>
          </div>
        </div>
      )}
    </nav>
  );
}
