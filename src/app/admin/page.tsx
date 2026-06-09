"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useDatabase, Order, MenuItem, CustomerFeedback } from "@/context/DatabaseContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart3, 
  ChefHat, 
  ClipboardList, 
  LogOut, 
  MessageSquare, 
  Plus, 
  Printer, 
  Settings, 
  Trash2, 
  Upload, 
  User, 
  Check, 
  AlertCircle,
  TrendingUp,
  MapPin,
  Search,
  CheckSquare,
  Square,
  Sparkles,
  Phone,
  Power
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell, 
  PieChart, 
  Pie 
} from "recharts";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { 
    orders, 
    menu, 
    settings, 
    feedback,
    addOrder,
    updateOrderStatus,
    deleteOrder,
    updateMenuItem,
    addMenuItem,
    deleteMenuItem,
    updateSettings,
    saveFirebaseConfig,
    clearFirebaseConfig,
    firebaseConfig,
    dbMode
  } = useDatabase();

  // Authentication Guard
  const [isAuth, setIsAuth] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const loggedIn = localStorage.getItem("ppp_admin_auth") === "true";
      if (!loggedIn) {
        router.push("/admin/login");
      } else {
        setIsAuth(true);
      }
    }
  }, []);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"orders" | "kitchen" | "menu" | "analytics" | "feedback" | "settings">("orders");

  // Filter States for Orders
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("All");
  const [orderBranchFilter, setOrderBranchFilter] = useState<string>("All");

  // Sound triggers
  const prevOrderCountRef = useRef(0);
  const playNewOrderBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch(e) {}
  };

  useEffect(() => {
    if (orders.length > prevOrderCountRef.current && prevOrderCountRef.current > 0) {
      playNewOrderBeep();
    }
    prevOrderCountRef.current = orders.length;
  }, [orders.length]);

  // Listener for simulated background order placement
  useEffect(() => {
    const handleNewOrderEvent = () => {
      playNewOrderBeep();
    };
    window.addEventListener("newLocalOrder", handleNewOrderEvent);
    return () => window.removeEventListener("newLocalOrder", handleNewOrderEvent);
  }, []);

  // Modals
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);

  // New Menu Item Form State
  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuPrice, setNewMenuPrice] = useState("");
  const [newMenuCategory, setNewMenuCategory] = useState<MenuItem["category"]>("Pani Puri");
  const [newMenuImage, setNewMenuImage] = useState("");
  const [newMenuDescription, setNewMenuDescription] = useState("");

  // Manual Order Placement State
  const [manualCustomer, setManualCustomer] = useState("");
  const [manualBranch, setManualBranch] = useState("Main Branch");
  const [manualCart, setManualCart] = useState<{ [itemId: string]: number }>({});
  const [manualNotes, setManualNotes] = useState("");

  // Firebase Config Form State
  const [fbApiKey, setFbApiKey] = useState(firebaseConfig?.apiKey || "");
  const [fbAuthDomain, setFbAuthDomain] = useState(firebaseConfig?.authDomain || "");
  const [fbProjectId, setFbProjectId] = useState(firebaseConfig?.projectId || "");
  const [fbAppId, setFbAppId] = useState(firebaseConfig?.appId || "");

  // Kitchen Item Checklist State
  const [kitchenChecklist, setKitchenChecklist] = useState<{ [orderItemId: string]: boolean }>({});

  const handleLogout = () => {
    localStorage.removeItem("ppp_admin_auth");
    router.push("/admin/login");
  };

  // --- ORDER CRUD HANDLERS ---
  const handleAddManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCustomer.trim()) return;
    
    const orderItems = Object.keys(manualCart)
      .map((id) => {
        const item = menu.find((m) => m.id === id);
        return item ? {
          id: item.id,
          name: item.name,
          quantity: manualCart[id],
          price: item.price,
          category: item.category
        } : null;
      })
      .filter((it): it is NonNullable<typeof it> => it !== null && it.quantity > 0);

    if (orderItems.length === 0) {
      alert("Please select at least 1 item");
      return;
    }

    const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    await addOrder(manualCustomer, orderItems, total, manualNotes, manualBranch, "");
    setManualCustomer("");
    setManualCart({});
    setManualNotes("");
    setShowAddOrderModal(false);
  };

  // --- MENU CRUD HANDLERS ---
  const handleCreateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuName.trim() || !newMenuPrice) return;

    const priceNum = parseFloat(newMenuPrice);
    if (isNaN(priceNum)) return;

    const imgUrl = newMenuImage.trim() || "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&q=80&w=400";

    await addMenuItem({
      name: newMenuName,
      price: priceNum,
      category: newMenuCategory,
      image: imgUrl,
      description: newMenuDescription,
      inStock: true
    });

    setNewMenuName("");
    setNewMenuPrice("");
    setNewMenuImage("");
    setNewMenuDescription("");
    setShowAddMenuModal(false);
  };

  const handleToggleStock = async (itemId: string, currentStock: boolean) => {
    await updateMenuItem(itemId, { inStock: !currentStock });
  };

  const handleUpdatePrice = async (itemId: string, newPrice: string) => {
    const priceNum = parseFloat(newPrice);
    if (isNaN(priceNum)) return;
    await updateMenuItem(itemId, { price: priceNum });
  };

  // --- SETTINGS HANDLERS ---
  const handleSaveFirebase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbApiKey || !fbProjectId) {
      alert("API Key and Project ID are required");
      return;
    }
    saveFirebaseConfig({
      apiKey: fbApiKey,
      authDomain: fbAuthDomain,
      projectId: fbProjectId,
      appId: fbAppId
    });
    alert("Firebase Credentials Saved! System is reconnecting...");
  };

  const handleResetFirebase = () => {
    clearFirebaseConfig();
    setFbApiKey("");
    setFbAuthDomain("");
    setFbProjectId("");
    setFbAppId("");
    alert("Firebase config cleared. Falling back to local mode.");
  };

  const handleResetToken = async () => {
    if (confirm("Reset served token counter to #100?")) {
      await updateSettings({ currentToken: 100 });
    }
  };

  // Print Receipt Trigger
  const triggerPrintReceipt = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (!isAuth) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Verifying credentials...</div>;
  }

  // Filter Orders list
  const filteredOrders = orders.filter((o) => {
    const matchesSearch = o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) || 
                          o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
                          o.token.toString().includes(orderSearch);
    const matchesStatus = orderStatusFilter === "All" || o.status === orderStatusFilter;
    const matchesBranch = orderBranchFilter === "All" || o.branch === orderBranchFilter;
    return matchesSearch && matchesStatus && matchesBranch;
  });

  // --- ANALYTICS DATA GENERATION ---
  const getSalesChartData = () => {
    // Group sales by day
    const salesMap: { [day: string]: number } = {};
    orders
      .filter((o) => o.status === "Completed")
      .forEach((order) => {
        const dateStr = new Date(order.createdAt).toLocaleDateString([], { month: "short", day: "numeric" });
        salesMap[dateStr] = (salesMap[dateStr] || 0) + order.amount;
      });

    const data = Object.keys(salesMap).map((day) => ({
      day,
      Revenue: salesMap[day]
    }));
    
    // Sort chronologically (simple fallback: reverse orders array direction)
    return data.reverse();
  };

  const getCategoryChartData = () => {
    const catMap: { [cat: string]: number } = {};
    orders
      .filter((o) => o.status === "Completed")
      .forEach((order) => {
        order.items.forEach((item) => {
          catMap[item.category] = (catMap[item.category] || 0) + item.quantity;
        });
      });

    const colors = ["#ff6b00", "#ffb703", "#fb8500", "#22c55e", "#06b6d4", "#a855f7"];
    return Object.keys(catMap).map((cat, idx) => ({
      name: cat,
      value: catMap[cat],
      color: colors[idx % colors.length]
    }));
  };

  const getPeakHoursData = () => {
    const hourMap: { [hr: string]: number } = {};
    // Populate with 24 hours
    for (let i = 8; i <= 22; i++) {
      const ampm = i >= 12 ? "PM" : "AM";
      const hr = (i % 12 || 12) + " " + ampm;
      hourMap[hr] = 0;
    }

    orders.forEach((order) => {
      const date = new Date(order.createdAt);
      const hrNum = date.getHours();
      if (hrNum >= 8 && hrNum <= 22) {
        const ampm = hrNum >= 12 ? "PM" : "AM";
        const hr = (hrNum % 12 || 12) + " " + ampm;
        hourMap[hr] = (hourMap[hr] || 0) + 1;
      }
    });

    return Object.keys(hourMap).map((hour) => ({
      Hour: hour,
      Orders: hourMap[hour]
    }));
  };

  const analyticsSummary = {
    totalOrdersCount: orders.length,
    completedOrdersCount: orders.filter((o) => o.status === "Completed").length,
    totalRevenueAmount: orders.filter((o) => o.status === "Completed").reduce((sum, o) => sum + o.amount, 0),
    avgWaitTime: orders.filter((o) => o.status === "Completed" && o.timeSpent).length > 0
      ? Math.round(
          orders.filter((o) => o.status === "Completed" && o.timeSpent).reduce((sum, o) => sum + (o.timeSpent || 0), 0) /
          orders.filter((o) => o.status === "Completed" && o.timeSpent).length / 60
        )
      : 5,
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 font-sans">
      <Navbar />

      <div className="flex-grow flex flex-col md:flex-row max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 gap-6">
        
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2">
          <div className="glass-panel p-4 rounded-2xl border-white/5 space-y-1">
            <div className="flex items-center space-x-2.5 px-3 py-2 border-b border-white/5 mb-2 pb-3">
              <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                AD
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none">Paradise Admin</p>
                <span className="text-[10px] text-slate-400 capitalize mt-1 inline-block">Role: Manager</span>
              </div>
            </div>

            {[
              { id: "orders", name: "Orders Manager", icon: ClipboardList },
              { id: "kitchen", name: "Kitchen Screen", icon: ChefHat },
              { id: "menu", name: "Menu Manager", icon: Plus },
              { id: "analytics", name: "Analytics Dashboard", icon: BarChart3 },
              { id: "feedback", name: "Reviews Panel", icon: MessageSquare },
              { id: "settings", name: "System Settings", icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === tab.id
                      ? "bg-primary text-white shadow-lg shadow-primary/25"
                      : "text-slate-400 hover:bg-slate-900/50 hover:text-white"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {tab.name}
                </button>
              );
            })}

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition-all mt-4 border border-rose-500/10"
            >
              <LogOut className="h-4.5 w-4.5" />
              Sign Out Panel
            </button>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-grow">
          
          {/* TAB 1: ORDER MANAGER */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white">Live Orders Manager</h2>
                  <p className="text-xs text-slate-400">Create, monitor, and transition order statuses in real-time</p>
                </div>

                <button
                  onClick={() => setShowAddOrderModal(true)}
                  className="bg-primary hover:bg-primary/95 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-primary/10 transition-transform hover:scale-[1.02]"
                >
                  <Plus className="h-4 w-4" />
                  Create Manual Order
                </button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/40 p-4 border border-white/5 rounded-2xl">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by customer, token..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div>
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-slate-400 focus:outline-none"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Ready">Ready</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <select
                    value={orderBranchFilter}
                    onChange={(e) => setOrderBranchFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-slate-400 focus:outline-none"
                  >
                    <option value="All">All Branches</option>
                    <option value="Main Branch">Main Branch</option>
                    <option value="Express Outlet">Express Outlet</option>
                  </select>
                </div>
              </div>

              {/* Orders List Table */}
              <div className="glass-panel border-white/5 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 border-b border-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="p-4">Token</th>
                        <th className="p-4">Customer</th>
                        <th className="p-4">Details</th>
                        <th className="p-4">Price</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      <AnimatePresence mode="popLayout">
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-500 italic text-xs">
                              No orders found.
                            </td>
                          </tr>
                        ) : (
                          filteredOrders.map((order) => (
                            <motion.tr
                              key={order.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="hover:bg-slate-900/30 transition-colors"
                            >
                              <td className="p-4">
                                <span className="font-extrabold text-white font-mono">
                                  #{order.token}
                                </span>
                                <span className="block text-[10px] text-slate-500 mt-0.5">{order.id}</span>
                              </td>
                              <td className="p-4">
                                <div className="font-semibold text-slate-200">{order.customerName}</div>
                                <span className="text-[10px] text-slate-500 flex items-center gap-0.5 mt-0.5">
                                  <MapPin className="h-2.5 w-2.5" /> {order.branch}
                                </span>
                              </td>
                              <td className="p-4 max-w-xs">
                                <div className="text-xs text-slate-300 space-x-1.5 flex flex-wrap gap-y-1">
                                  {order.items.map((it) => (
                                    <span key={it.id} className="bg-slate-900 px-2 py-0.5 rounded border border-white/5">
                                      {it.name} x{it.quantity}
                                    </span>
                                  ))}
                                </div>
                                {order.notes && (
                                  <span className="block text-[10px] text-amber-500/80 italic mt-1.5 truncate">
                                    Note: {order.notes}
                                  </span>
                                )}
                              </td>
                              <td className="p-4 font-bold text-slate-200">₹{order.amount}</td>
                              <td className="p-4">
                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${
                                  order.status === "Ready"
                                    ? "bg-green-500/10 text-green-400 ring-green-500/20"
                                    : order.status === "Preparing"
                                    ? "bg-orange-500/10 text-orange-400 ring-orange-500/20"
                                    : order.status === "Pending"
                                    ? "bg-amber-500/10 text-amber-400 ring-amber-500/20"
                                    : "bg-slate-500/10 text-slate-400 ring-slate-500/20"
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="p-4 text-right space-x-2 whitespace-nowrap">
                                {/* Transitions */}
                                {order.status === "Pending" && (
                                  <button
                                    onClick={() => updateOrderStatus(order.id, "Preparing")}
                                    className="bg-orange-500/15 hover:bg-orange-500 text-orange-400 hover:text-white border border-orange-500/20 px-2 py-1 rounded-lg text-xs font-bold transition-all"
                                  >
                                    Start Prep
                                  </button>
                                )}
                                {order.status === "Preparing" && (
                                  <button
                                    onClick={() => updateOrderStatus(order.id, "Ready")}
                                    className="bg-green-500/15 hover:bg-green-500 text-green-400 hover:text-white border border-green-500/20 px-2 py-1 rounded-lg text-xs font-bold transition-all"
                                  >
                                    Make Ready
                                  </button>
                                )}
                                {order.status === "Ready" && (
                                  <button
                                    onClick={() => updateOrderStatus(order.id, "Completed")}
                                    className="bg-slate-500/15 hover:bg-slate-500 text-slate-300 hover:text-white border border-slate-500/20 px-2 py-1 rounded-lg text-xs font-bold transition-all"
                                  >
                                    Serve Done
                                  </button>
                                )}
                                
                                {/* Receipt Print */}
                                <button
                                  onClick={() => setSelectedReceiptOrder(order)}
                                  className="p-1.5 rounded-lg bg-slate-900 border border-white/5 text-slate-400 hover:text-white inline-flex items-center"
                                  title="Print Receipt"
                                >
                                  <Printer className="h-4 w-4" />
                                </button>

                                {/* Delete */}
                                <button
                                  onClick={() => deleteOrder(order.id)}
                                  className="p-1.5 rounded-lg bg-slate-900 border border-white/5 text-rose-500 hover:bg-rose-500/15 hover:text-rose-400 inline-flex items-center"
                                  title="Cancel/Delete Order"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </motion.tr>
                          ))
                        )}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KITCHEN DISPLAY */}
          {activeTab === "kitchen" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white">Kitchen Display Screen</h2>
                <p className="text-xs text-slate-400">Active chef checklist. Monitor active items and timers</p>
              </div>

              {/* Grid of Active Orders */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {orders.filter((o) => o.status === "Pending" || o.status === "Preparing").length === 0 ? (
                    <div className="col-span-full py-16 text-center text-slate-500 italic text-sm">
                      No orders in preparation. Chef is currently relaxing! 
                    </div>
                  ) : (
                    orders
                      .filter((o) => o.status === "Pending" || o.status === "Preparing")
                      .reverse() // Oldest first
                      .map((order) => (
                        <motion.div
                          key={order.id}
                          layout
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.95, opacity: 0 }}
                          className={`glass-panel rounded-3xl border-white/5 overflow-hidden flex flex-col justify-between ${
                            order.status === "Pending" ? "border-amber-500/15" : "border-orange-500/15"
                          }`}
                        >
                          <div className="p-4 border-b border-white/5 flex items-center justify-between">
                            <div>
                              <span className="text-2xl font-black text-white font-mono">
                                #{order.token}
                              </span>
                              <span className="block text-[10px] text-slate-400 capitalize">{order.customerName}</span>
                            </div>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                              order.status === "Preparing" 
                                ? "bg-orange-500/10 text-orange-400" 
                                : "bg-amber-500/10 text-amber-400"
                            }`}>
                              {order.status}
                            </span>
                          </div>

                          <div className="p-4 flex-grow space-y-3">
                            {/* Checklist of items */}
                            <div className="space-y-2">
                              {order.items.map((it) => {
                                const checkKey = `${order.id}-${it.id}`;
                                const isChecked = !!kitchenChecklist[checkKey];
                                return (
                                  <div
                                    key={it.id}
                                    onClick={() => setKitchenChecklist({
                                      ...kitchenChecklist,
                                      [checkKey]: !isChecked
                                    })}
                                    className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950/40 border border-white/5 cursor-pointer hover:bg-slate-950 transition-colors"
                                  >
                                    {isChecked ? (
                                      <CheckSquare className="h-4.5 w-4.5 text-primary flex-shrink-0 mt-0.5" />
                                    ) : (
                                      <Square className="h-4.5 w-4.5 text-slate-600 flex-shrink-0 mt-0.5" />
                                    )}
                                    <div className="text-xs">
                                      <div className={`font-bold ${isChecked ? "text-slate-500 line-through" : "text-slate-200"}`}>
                                        {it.quantity}x {it.name}
                                      </div>
                                      <span className="text-[10px] text-slate-400">{it.category}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {order.notes && (
                              <div className="p-2.5 bg-slate-950 rounded-xl text-[10px] text-amber-500 italic">
                                <strong>Chef Request:</strong> {order.notes}
                              </div>
                            )}

                            <div className="text-[10px] text-slate-500 pt-2 border-t border-white/5">
                              Ordered: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>

                          <div className="p-4 border-t border-white/5 bg-slate-950/50">
                            {order.status === "Pending" ? (
                              <button
                                onClick={() => updateOrderStatus(order.id, "Preparing")}
                                className="w-full bg-orange-500 hover:bg-orange-500/90 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1"
                              >
                                <ChefHat className="h-4 w-4" />
                                Confirm & Start Prep
                              </button>
                            ) : (
                              <button
                                onClick={() => updateOrderStatus(order.id, "Ready")}
                                className="w-full bg-green-500 hover:bg-green-500/90 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1"
                              >
                                <Check className="h-4 w-4" />
                                Mark Platter Ready
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* TAB 3: MENU MANAGER */}
          {activeTab === "menu" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-white">Menu Stock Manager</h2>
                  <p className="text-xs text-slate-400">Update item pricing, toggle availability, add new recipes</p>
                </div>

                <button
                  onClick={() => setShowAddMenuModal(true)}
                  className="bg-primary hover:bg-primary/95 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-primary/10 transition-transform hover:scale-[1.02]"
                >
                  <Plus className="h-4 w-4" />
                  Add Menu Item
                </button>
              </div>

              {/* Menu manager List */}
              <div className="glass-panel border-white/5 rounded-3xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 border-b border-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="p-4">Item</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Price (₹)</th>
                      <th className="p-4">Availability</th>
                      <th className="p-4 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {menu.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-10 w-10 rounded-lg object-cover bg-slate-900 border border-white/5 flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.src = "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&q=80&w=400";
                            }}
                          />
                          <div>
                            <div className="font-bold text-slate-200">{item.name}</div>
                            <span className="text-[10px] text-slate-500 block max-w-xs truncate">{item.description}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="bg-slate-900 px-2 py-0.5 border border-white/5 rounded-md text-slate-400">
                            {item.category}
                          </span>
                        </td>
                        <td className="p-4">
                          <input
                            type="number"
                            defaultValue={item.price}
                            onBlur={(e) => handleUpdatePrice(item.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleUpdatePrice(item.id, e.currentTarget.value);
                                e.currentTarget.blur();
                              }
                            }}
                            className="w-20 bg-slate-950 border border-white/5 rounded px-2 py-1 text-xs text-white text-center font-bold"
                          />
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleStock(item.id, item.inStock)}
                            className={`px-3 py-1.5 rounded-lg font-bold border transition-colors ${
                              item.inStock
                                ? "bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/20"
                                : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20"
                            }`}
                          >
                            {item.inStock ? "Available (In Stock)" : "Out of Stock"}
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => deleteMenuItem(item.id)}
                            className="p-2 rounded bg-slate-900 border border-white/5 text-rose-500 hover:bg-rose-500/15"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ANALYTICS DASHBOARD */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white">Analytics Intelligence</h2>
                <p className="text-xs text-slate-400">Review business metrics, hourly peak times, and sales trends</p>
              </div>

              {/* Stats Summary Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-slate-900/60 border border-white/5 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Orders</span>
                  <div className="text-2xl font-black text-white mt-1.5">{analyticsSummary.totalOrdersCount}</div>
                </div>
                <div className="p-5 bg-slate-900/60 border border-white/5 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Completed Orders</span>
                  <div className="text-2xl font-black text-green-400 mt-1.5">{analyticsSummary.completedOrdersCount}</div>
                </div>
                <div className="p-5 bg-slate-900/60 border border-white/5 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Gross Revenue</span>
                  <div className="text-2xl font-black text-primary mt-1.5">₹{analyticsSummary.totalRevenueAmount}</div>
                </div>
                <div className="p-5 bg-slate-900/60 border border-white/5 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Avg. Wait Time</span>
                  <div className="text-2xl font-black text-cyan-400 mt-1.5">{analyticsSummary.avgWaitTime} min</div>
                </div>
              </div>

              {/* Recharts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Trend (Area Chart) */}
                <div className="glass-panel p-5 rounded-3xl border-white/5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Revenue Sales Trend (Daily)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getSalesChartData()}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ff6b00" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#ff6b00" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="day" stroke="#64748b" fontSize={10} />
                        <YAxis stroke="#64748b" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }} />
                        <Area type="monotone" dataKey="Revenue" stroke="#ff6b00" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Peak Hours (Bar Chart) */}
                <div className="glass-panel p-5 rounded-3xl border-white/5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Orders hourly peak times</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getPeakHoursData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="Hour" stroke="#64748b" fontSize={9} />
                        <YAxis stroke="#64748b" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }} />
                        <Bar dataKey="Orders" fill="#ffb703" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Categories Share (Pie Chart) */}
                <div className="glass-panel p-5 rounded-3xl border-white/5 space-y-4 lg:col-span-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Most Ordered Dishes Category Shares</h3>
                  <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
                    <div className="h-56 w-56 relative flex-shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getCategoryChartData()}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {getCategoryChartData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none pointer-events-none">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Category</span>
                        <span className="text-xl font-black text-white mt-1">Shares</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      {getCategoryChartData().map((cat) => (
                        <div key={cat.name} className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded" style={{ backgroundColor: cat.color }} />
                          <span className="text-slate-300 font-medium">
                            {cat.name} ({cat.value} items)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: REVIEWS PANEL */}
          {activeTab === "feedback" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white">Reviews & Feedback Board</h2>
                <p className="text-xs text-slate-400">Browse customer reviews, star ratings, and comments</p>
              </div>

              {/* Feedback list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {feedback.map((fb) => (
                  <div
                    key={fb.id}
                    className="glass-panel p-5 rounded-2xl border-white/5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{fb.customerName}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(fb.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                      <div className="flex text-secondary text-xs mt-1.5">
                        {Array.from({ length: fb.rating }).map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                      </div>
                      <p className="text-slate-300 text-xs mt-3 leading-relaxed">
                        "{fb.comment}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: SYSTEM SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white">System Configuration</h2>
                <p className="text-xs text-slate-400">Configure restaurant open status, order simulator, and Firebase keys</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Global Toggles */}
                <div className="glass-panel p-5 rounded-3xl border-white/5 space-y-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-white/5 pb-2">Global Operations</h3>
                  
                  {/* Restaurant Status Open/Close */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">Restaurant Open/Closed</h4>
                      <p className="text-[10px] text-slate-400">Setting Closed disables customer orders</p>
                    </div>
                    <button
                      onClick={() => updateSettings({ restaurantStatus: settings.restaurantStatus === "Open" ? "Closed" : "Open" })}
                      className={`h-9 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border ${
                        settings.restaurantStatus === "Open"
                          ? "bg-green-500/10 text-green-400 border-green-500/25"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/25"
                      }`}
                    >
                      <Power className="h-4 w-4" />
                      {settings.restaurantStatus}
                    </button>
                  </div>

                  {/* Simulator toggle */}
                  {dbMode === "local" && (
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-1">
                          Simulate Live Orders
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                        </h4>
                        <p className="text-[10px] text-slate-400">Background task automatically creates and progresses orders</p>
                      </div>
                      <button
                        onClick={() => updateSettings({ simulateOrders: !settings.simulateOrders })}
                        className={`h-9 px-4 rounded-xl text-xs font-bold transition-all border ${
                          settings.simulateOrders
                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/10"
                            : "bg-slate-950 text-slate-400 border-white/5 hover:border-white/10"
                        }`}
                      >
                        {settings.simulateOrders ? "Simulate On" : "Simulate Off"}
                      </button>
                    </div>
                  )}

                  {/* Reset served token counter */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">Reset Served Token Counter</h4>
                      <p className="text-[10px] text-slate-400">Resets served token back to #100</p>
                    </div>
                    <button
                      onClick={handleResetToken}
                      className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold border border-white/5 rounded-xl text-xs"
                    >
                      Reset Token
                    </button>
                  </div>
                </div>

                {/* Firebase Connection configuration */}
                <div className="glass-panel p-5 rounded-3xl border-white/5 space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center justify-between">
                      <span>Firebase Database Config</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        dbMode === "firebase" ? "bg-cyan-500/10 text-cyan-400" : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {dbMode === "firebase" ? "Connected" : "Simulated Local"}
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-2">
                      Input your Firebase client keys to connect this dashboard to a live Google Firestore real-time database.
                    </p>
                  </div>

                  <form onSubmit={handleSaveFirebase} className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="text-slate-400 font-bold">API Key *</label>
                        <input
                          type="text"
                          required
                          value={fbApiKey}
                          onChange={(e) => setFbApiKey(e.target.value)}
                          placeholder="AIzaSy..."
                          className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-400 font-bold">Project ID *</label>
                        <input
                          type="text"
                          required
                          value={fbProjectId}
                          onChange={(e) => setFbProjectId(e.target.value)}
                          placeholder="pani-puri-paradise"
                          className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-400 font-bold">Auth Domain</label>
                        <input
                          type="text"
                          value={fbAuthDomain}
                          onChange={(e) => setFbAuthDomain(e.target.value)}
                          placeholder="pani-puri.firebaseapp.com"
                          className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-400 font-bold">App ID</label>
                        <input
                          type="text"
                          value={fbAppId}
                          onChange={(e) => setFbAppId(e.target.value)}
                          placeholder="1:1234567:web:abcd"
                          className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {firebaseConfig && (
                        <button
                          type="button"
                          onClick={handleResetFirebase}
                          className="w-1/3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/25 text-xs font-bold text-rose-400 transition-colors"
                        >
                          Clear Config
                        </button>
                      )}
                      <button
                        type="submit"
                        className="flex-grow py-2 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs shadow-lg shadow-primary/10 transition-all flex items-center justify-center gap-1"
                      >
                        <Upload className="h-4.5 w-4.5" />
                        Connect Live Firebase
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL 1: ADD MENU ITEM */}
      <AnimatePresence>
        {showAddMenuModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddMenuModal(false)}
              className="absolute inset-0 bg-black"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-slate-900 border border-white/10 p-6 rounded-3xl shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <h3 className="text-lg font-bold text-white">Add New Dish</h3>
                <button onClick={() => setShowAddMenuModal(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
                  <Check className="h-5 w-5 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleCreateMenuItem} className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1 col-span-2">
                    <label className="text-slate-400 font-bold">Dish Name *</label>
                    <input
                      type="text"
                      required
                      value={newMenuName}
                      onChange={(e) => setNewMenuName(e.target.value)}
                      placeholder="e.g. Dahi Puri Supreme"
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">Price (₹) *</label>
                    <input
                      type="number"
                      required
                      value={newMenuPrice}
                      onChange={(e) => setNewMenuPrice(e.target.value)}
                      placeholder="130"
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">Category</label>
                    <select
                      value={newMenuCategory}
                      onChange={(e) => setNewMenuCategory(e.target.value as any)}
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-white focus:outline-none"
                    >
                      <option value="Pani Puri">Pani Puri</option>
                      <option value="Dahi Puri">Dahi Puri</option>
                      <option value="Sev Puri">Sev Puri</option>
                      <option value="Ragda Puri">Ragda Puri</option>
                      <option value="Chaat">Chaat</option>
                      <option value="Drinks">Drinks</option>
                    </select>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-slate-400 font-bold">Image URL (Optional)</label>
                    <input
                      type="text"
                      value={newMenuImage}
                      onChange={(e) => setNewMenuImage(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-slate-400 font-bold">Description</label>
                    <textarea
                      rows={2.5}
                      value={newMenuDescription}
                      onChange={(e) => setNewMenuDescription(e.target.value)}
                      placeholder="Flavor notes, count of puris, spice configurations..."
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-white focus:outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowAddMenuModal(false)}
                    className="w-1/3 py-2.5 rounded-xl bg-slate-950 border border-white/5 text-slate-400 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-grow py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold"
                  >
                    Create Menu Item
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: ADD MANUAL ORDER */}
      <AnimatePresence>
        {showAddOrderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddOrderModal(false)}
              className="absolute inset-0 bg-black"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-slate-900 border border-white/10 p-6 rounded-3xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <h3 className="text-lg font-bold text-white">New Manual Ticket</h3>
                <button onClick={() => setShowAddOrderModal(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
                  <Check className="h-5 w-5 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleAddManualOrder} className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">Customer Name *</label>
                    <input
                      type="text"
                      required
                      value={manualCustomer}
                      onChange={(e) => setManualCustomer(e.target.value)}
                      placeholder="e.g. Suresh Sharma"
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">Branch</label>
                    <select
                      value={manualBranch}
                      onChange={(e) => setManualBranch(e.target.value)}
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2.5 text-white focus:outline-none"
                    >
                      <option value="Main Branch">Main Branch</option>
                      <option value="Express Outlet">Express Outlet</option>
                    </select>
                  </div>
                </div>

                {/* Items grid selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400">Select Items</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs max-h-48 overflow-y-auto pr-1">
                    {menu.map((it) => {
                      const qty = manualCart[it.id] || 0;
                      return (
                        <div key={it.id} className="flex justify-between items-center p-2 rounded-xl bg-slate-950/40 border border-white/5">
                          <span className="font-semibold text-slate-300">{it.name} (₹{it.price})</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setManualCart({ ...manualCart, [it.id]: Math.max(0, qty - 1) })}
                              className="w-6 h-6 rounded bg-slate-900 border border-white/5 flex items-center justify-center font-bold text-slate-400 hover:text-white"
                            >
                              -
                            </button>
                            <span className="w-5 text-center font-bold text-white">{qty}</span>
                            <button
                              type="button"
                              onClick={() => setManualCart({ ...manualCart, [it.id]: qty + 1 })}
                              className="w-6 h-6 rounded bg-slate-900 border border-white/5 flex items-center justify-center font-bold text-slate-400 hover:text-white"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="text-slate-400 font-bold">Special cooking note</label>
                  <input
                    type="text"
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    placeholder="e.g. Extra spicy mint, double onions"
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                {/* Submit button */}
                <div className="flex gap-2 pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowAddOrderModal(false)}
                    className="w-1/3 py-2.5 rounded-xl bg-slate-950 border border-white/5 text-slate-400 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-grow py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold"
                  >
                    Place Ticket Order
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: PRINTABLE RECEIPT MODAL */}
      <AnimatePresence>
        {selectedReceiptOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:p-0 print:absolute print:inset-0">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReceiptOrder(null)}
              className="absolute inset-0 bg-black print:hidden"
            />
            {/* Receipt Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-white text-slate-950 p-6 rounded-2xl shadow-2xl border border-slate-200 print:shadow-none print:border-none print:bg-white print:text-black print:p-0 print:m-0"
            >
              {/* Receipt Content Wrapper */}
              <div id="printable-receipt" className="space-y-4">
                <div className="text-center space-y-1">
                  <h2 className="text-lg font-black tracking-tight">PANI PURI PARADISE</h2>
                  <p className="text-[10px] text-slate-500 font-medium">Food Street, Paradise Plaza, Block-4</p>
                  <p className="text-[10px] text-slate-500 font-medium">Phone: +91 98765 43210</p>
                </div>

                <div className="border-t border-b border-dashed border-slate-300 py-2 text-xs space-y-1 font-medium">
                  <div className="flex justify-between">
                    <span>Order ID: {selectedReceiptOrder.id}</span>
                    <span className="font-bold">Token: #{selectedReceiptOrder.token}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer: {selectedReceiptOrder.customerName}</span>
                    <span>Date: {new Date(selectedReceiptOrder.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Branch: {selectedReceiptOrder.branch}</span>
                    <span>Time: {new Date(selectedReceiptOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2 text-xs font-semibold">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5 text-slate-500 font-bold">
                    <span>Item & Qty</span>
                    <span>Price</span>
                  </div>
                  {selectedReceiptOrder.items.map((it) => (
                    <div key={it.id} className="flex justify-between font-medium">
                      <span>{it.name} x{it.quantity}</span>
                      <span>₹{it.price * it.quantity}</span>
                    </div>
                  ))}
                </div>

                {selectedReceiptOrder.notes && (
                  <div className="text-[10px] bg-slate-50 p-2 rounded-lg text-slate-600 font-medium italic border border-slate-100">
                    <strong>Cooking Note:</strong> {selectedReceiptOrder.notes}
                  </div>
                )}

                <div className="border-t border-dashed border-slate-300 pt-3 flex justify-between items-center text-sm font-black">
                  <span>GRAND TOTAL</span>
                  <span className="text-base">₹{selectedReceiptOrder.amount}</span>
                </div>

                <div className="text-center text-[10px] text-slate-400 font-semibold pt-4 border-t border-slate-100">
                  ⭐⭐⭐ Thank You! Enjoy Your Puris! ⭐⭐⭐
                </div>
              </div>

              {/* Print Button for Modal */}
              <div className="flex gap-2 pt-4 border-t border-slate-100 mt-4 print:hidden">
                <button
                  onClick={() => setSelectedReceiptOrder(null)}
                  className="w-1/3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={triggerPrintReceipt}
                  className="flex-grow py-2 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-primary/10 transition-transform hover:scale-[1.01]"
                >
                  <Printer className="h-4 w-4" />
                  Print Ticket
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
