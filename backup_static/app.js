/**
 * Pani Puri Paradise - Main Application Logic
 * Integrates UI components, cart management, search, lightbox, review forms,
 * toast notification systems, and the Admin Panel with real-time sync.
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  let cart = JSON.parse(localStorage.getItem('ppp_cart')) || [];
  let menuData = {};
  let ordersData = [];
  let reviewsData = [];
  let isAdminAuthenticated = sessionStorage.getItem('ppp_admin_logged') === 'true';
  let activeAdminTab = 'admin-orders';
  let currentRating = 5;

  // --- HTML ELEMENT REFERENCES ---
  const themeToggle = document.getElementById('theme-toggle');
  const cartToggle = document.getElementById('cart-toggle');
  const cartCount = document.getElementById('cart-count');
  const mobileNavToggle = document.getElementById('mobile-nav-toggle');
  const navLinks = document.getElementById('nav-links');
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-overlay');
  const closeCartBtn = document.getElementById('close-cart');
  const cartItemsContainer = document.getElementById('cart-items-container');
  const cartSubtotal = document.getElementById('cart-subtotal');
  const cartTax = document.getElementById('cart-tax');
  const cartTotal = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('checkout-btn');
  const checkoutModal = document.getElementById('checkout-modal');
  const closeCheckoutBtn = document.getElementById('close-checkout');
  const checkoutForm = document.getElementById('checkout-form');
  const menuGrid = document.getElementById('menu-grid');
  const menuSearchInput = document.getElementById('menu-search-input');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const reviewForm = document.getElementById('review-form');
  const reviewsList = document.getElementById('reviews-list');
  const starRatingSelect = document.getElementById('star-rating-select');
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const closeLightboxBtn = document.getElementById('close-lightbox');
  const contactForm = document.getElementById('contact-form');
  
  // Live Orders
  const liveOrdersContainer = document.getElementById('live-orders-container');
  const statActive = document.getElementById('stat-active');
  const statPreparing = document.getElementById('stat-preparing');
  const statReady = document.getElementById('stat-ready');
  const feedList = document.getElementById('feed-list');

  // Checkout modal type tabs
  const orderTypeBtns = document.querySelectorAll('.order-type-btn');
  const dineinGroup = document.getElementById('dinein-group');
  const deliveryGroup = document.getElementById('delivery-group');
  let selectedOrderType = 'dinein';

  // Admin Dashboard
  const adminSection = document.getElementById('admin');
  const adminNavLink = document.getElementById('admin-nav-link');
  const adminTabBtns = document.querySelectorAll('.admin-tab-btn');
  const adminPanels = document.querySelectorAll('.admin-panel-content');
  const adminOrdersList = document.getElementById('admin-orders-list');
  const adminInventoryList = document.getElementById('admin-inventory-list');
  const fbConfigForm = document.getElementById('firebase-config-form');
  const fbClearConfigBtn = document.getElementById('fb-clear-config');
  const adminDbStatusBadge = document.getElementById('admin-db-status');

  // Analytics Elements
  const analyticRevenue = document.getElementById('analytic-revenue');
  const analyticOrders = document.getElementById('analytic-orders');
  const analyticAvgValue = document.getElementById('analytic-avg-value');
  const analyticPopularItems = document.getElementById('analytic-popular-items');

  // Map controls
  const mapZoomBtns = document.querySelectorAll('.map-zoom-btn');

  // --- AUDIO SYNTH NOTIFICATION CHIME ---
  // Plays a beautiful double-tone bell when order status updates
  function playNotificationChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc1.type = 'sine';
      osc2.type = 'triangle';
      
      const now = ctx.currentTime;
      // High-chime sequence: C5 then E5
      osc1.frequency.setValueAtTime(523.25, now);
      osc1.frequency.setValueAtTime(659.25, now + 0.12);
      
      osc2.frequency.setValueAtTime(261.63, now); // C4 support
      osc2.frequency.setValueAtTime(329.63, now + 0.12);
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      
      osc1.start(now);
      osc1.stop(now + 0.5);
      osc2.start(now);
      osc2.stop(now + 0.5);
    } catch (e) {
      console.warn("Audio chime autoplay blocked or unsupported: ", e);
    }
  }

  // --- TOAST NOTIFICATIONS ---
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Choose icon based on type
    let iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-triangle';
    if (type === 'info') iconName = 'info';
    
    toast.innerHTML = `
      <i data-lucide="${iconName}"></i>
      <span>${message}</span>
    `;
    
    container.appendChild(toast);
    lucide.createIcons();
    
    // Slide out and remove after 4 seconds
    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 4000);
  }

  // Listen to order status updates dispatched from database layer
  window.addEventListener('orderStatusUpdate', (e) => {
    const { orderId, status } = e.detail;
    showToast(`Order ${orderId} is now ${status}!`, 'info');
    playNotificationChime();
    addLiveFeedItem(`Order #${orderId} changed status to: ${status}`);
  });

  // --- INITIAL DATABASE SYNCS ---
  
  // Sync Menu Items
  window.dbService.onMenuChange((menu) => {
    menuData = menu;
    renderMenu();
    if (isAdminAuthenticated) {
      renderAdminInventory();
    }
  });

  // Sync Orders
  window.dbService.onOrdersChange((orders) => {
    ordersData = orders;
    renderLiveOrders();
    updateLiveOrderStats();
    if (isAdminAuthenticated) {
      renderAdminOrders();
      renderAdminAnalytics();
    }
  });

  // Sync Reviews
  window.dbService.onReviewsChange((reviews) => {
    reviewsData = reviews;
    renderReviews();
  });

  // Update Database Connection Status Badge in Admin
  function updateAdminDbBadge() {
    const isLive = window.dbService.useFirebase;
    adminDbStatusBadge.textContent = isLive ? 'Live Firebase RTD' : 'Simulated Local Mode';
    adminDbStatusBadge.className = isLive ? 'mode-badge live' : 'mode-badge';
  }
  updateAdminDbBadge();

  // --- THEME / DARK MODE ---
  const savedTheme = localStorage.getItem('ppp_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeToggleIcons(savedTheme);

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('ppp_theme', newTheme);
    updateThemeToggleIcons(newTheme);
    showToast(`Switched to ${newTheme} mode!`, 'info');
  });

  function updateThemeToggleIcons(theme) {
    const moon = themeToggle.querySelector('.theme-icon-dark');
    const sun = themeToggle.querySelector('.theme-icon-light');
    if (theme === 'dark') {
      moon.style.display = 'none';
      sun.style.display = 'block';
    } else {
      moon.style.display = 'block';
      sun.style.display = 'none';
    }
  }

  // --- MOBILE NAVIGATION BAR ---
  mobileNavToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    const isOpen = navLinks.classList.contains('open');
    mobileNavToggle.innerHTML = isOpen ? '<i data-lucide="x"></i>' : '<i data-lucide="menu"></i>';
    lucide.createIcons();
  });

  // Close mobile nav on click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      mobileNavToggle.innerHTML = '<i data-lucide="menu"></i>';
      lucide.createIcons();
    });
  });

  // Highlight active nav item on scroll
  window.addEventListener('scroll', () => {
    let current = 'home';
    const sections = document.querySelectorAll('section');
    const scrollPos = window.scrollY + 100;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        current = section.getAttribute('id');
      }
    });

    // Handle Admin Section separately (since it has absolute layout toggles)
    if (adminSection.classList.contains('active') && window.scrollY + window.innerHeight >= document.body.scrollHeight - 50) {
      current = 'admin';
    }

    const navItems = navLinks.querySelectorAll('a');
    navItems.forEach(item => {
      item.classList.remove('active');
      const href = item.getAttribute('href');
      if (href === `#${current}` || (current === 'admin' && href === '#admin')) {
        item.classList.add('active');
      }
    });
  });

  // --- CART MANAGEMENT ---
  
  function updateCartUI() {
    localStorage.setItem('ppp_cart', JSON.stringify(cart));
    
    // Update badge count
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCount.textContent = totalQty;
    
    // Render drawer list
    if (cart.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="cart-empty-state">
          <i data-lucide="shopping-bag" style="width:40px; height:40px; color: var(--text-muted);"></i>
          <p>Your cart is empty.</p>
          <p style="font-size:0.85rem; color:var(--text-muted);">Explore our menu and add delicious plates!</p>
        </div>
      `;
    } else {
      cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.name}" class="cart-item-img">
          <div class="cart-item-details">
            <h4>${item.name}</h4>
            <div class="price">₹${item.price}</div>
            <div class="cart-item-qty-actions">
              <button class="qty-btn dec-qty" data-id="${item.id}">-</button>
              <span class="cart-item-qty">${item.qty}</span>
              <button class="qty-btn inc-qty" data-id="${item.id}">+</button>
              
              <button class="remove-item-btn" data-id="${item.id}">
                <i data-lucide="trash-2" style="width:14px; height:14px;"></i> Remove
              </button>
            </div>
          </div>
        </div>
      `).join('');
    }
    
    lucide.createIcons();
    
    // Calculate values
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const tax = Math.round(subtotal * 0.05); // 5% GST
    const total = subtotal + tax;
    
    cartSubtotal.textContent = `₹${subtotal}`;
    cartTax.textContent = `₹${tax}`;
    cartTotal.textContent = `₹${total}`;
    
    // Disable/Enable checkout button
    checkoutBtn.disabled = cart.length === 0;
    
    // Add event listeners inside cart drawer items
    const decBtns = cartItemsContainer.querySelectorAll('.dec-qty');
    const incBtns = cartItemsContainer.querySelectorAll('.inc-qty');
    const removeBtns = cartItemsContainer.querySelectorAll('.remove-item-btn');
    
    decBtns.forEach(btn => btn.addEventListener('click', () => changeQuantity(btn.dataset.id, -1)));
    incBtns.forEach(btn => btn.addEventListener('click', () => changeQuantity(btn.dataset.id, 1)));
    removeBtns.forEach(btn => btn.addEventListener('click', () => removeFromCart(btn.dataset.id)));
  }

  function addToCart(id) {
    const menuItem = menuData[id];
    if (!menuItem || !menuItem.inStock) {
      showToast("Sorry, this item is currently out of stock!", "error");
      return;
    }
    
    const existing = cart.find(item => item.id === id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        id: id,
        name: menuItem.name,
        price: menuItem.price,
        image: menuItem.image,
        qty: 1
      });
    }
    
    updateCartUI();
    showToast(`Added ${menuItem.name} to cart!`);
    
    // Audio chirp
    playNotificationChime();
    
    // Slide cart drawer open automatically on first add
    if (cart.length === 1 && cart[0].qty === 1) {
      toggleCartDrawer(true);
    }
  }

  function changeQuantity(id, delta) {
    const item = cart.find(item => item.id === id);
    if (!item) return;
    
    item.qty += delta;
    if (item.qty <= 0) {
      removeFromCart(id);
    } else {
      updateCartUI();
    }
  }

  function removeFromCart(id) {
    const item = cart.find(item => item.id === id);
    const name = item ? item.name : 'Item';
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
    showToast(`Removed ${name} from cart`, 'info');
  }

  function toggleCartDrawer(open) {
    if (open) {
      cartDrawer.classList.add('open');
      cartOverlay.classList.add('open');
    } else {
      cartDrawer.classList.remove('open');
      cartOverlay.classList.remove('open');
    }
  }

  cartToggle.addEventListener('click', () => toggleCartDrawer(true));
  closeCartBtn.addEventListener('click', () => toggleCartDrawer(false));
  cartOverlay.addEventListener('click', () => toggleCartDrawer(false));

  updateCartUI();

  // --- CHECKOUT & ORDERING FLOW ---
  
  checkoutBtn.addEventListener('click', () => {
    toggleCartDrawer(false);
    checkoutModal.classList.add('open');
  });

  closeCheckoutBtn.addEventListener('click', () => {
    checkoutModal.classList.remove('open');
  });

  checkoutModal.addEventListener('click', (e) => {
    if (e.target === checkoutModal) {
      checkoutModal.classList.remove('open');
    }
  });

  // Toggling Dine-in vs Delivery
  orderTypeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      orderTypeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const type = btn.dataset.type;
      selectedOrderType = type;
      
      if (type === 'dinein') {
        dineinGroup.style.display = 'block';
        deliveryGroup.style.display = 'none';
        document.getElementById('cust-table').required = true;
        document.getElementById('cust-address').required = false;
      } else {
        dineinGroup.style.display = 'none';
        deliveryGroup.style.display = 'block';
        document.getElementById('cust-table').required = false;
        document.getElementById('cust-address').required = true;
      }
    });
  });

  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const table = document.getElementById('cust-table').value.trim();
    const address = document.getElementById('cust-address').value.trim();
    
    const orderItems = cart.map(item => ({
      itemId: item.id,
      name: item.name,
      qty: item.qty,
      price: item.price
    }));

    const orderSubtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const orderTax = Math.round(orderSubtotal * 0.05);
    const orderTotal = orderSubtotal + orderTax;

    const orderData = {
      customer: {
        name,
        phone,
        type: selectedOrderType,
        table: selectedOrderType === 'dinein' ? table : null,
        address: selectedOrderType === 'delivery' ? address : null
      },
      items: orderItems,
      totals: {
        subtotal: orderSubtotal,
        tax: orderTax,
        total: orderTotal
      }
    };

    // Save to database
    const orderId = window.dbService.saveOrder(orderData);
    
    // Clear state
    cart = [];
    updateCartUI();
    
    checkoutForm.reset();
    checkoutModal.classList.remove('open');
    
    showToast(`Order Placed Successfully! Your ID is: ${orderId}`, 'success');
    addLiveFeedItem(`Order Placed: #${orderId} for ${name} (Grand Total: ₹${orderTotal})`);
    
    // Smooth scroll to live tracker dashboard
    document.getElementById('live-tracker').scrollIntoView({ behavior: 'smooth' });
  });

  // --- MENU RENDER & SEARCH ---
  
  let activeFilter = 'all';

  function renderMenu() {
    const searchVal = menuSearchInput.value.toLowerCase().trim();
    let keys = Object.keys(menuData);

    // Filter by category
    if (activeFilter !== 'all') {
      keys = keys.filter(key => {
        if (activeFilter === 'panipuri') return key.includes('panipuri');
        if (activeFilter === 'chaats') return key.includes('puri') && !key.includes('panipuri');
        if (activeFilter === 'combos') return key.includes('combo');
        return true;
      });
    }

    // Filter by search text
    if (searchVal !== '') {
      keys = keys.filter(key => {
        const item = menuData[key];
        return item.name.toLowerCase().includes(searchVal) || 
               item.description.toLowerCase().includes(searchVal);
      });
    }

    if (keys.length === 0) {
      menuGrid.innerHTML = `
        <div class="cart-empty-state" style="grid-column: 1/-1; padding: 40px;">
          <i data-lucide="frown" style="width:40px; height:40px; color: var(--text-muted);"></i>
          <p>No menu items matched your search.</p>
          <p style="font-size:0.85rem; color:var(--text-muted);">Try typing another recipe or clear the filter!</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    menuGrid.innerHTML = keys.map(key => {
      const item = menuData[key];
      const outOfStockClass = !item.inStock ? 'out-of-stock' : '';
      const outOfStockBadge = !item.inStock ? `<div class="out-of-stock-badge">Sold Out</div>` : '';
      
      return `
        <div class="menu-card ${outOfStockClass}" data-id="${key}">
          ${outOfStockBadge}
          <div class="menu-card-img-wrapper">
            <img src="${item.image}" alt="${item.name}" class="menu-card-img" loading="lazy">
            <span class="menu-card-rating">
              <i data-lucide="star" style="width:12px; height:12px; fill:currentColor;"></i> ${item.rating}
            </span>
          </div>
          <div class="menu-card-content">
            <h3 class="menu-card-title">${item.name}</h3>
            <p class="menu-card-desc">${item.description}</p>
            <div class="menu-card-footer">
              <span class="menu-card-price">₹${item.price}</span>
              <button class="add-to-cart-btn add-btn" data-id="${key}" aria-label="Add ${item.name} to cart" ${!item.inStock ? 'disabled' : ''}>
                <i data-lucide="plus"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    lucide.createIcons();

    // Attach listeners
    const addBtns = menuGrid.querySelectorAll('.add-btn');
    addBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        addToCart(btn.dataset.id);
      });
    });
  }

  // Search input debouncing/listening
  menuSearchInput.addEventListener('input', renderMenu);

  // Filters logic
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      renderMenu();
    });
  });

  // --- LIVE ORDERS DASHBOARD ---
  
  function renderLiveOrders() {
    // Only display active orders (Pending, Preparing, Ready) in the customer view
    const activeOrders = ordersData.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
    
    if (activeOrders.length === 0) {
      liveOrdersContainer.innerHTML = `
        <div class="cart-empty-state" style="padding: 40px; background-color: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <i data-lucide="activity" style="width:48px; height:48px; color: var(--text-muted);"></i>
          <p style="font-weight:600;">No active live orders right now.</p>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Add items to your cart, place an order, and watch it show up here!</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    liveOrdersContainer.innerHTML = activeOrders.map(order => {
      const itemsString = order.items.map(i => `${i.name} (x${i.qty})`).join(', ');
      const status = order.status;
      
      // Calculate active steps for tracking timeline
      const stepPending = status === 'Pending' || status === 'Preparing' || status === 'Ready' || status === 'Delivered' ? 'active' : '';
      const stepPreparing = status === 'Preparing' || status === 'Ready' || status === 'Delivered' ? 'active' : '';
      const stepReady = status === 'Ready' || status === 'Delivered' ? 'active' : '';
      const stepDelivered = status === 'Delivered' ? 'active' : '';

      // Complete steps (green dots)
      const cPending = status === 'Preparing' || status === 'Ready' || status === 'Delivered' ? 'completed' : '';
      const cPreparing = status === 'Ready' || status === 'Delivered' ? 'completed' : '';
      const cReady = status === 'Delivered' ? 'completed' : '';
      const cDelivered = ''; // Handled by active check

      const orderTypeLabel = order.customer.type === 'dinein' ? `Dine-in (Table ${order.customer.table})` : `Delivery`;
      const timeStr = new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return `
        <div class="live-order-card" data-order-id="${order.id}">
          <div class="live-order-header">
            <div>
              <span class="live-order-id">Order #${order.id}</span>
              <span style="font-size:0.8rem; color: var(--text-muted); margin-left: 10px;">${orderTypeLabel}</span>
            </div>
            <div>
              <span class="badge badge-${status.toLowerCase()}">${status}</span>
              <span class="live-order-time">${timeStr}</span>
            </div>
          </div>
          
          <div class="live-order-items">
            <strong>Cravings:</strong> ${itemsString}
          </div>
          
          <!-- Tracking progress bar timeline -->
          <div class="timeline">
            <div class="timeline-step ${stepPending} ${cPending}">
              <div class="timeline-dot">
                <span>1</span>
                <i data-lucide="check"></i>
              </div>
              <div class="timeline-label">Placed</div>
            </div>
            
            <div class="timeline-step preparing-step ${stepPreparing} ${cPreparing}">
              <div class="timeline-dot">
                <span>2</span>
                <i data-lucide="check"></i>
              </div>
              <div class="timeline-label">Preparing</div>
            </div>
            
            <div class="timeline-step ready-step ${stepReady} ${cReady}">
              <div class="timeline-dot">
                <span>3</span>
                <i data-lucide="check"></i>
              </div>
              <div class="timeline-label">Ready</div>
            </div>
            
            <div class="timeline-step delivered-step ${stepDelivered}">
              <div class="timeline-dot">
                <span>4</span>
                <i data-lucide="check"></i>
              </div>
              <div class="timeline-label">Served</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    lucide.createIcons();
  }

  function updateLiveOrderStats() {
    const active = ordersData.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length;
    const preparing = ordersData.filter(o => o.status === 'Preparing').length;
    const ready = ordersData.filter(o => o.status === 'Ready').length;

    statActive.textContent = active;
    statPreparing.textContent = preparing;
    statReady.textContent = ready;
  }

  function addLiveFeedItem(message) {
    const li = document.createElement('li');
    li.className = 'feed-item';
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    li.innerHTML = `
      <span>${message}</span>
      <span class="time">${now}</span>
    `;
    
    // Add to top of list
    feedList.insertBefore(li, feedList.firstChild);
    
    // Limit to 6 items
    while (feedList.children.length > 6) {
      feedList.lastChild.remove();
    }
  }

  // --- REVIEWS / TESTIMONIALS ---
  
  // Custom Star rating UI logic in reviews form
  starRatingSelect.querySelectorAll('span').forEach(star => {
    star.addEventListener('click', () => {
      currentRating = parseInt(star.dataset.star);
      
      // Update visual stars
      starRatingSelect.querySelectorAll('span').forEach(s => {
        const sVal = parseInt(s.dataset.star);
        if (sVal <= currentRating) {
          s.classList.add('active');
        } else {
          s.classList.remove('active');
        }
      });
    });
  });

  reviewForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('review-name').value.trim();
    const comment = document.getElementById('review-comment').value.trim();
    
    const reviewData = {
      name,
      rating: currentRating,
      comment
    };

    window.dbService.saveReview(reviewData);
    
    // Reset form
    reviewForm.reset();
    currentRating = 5;
    starRatingSelect.querySelectorAll('span').forEach(s => s.classList.add('active'));
    
    showToast("Review submitted successfully! Thank you!");
  });

  function renderReviews() {
    if (reviewsData.length === 0) {
      reviewsList.innerHTML = `<p style="text-align:center; color:var(--text-muted);">No reviews posted yet.</p>`;
      return;
    }

    reviewsList.innerHTML = reviewsData.map(r => {
      let starsHtml = '';
      for (let i = 1; i <= 5; i++) {
        const starClass = i <= r.rating ? 'fill: currentColor;' : 'opacity: 0.3;';
        starsHtml += `<i data-lucide="star" style="width:14px; height:14px; ${starClass}"></i>`;
      }

      return `
        <div class="review-card">
          <div class="review-card-header">
            <span class="review-author">${r.name}</span>
            <div class="review-stars">${starsHtml}</div>
          </div>
          <p class="review-comment">"${r.comment}"</p>
          <span class="review-date">${r.date}</span>
        </div>
      `;
    }).join('');

    lucide.createIcons();
  }

  // --- GALLERY LIGHTBOX ---
  
  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const url = item.dataset.imgUrl;
      lightboxImg.src = url;
      lightbox.style.display = 'flex';
      // Force repaint to trigger CSS opacity transition
      lightbox.offsetHeight;
      lightbox.classList.add('open');
    });
  });

  function closeLightbox() {
    lightbox.classList.remove('open');
    setTimeout(() => {
      lightbox.style.display = 'none';
      lightboxImg.src = '';
    }, 300);
  }

  closeLightboxBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  // --- CONTACT FORM ---
  
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('contact-name').value.trim();
    showToast(`Thank you ${name}! Your inquiry has been received.`, 'success');
    contactForm.reset();
  });

  // --- MOCK MAP ZOOM CONTROLS ---
  mapZoomBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.textContent;
      showToast(`Map Zoom ${action === '+' ? 'In' : 'Out'} (Simulated)`);
    });
  });

  // --- ADMIN AUTHENTICATION GATE ---
  
  const adminLinkBtns = document.querySelectorAll('.admin-link-btn');
  
  adminLinkBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      
      if (isAdminAuthenticated) {
        // Scroll to admin view
        revealAdminDashboard();
      } else {
        // Request password
        const password = prompt("Enter Admin Passcode (Hint: admin):");
        if (password === 'admin') {
          isAdminAuthenticated = true;
          sessionStorage.setItem('ppp_admin_logged', 'true');
          revealAdminDashboard();
          showToast("Admin authenticated successfully!", "success");
        } else if (password !== null) {
          showToast("Incorrect passcode!", "error");
        }
      }
    });
  });

  function revealAdminDashboard() {
    adminSection.classList.add('active');
    // Change nav links text to Log Out Admin
    adminNavLink.innerHTML = 'Log Out Admin';
    adminNavLink.classList.add('admin-logged-in');
    
    // Remove individual click prompt listener on log out state
    adminNavLink.onclick = (e) => {
      if (isAdminAuthenticated) {
        e.preventDefault();
        e.stopPropagation();
        
        isAdminAuthenticated = false;
        sessionStorage.removeItem('ppp_admin_logged');
        adminSection.classList.remove('active');
        adminNavLink.innerHTML = 'Admin';
        adminNavLink.onclick = null; // reset
        showToast("Logged out from Admin Dashboard", "info");
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    // Render Admin Views
    renderAdminOrders();
    renderAdminInventory();
    renderAdminAnalytics();
    updateAdminDbBadge();
    
    // Prefill Firebase config inputs
    const fbConfig = window.dbService.getFirebaseConfig();
    if (fbConfig) {
      document.getElementById('fb-apikey').value = fbConfig.apiKey || '';
      document.getElementById('fb-authdomain').value = fbConfig.authDomain || '';
      document.getElementById('fb-dburl').value = fbConfig.databaseURL || '';
      document.getElementById('fb-projectid').value = fbConfig.projectId || '';
    }

    // Smooth scroll to admin
    adminSection.scrollIntoView({ behavior: 'smooth' });
  }

  // Reload admin state on refresh if already authenticated
  if (isAdminAuthenticated) {
    revealAdminDashboard();
  }

  // Admin section Tabs toggler
  adminTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      adminTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      activeAdminTab = btn.dataset.tab;
      adminPanels.forEach(panel => {
        panel.classList.remove('active');
        if (panel.getAttribute('id') === activeAdminTab) {
          panel.classList.add('active');
        }
      });
    });
  });

  // --- TAB 1: ADMIN ORDERS MANAGER ---
  
  function renderAdminOrders() {
    if (ordersData.length === 0) {
      adminOrdersList.innerHTML = `<p style="text-align:center; padding: 30px; color: var(--text-muted);">No orders placed yet.</p>`;
      return;
    }

    adminOrdersList.innerHTML = ordersData.map(order => {
      const itemsString = order.items.map(i => `${i.name} (x${i.qty})`).join(', ');
      const customerLabel = order.customer.type === 'dinein' ? `Dine-in (Tbl ${order.customer.table})` : `Delivery`;
      
      return `
        <div class="admin-order-row">
          <div class="admin-order-customer">
            <h5>${order.customer.name}</h5>
            <p>${order.customer.phone} | ${customerLabel}</p>
          </div>
          <div class="admin-order-items">
            <strong>Cravings:</strong> ${itemsString}
          </div>
          <div class="admin-order-total">
            ₹${order.totals.total}
          </div>
          <div class="admin-order-actions">
            <select class="admin-select-status" data-order-id="${order.id}">
              <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Preparing" ${order.status === 'Preparing' ? 'selected' : ''}>Preparing</option>
              <option value="Ready" ${order.status === 'Ready' ? 'selected' : ''}>Ready</option>
              <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
              <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </div>
        </div>
      `;
    }).join('');

    // Attach status select event listeners
    adminOrdersList.querySelectorAll('.admin-select-status').forEach(select => {
      select.addEventListener('change', (e) => {
        const orderId = select.dataset.orderId;
        const newStatus = select.value;
        window.dbService.updateOrderStatus(orderId, newStatus);
        showToast(`Status of order #${orderId} updated to ${newStatus}`);
        addLiveFeedItem(`Admin changed Order #${orderId} status to: ${newStatus}`);
      });
    });
  }

  // --- TAB 2: ADMIN INVENTORY MANAGER ---
  
  function renderAdminInventory() {
    const menuKeys = Object.keys(menuData);
    
    adminInventoryList.innerHTML = menuKeys.map(key => {
      const item = menuData[key];
      
      return `
        <div class="inventory-row">
          <div class="inventory-item-info">
            <img src="${item.image}" alt="${item.name}" class="inventory-item-img">
            <span class="inventory-item-title">${item.name}</span>
          </div>
          
          <div class="inventory-item-price-edit">
            <span>Price (₹):</span>
            <input type="number" class="inventory-price-input" data-id="${key}" value="${item.price}" min="1">
          </div>
          
          <div style="display:flex; align-items:center; gap: 10px;">
            <span style="font-size:0.85rem; font-weight:600;">Stock Availability:</span>
            <label class="switch">
              <input type="checkbox" class="inventory-stock-toggle" data-id="${key}" ${item.inStock ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </div>
        </div>
      `;
    }).join('');

    // Attach price inputs and toggles listeners
    adminInventoryList.querySelectorAll('.inventory-price-input').forEach(input => {
      input.addEventListener('change', () => {
        const itemId = input.dataset.id;
        const newPrice = input.value;
        window.dbService.updateItemPrice(itemId, newPrice);
        showToast(`Updated price of ${menuData[itemId].name} to ₹${newPrice}`);
      });
    });

    adminInventoryList.querySelectorAll('.inventory-stock-toggle').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const itemId = checkbox.dataset.id;
        const inStock = checkbox.checked;
        window.dbService.updateItemStock(itemId, inStock);
        showToast(`${menuData[itemId].name} is now ${inStock ? 'In Stock' : 'Out of Stock'}`);
      });
    });
  }

  // --- TAB 3: ADMIN SALES ANALYTICS ---
  
  function renderAdminAnalytics() {
    // Deliver orders represent finalized revenue sales
    const completedOrders = ordersData.filter(o => o.status === 'Delivered');
    const revenue = completedOrders.reduce((sum, o) => sum + o.totals.total, 0);
    const count = completedOrders.length;
    const avg = count > 0 ? Math.round(revenue / count) : 0;

    analyticRevenue.textContent = `₹${revenue}`;
    analyticOrders.textContent = count;
    analyticAvgValue.textContent = `₹${avg}`;

    // Calculate popularity counts
    const popularity = {};
    // Seed with all current menu keys to ensure they exist on metrics
    Object.keys(menuData).forEach(k => {
      popularity[k] = { name: menuData[k].name, count: 0 };
    });

    // Count item counts from orders (completed or active orders)
    ordersData.forEach(order => {
      if (order.status === 'Cancelled') return;
      order.items.forEach(item => {
        if (popularity[item.itemId]) {
          popularity[item.itemId].count += item.qty;
        }
      });
    });

    // Convert to array and sort by popularity count descending
    const sortedPopular = Object.keys(popularity).map(key => ({
      key,
      name: popularity[key].name,
      count: popularity[key].count
    })).sort((a, b) => b.count - a.count);

    const maxCount = sortedPopular.length > 0 ? sortedPopular[0].count : 1;
    const finalMax = maxCount === 0 ? 1 : maxCount;

    analyticPopularItems.innerHTML = sortedPopular.map(item => {
      const percentage = Math.round((item.count / finalMax) * 100);
      return `
        <div class="popular-item-row">
          <div class="popular-item-info">
            <span>${item.name}</span>
            <span>${item.count} orders</span>
          </div>
          <div class="popular-item-bar-bg">
            <div class="popular-item-bar-fill" style="width: ${percentage}%;"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- TAB 4: FIREBASE SETTINGS CONFIGS ---
  
  fbConfigForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const apiKey = document.getElementById('fb-apikey').value.trim();
    const authDomain = document.getElementById('fb-authdomain').value.trim();
    const databaseURL = document.getElementById('fb-dburl').value.trim();
    const projectId = document.getElementById('fb-projectid').value.trim();

    if (!apiKey || !databaseURL) {
      showToast("API Key and Database URL are required fields!", "error");
      return;
    }

    const config = {
      apiKey,
      authDomain,
      databaseURL,
      projectId
    };

    window.dbService.saveFirebaseConfig(config);
    updateAdminDbBadge();
    showToast("Firebase configurations saved successfully! Reconnected database.", "success");
    addLiveFeedItem("Database connection mode switched to Live Firebase.");
  });

  fbClearConfigBtn.addEventListener('click', () => {
    window.dbService.saveFirebaseConfig(null);
    updateAdminDbBadge();
    
    // Clear form inputs
    fbConfigForm.reset();
    
    showToast("Disconnected from Firebase. Reverted to local storage database mock.", "info");
    addLiveFeedItem("Database connection mode reverted to Local Storage Mock.");
  });

});
