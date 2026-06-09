/**
 * Firebase Realtime Database & Mock Database Service
 * Provides seamless fallback to LocalStorage/Memory state if Firebase is not configured.
 */

class DatabaseService {
  constructor() {
    this.firebaseApp = null;
    this.firebaseDb = null;
    this.useFirebase = false;
    
    // Subscriptions
    this.orderCallbacks = [];
    this.menuCallbacks = [];
    this.reviewCallbacks = [];

    // Local Storage Mock Keys
    this.STORAGE_KEYS = {
      FIREBASE_CONFIG: 'ppp_firebase_config',
      ORDERS: 'ppp_mock_orders',
      MENU: 'ppp_mock_menu',
      REVIEWS: 'ppp_mock_reviews'
    };

    // Default Menu Items
    this.DEFAULT_MENU = {
      'classic-panipuri': { name: 'Classic Panipuri', price: 99, inStock: true, rating: 4.9, image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=400', description: '6 crispy puris filled with spiced boiled potatoes, chickpeas, fresh mint-coriander water, and sweet tamarind chutney.' },
      'masala-panipuri': { name: 'Masala Panipuri', price: 119, inStock: true, rating: 4.7, image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&q=80&w=400', description: 'Puris stuffed with hot, flavorful white pea ragda, fresh onions, coriander, and secret spice powders.' },
      'cheese-panipuri': { name: 'Cheese Panipuri', price: 149, inStock: true, rating: 4.8, image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=400', description: 'A fusion delight! Crispy puris loaded with spiced potatoes, tangy chutneys, and a generous layer of melted cheese.' },
      'sweet-spicy-panipuri': { name: 'Sweet & Spicy Panipuri', price: 109, inStock: true, rating: 4.6, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=400', description: 'Perfect harmony of hot mint-chili water and rich sweet dates-tamarind chutney.' },
      'dahi-puri': { name: 'Dahi Puri', price: 139, inStock: true, rating: 4.9, image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&q=80&w=400', description: 'Crispy hollow puris filled with potatoes, topped with whipped sweet yogurt, dynamic chutneys, sev, and pomegranate.' },
      'sev-puri': { name: 'Sev Puri', price: 129, inStock: true, rating: 4.8, image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=400', description: 'Flat crispy puris loaded with diced potatoes, onions, tomatoes, trio of house chutneys, and a mountain of fine sev.' },
      'paradise-combo': { name: 'Special Paradise Combo', price: 249, inStock: true, rating: 5.0, image: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&q=80&w=400', description: 'Platter of 12 puris with 4 unique flavored waters (Mint, Garlic, Hing, Lemon-Ginger) plus a side of Dahi Puri.' }
    };

    // Default Reviews
    this.DEFAULT_REVIEWS = [
      { id: 'r1', name: 'Aarav Sharma', rating: 5, comment: 'The best Panipuri I have ever tasted! Extremely clean, crispy, and the mint water was incredibly refreshing.', date: '2026-06-05' },
      { id: 'r2', name: 'Priya Patel', rating: 5, comment: 'Dahi Puri is out of this world! Super fresh ingredients, and the packaging for delivery was neat.', date: '2026-06-07' },
      { id: 'r3', name: 'Rohan Mehta', rating: 4, comment: 'Really love their Cheese Panipuri fusion. Cleanliness is top-notch. Highly recommended!', date: '2026-06-08' }
    ];

    // Initialize Database
    this.init();
    
    // Start Local Mock Order Status Auto-Progression
    this.startMockStatusProgression();
  }

  init() {
    const config = this.getFirebaseConfig();
    if (config && config.apiKey && config.databaseURL) {
      try {
        // Check if firebase is loaded on window
        if (window.firebase) {
          // Initialize Firebase compat app
          if (!window.firebase.apps.length) {
            this.firebaseApp = window.firebase.initializeApp(config);
          } else {
            this.firebaseApp = window.firebase.app();
          }
          this.firebaseDb = window.firebase.database(this.firebaseApp);
          this.useFirebase = true;
          console.log("Firebase initialized successfully. Live mode active.");
          
          // Setup Live Database Observers
          this.setupFirebaseObservers();
          return;
        } else {
          console.warn("Firebase scripts not loaded. Falling back to Simulated Mode.");
        }
      } catch (e) {
        console.error("Firebase init failed, falling back to Local Mode:", e);
      }
    }
    
    // Fallback: Initialize Local Storage data if not exists
    this.useFirebase = false;
    this.initLocalStorageData();
  }

  initLocalStorageData() {
    if (!localStorage.getItem(this.STORAGE_KEYS.MENU)) {
      localStorage.setItem(this.STORAGE_KEYS.MENU, JSON.stringify(this.DEFAULT_MENU));
    }
    if (!localStorage.getItem(this.STORAGE_KEYS.REVIEWS)) {
      localStorage.setItem(this.STORAGE_KEYS.REVIEWS, JSON.stringify(this.DEFAULT_REVIEWS));
    }
    if (!localStorage.getItem(this.STORAGE_KEYS.ORDERS)) {
      localStorage.setItem(this.STORAGE_KEYS.ORDERS, JSON.stringify([]));
    }
  }

  // Firebase Observers
  setupFirebaseObservers() {
    if (!this.useFirebase) return;

    // Listen for Orders
    this.firebaseDb.ref('orders').on('value', (snapshot) => {
      const data = snapshot.val();
      const ordersList = [];
      if (data) {
        Object.keys(data).forEach(key => {
          ordersList.push({ id: key, ...data[key] });
        });
      }
      // Sort orders by timestamp descending
      ordersList.sort((a, b) => b.timestamp - a.timestamp);
      this.orderCallbacks.forEach(cb => cb(ordersList));
    });

    // Listen for Menu Settings
    this.firebaseDb.ref('menu').on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        this.menuCallbacks.forEach(cb => cb(data));
      } else {
        // Initialize Firebase with defaults if empty
        this.firebaseDb.ref('menu').set(this.DEFAULT_MENU);
        this.menuCallbacks.forEach(cb => cb(this.DEFAULT_MENU));
      }
    });

    // Listen for Reviews
    this.firebaseDb.ref('reviews').on('value', (snapshot) => {
      const data = snapshot.val();
      const reviewsList = [];
      if (data) {
        Object.keys(data).forEach(key => {
          reviewsList.push({ id: key, ...data[key] });
        });
      } else {
        // Initialize Firebase with defaults if empty
        this.DEFAULT_REVIEWS.forEach(r => {
          this.firebaseDb.ref('reviews').push(r);
        });
      }
      this.reviewCallbacks.forEach(cb => cb(reviewsList));
    });
  }

  // Switch Firebase Config
  saveFirebaseConfig(config) {
    if (config) {
      localStorage.setItem(this.STORAGE_KEYS.FIREBASE_CONFIG, JSON.stringify(config));
    } else {
      localStorage.removeItem(this.STORAGE_KEYS.FIREBASE_CONFIG);
    }
    this.init();
    // Notify clients of change
    this.triggerLocalSync();
  }

  getFirebaseConfig() {
    try {
      const configStr = localStorage.getItem(this.STORAGE_KEYS.FIREBASE_CONFIG);
      return configStr ? JSON.parse(configStr) : null;
    } catch (e) {
      return null;
    }
  }

  // --- Orders APIs ---

  saveOrder(orderData) {
    const id = 'PPP-' + Math.floor(1000 + Math.random() * 9000);
    const order = {
      id: id,
      ...orderData,
      status: 'Pending',
      timestamp: Date.now()
    };

    if (this.useFirebase) {
      this.firebaseDb.ref('orders/' + id).set(order);
    } else {
      const orders = this.getLocalOrders();
      orders.unshift(order);
      localStorage.setItem(this.STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      this.notifyOrderListeners();
    }
    return id;
  }

  updateOrderStatus(orderId, status) {
    if (this.useFirebase) {
      this.firebaseDb.ref(`orders/${orderId}/status`).set(status);
    } else {
      const orders = this.getLocalOrders();
      const order = orders.find(o => o.id === orderId);
      if (order) {
        order.status = status;
        localStorage.setItem(this.STORAGE_KEYS.ORDERS, JSON.stringify(orders));
        this.notifyOrderListeners();
      }
    }
  }

  onOrdersChange(callback) {
    this.orderCallbacks.push(callback);
    // Initial load
    if (this.useFirebase) {
      // Handled by snapshot
    } else {
      callback(this.getLocalOrders());
    }
  }

  getLocalOrders() {
    this.initLocalStorageData();
    try {
      const orders = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ORDERS)) || [];
      return orders.sort((a, b) => b.timestamp - a.timestamp);
    } catch(e) {
      return [];
    }
  }

  notifyOrderListeners() {
    const orders = this.getLocalOrders();
    this.orderCallbacks.forEach(cb => cb(orders));
  }

  // --- Menu Inventory APIs ---

  updateItemStock(itemId, inStock) {
    if (this.useFirebase) {
      this.firebaseDb.ref(`menu/${itemId}/inStock`).set(inStock);
    } else {
      const menu = this.getLocalMenu();
      if (menu[itemId]) {
        menu[itemId].inStock = inStock;
        localStorage.setItem(this.STORAGE_KEYS.MENU, JSON.stringify(menu));
        this.notifyMenuListeners();
      }
    }
  }

  updateItemPrice(itemId, price) {
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice)) return;

    if (this.useFirebase) {
      this.firebaseDb.ref(`menu/${itemId}/price`).set(numericPrice);
    } else {
      const menu = this.getLocalMenu();
      if (menu[itemId]) {
        menu[itemId].price = numericPrice;
        localStorage.setItem(this.STORAGE_KEYS.MENU, JSON.stringify(menu));
        this.notifyMenuListeners();
      }
    }
  }

  onMenuChange(callback) {
    this.menuCallbacks.push(callback);
    if (!this.useFirebase) {
      callback(this.getLocalMenu());
    }
  }

  getLocalMenu() {
    this.initLocalStorageData();
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.MENU)) || this.DEFAULT_MENU;
    } catch(e) {
      return this.DEFAULT_MENU;
    }
  }

  notifyMenuListeners() {
    const menu = this.getLocalMenu();
    this.menuCallbacks.forEach(cb => cb(menu));
  }

  // --- Reviews APIs ---

  saveReview(reviewData) {
    const review = {
      id: 'rev-' + Date.now(),
      ...reviewData,
      date: new Date().toISOString().split('T')[0]
    };

    if (this.useFirebase) {
      this.firebaseDb.ref('reviews').push(review);
    } else {
      const reviews = this.getLocalReviews();
      reviews.unshift(review);
      localStorage.setItem(this.STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
      this.notifyReviewListeners();
    }
  }

  onReviewsChange(callback) {
    this.reviewCallbacks.push(callback);
    if (!this.useFirebase) {
      callback(this.getLocalReviews());
    }
  }

  getLocalReviews() {
    this.initLocalStorageData();
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.REVIEWS)) || this.DEFAULT_REVIEWS;
    } catch(e) {
      return this.DEFAULT_REVIEWS;
    }
  }

  notifyReviewListeners() {
    const reviews = this.getLocalReviews();
    this.reviewCallbacks.forEach(cb => cb(reviews));
  }

  // Force local view updates on initial config setup
  triggerLocalSync() {
    if (this.useFirebase) {
      this.setupFirebaseObservers();
    } else {
      this.initLocalStorageData();
      this.notifyOrderListeners();
      this.notifyMenuListeners();
      this.notifyReviewListeners();
    }
  }

  // --- Simulated Order Progression ---
  // In simulated local mode, new orders automatically advance status over time
  // to make the live dashboard feel interactive and dynamic without manual admin clicks.
  startMockStatusProgression() {
    setInterval(() => {
      if (this.useFirebase) return; // Only run in local mock mode
      
      const orders = this.getLocalOrders();
      let changed = false;

      orders.forEach(order => {
        if (order.status === 'Delivered' || order.status === 'Cancelled') return;

        const timeDiffSec = (Date.now() - order.timestamp) / 1000;

        if (order.status === 'Pending' && timeDiffSec > 15) {
          order.status = 'Preparing';
          changed = true;
          this.triggerNotification(order.id, 'Preparing');
        } else if (order.status === 'Preparing' && timeDiffSec > 35) {
          order.status = 'Ready';
          changed = true;
          this.triggerNotification(order.id, 'Ready');
        } else if (order.status === 'Ready' && timeDiffSec > 60) {
          order.status = 'Delivered';
          changed = true;
          this.triggerNotification(order.id, 'Delivered');
        }
      });

      if (changed) {
        localStorage.setItem(this.STORAGE_KEYS.ORDERS, JSON.stringify(orders));
        this.notifyOrderListeners();
      }
    }, 5000); // Check every 5 seconds
  }

  triggerNotification(orderId, status) {
    // Dispatch a custom event for live toasts in app.js
    const event = new CustomEvent('orderStatusUpdate', {
      detail: { orderId, status }
    });
    window.dispatchEvent(event);
  }
}

// Global database service instance
window.dbService = new DatabaseService();
