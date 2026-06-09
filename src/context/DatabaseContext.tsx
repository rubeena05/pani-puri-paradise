"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs 
} from "firebase/firestore";
import { db as envDb, initDynamicFirebase, envConfig, hasEnvConfig } from "@/lib/firebase";

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
}

export interface Order {
  id: string;
  token: number;
  customerName: string;
  items: OrderItem[];
  amount: number;
  status: "Pending" | "Preparing" | "Ready" | "Completed";
  createdAt: number;
  notes?: string;
  branch: string;
  phone?: string;
  timeSpent?: number; // for analytics
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: "Pani Puri" | "Dahi Puri" | "Sev Puri" | "Ragda Puri" | "Chaat" | "Drinks";
  inStock: boolean;
}

export interface GlobalSettings {
  currentToken: number;
  restaurantStatus: "Open" | "Closed";
  simulateOrders: boolean;
}

export interface CustomerFeedback {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: number;
}

interface FirebaseConfigInput {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

interface DatabaseContextType {
  dbMode: "firebase" | "local";
  isFirebaseConnected: boolean;
  orders: Order[];
  menu: MenuItem[];
  settings: GlobalSettings;
  feedback: CustomerFeedback[];
  addOrder: (customerName: string, items: OrderItem[], amount: number, notes?: string, branch?: string, phone?: string) => Promise<string>;
  updateOrderStatus: (id: string, status: Order["status"]) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => Promise<void>;
  addMenuItem: (item: Omit<MenuItem, "id">) => Promise<string>;
  deleteMenuItem: (id: string) => Promise<void>;
  updateSettings: (updates: Partial<GlobalSettings>) => Promise<void>;
  addFeedback: (customerName: string, rating: number, comment: string) => Promise<void>;
  saveFirebaseConfig: (config: FirebaseConfigInput) => void;
  clearFirebaseConfig: () => void;
  firebaseConfig: FirebaseConfigInput | null;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

const STORAGE_KEYS = {
  FIREBASE_CONFIG: "ppp_firebase_config",
  ORDERS: "ppp_mock_orders",
  MENU: "ppp_mock_menu",
  SETTINGS: "ppp_mock_settings",
  FEEDBACK: "ppp_mock_feedback",
};

const DEFAULT_MENU: MenuItem[] = [
  { id: "classic-panipuri", name: "Classic Panipuri", price: 99, inStock: true, category: "Pani Puri", image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=400", description: "6 crispy hollow puris filled with spiced boiled potatoes, chickpeas, fresh mint water, and sweet tamarind chutney." },
  { id: "masala-panipuri", name: "Masala Pea Panipuri", price: 119, inStock: true, category: "Pani Puri", image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&q=80&w=400", description: "Crispy puris stuffed with hot, flavorful white pea ragda, fresh onions, coriander, and secret spices." },
  { id: "cheese-panipuri", name: "Cheese Blast Panipuri", price: 149, inStock: true, category: "Pani Puri", image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=400", description: "A cheesy fusion delight! Crispy puris loaded with spiced potatoes, tangy chutneys, and melted cheese." },
  { id: "dahi-puri", name: "Royal Dahi Puri", price: 139, inStock: true, category: "Dahi Puri", image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&q=80&w=400", description: "Crispy puris stuffed with potatoes, topped with sweet yogurt, dynamic chutneys, sev, and pomegranate seeds." },
  { id: "sev-puri", name: "Mumbai Sev Puri", price: 129, inStock: true, category: "Sev Puri", image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=400", description: "Flat crispy puris topped with spiced potatoes, onions, tomatoes, trio of chutneys, and loaded with fine sev." },
  { id: "ragda-pattice", name: "Spicy Ragda Puri", price: 119, inStock: true, category: "Ragda Puri", image: "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&q=80&w=400", description: "Spiced ragda (white pea gravy) served with puris, chopped coriander, and tamarind chutney." },
  { id: "samosa-chaat", name: "Samosa Smash Chaat", price: 159, inStock: true, category: "Chaat", image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&q=80&w=400", description: "Crushed samosas topped with spicy ragda, chilled yogurt, sweet-tangy chutneys, sev, and onions." },
  { id: "jaljeera-splash", name: "Jaljeera Mint Soda", price: 59, inStock: true, category: "Drinks", image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=400", description: "Tangy, digestive cumin-mint drink topped with crunchy boondi and ice." }
];

const DEFAULT_SETTINGS: GlobalSettings = {
  currentToken: 100,
  restaurantStatus: "Open",
  simulateOrders: false,
};

const DEFAULT_FEEDBACK: CustomerFeedback[] = [
  { id: "f1", customerName: "Vikram Malhotra", rating: 5, comment: "Hands down the cleanest and crunchiest Panipuri in town. The double-water option is genius!", createdAt: Date.now() - 3600000 * 3 },
  { id: "f2", customerName: "Ananya Sen", rating: 5, comment: "The Dahi Puri yogurt was so rich and fresh, and the presentation was lovely. Love the live dashboard tracking!", createdAt: Date.now() - 3600000 * 24 },
  { id: "f3", customerName: "Rajesh K.", rating: 4, comment: "Great food, fast service. Samosa Chaat was super tasty. The sound alerts on order updates are very helpful.", createdAt: Date.now() - 3600000 * 48 }
];

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [dbMode, setDbMode] = useState<"firebase" | "local">("local");
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfigInput | null>(null);

  // Firestore DB Instance reference
  const activeDbRef = useRef<any>(null);

  // State
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS);
  const [feedback, setFeedback] = useState<CustomerFeedback[]>([]);

  // Sync Channel for Local Mode
  const syncChannelRef = useRef<BroadcastChannel | null>(null);

  // Load Custom Config from LocalStorage (if any)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEYS.FIREBASE_CONFIG);
      if (stored) {
        try {
          setFirebaseConfig(JSON.parse(stored));
        } catch (e) {
          console.error("Error parsing stored firebase config:", e);
        }
      }
      
      // Initialize Broadcast Channel
      try {
        syncChannelRef.current = new BroadcastChannel("ppp_sync_channel");
        syncChannelRef.current.onmessage = (event) => {
          if (dbMode === "local") {
            const { type } = event.data;
            if (type === "SYNC_LOCAL_DATA") {
              loadLocalData();
            }
          }
        };
      } catch (e) {
        console.warn("BroadcastChannel not supported in this environment");
      }
    }
  }, [dbMode]);

  // Load local data from LocalStorage
  const loadLocalData = () => {
    if (typeof window === "undefined") return;
    
    const localOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
    const localMenu = localStorage.getItem(STORAGE_KEYS.MENU);
    const localSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const localFeedback = localStorage.getItem(STORAGE_KEYS.FEEDBACK);

    if (localOrders) setOrders(JSON.parse(localOrders));
    else {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
      setOrders([]);
    }

    if (localMenu) setMenu(JSON.parse(localMenu));
    else {
      localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(DEFAULT_MENU));
      setMenu(DEFAULT_MENU);
    }

    if (localSettings) setSettings(JSON.parse(localSettings));
    else {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      setSettings(DEFAULT_SETTINGS);
    }

    if (localFeedback) setFeedback(JSON.parse(localFeedback));
    else {
      localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(DEFAULT_FEEDBACK));
      setFeedback(DEFAULT_FEEDBACK);
    }
  };

  // Broadcast local changes to other tabs
  const broadcastLocalChange = () => {
    if (syncChannelRef.current) {
      syncChannelRef.current.postMessage({ type: "SYNC_LOCAL_DATA" });
    }
  };

  // Reconnect Database when Config or Environment changes
  useEffect(() => {
    let unsubscribeOrders: () => void = () => {};
    let unsubscribeMenu: () => void = () => {};
    let unsubscribeSettings: () => void = () => {};
    let unsubscribeFeedback: () => void = () => {};

    const setupFirebaseMode = (firebaseDbInstance: any) => {
      activeDbRef.current = firebaseDbInstance;
      setDbMode("firebase");
      setIsFirebaseConnected(true);

      // Listen to Orders
      const ordersCol = collection(firebaseDbInstance, "orders");
      const ordersQuery = query(ordersCol);
      unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
        const list: Order[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Order);
        });
        // Sort descending by createdAt
        list.sort((a, b) => b.createdAt - a.createdAt);
        setOrders(list);
      }, (err) => console.error("Firestore orders listen error:", err));

      // Listen to Menu
      const menuCol = collection(firebaseDbInstance, "menu");
      unsubscribeMenu = onSnapshot(menuCol, (snapshot) => {
        const list: MenuItem[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as MenuItem);
        });
        
        if (list.length === 0) {
          // Initialize Firebase Menu with defaults if empty
          DEFAULT_MENU.forEach(async (item) => {
            const { id, ...rest } = item;
            await setDoc(doc(menuCol, id), rest);
          });
        } else {
          setMenu(list);
        }
      }, (err) => console.error("Firestore menu listen error:", err));

      // Listen to Settings
      const settingsDocRef = doc(firebaseDbInstance, "settings", "global");
      unsubscribeSettings = onSnapshot(settingsDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setSettings(docSnap.data() as GlobalSettings);
        } else {
          // Initialize settings doc
          setDoc(settingsDocRef, DEFAULT_SETTINGS);
          setSettings(DEFAULT_SETTINGS);
        }
      }, (err) => console.error("Firestore settings listen error:", err));

      // Listen to Feedback
      const feedbackCol = collection(firebaseDbInstance, "feedback");
      unsubscribeFeedback = onSnapshot(feedbackCol, (snapshot) => {
        const list: CustomerFeedback[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as CustomerFeedback);
        });
        list.sort((a, b) => b.createdAt - a.createdAt);
        setFeedback(list);
      }, (err) => console.error("Firestore feedback listen error:", err));
    };

    // Determine connection method
    if (firebaseConfig) {
      // Dynamic config from localStorage
      const { db: dynDb, success } = initDynamicFirebase(firebaseConfig);
      if (success && dynDb) {
        setupFirebaseMode(dynDb);
      } else {
        console.warn("Failed dynamic Firebase initialization. Falling back to local mode.");
        setDbMode("local");
        setIsFirebaseConnected(false);
        activeDbRef.current = null;
        loadLocalData();
      }
    } else if (hasEnvConfig && envDb) {
      // ENV-configured Firebase
      setupFirebaseMode(envDb);
    } else {
      // Local Fallback Mode
      setDbMode("local");
      setIsFirebaseConnected(false);
      activeDbRef.current = null;
      loadLocalData();
    }

    return () => {
      unsubscribeOrders();
      unsubscribeMenu();
      unsubscribeSettings();
      unsubscribeFeedback();
    };
  }, [firebaseConfig]);

  // Save/Clear Firebase Configuration
  const saveFirebaseConfig = (config: FirebaseConfigInput) => {
    localStorage.setItem(STORAGE_KEYS.FIREBASE_CONFIG, JSON.stringify(config));
    setFirebaseConfig(config);
  };

  const clearFirebaseConfig = () => {
    localStorage.removeItem(STORAGE_KEYS.FIREBASE_CONFIG);
    setFirebaseConfig(null);
  };

  // --- DATABASE OPERATIONS ---

  const addOrder = async (
    customerName: string, 
    items: OrderItem[], 
    amount: number, 
    notes?: string,
    branch: string = "Main Branch",
    phone?: string
  ): Promise<string> => {
    const timestamp = Date.now();
    
    if (dbMode === "firebase" && activeDbRef.current) {
      const orderCol = collection(activeDbRef.current, "orders");
      // Calculate token number
      const nextToken = settings.currentToken + 1;
      const id = "PPP-" + nextToken;
      const orderData: Omit<Order, "id"> = {
        token: nextToken,
        customerName,
        items,
        amount,
        status: "Pending",
        createdAt: timestamp,
        notes: notes || "",
        branch,
        phone: phone || ""
      };
      await setDoc(doc(orderCol, id), orderData);
      
      // Update Settings token
      await updateSettings({ currentToken: nextToken });
      return id;
    } else {
      // Local Storage Mode
      const localOrders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || "[]") as Order[];
      const nextToken = settings.currentToken + 1;
      const id = "PPP-" + nextToken;
      
      const newOrder: Order = {
        id,
        token: nextToken,
        customerName,
        items,
        amount,
        status: "Pending",
        createdAt: timestamp,
        notes: notes || "",
        branch,
        phone: phone || ""
      };

      localOrders.unshift(newOrder);
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(localOrders));
      
      // Update local settings
      const newSettings = { ...settings, currentToken: nextToken };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
      
      setOrders(localOrders);
      setSettings(newSettings);
      broadcastLocalChange();
      
      // Custom event for new order sound alerts in current tab
      window.dispatchEvent(new CustomEvent("newLocalOrder", { detail: newOrder }));
      return id;
    }
  };

  const updateOrderStatus = async (id: string, status: Order["status"]): Promise<void> => {
    if (dbMode === "firebase" && activeDbRef.current) {
      const orderDoc = doc(activeDbRef.current, "orders", id);
      const updates: any = { status };
      if (status === "Completed") {
        const order = orders.find(o => o.id === id);
        if (order) {
          updates.timeSpent = Math.round((Date.now() - order.createdAt) / 1000); // seconds
        }
      }
      await updateDoc(orderDoc, updates);
    } else {
      const localOrders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || "[]") as Order[];
      const orderIndex = localOrders.findIndex(o => o.id === id);
      if (orderIndex > -1) {
        localOrders[orderIndex].status = status;
        if (status === "Completed") {
          localOrders[orderIndex].timeSpent = Math.round((Date.now() - localOrders[orderIndex].createdAt) / 1000);
        }
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(localOrders));
        setOrders(localOrders);
        broadcastLocalChange();
        
        // Dispatch event for sound alerts/toasts
        window.dispatchEvent(new CustomEvent("orderStatusUpdate", { detail: { id, status } }));
      }
    }
  };

  const deleteOrder = async (id: string): Promise<void> => {
    if (dbMode === "firebase" && activeDbRef.current) {
      await deleteDoc(doc(activeDbRef.current, "orders", id));
    } else {
      const localOrders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || "[]") as Order[];
      const filtered = localOrders.filter(o => o.id !== id);
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(filtered));
      setOrders(filtered);
      broadcastLocalChange();
    }
  };

  const updateMenuItem = async (id: string, updates: Partial<MenuItem>): Promise<void> => {
    if (dbMode === "firebase" && activeDbRef.current) {
      const menuDoc = doc(activeDbRef.current, "menu", id);
      await updateDoc(menuDoc, updates);
    } else {
      const localMenu = JSON.parse(localStorage.getItem(STORAGE_KEYS.MENU) || "[]") as MenuItem[];
      const idx = localMenu.findIndex(m => m.id === id);
      if (idx > -1) {
        localMenu[idx] = { ...localMenu[idx], ...updates };
        localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(localMenu));
        setMenu(localMenu);
        broadcastLocalChange();
      }
    }
  };

  const addMenuItem = async (item: Omit<MenuItem, "id">): Promise<string> => {
    const id = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    
    if (dbMode === "firebase" && activeDbRef.current) {
      await setDoc(doc(activeDbRef.current, "menu", id), item);
      return id;
    } else {
      const localMenu = JSON.parse(localStorage.getItem(STORAGE_KEYS.MENU) || "[]") as MenuItem[];
      const newItem = { id, ...item };
      localMenu.push(newItem);
      localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(localMenu));
      setMenu(localMenu);
      broadcastLocalChange();
      return id;
    }
  };

  const deleteMenuItem = async (id: string): Promise<void> => {
    if (dbMode === "firebase" && activeDbRef.current) {
      await deleteDoc(doc(activeDbRef.current, "menu", id));
    } else {
      const localMenu = JSON.parse(localStorage.getItem(STORAGE_KEYS.MENU) || "[]") as MenuItem[];
      const filtered = localMenu.filter(m => m.id !== id);
      localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(filtered));
      setMenu(filtered);
      broadcastLocalChange();
    }
  };

  const updateSettings = async (updates: Partial<GlobalSettings>): Promise<void> => {
    const newSettings = { ...settings, ...updates };
    if (dbMode === "firebase" && activeDbRef.current) {
      const settingsDoc = doc(activeDbRef.current, "settings", "global");
      await setDoc(settingsDoc, newSettings, { merge: true });
    } else {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
      setSettings(newSettings);
      broadcastLocalChange();
    }
  };

  const addFeedback = async (customerName: string, rating: number, comment: string): Promise<void> => {
    const feedbackData: CustomerFeedback = {
      id: "f-" + Date.now(),
      customerName,
      rating,
      comment,
      createdAt: Date.now()
    };

    if (dbMode === "firebase" && activeDbRef.current) {
      const feedbackCol = collection(activeDbRef.current, "feedback");
      await setDoc(doc(feedbackCol, feedbackData.id), feedbackData);
    } else {
      const localFb = JSON.parse(localStorage.getItem(STORAGE_KEYS.FEEDBACK) || "[]") as CustomerFeedback[];
      localFb.unshift(feedbackData);
      localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(localFb));
      setFeedback(localFb);
      broadcastLocalChange();
    }
  };

  // --- AUTOMATIC ORDER PROGRESSION & CREATION SIMULATOR ---
  useEffect(() => {
    let simulatorInterval: NodeJS.Timeout;
    
    if (dbMode === "local" && settings.simulateOrders && settings.restaurantStatus === "Open") {
      simulatorInterval = setInterval(() => {
        const localOrders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || "[]") as Order[];
        let stateChanged = false;
        
        // 1. Progress active orders
        const updatedOrders: Order[] = localOrders.map((order) => {
          const ageSec = (Date.now() - order.createdAt) / 1000;
          let newStatus = order.status;
          
          if (order.status === "Pending" && ageSec > 15) {
            newStatus = "Preparing";
            stateChanged = true;
          } else if (order.status === "Preparing" && ageSec > 40) {
            newStatus = "Ready";
            stateChanged = true;
            // Broadcast sound trigger
            window.dispatchEvent(new CustomEvent("orderStatusUpdate", { detail: { id: order.id, status: "Ready" } }));
          } else if (order.status === "Ready" && ageSec > 75) {
            newStatus = "Completed";
            stateChanged = true;
          }
          
          return {
            ...order,
            status: newStatus,
            timeSpent: newStatus === "Completed" ? Math.round(ageSec) : order.timeSpent
          };
        });

        // 2. Randomly create new simulated orders (20% chance every 10 seconds)
        if (Math.random() < 0.25) {
          const names = ["Rohan", "Siddharth", "Meera", "Kabir", "Neha", "Arjun", "Zara", "Aarav", "Pooja", "Ishaan"];
          const customerName = names[Math.floor(Math.random() * names.length)];
          
          // Randomly select menu items
          const itemsCount = Math.floor(Math.random() * 3) + 1;
          const orderItems: OrderItem[] = [];
          let total = 0;
          
          for (let i = 0; i < itemsCount; i++) {
            const menuItem = menu[Math.floor(Math.random() * menu.length)];
            if (menuItem && menuItem.inStock) {
              const qty = Math.floor(Math.random() * 2) + 1;
              orderItems.push({
                id: menuItem.id,
                name: menuItem.name,
                quantity: qty,
                price: menuItem.price,
                category: menuItem.category
              });
              total += menuItem.price * qty;
            }
          }
          
          if (orderItems.length > 0) {
            const nextToken = settings.currentToken + 1;
            const newId = "PPP-" + nextToken;
            const newOrder: Order = {
              id: newId,
              token: nextToken,
              customerName,
              items: orderItems,
              amount: total,
              status: "Pending",
              createdAt: Date.now(),
              notes: Math.random() < 0.3 ? "Make it extra spicy!" : "",
              branch: Math.random() < 0.5 ? "Main Branch" : "Express Outlet",
              phone: "9876543210"
            };
            
            updatedOrders.unshift(newOrder);
            settings.currentToken = nextToken;
            stateChanged = true;
            
            // Dispatch new local order event
            window.dispatchEvent(new CustomEvent("newLocalOrder", { detail: newOrder }));
          }
        }

        if (stateChanged) {
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updatedOrders));
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
          setOrders(updatedOrders);
          setSettings({ ...settings });
          broadcastLocalChange();
        }
      }, 8000); // Check and run simulation step every 8 seconds
    }
    
    return () => {
      if (simulatorInterval) clearInterval(simulatorInterval);
    };
  }, [dbMode, settings, menu]);

  return (
    <DatabaseContext.Provider value={{
      dbMode,
      isFirebaseConnected,
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
      addFeedback,
      saveFirebaseConfig,
      clearFirebaseConfig,
      firebaseConfig
    }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error("useDatabase must be used within a DatabaseProvider");
  }
  return context;
}
