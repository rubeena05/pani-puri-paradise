import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { DatabaseProvider } from "@/context/DatabaseContext";
import { CartProvider } from "@/context/CartContext";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Pani Puri Paradise | Real-Time Live Order Dashboard",
  description: "Experience the ultimate street food vibes with real-time live order tracking, digital menu ordering, and kitchen display updates at Pani Puri Paradise.",
  keywords: ["Pani Puri", "Chaat", "Real-Time Dashboard", "Live Order Tracking", "Street Food", "Next.js", "Firebase"],
  authors: [{ name: "Pani Puri Paradise Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-dashboard-bg text-slate-100 selection:bg-primary selection:text-white">
        <DatabaseProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </DatabaseProvider>
      </body>
    </html>
  );
}
