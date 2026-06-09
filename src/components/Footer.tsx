"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Phone, MapPin, Clock } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-slate-950 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Pani Puri <span className="text-accent">Paradise</span>
            </span>
            <p className="text-sm text-slate-400">
              Serving the crispiest, tangiest, and most hygienic street food delicacies. Experience real-time live order updates and a premium dining experience.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 tracking-wider uppercase mb-3">Quick Navigation</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              </li>
              <li>
                <Link href="/menu" className="hover:text-primary transition-colors">Digital Menu</Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-primary transition-colors">Track Order</Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-primary transition-colors">TV Dashboard</Link>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 tracking-wider uppercase mb-3">Operating Hours</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-secondary" />
                <span>Mon - Thu: 4:00 PM - 10:00 PM</span>
              </li>
              <li className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-secondary" />
                <span>Fri - Sun: 12:00 PM - 11:00 PM</span>
              </li>
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 tracking-wider uppercase mb-3">Get in Touch</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-primary" />
                <span>Food Street, Block-4, Paradise Plaza</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-primary" />
                <span>+91 98765 43210</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/5 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Pani Puri Paradise. All rights reserved. Built with Next.js & Firebase.
          </p>
          <div className="flex items-center space-x-1 mt-4 sm:mt-0 text-xs text-slate-500">
            <span>Made with love for fine street food</span>
            <Sparkles className="h-3 w-3 text-secondary animate-pulse" />
          </div>
        </div>
      </div>
    </footer>
  );
}
