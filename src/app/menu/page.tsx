"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useDatabase } from "@/context/DatabaseContext";
import { useCart } from "@/context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  X, 
  Check, 
  AlertCircle,
  HelpCircle,
  MapPin
} from "lucide-react";

export default function MenuPage() {
  const router = useRouter();
  const { menu, settings, addOrder } = useDatabase();
  const { cart, addToCart, updateQuantity, clearCart, cartTotal } = useCart();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Cart Drawer & Checkout modal states
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [branch, setBranch] = useState("Main Branch");
  const [globalNotes, setGlobalNotes] = useState("");

  // Item custom note temp state
  const [itemNoteId, setItemNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState("");

  const categories = ["All", "Pani Puri", "Dahi Puri", "Sev Puri", "Ragda Puri", "Chaat", "Drinks"];

  // Filtered Menu Items
  const filteredMenu = menu.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (item: any) => {
    addToCart(item, 1, "");
  };

  const openNoteModal = (itemId: string, currentNote: string) => {
    setItemNoteId(itemId);
    setTempNote(currentNote);
  };

  const saveItemNote = (itemId: string) => {
    const cartItem = cart.find(i => i.item.id === itemId);
    if (cartItem) {
      updateQuantity(itemId, cartItem.quantity); // Keep quantity, but we need notes
      // Let's modify cart context to update notes directly. 
      // Simple fallback: remove and re-add with custom note
      cartItem.notes = tempNote;
    }
    setItemNoteId(null);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!customerName.trim()) {
      alert("Please enter your name");
      return;
    }

    setIsSubmitting(true);
    try {
      // Map cart items to OrderItem schema
      const orderItems = cart.map((ci) => ({
        id: ci.item.id,
        name: ci.item.name,
        quantity: ci.quantity,
        price: ci.item.price,
        category: ci.item.category
      }));

      // Combine global note and item notes
      const notesArray = [];
      if (globalNotes.trim()) notesArray.push(`General: ${globalNotes}`);
      cart.forEach((ci) => {
        if (ci.notes.trim()) {
          notesArray.push(`${ci.item.name}: ${ci.notes}`);
        }
      });
      const finalNotes = notesArray.join(" | ");

      const orderId = await addOrder(
        customerName,
        orderItems,
        cartTotal,
        finalNotes,
        branch,
        phone
      );

      clearCart();
      setIsCheckingOut(false);
      setIsCartOpen(false);
      
      // Redirect to tracking page
      router.push(`/track/${orderId}`);
    } catch (e) {
      console.error(e);
      alert("Error submitting order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Banner Alert if restaurant is closed */}
        {settings.restaurantStatus !== "Open" && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              We are currently CLOSED. You can still browse the menu and place simulated local orders, but our kitchen is offline.
            </p>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Paradise <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Digital Menu</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">Fresh ingredients, hygienic preparation, instant serving</p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search crispy puri..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>

        {/* Categories Tab Bar */}
        <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar scroll-smooth">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex-shrink-0 border ${
                selectedCategory === cat
                  ? "bg-primary border-primary text-white shadow-lg shadow-primary/25"
                  : "bg-slate-900/50 border-white/5 text-slate-400 hover:text-white hover:border-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
          <AnimatePresence mode="popLayout">
            {filteredMenu.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel border-white/5 rounded-2xl overflow-hidden flex flex-col justify-between"
              >
                {/* Product Image */}
                <div className="relative aspect-[4/3] bg-slate-900 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&q=80&w=400";
                    }}
                  />
                  {!item.inStock && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center">
                      <span className="bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                        Out of Stock
                      </span>
                    </div>
                  )}
                  <span className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-md text-secondary text-xs font-bold px-2.5 py-1 rounded-lg border border-white/5">
                    {item.category}
                  </span>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2 flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white text-base">{item.name}</h3>
                      <span className="font-extrabold text-primary text-base">₹{item.price}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-3">
                    {item.inStock ? (
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-bold py-2 rounded-xl text-xs border border-white/5 hover:border-white/10 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5 text-primary" />
                        Add to Cart
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full bg-slate-900 text-slate-600 font-bold py-2 rounded-xl text-xs border border-white/5 cursor-not-allowed text-center"
                      >
                        Unavailable
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Floating Cart Button for Mobile */}
        {cart.length > 0 && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-6 right-6 z-40 bg-primary text-white p-4 rounded-full shadow-2xl shadow-primary/40 flex items-center gap-2 hover:scale-105 transition-transform md:hidden"
          >
            <ShoppingBag className="h-6 w-6" />
            <span className="bg-slate-950 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {cart.reduce((sum, ci) => sum + ci.quantity, 0)}
            </span>
          </motion.button>
        )}
      </main>

      {/* Cart Panel Sidebar (Slideout Drawer) */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 z-45 bg-black"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-slate-900 border-l border-white/5 shadow-2xl flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold text-white">Your Order Platter</h2>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Items List */}
              <div className="p-4 flex-grow overflow-y-auto space-y-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
                    <ShoppingBag className="h-12 w-12 text-slate-600 animate-pulse" />
                    <p className="text-sm font-semibold">Your platter is empty.</p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="text-xs text-primary font-bold hover:underline"
                    >
                      Browse items
                    </button>
                  </div>
                ) : (
                  cart.map((ci) => (
                    <div
                      key={ci.item.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-white/5 flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-white text-sm">{ci.item.name}</h4>
                          <span className="text-xs text-slate-400 font-medium mt-0.5 inline-block">
                            ₹{ci.item.price} each
                          </span>
                        </div>
                        <span className="font-bold text-primary text-sm">
                          ₹{ci.item.price * ci.quantity}
                        </span>
                      </div>

                      {/* Customize item notes */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                        <button
                          onClick={() => openNoteModal(ci.item.id, ci.notes)}
                          className="text-[10px] font-bold text-secondary hover:underline flex items-center"
                        >
                          {ci.notes ? `Note: ${ci.notes}` : "+ Add cooking note"}
                        </button>

                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => updateQuantity(ci.item.id, ci.quantity - 1)}
                            className="p-1 rounded-md bg-slate-900 border border-white/5 text-slate-400 hover:text-white"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-sm font-bold text-white w-4 text-center">
                            {ci.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(ci.item.id, ci.quantity + 1)}
                            className="p-1 rounded-md bg-slate-900 border border-white/5 text-slate-400 hover:text-white"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer & Checkout Action */}
              <div className="p-4 border-t border-white/5 bg-slate-950/50 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-400">Total Price</span>
                  <span className="text-xl font-extrabold text-white">₹{cartTotal}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={clearCart}
                    className="p-3 rounded-xl bg-slate-900 text-rose-400 hover:text-rose-300 border border-white/5 flex items-center justify-center hover:bg-slate-800"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setIsCheckingOut(true)}
                    disabled={cart.length === 0}
                    className="flex-grow bg-primary hover:bg-primary/90 disabled:bg-slate-900 text-white font-bold py-3 rounded-xl transition-all disabled:text-slate-600 disabled:cursor-not-allowed text-center text-sm shadow-lg shadow-primary/10"
                  >
                    Confirm & Place Order
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Checkout Information Modal */}
      <AnimatePresence>
        {isCheckingOut && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckingOut(false)}
              className="absolute inset-0 bg-black"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-slate-900 border border-white/10 p-6 rounded-3xl shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <h3 className="text-lg font-bold text-white">Platter Confirmation</h3>
                <button
                  onClick={() => setIsCheckingOut(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                {/* Customer Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter name for token call"
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                {/* Mobile / WhatsApp */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">WhatsApp Mobile (Optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="91xxxxxxxx (For live messages)"
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                {/* Branch Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-primary" /> Select Branch
                  </label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                  >
                    <option value="Main Branch">Main Branch (Block-4)</option>
                    <option value="Express Outlet">Express Outlet (Station Road)</option>
                  </select>
                </div>

                {/* Special Instructions */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Special Instructions</label>
                  <textarea
                    rows={2}
                    value={globalNotes}
                    onChange={(e) => setGlobalNotes(e.target.value)}
                    placeholder="Any general request? e.g. Extra onions, double puri container"
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                  />
                </div>

                {/* Order Summary */}
                <div className="p-3 bg-slate-950 border border-white/5 rounded-xl text-xs space-y-1 text-slate-400">
                  <div className="flex justify-between font-medium">
                    <span>Items Total</span>
                    <span className="text-white">₹{cartTotal}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Tax & Services</span>
                    <span className="text-success">FREE (Grand Opening)</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-white pt-2 border-t border-white/5">
                    <span>Amount Payable</span>
                    <span className="text-primary">₹{cartTotal}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCheckingOut(false)}
                    className="w-1/3 py-2.5 rounded-xl bg-slate-950 border border-white/5 hover:bg-slate-800 text-xs font-semibold text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-grow py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-lg shadow-primary/10"
                  >
                    {isSubmitting ? "Generating Token..." : `Pay & Get Token (₹${cartTotal})`}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Item Cooking Note Modal */}
      <AnimatePresence>
        {itemNoteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setItemNoteId(null)}
              className="absolute inset-0 bg-black"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-slate-900 border border-white/10 p-5 rounded-2xl shadow-2xl space-y-3"
            >
              <h4 className="font-bold text-white text-sm">Add Cooking Instructions</h4>
              <p className="text-xs text-slate-400">
                Specify spice preference or allergy details for this item.
              </p>
              <input
                type="text"
                value={tempNote}
                onChange={(e) => setTempNote(e.target.value)}
                placeholder="e.g. Extra spicy sweet water, no garlic, double onions"
                className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveItemNote(itemNoteId);
                }}
              />
              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => setItemNoteId(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-white/5 text-xs text-slate-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveItemNote(itemNoteId)}
                  className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/95 text-white text-xs font-bold"
                >
                  Save Note
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
