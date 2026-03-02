import { useState, useEffect, useRef } from 'react';
import { db } from './firebase';
import { ref, onValue, set, push, remove, update } from 'firebase/database';

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════════════ */

const ROOMS = [402, 404, 406, 408];

const ROOM_STATUS = {
  VACANT_CLEAN: 'vacant-clean',
  VACANT_DIRTY: 'vacant-dirty',
  OCCUPIED: 'occupied',
  MAINTENANCE: 'maintenance',
};

const STATUS_INFO = {
  [ROOM_STATUS.VACANT_CLEAN]:  { label: 'Vacant & Clean', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500', emoji: '✨' },
  [ROOM_STATUS.VACANT_DIRTY]:  { label: 'Needs Cleaning', color: 'bg-amber-100 text-amber-800 border-amber-300', dot: 'bg-amber-500', emoji: '🧹' },
  [ROOM_STATUS.OCCUPIED]:      { label: 'Occupied', color: 'bg-blue-100 text-blue-800 border-blue-300', dot: 'bg-blue-500', emoji: '🛏️' },
  [ROOM_STATUS.MAINTENANCE]:   { label: 'Maintenance', color: 'bg-red-100 text-red-800 border-red-300', dot: 'bg-red-500', emoji: '🔧' },
};

const ROLES = [
  { id: 'manager',      label: 'Manager',      emoji: '👔', desc: 'Oversee everything' },
  { id: 'receptionist', label: 'Receptionist', emoji: '🛎️', desc: 'Check guests in & out' },
  { id: 'housekeeper',  label: 'Housekeeper',  emoji: '🧹', desc: 'Clean rooms & restock' },
  { id: 'bellhop',      label: 'Bellhop',      emoji: '🧳', desc: 'Room service & luggage' },
];

const ROOM_THEMES = [
  { id: 'ocean',   label: 'Ocean Paradise',  emoji: '🌊', bg: 'from-cyan-50 to-blue-50',   accent: 'text-cyan-600' },
  { id: 'space',   label: 'Space Adventure', emoji: '🚀', bg: 'from-indigo-50 to-purple-50', accent: 'text-indigo-600' },
  { id: 'jungle',  label: 'Jungle Safari',   emoji: '🌴', bg: 'from-green-50 to-lime-50',  accent: 'text-green-600' },
  { id: 'royal',   label: 'Royal Palace',    emoji: '👑', bg: 'from-amber-50 to-yellow-50', accent: 'text-amber-600' },
  { id: 'default', label: 'Classic',         emoji: '🏨', bg: 'from-gray-50 to-slate-50',  accent: 'text-gray-600' },
];

const MENU_CATEGORIES = [
  { id: 'breakfast', label: 'Breakfast', emoji: '🥞' },
  { id: 'lunch',     label: 'Lunch',     emoji: '🍔' },
  { id: 'snacks',    label: 'Snacks',    emoji: '🍿' },
  { id: 'drinks',    label: 'Drinks',    emoji: '🥤' },
  { id: 'desserts',  label: 'Desserts',  emoji: '🍰' },
];

const MENU_ITEMS = [
  { id: 'm1',  name: 'Pancake Stack',      emoji: '🥞', price: 8,  cat: 'breakfast' },
  { id: 'm2',  name: 'Eggs & Toast',       emoji: '🍳', price: 7,  cat: 'breakfast' },
  { id: 'm3',  name: 'Fruit Bowl',         emoji: '🍓', price: 6,  cat: 'breakfast' },
  { id: 'm4',  name: 'Waffles',            emoji: '🧇', price: 9,  cat: 'breakfast' },
  { id: 'm5',  name: 'Cheeseburger',       emoji: '🍔', price: 12, cat: 'lunch' },
  { id: 'm6',  name: 'Grilled Cheese',     emoji: '🧀', price: 8,  cat: 'lunch' },
  { id: 'm7',  name: 'Chicken Nuggets',    emoji: '🍗', price: 10, cat: 'lunch' },
  { id: 'm8',  name: 'Pizza Slice',        emoji: '🍕', price: 6,  cat: 'lunch' },
  { id: 'm9',  name: 'Popcorn',            emoji: '🍿', price: 4,  cat: 'snacks' },
  { id: 'm10', name: 'Chips & Salsa',      emoji: '🌮', price: 5,  cat: 'snacks' },
  { id: 'm11', name: 'Cookie Plate',       emoji: '🍪', price: 5,  cat: 'snacks' },
  { id: 'm12', name: 'Lemonade',           emoji: '🍋', price: 4,  cat: 'drinks' },
  { id: 'm13', name: 'Hot Chocolate',      emoji: '☕', price: 5,  cat: 'drinks' },
  { id: 'm14', name: 'Milkshake',          emoji: '🥛', price: 7,  cat: 'drinks' },
  { id: 'm15', name: 'Juice Box',          emoji: '🧃', price: 3,  cat: 'drinks' },
  { id: 'm16', name: 'Ice Cream Sundae',   emoji: '🍨', price: 8,  cat: 'desserts' },
  { id: 'm17', name: 'Chocolate Cake',     emoji: '🎂', price: 9,  cat: 'desserts' },
  { id: 'm18', name: 'Cupcake',            emoji: '🧁', price: 5,  cat: 'desserts' },
];

const SUPPLIES = [
  { id: 's1', name: 'Fresh Towels', emoji: '🛁' },
  { id: 's2', name: 'Bed Sheets',   emoji: '🛏️' },
  { id: 's3', name: 'Soap & Shampoo', emoji: '🧴' },
  { id: 's4', name: 'Toilet Paper',  emoji: '🧻' },
  { id: 's5', name: 'Mini Fridge',   emoji: '🧊' },
  { id: 's6', name: 'Chocolates',    emoji: '🍫' },
];

const DOOR_SIGNS = [
  { id: 'none',    label: 'No Sign',          emoji: '' },
  { id: 'dnd',     label: 'Do Not Disturb',   emoji: '🔴' },
  { id: 'clean',   label: 'Please Clean',     emoji: '🟢' },
  { id: 'service', label: 'Room Service Pls',  emoji: '🟡' },
];

const NOTIF_TYPES = {
  'guest-checkin':  { label: 'Guest Check-In',  emoji: '🛎️' },
  'guest-checkout': { label: 'Guest Check-Out', emoji: '👋' },
  'room-ready':     { label: 'Room Ready',      emoji: '✨' },
  'room-service':   { label: 'Room Service',    emoji: '🍽️' },
  'order-ready':    { label: 'Order Ready',     emoji: '✅' },
  'maintenance':    { label: 'Maintenance',     emoji: '🔧' },
  'vip':            { label: 'VIP Guest',       emoji: '⭐' },
  'review':         { label: 'New Review',      emoji: '📝' },
};

const DEFAULT_STAFF = [
  { name: 'Ruth',  pin: '1111', emoji: '👩', color: '#2563eb' },
  { name: 'Rose',  pin: '2222', emoji: '👧', color: '#f59e0b' },
];

const FB = 'hotel';

/* ═══════════════════════════════════════════════════════════════════════════
   APP
   ═══════════════════════════════════════════════════════════════════════════ */

export default function App() {
  // ─── auth state ──────────────────────────────────────────────────────────
  const [staff, setStaff] = useState([]);
  const [guestAccounts, setGuestAccounts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginStep, setLoginStep] = useState('pick'); // pick | pin | role | guest-pick | guest-pin
  const [loginTarget, setLoginTarget] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // ─── data state ──────────────────────────────────────────────────────────
  const [rooms, setRooms] = useState({});
  const [guests, setGuests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [guestBook, setGuestBook] = useState([]);
  const [lostFound, setLostFound] = useState([]);
  const [timers, setTimers] = useState({});

  // ─── UI state ────────────────────────────────────────────────────────────
  const [view, setView] = useState('dashboard');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [toast, setToast] = useState(null);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [timerTick, setTimerTick] = useState(0);

  // ─── forms ───────────────────────────────────────────────────────────────
  const blankGuest = () => ({ name: '', numGuests: 1, roomNum: '', checkIn: new Date().toISOString().slice(0, 10), nights: 1, vip: false, requests: '', phone: '', guestPin: '' });
  const [guestForm, setGuestForm] = useState(blankGuest());
  const [menuCat, setMenuCat] = useState('breakfast');
  const [cart, setCart] = useState([]);
  const [orderRoom, setOrderRoom] = useState('');
  const [reviewForm, setReviewForm] = useState({ guestName: '', stars: 5, comment: '', roomNum: '' });
  const [lfForm, setLfForm] = useState({ description: '', foundWhere: '', foundBy: '' });

  // ─── PWA state ───────────────────────────────────────────────────────────
  const [notifPermission, setNotifPermission] = useState(() => typeof Notification !== 'undefined' ? Notification.permission : 'denied');
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(true);
  const seenNotifIds = useRef(new Set());

  const isLoggedIn = !!currentUser;
  const isGuest = currentUser?.accountType === 'guest';
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

  // ─── Toast helper ────────────────────────────────────────────────────────
  const showToast = (msg, dur = 2500) => { setToast(msg); setTimeout(() => setToast(null), dur); };

  // ─── Timer tick ──────────────────────────────────────────────────────────
  const hasActiveTimers = Object.keys(timers).length > 0 && isLoggedIn;
  useEffect(() => {
    if (!hasActiveTimers) return;
    const iv = setInterval(() => setTimerTick(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, [hasActiveTimers]);

  /* ═══════════════════════════════════════════════════════════════════════
     FIREBASE SYNC
     ═══════════════════════════════════════════════════════════════════════ */

  useEffect(() => {
    if (!db) return;
    const unsubs = [];
    const listen = (path, setter, isArray = true) => {
      const r = ref(db, `${FB}/${path}`);
      const u = onValue(r, snap => {
        const val = snap.val();
        if (isArray) {
          setter(val ? Object.entries(val).map(([id, v]) => ({ id, ...v })) : []);
        } else {
          setter(val || {});
        }
      });
      unsubs.push(() => u());
    };
    listen('staff', setStaff);
    listen('guestAccounts', setGuestAccounts);
    listen('rooms', (val) => {
      // initialize rooms if empty
      if (!val || Object.keys(val).length === 0) {
        const init = {};
        ROOMS.forEach(n => { init[n] = { status: ROOM_STATUS.VACANT_CLEAN, theme: 'default', doorSign: 'none', guestId: null }; });
        set(ref(db, `${FB}/rooms`), init);
      } else {
        setRooms(val);
      }
    }, false);
    listen('guests', setGuests);
    listen('orders', setOrders);
    listen('tasks', setTasks);
    listen('notifications', setNotifications);
    listen('guestBook', setGuestBook);
    listen('lostFound', setLostFound);
    listen('timers', (val) => setTimers(val || {}), false);

    // seed default staff if empty
    const staffRef = ref(db, `${FB}/staff`);
    onValue(staffRef, snap => {
      if (!snap.val()) {
        const seed = {};
        DEFAULT_STAFF.forEach(s => { seed[push(ref(db, `${FB}/staff`)).key] = s; });
        set(staffRef, seed);
      }
    }, { onlyOnce: true });

    return () => unsubs.forEach(u => u());
  }, []);

  // Sync current user
  useEffect(() => {
    if (!currentUser) return;
    const match = staff.find(s => s.id === currentUser.id);
    if (match) setCurrentUser(match);
  }, [staff]);

  // PWA install prompt
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Browser notifications from Firebase
  useEffect(() => {
    if (!isLoggedIn || !db) return;
    const r = ref(db, `${FB}/notifications`);
    const unsub = onValue(r, snap => {
      const val = snap.val();
      if (!val) return;
      const now = Date.now();
      Object.entries(val).forEach(([id, n]) => {
        if (seenNotifIds.current.has(id)) return;
        seenNotifIds.current.add(id);
        if (now - n.createdAt < 30000) {
          sendBrowserNotif(
            `${NOTIF_TYPES[n.type]?.emoji || '🔔'} ${NOTIF_TYPES[n.type]?.label || 'Alert'}`,
            n.message,
            `hotel-${id}`
          );
        }
      });
    });
    return () => unsub();
  }, [isLoggedIn, notifPermission]);

  /* ═══════════════════════════════════════════════════════════════════════
     AUTH FUNCTIONS
     ═══════════════════════════════════════════════════════════════════════ */

  const handlePickStaff = (s) => {
    setLoginTarget(s);
    setPinInput('');
    setPinError('');
    setLoginStep('pin');
  };

  const handlePinSubmit = () => {
    if (pinInput === loginTarget.pin) {
      setPinError('');
      setLoginStep('role');
    } else {
      setPinError('Wrong PIN!');
    }
  };

  const handlePickRole = (roleId) => {
    const updated = { ...loginTarget, currentRole: roleId };
    if (db) update(ref(db, `${FB}/staff/${loginTarget.id}`), { currentRole: roleId });
    setCurrentUser(updated);
    setLoginStep('pick');
    setLoginTarget(null);
    setPinInput('');
  };

  const handlePickGuest = (g) => {
    setLoginTarget(g);
    setPinInput('');
    setPinError('');
    setLoginStep('guest-pin');
  };

  const handleGuestPinSubmit = () => {
    if (pinInput === loginTarget.pin) {
      setCurrentUser({ ...loginTarget, accountType: 'guest' });
      setLoginStep('pick');
      setLoginTarget(null);
      setPinInput('');
      setView('guest-dashboard');
    } else {
      setPinError('Wrong PIN!');
    }
  };

  const handleLogout = () => {
    if (db && currentUser && !isGuest) update(ref(db, `${FB}/staff/${currentUser.id}`), { currentRole: null });
    setCurrentUser(null);
    setView('dashboard');
    setLoginStep('pick');
  };

  /* ═══════════════════════════════════════════════════════════════════════
     NOTIFICATION & PWA HELPERS
     ═══════════════════════════════════════════════════════════════════════ */

  const requestNotifPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
  };

  const sendBrowserNotif = (title, body, tag) => {
    if (notifPermission !== 'granted') return;
    try {
      const n = new Notification(title, {
        body, icon: '/seasons-study-app/hotel/icon-192.png',
        badge: '/seasons-study-app/hotel/icon-192.png', tag
      });
      n.onclick = () => { window.focus(); n.close(); };
    } catch {}
  };

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const addNotification = (type, message, roomNum) => {
    if (!db) return;
    const notif = { type, message, roomNum: roomNum || null, createdAt: Date.now(), by: currentUser?.name || 'System' };
    push(ref(db, `${FB}/notifications`), notif);
  };

  /* ═══════════════════════════════════════════════════════════════════════
     GUEST & ROOM FUNCTIONS
     ═══════════════════════════════════════════════════════════════════════ */

  const availableRooms = ROOMS.filter(n => {
    const r = rooms[n];
    return r && r.status === ROOM_STATUS.VACANT_CLEAN;
  });

  const checkInGuest = () => {
    if (!db || !guestForm.name || !guestForm.roomNum) return;
    const guestId = push(ref(db, `${FB}/guests`)).key;
    const guest = {
      name: guestForm.name,
      numGuests: guestForm.numGuests || 1,
      roomNum: Number(guestForm.roomNum),
      checkIn: guestForm.checkIn,
      nights: guestForm.nights || 1,
      vip: guestForm.vip,
      requests: guestForm.requests,
      phone: guestForm.phone,
      checkedOut: false,
      checkedOutAt: null,
    };
    set(ref(db, `${FB}/guests/${guestId}`), guest);
    update(ref(db, `${FB}/rooms/${guestForm.roomNum}`), { status: ROOM_STATUS.OCCUPIED, guestId });
    // Create guest login account if PIN provided
    if (guestForm.guestPin) {
      push(ref(db, `${FB}/guestAccounts`), {
        name: guestForm.name,
        pin: guestForm.guestPin,
        roomNum: Number(guestForm.roomNum),
        guestId,
      });
    }
    addNotification(guestForm.vip ? 'vip' : 'guest-checkin', `${guest.name} checked into Room ${guest.roomNum}${guestForm.vip ? ' (VIP!)' : ''}`, guest.roomNum);
    setGuestForm(blankGuest());
    showToast(`Welcome ${guest.name} to Room ${guest.roomNum}!`);
    setView('dashboard');
  };

  const checkOutGuest = (guest) => {
    if (!db || !guest) return;
    update(ref(db, `${FB}/guests/${guest.id}`), { checkedOut: true, checkedOutAt: Date.now() });
    update(ref(db, `${FB}/rooms/${guest.roomNum}`), { status: ROOM_STATUS.VACANT_DIRTY, guestId: null });
    // Remove guest login account
    const acct = guestAccounts.find(a => a.guestId === guest.id);
    if (acct) remove(ref(db, `${FB}/guestAccounts/${acct.id}`));
    addNotification('guest-checkout', `${guest.name} checked out of Room ${guest.roomNum}`, guest.roomNum);
    showToast(`${guest.name} has checked out. Room ${guest.roomNum} needs cleaning!`);
  };

  const setRoomStatus = (roomNum, status) => {
    if (!db) return;
    update(ref(db, `${FB}/rooms/${roomNum}`), { status });
    if (status === ROOM_STATUS.VACANT_CLEAN) {
      addNotification('room-ready', `Room ${roomNum} is clean and ready!`, roomNum);
    }
  };

  const setRoomTheme = (roomNum, themeId) => {
    if (!db) return;
    update(ref(db, `${FB}/rooms/${roomNum}`), { theme: themeId });
    showToast(`Room ${roomNum} theme updated!`);
  };

  const setDoorSign = (roomNum, signId) => {
    if (!db) return;
    update(ref(db, `${FB}/rooms/${roomNum}`), { doorSign: signId });
  };

  /* ═══════════════════════════════════════════════════════════════════════
     ROOM SERVICE
     ═══════════════════════════════════════════════════════════════════════ */

  const addToCart = (item) => {
    setCart(c => {
      const existing = c.find(ci => ci.id === item.id);
      if (existing) return c.map(ci => ci.id === item.id ? { ...ci, qty: ci.qty + 1 } : ci);
      return [...c, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (itemId) => setCart(c => c.filter(ci => ci.id !== itemId));

  const updateCartQty = (itemId, delta) => {
    setCart(c => c.map(ci => {
      if (ci.id !== itemId) return ci;
      const newQty = ci.qty + delta;
      return newQty <= 0 ? null : { ...ci, qty: newQty };
    }).filter(Boolean));
  };

  const cartTotal = cart.reduce((sum, ci) => sum + ci.price * ci.qty, 0);

  const submitOrder = (overrideRoom) => {
    const room = overrideRoom || orderRoom;
    if (!db || cart.length === 0 || !room) return;
    const order = {
      roomNum: Number(room),
      items: cart.map(ci => ({ name: ci.name, emoji: ci.emoji, qty: ci.qty, price: ci.price })),
      total: cartTotal,
      status: 'ordered',
      createdAt: Date.now(),
      createdBy: currentUser?.name || 'Guest',
    };
    push(ref(db, `${FB}/orders`), order);
    addNotification('room-service', `Room service order from ${currentUser?.name || 'Guest'} in Room ${room} — $${cartTotal}`, Number(room));
    setCart([]);
    setOrderRoom('');
    showToast('Order placed!');
  };

  const updateOrderStatus = (orderId, status) => {
    if (!db) return;
    update(ref(db, `${FB}/orders/${orderId}`), { status });
    if (status === 'delivered') {
      const order = orders.find(o => o.id === orderId);
      if (order) addNotification('order-ready', `Order delivered to Room ${order.roomNum}`, order.roomNum);
    }
  };

  /* ═══════════════════════════════════════════════════════════════════════
     HOUSEKEEPING
     ═══════════════════════════════════════════════════════════════════════ */

  const addTask = (roomNum, taskType) => {
    if (!db) return;
    const task = {
      roomNum: Number(roomNum),
      type: taskType,
      assignedTo: currentUser?.name || '',
      status: 'pending',
      createdAt: Date.now(),
      completedAt: null,
    };
    push(ref(db, `${FB}/tasks`), task);
  };

  const completeTask = (taskId) => {
    if (!db) return;
    update(ref(db, `${FB}/tasks/${taskId}`), { status: 'done', completedAt: Date.now() });
  };

  const startCleaningTimer = (roomNum) => {
    if (!db) return;
    const timer = { roomNum: Number(roomNum), startedAt: Date.now(), duration: 600, assignedTo: currentUser?.name || '' };
    set(ref(db, `${FB}/timers/${roomNum}`), timer);
    addTask(roomNum, 'clean');
    showToast(`Cleaning timer started for Room ${roomNum} (10 min)`);
  };

  const stopTimer = (roomNum) => {
    if (!db) return;
    remove(ref(db, `${FB}/timers/${roomNum}`));
    setRoomStatus(roomNum, ROOM_STATUS.VACANT_CLEAN);
    showToast(`Room ${roomNum} is clean!`);
  };

  const getTimerRemaining = (roomNum) => {
    const t = timers[roomNum];
    if (!t) return null;
    const elapsed = Math.floor((Date.now() - t.startedAt) / 1000);
    const remaining = Math.max(0, t.duration - elapsed);
    return remaining;
  };

  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  /* ═══════════════════════════════════════════════════════════════════════
     GUEST BOOK & LOST & FOUND
     ═══════════════════════════════════════════════════════════════════════ */

  const submitReview = () => {
    if (!db || !reviewForm.guestName) return;
    push(ref(db, `${FB}/guestBook`), { ...reviewForm, createdAt: Date.now() });
    addNotification('review', `${reviewForm.guestName} left a ${reviewForm.stars}-star review!`);
    setReviewForm({ guestName: '', stars: 5, comment: '', roomNum: '' });
    showToast('Review submitted! Thank you!');
  };

  const submitLostItem = () => {
    if (!db || !lfForm.description) return;
    push(ref(db, `${FB}/lostFound`), { ...lfForm, status: 'unclaimed', createdAt: Date.now() });
    setLfForm({ description: '', foundWhere: '', foundBy: '' });
    showToast('Item logged!');
  };

  const claimLostItem = (itemId) => {
    if (!db) return;
    update(ref(db, `${FB}/lostFound/${itemId}`), { status: 'claimed' });
  };

  /* ═══════════════════════════════════════════════════════════════════════
     STAFF MANAGEMENT
     ═══════════════════════════════════════════════════════════════════════ */

  const [newStaffForm, setNewStaffForm] = useState({ name: '', pin: '', emoji: '😊', color: '#2563eb' });

  const addStaffMember = () => {
    if (!db || !newStaffForm.name || !newStaffForm.pin) return;
    push(ref(db, `${FB}/staff`), { name: newStaffForm.name, pin: newStaffForm.pin, emoji: newStaffForm.emoji, color: newStaffForm.color });
    setNewStaffForm({ name: '', pin: '', emoji: '😊', color: '#2563eb' });
    showToast('Staff member added!');
  };

  const removeStaffMember = (staffId) => {
    if (!db) return;
    remove(ref(db, `${FB}/staff/${staffId}`));
  };

  /* ═══════════════════════════════════════════════════════════════════════
     DERIVED DATA
     ═══════════════════════════════════════════════════════════════════════ */

  const activeGuests = guests.filter(g => !g.checkedOut);
  const getGuestForRoom = (roomNum) => activeGuests.find(g => g.roomNum === roomNum);
  const pendingOrders = orders.filter(o => o.status !== 'delivered').sort((a, b) => b.createdAt - a.createdAt);
  const pendingTasks = tasks.filter(t => t.status === 'done' ? false : true);
  const unreadNotifs = notifications.filter(n => Date.now() - n.createdAt < 3600000).sort((a, b) => b.createdAt - a.createdAt);
  const avgRating = guestBook.length > 0 ? (guestBook.reduce((s, r) => s + r.stars, 0) / guestBook.length).toFixed(1) : '—';

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER: LOGIN
     ═══════════════════════════════════════════════════════════════════════ */

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-amber-50 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <div className="text-6xl mb-2">🏨</div>
          <h1 className="text-3xl font-bold text-blue-800">Ruth & Rose's</h1>
          <h2 className="text-xl text-amber-600 font-semibold">Grand Hotel</h2>
        </div>

        {loginStep === 'pick' && (
          <div className="w-full max-w-sm space-y-3">
            <p className="text-center text-gray-600 font-medium mb-4">Who's working today?</p>
            {staff.map(s => (
              <button key={s.id} onClick={() => handlePickStaff(s)}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white shadow-md hover:shadow-lg border-2 border-transparent hover:border-blue-300 transition-all">
                <span className="text-3xl">{s.emoji}</span>
                <span className="text-lg font-bold" style={{ color: s.color }}>{s.name}</span>
              </button>
            ))}
            {guestAccounts.length > 0 && (
              <div className="pt-4 border-t mt-4">
                <button onClick={() => setLoginStep('guest-pick')}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-amber-50 shadow-md hover:shadow-lg border-2 border-amber-200 hover:border-amber-400 transition-all">
                  <span className="text-2xl">🔑</span>
                  <span className="text-lg font-bold text-amber-700">I'm a Guest</span>
                </button>
              </div>
            )}
          </div>
        )}

        {loginStep === 'guest-pick' && (
          <div className="w-full max-w-sm space-y-3">
            <p className="text-center text-gray-600 font-medium mb-4">Welcome! Which guest are you?</p>
            {guestAccounts.map(g => (
              <button key={g.id} onClick={() => handlePickGuest(g)}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white shadow-md hover:shadow-lg border-2 border-transparent hover:border-amber-300 transition-all">
                <span className="text-3xl">🏨</span>
                <div className="text-left">
                  <span className="text-lg font-bold text-gray-800">{g.name}</span>
                  <div className="text-sm text-gray-500">Room {g.roomNum}</div>
                </div>
              </button>
            ))}
            <button onClick={() => setLoginStep('pick')}
              className="w-full mt-2 py-2 rounded-xl bg-gray-100 text-gray-600 font-semibold">Back to Staff</button>
          </div>
        )}

        {loginStep === 'guest-pin' && loginTarget && (
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center mb-4">
              <span className="text-4xl">🔑</span>
              <p className="font-bold text-lg mt-1 text-gray-800">{loginTarget.name}</p>
              <p className="text-sm text-gray-500">Room {loginTarget.roomNum}</p>
            </div>
            <label className="label">Enter your Guest PIN</label>
            <input type="password" maxLength={4} value={pinInput}
              onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && handleGuestPinSubmit()}
              className="input text-center text-2xl tracking-widest mb-3" placeholder="••••" />
            {pinError && <p className="text-red-500 text-sm text-center mb-2">{pinError}</p>}
            <div className="flex gap-2">
              <button onClick={() => { setLoginStep('guest-pick'); setLoginTarget(null); }}
                className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-600 font-semibold">Back</button>
              <button onClick={handleGuestPinSubmit} disabled={pinInput.length < 4}
                className="flex-1 py-2 rounded-xl btn-amber font-semibold disabled:opacity-40">Enter</button>
            </div>
          </div>
        )}

        {loginStep === 'pin' && loginTarget && (
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center mb-4">
              <span className="text-4xl">{loginTarget.emoji}</span>
              <p className="font-bold text-lg mt-1" style={{ color: loginTarget.color }}>{loginTarget.name}</p>
            </div>
            <label className="label">Enter your PIN</label>
            <input type="password" maxLength={4} value={pinInput}
              onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && handlePinSubmit()}
              className="input text-center text-2xl tracking-widest mb-3" placeholder="••••" />
            {pinError && <p className="text-red-500 text-sm text-center mb-2">{pinError}</p>}
            <div className="flex gap-2">
              <button onClick={() => { setLoginStep('pick'); setLoginTarget(null); }}
                className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-600 font-semibold">Back</button>
              <button onClick={handlePinSubmit} disabled={pinInput.length < 4}
                className="flex-1 py-2 rounded-xl btn-blue font-semibold disabled:opacity-40">Enter</button>
            </div>
          </div>
        )}

        {loginStep === 'role' && loginTarget && (
          <div className="w-full max-w-sm">
            <p className="text-center text-gray-600 font-medium mb-4">Pick your job today, {loginTarget.name}!</p>
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map(role => (
                <button key={role.id} onClick={() => handlePickRole(role.id)}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white shadow-md hover:shadow-lg border-2 border-transparent hover:border-amber-300 transition-all">
                  <span className="text-3xl">{role.emoji}</span>
                  <span className="font-bold text-gray-800">{role.label}</span>
                  <span className="text-xs text-gray-500">{role.desc}</span>
                </button>
              ))}
            </div>
            <button onClick={() => { setLoginStep('pick'); setLoginTarget(null); }}
              className="w-full mt-4 py-2 rounded-xl bg-gray-100 text-gray-600 font-semibold">Back</button>
          </div>
        )}

        {/* iOS install banner */}
        {isIOS && !isStandalone && showInstallBanner && (
          <div className="fixed bottom-0 left-0 right-0 bg-blue-700 text-white p-3 text-center text-sm">
            <button onClick={() => setShowInstallBanner(false)} className="absolute top-1 right-2 text-white/70 text-lg">&times;</button>
            To install: tap <strong>Share</strong> then <strong>"Add to Home Screen"</strong>
          </div>
        )}

        {/* Desktop/Android install */}
        {installPrompt && (
          <button onClick={handleInstallApp}
            className="mt-6 px-6 py-2 rounded-xl btn-blue font-semibold text-sm">
            Install App
          </button>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER: NAV BAR
     ═══════════════════════════════════════════════════════════════════════ */

  const currentRole = ROLES.find(r => r.id === currentUser.currentRole);

  const navItems = [
    { id: 'dashboard',    label: 'Rooms',       emoji: '🚪' },
    { id: 'reception',    label: 'Reception',   emoji: '🛎️' },
    { id: 'room-service', label: 'Room Service', emoji: '🍽️' },
    { id: 'housekeeping', label: 'Cleaning',    emoji: '🧹' },
    { id: 'guest-book',   label: 'Reviews',     emoji: '📝' },
    { id: 'lost-found',   label: 'Lost & Found', emoji: '🔍' },
    { id: 'settings',     label: 'Settings',    emoji: '⚙️' },
  ];

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER: ROOM CARD
     ═══════════════════════════════════════════════════════════════════════ */

  const RoomCard = (roomNum) => {
    const room = rooms[roomNum] || {};
    const status = room.status || ROOM_STATUS.VACANT_CLEAN;
    const info = STATUS_INFO[status];
    const theme = ROOM_THEMES.find(t => t.id === (room.theme || 'default'));
    const guest = getGuestForRoom(roomNum);
    const timer = getTimerRemaining(roomNum);
    const sign = DOOR_SIGNS.find(d => d.id === (room.doorSign || 'none'));

    return (
      <button key={roomNum} onClick={() => { setSelectedRoom(roomNum); setView('room-detail'); }}
        className={`relative p-4 rounded-2xl bg-gradient-to-br ${theme.bg} border-2 ${status === ROOM_STATUS.OCCUPIED ? 'border-blue-300' : status === ROOM_STATUS.VACANT_CLEAN ? 'border-emerald-300' : status === ROOM_STATUS.VACANT_DIRTY ? 'border-amber-300' : 'border-red-300'} shadow-md hover:shadow-lg transition-all text-left`}>
        {sign && sign.id !== 'none' && (
          <span className="absolute top-2 right-2 text-lg">{sign.emoji}</span>
        )}
        <div className="text-2xl font-bold text-gray-800 mb-1">Room {roomNum}</div>
        <div className="text-lg mb-2">{theme.emoji} {theme.label}</div>
        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${info.color}`}>
          <span className={`w-2 h-2 rounded-full ${info.dot}`} />
          {info.label}
        </div>
        {guest && (
          <div className="mt-2 text-sm">
            <span className="font-semibold">{guest.name}</span>
            {guest.vip && <span className="ml-1 text-amber-500">⭐VIP</span>}
            <div className="text-gray-500 text-xs">{guest.numGuests} guest{guest.numGuests > 1 ? 's' : ''} · {guest.nights} night{guest.nights > 1 ? 's' : ''}</div>
          </div>
        )}
        {timer !== null && (
          <div className="mt-2 px-2 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-mono font-bold">
            🧹 Cleaning: {fmtTime(timer)}
          </div>
        )}
      </button>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER: KEY CARD (fun visual for checked-in guests)
     ═══════════════════════════════════════════════════════════════════════ */

  const KeyCard = (guest) => {
    if (!guest) return null;
    const theme = ROOM_THEMES.find(t => t.id === (rooms[guest.roomNum]?.theme || 'default'));
    return (
      <div className={`p-4 rounded-2xl bg-gradient-to-br ${theme.bg} border-2 border-amber-300 shadow-lg max-w-xs mx-auto`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold text-blue-800">🏨 R&R Hotel</span>
          {guest.vip && <span className="text-amber-500 text-xl">⭐</span>}
        </div>
        <div className="bg-white/70 rounded-xl p-3">
          <div className="text-sm text-gray-500 font-medium">Guest</div>
          <div className="text-lg font-bold text-gray-800">{guest.name}</div>
          <div className="flex justify-between mt-2">
            <div>
              <div className="text-xs text-gray-500">Room</div>
              <div className="text-2xl font-bold text-blue-700">{guest.roomNum}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Nights</div>
              <div className="text-2xl font-bold text-amber-600">{guest.nights}</div>
            </div>
          </div>
        </div>
        <div className="mt-2 text-center text-xs text-gray-500">
          {theme.emoji} {theme.label} Suite
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER: MAIN LAYOUT
     ═══════════════════════════════════════════════════════════════════════ */

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-amber-50 pb-20">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-blue-700 text-white px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏨</span>
          <div>
            <h1 className="text-sm font-bold leading-tight">Ruth & Rose's Grand Hotel</h1>
            <div className="text-xs text-blue-200">
              {isGuest ? `🔑 ${currentUser.name} — Room ${currentUser.roomNum}` : `${currentRole?.emoji} ${currentUser.name} — ${currentRole?.label}`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowNotifPanel(!showNotifPanel)}
            className="relative p-2 rounded-full hover:bg-blue-600 transition-colors">
            🔔
            {unreadNotifs.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadNotifs.length > 9 ? '9+' : unreadNotifs.length}
              </span>
            )}
          </button>
          <button onClick={handleLogout} className="p-2 rounded-full hover:bg-blue-600 transition-colors text-sm">🚪</button>
        </div>
      </header>

      {/* ── Notification panel ─────────────────────────────────────── */}
      {showNotifPanel && (
        <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setShowNotifPanel(false)}>
          <div className="absolute top-14 right-2 w-80 max-h-96 overflow-y-auto bg-white rounded-2xl shadow-xl border" onClick={e => e.stopPropagation()}>
            <div className="p-3 border-b font-bold text-gray-800">Notifications</div>
            {unreadNotifs.length === 0 ? (
              <div className="p-4 text-center text-gray-400">No recent notifications</div>
            ) : unreadNotifs.map(n => (
              <div key={n.id} className="p-3 border-b last:border-b-0 hover:bg-gray-50">
                <div className="flex items-start gap-2">
                  <span className="text-lg">{NOTIF_TYPES[n.type]?.emoji || '🔔'}</span>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{NOTIF_TYPES[n.type]?.label || 'Alert'}</div>
                    <div className="text-sm text-gray-600">{n.message}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleTimeString()} · by {n.by}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Toast ──────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-gray-800 text-white rounded-xl shadow-lg text-sm font-medium animate-bounce">
          {toast}
        </div>
      )}

      {/* ── Main content ───────────────────────────────────────────── */}
      <main className="p-4 max-w-2xl mx-auto">

        {/* ═══ DASHBOARD ═══ */}
        {view === 'dashboard' && (
          <div>
            {/* Stats bar */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="bg-white rounded-xl p-2 text-center shadow-sm border">
                <div className="text-lg font-bold text-blue-600">{activeGuests.length}</div>
                <div className="text-[10px] text-gray-500">Guests</div>
              </div>
              <div className="bg-white rounded-xl p-2 text-center shadow-sm border">
                <div className="text-lg font-bold text-emerald-600">{ROOMS.filter(n => rooms[n]?.status === ROOM_STATUS.VACANT_CLEAN).length}</div>
                <div className="text-[10px] text-gray-500">Available</div>
              </div>
              <div className="bg-white rounded-xl p-2 text-center shadow-sm border">
                <div className="text-lg font-bold text-amber-600">{pendingOrders.length}</div>
                <div className="text-[10px] text-gray-500">Orders</div>
              </div>
              <div className="bg-white rounded-xl p-2 text-center shadow-sm border">
                <div className="text-lg font-bold text-purple-600">{avgRating}</div>
                <div className="text-[10px] text-gray-500">Rating</div>
              </div>
            </div>

            {/* Room grid */}
            <h2 className="text-lg font-bold text-gray-800 mb-3">Our Rooms</h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {ROOMS.map(n => RoomCard(n))}
            </div>

            {/* On-duty staff */}
            {staff.filter(s => s.currentRole).length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border mb-4">
                <h3 className="font-bold text-gray-800 mb-2">Staff On Duty</h3>
                <div className="flex flex-wrap gap-2">
                  {staff.filter(s => s.currentRole).map(s => {
                    const role = ROLES.find(r => r.id === s.currentRole);
                    return (
                      <div key={s.id} className="flex items-center gap-2 bg-blue-50 rounded-full px-3 py-1">
                        <span>{s.emoji}</span>
                        <span className="text-sm font-semibold" style={{ color: s.color }}>{s.name}</span>
                        <span className="text-xs text-gray-500">{role?.emoji} {role?.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pending orders */}
            {pendingOrders.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border">
                <h3 className="font-bold text-gray-800 mb-2">Active Orders</h3>
                {pendingOrders.slice(0, 5).map(o => (
                  <div key={o.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div>
                      <span className="font-semibold">Room {o.roomNum}</span>
                      <span className="ml-2 text-sm text-gray-500">{o.items.map(i => `${i.emoji}${i.qty > 1 ? `x${i.qty}` : ''}`).join(' ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${o.status === 'ordered' ? 'bg-amber-100 text-amber-700' : o.status === 'preparing' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {o.status}
                      </span>
                      {o.status === 'ordered' && (
                        <button onClick={() => updateOrderStatus(o.id, 'preparing')} className="text-xs px-2 py-1 rounded-lg btn-blue">Start</button>
                      )}
                      {o.status === 'preparing' && (
                        <button onClick={() => updateOrderStatus(o.id, 'delivered')} className="text-xs px-2 py-1 rounded-lg btn-green">Done</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ ROOM DETAIL ═══ */}
        {view === 'room-detail' && selectedRoom && (() => {
          const room = rooms[selectedRoom] || {};
          const status = room.status || ROOM_STATUS.VACANT_CLEAN;
          const info = STATUS_INFO[status];
          const theme = ROOM_THEMES.find(t => t.id === (room.theme || 'default'));
          const guest = getGuestForRoom(selectedRoom);
          const timer = getTimerRemaining(selectedRoom);
          const roomOrders = orders.filter(o => o.roomNum === selectedRoom && o.status !== 'delivered');

          return (
            <div>
              <button onClick={() => setView('dashboard')} className="text-blue-600 font-semibold mb-3 flex items-center gap-1">
                ← Back to Rooms
              </button>

              <div className={`p-5 rounded-2xl bg-gradient-to-br ${theme.bg} border-2 mb-4 shadow-lg`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-3xl font-bold text-gray-800">Room {selectedRoom}</h2>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${info.color}`}>
                    <span className={`w-2 h-2 rounded-full ${info.dot}`} /> {info.label}
                  </div>
                </div>
                <div className="text-lg mb-4">{theme.emoji} {theme.label}</div>

                {/* Guest key card */}
                {guest && KeyCard(guest)}

                {/* Door sign */}
                <div className="mt-4">
                  <label className="label">Door Sign</label>
                  <div className="flex gap-2 flex-wrap">
                    {DOOR_SIGNS.map(s => (
                      <button key={s.id} onClick={() => setDoorSign(selectedRoom, s.id)}
                        className={`px-3 py-1.5 rounded-xl text-sm font-semibold border-2 transition-all ${(room.doorSign || 'none') === s.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                        {s.emoji} {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme selector */}
                <div className="mt-4">
                  <label className="label">Room Theme</label>
                  <div className="flex gap-2 flex-wrap">
                    {ROOM_THEMES.map(t => (
                      <button key={t.id} onClick={() => setRoomTheme(selectedRoom, t.id)}
                        className={`px-3 py-1.5 rounded-xl text-sm font-semibold border-2 transition-all ${(room.theme || 'default') === t.id ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-white'}`}>
                        {t.emoji} {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {status === ROOM_STATUS.OCCUPIED && guest && (
                  <button onClick={() => checkOutGuest(guest)}
                    className="p-3 rounded-2xl btn-amber font-bold text-sm shadow-md">
                    👋 Check Out Guest
                  </button>
                )}
                {status === ROOM_STATUS.VACANT_DIRTY && !timer && (
                  <button onClick={() => startCleaningTimer(selectedRoom)}
                    className="p-3 rounded-2xl btn-green font-bold text-sm shadow-md">
                    🧹 Start Cleaning
                  </button>
                )}
                {timer !== null && (
                  <button onClick={() => stopTimer(selectedRoom)}
                    className="p-3 rounded-2xl btn-green font-bold text-sm shadow-md">
                    ✅ Mark Clean ({fmtTime(timer)})
                  </button>
                )}
                {status === ROOM_STATUS.VACANT_CLEAN && (
                  <button onClick={() => { setGuestForm({ ...blankGuest(), roomNum: String(selectedRoom) }); setView('reception'); }}
                    className="p-3 rounded-2xl btn-blue font-bold text-sm shadow-md">
                    🛎️ Check In Guest
                  </button>
                )}
                <button onClick={() => setRoomStatus(selectedRoom, ROOM_STATUS.MAINTENANCE)}
                  className="p-3 rounded-2xl btn-red font-bold text-sm shadow-md"
                  disabled={status === ROOM_STATUS.MAINTENANCE}>
                  🔧 Maintenance
                </button>
                {status === ROOM_STATUS.MAINTENANCE && (
                  <button onClick={() => setRoomStatus(selectedRoom, ROOM_STATUS.VACANT_DIRTY)}
                    className="p-3 rounded-2xl btn-purple font-bold text-sm shadow-md">
                    ✅ Fixed!
                  </button>
                )}
              </div>

              {/* Room orders */}
              {roomOrders.length > 0 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border mb-4">
                  <h3 className="font-bold text-gray-800 mb-2">Active Orders</h3>
                  {roomOrders.map(o => (
                    <div key={o.id} className="py-2 border-b last:border-b-0">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">{o.items.map(i => `${i.emoji} ${i.name} x${i.qty}`).join(', ')}</div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${o.status === 'ordered' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{o.status}</span>
                      </div>
                      <div className="text-xs text-gray-400">${o.total} · {new Date(o.createdAt).toLocaleTimeString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* ═══ RECEPTION ═══ */}
        {view === 'reception' && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">🛎️ Reception Desk</h2>

            <div className="bg-white rounded-2xl p-4 shadow-sm border mb-4">
              <h3 className="font-bold text-gray-800 mb-3">Check In a Guest</h3>

              <div className="space-y-3">
                <div>
                  <label className="label">Guest Name <span className="text-red-500">*</span></label>
                  <input className="input" value={guestForm.name} onChange={e => setGuestForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Princess Sparkle" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Phone</label>
                    <input className="input" value={guestForm.phone} onChange={e => setGuestForm(f => ({ ...f, phone: e.target.value }))} placeholder="Optional" />
                  </div>
                  <div>
                    <label className="label"># Guests</label>
                    <input type="number" min={1} max={10} className="input" value={guestForm.numGuests} onChange={e => setGuestForm(f => ({ ...f, numGuests: Number(e.target.value) }))} />
                  </div>
                </div>

                <div>
                  <label className="label">Room <span className="text-red-500">*</span></label>
                  {availableRooms.length === 0 ? (
                    <p className="text-amber-600 text-sm font-medium">No rooms available right now!</p>
                  ) : (
                    <div className="flex gap-2 flex-wrap">
                      {availableRooms.map(n => (
                        <button key={n} onClick={() => setGuestForm(f => ({ ...f, roomNum: String(n) }))}
                          className={`px-4 py-2 rounded-xl font-bold text-lg border-2 transition-all ${guestForm.roomNum === String(n) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600'}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Check-In Date</label>
                    <input type="date" className="input" value={guestForm.checkIn} onChange={e => setGuestForm(f => ({ ...f, checkIn: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Nights</label>
                    <input type="number" min={1} max={30} className="input" value={guestForm.nights} onChange={e => setGuestForm(f => ({ ...f, nights: Number(e.target.value) }))} />
                  </div>
                </div>

                <div>
                  <label className="label flex items-center gap-2">
                    <input type="checkbox" checked={guestForm.vip} onChange={e => setGuestForm(f => ({ ...f, vip: e.target.checked }))}
                      className="w-5 h-5 rounded text-amber-500" />
                    ⭐ VIP Guest
                  </label>
                </div>

                <div>
                  <label className="label">Special Requests</label>
                  <textarea className="input" rows={2} value={guestForm.requests} onChange={e => setGuestForm(f => ({ ...f, requests: e.target.value }))} placeholder="Extra pillows, late checkout..." />
                </div>

                <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                  <label className="label flex items-center gap-1">🔑 Guest Login PIN <span className="text-xs text-gray-400 font-normal">(optional)</span></label>
                  <p className="text-xs text-gray-500 mb-2">Set a 4-digit PIN so the guest can log in from their own device to order room service</p>
                  <input type="text" maxLength={4} className="input text-center text-xl tracking-widest"
                    value={guestForm.guestPin} onChange={e => setGuestForm(f => ({ ...f, guestPin: e.target.value.replace(/\D/g, '') }))}
                    placeholder="e.g. 1234" />
                </div>

                <button onClick={checkInGuest}
                  disabled={!guestForm.name || !guestForm.roomNum}
                  className="w-full py-3 rounded-xl btn-blue font-bold text-lg disabled:opacity-40 shadow-md">
                  🛎️ Check In Guest
                </button>
              </div>
            </div>

            {/* Current guests */}
            {activeGuests.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border">
                <h3 className="font-bold text-gray-800 mb-3">Current Guests</h3>
                {activeGuests.map(g => (
                  <div key={g.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                    <div>
                      <span className="font-semibold text-gray-800">{g.name}</span>
                      {g.vip && <span className="ml-1 text-amber-500">⭐</span>}
                      <div className="text-sm text-gray-500">Room {g.roomNum} · {g.nights} night{g.nights > 1 ? 's' : ''}</div>
                    </div>
                    <button onClick={() => checkOutGuest(g)}
                      className="px-3 py-1.5 rounded-xl btn-amber text-sm font-semibold">
                      Check Out
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ ROOM SERVICE ═══ */}
        {view === 'room-service' && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">🍽️ Room Service</h2>

            {/* Room selector */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border mb-4">
              <label className="label">Deliver to Room</label>
              <div className="flex gap-2 flex-wrap">
                {ROOMS.filter(n => rooms[n]?.status === ROOM_STATUS.OCCUPIED).map(n => (
                  <button key={n} onClick={() => setOrderRoom(String(n))}
                    className={`px-4 py-2 rounded-xl font-bold text-lg border-2 transition-all ${orderRoom === String(n) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600'}`}>
                    {n}
                  </button>
                ))}
                {ROOMS.filter(n => rooms[n]?.status === ROOM_STATUS.OCCUPIED).length === 0 && (
                  <p className="text-gray-400 text-sm">No occupied rooms</p>
                )}
              </div>
            </div>

            {/* Menu */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border mb-4">
              <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                {MENU_CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setMenuCat(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap border-2 transition-all ${menuCat === cat.id ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 bg-white text-gray-600'}`}>
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {MENU_ITEMS.filter(i => i.cat === menuCat).map(item => (
                  <button key={item.id} onClick={() => addToCart(item)}
                    className="p-3 rounded-xl bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-all text-left">
                    <div className="text-2xl mb-1">{item.emoji}</div>
                    <div className="text-sm font-semibold text-gray-800">{item.name}</div>
                    <div className="text-sm text-amber-600 font-bold">${item.price}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cart */}
            {cart.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border mb-4">
                <h3 className="font-bold text-gray-800 mb-2">Your Order</h3>
                {cart.map(ci => (
                  <div key={ci.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex items-center gap-2">
                      <span>{ci.emoji}</span>
                      <span className="text-sm font-medium">{ci.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateCartQty(ci.id, -1)} className="w-7 h-7 rounded-full bg-gray-100 font-bold text-gray-600">-</button>
                      <span className="text-sm font-bold w-6 text-center">{ci.qty}</span>
                      <button onClick={() => updateCartQty(ci.id, 1)} className="w-7 h-7 rounded-full bg-gray-100 font-bold text-gray-600">+</button>
                      <span className="text-sm font-semibold text-amber-600 w-10 text-right">${ci.price * ci.qty}</span>
                      <button onClick={() => removeFromCart(ci.id)} className="text-red-400 text-sm">✕</button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between mt-3 pt-3 border-t">
                  <span className="font-bold text-gray-800">Total</span>
                  <span className="font-bold text-amber-600 text-lg">${cartTotal}</span>
                </div>
                <button onClick={submitOrder}
                  disabled={!orderRoom}
                  className="w-full mt-3 py-3 rounded-xl btn-blue font-bold disabled:opacity-40 shadow-md">
                  🍽️ Place Order {orderRoom ? `→ Room ${orderRoom}` : '(pick a room)'}
                </button>
              </div>
            )}

            {/* Active orders */}
            {pendingOrders.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border">
                <h3 className="font-bold text-gray-800 mb-2">Active Orders</h3>
                {pendingOrders.map(o => (
                  <div key={o.id} className="py-3 border-b last:border-b-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">Room {o.roomNum}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${o.status === 'ordered' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{o.status}</span>
                    </div>
                    <div className="text-sm text-gray-600">{o.items.map(i => `${i.emoji} ${i.name} x${i.qty}`).join(', ')}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-400">${o.total} · {new Date(o.createdAt).toLocaleTimeString()}</span>
                      <div className="flex gap-1">
                        {o.status === 'ordered' && (
                          <button onClick={() => updateOrderStatus(o.id, 'preparing')} className="text-xs px-2 py-1 rounded-lg btn-blue">Start Preparing</button>
                        )}
                        {o.status === 'preparing' && (
                          <button onClick={() => updateOrderStatus(o.id, 'delivered')} className="text-xs px-2 py-1 rounded-lg btn-green">Mark Delivered</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ HOUSEKEEPING ═══ */}
        {view === 'housekeeping' && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">🧹 Housekeeping</h2>

            {/* Rooms needing cleaning */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border mb-4">
              <h3 className="font-bold text-gray-800 mb-3">Rooms to Clean</h3>
              {ROOMS.filter(n => rooms[n]?.status === ROOM_STATUS.VACANT_DIRTY).length === 0 ? (
                <p className="text-center text-gray-400 py-4">All rooms are clean! ✨</p>
              ) : (
                <div className="space-y-3">
                  {ROOMS.filter(n => rooms[n]?.status === ROOM_STATUS.VACANT_DIRTY).map(n => {
                    const timer = getTimerRemaining(n);
                    return (
                      <div key={n} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200">
                        <div>
                          <span className="font-bold text-lg">Room {n}</span>
                          {timer !== null && <span className="ml-2 text-amber-600 font-mono font-bold">{fmtTime(timer)}</span>}
                        </div>
                        {timer === null ? (
                          <button onClick={() => startCleaningTimer(n)} className="px-3 py-1.5 rounded-xl btn-green font-semibold text-sm">
                            🧹 Start Cleaning
                          </button>
                        ) : (
                          <button onClick={() => stopTimer(n)} className="px-3 py-1.5 rounded-xl btn-blue font-semibold text-sm">
                            ✅ Done!
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Supply checklist */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border mb-4">
              <h3 className="font-bold text-gray-800 mb-3">Supply Checklist</h3>
              <div className="grid grid-cols-2 gap-2">
                {SUPPLIES.map(s => (
                  <label key={s.id} className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 border">
                    <input type="checkbox" className="w-5 h-5 rounded text-blue-500" />
                    <span>{s.emoji}</span>
                    <span className="text-sm font-medium">{s.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Maintenance rooms */}
            {ROOMS.filter(n => rooms[n]?.status === ROOM_STATUS.MAINTENANCE).length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border">
                <h3 className="font-bold text-gray-800 mb-3">Under Maintenance</h3>
                {ROOMS.filter(n => rooms[n]?.status === ROOM_STATUS.MAINTENANCE).map(n => (
                  <div key={n} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-200 mb-2">
                    <span className="font-bold text-lg">🔧 Room {n}</span>
                    <button onClick={() => setRoomStatus(n, ROOM_STATUS.VACANT_DIRTY)} className="px-3 py-1.5 rounded-xl btn-purple font-semibold text-sm">
                      Fixed → Clean
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ GUEST BOOK ═══ */}
        {view === 'guest-book' && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">📝 Guest Book</h2>

            {/* Average rating */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border mb-4 text-center">
              <div className="text-4xl font-bold text-amber-500">{avgRating}</div>
              <div className="text-amber-400 text-xl">{'★'.repeat(Math.round(Number(avgRating) || 0))}{'☆'.repeat(5 - Math.round(Number(avgRating) || 0))}</div>
              <div className="text-sm text-gray-500">{guestBook.length} review{guestBook.length !== 1 ? 's' : ''}</div>
            </div>

            {/* Write a review */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border mb-4">
              <h3 className="font-bold text-gray-800 mb-3">Write a Review</h3>
              <div className="space-y-3">
                <div>
                  <label className="label">Guest Name <span className="text-red-500">*</span></label>
                  <input className="input" value={reviewForm.guestName} onChange={e => setReviewForm(f => ({ ...f, guestName: e.target.value }))} placeholder="Your name" />
                </div>
                <div>
                  <label className="label">Room</label>
                  <div className="flex gap-2">
                    {ROOMS.map(n => (
                      <button key={n} onClick={() => setReviewForm(f => ({ ...f, roomNum: String(n) }))}
                        className={`px-3 py-1.5 rounded-xl font-bold border-2 transition-all ${reviewForm.roomNum === String(n) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => setReviewForm(f => ({ ...f, stars: n }))}
                        className={`text-3xl transition-transform hover:scale-110 ${n <= reviewForm.stars ? 'text-amber-400' : 'text-gray-300'}`}>
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Comment</label>
                  <textarea className="input" rows={3} value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))} placeholder="How was your stay?" />
                </div>
                <button onClick={submitReview} disabled={!reviewForm.guestName}
                  className="w-full py-3 rounded-xl btn-blue font-bold disabled:opacity-40 shadow-md">
                  📝 Submit Review
                </button>
              </div>
            </div>

            {/* Reviews list */}
            {guestBook.length > 0 && (
              <div className="space-y-3">
                {[...guestBook].sort((a, b) => b.createdAt - a.createdAt).map(r => (
                  <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-800">{r.guestName}</span>
                      <span className="text-amber-400">{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</span>
                    </div>
                    {r.roomNum && <div className="text-xs text-gray-400">Room {r.roomNum}</div>}
                    {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
                    <div className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ LOST & FOUND ═══ */}
        {view === 'lost-found' && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">🔍 Lost & Found</h2>

            <div className="bg-white rounded-2xl p-4 shadow-sm border mb-4">
              <h3 className="font-bold text-gray-800 mb-3">Log Found Item</h3>
              <div className="space-y-3">
                <div>
                  <label className="label">What was found? <span className="text-red-500">*</span></label>
                  <input className="input" value={lfForm.description} onChange={e => setLfForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Blue teddy bear" />
                </div>
                <div>
                  <label className="label">Where was it found?</label>
                  <input className="input" value={lfForm.foundWhere} onChange={e => setLfForm(f => ({ ...f, foundWhere: e.target.value }))} placeholder="e.g. Room 404, Lobby" />
                </div>
                <div>
                  <label className="label">Found by</label>
                  <input className="input" value={lfForm.foundBy} onChange={e => setLfForm(f => ({ ...f, foundBy: e.target.value }))} placeholder={currentUser?.name || ''} />
                </div>
                <button onClick={submitLostItem} disabled={!lfForm.description}
                  className="w-full py-3 rounded-xl btn-blue font-bold disabled:opacity-40 shadow-md">
                  📋 Log Item
                </button>
              </div>
            </div>

            {lostFound.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border">
                <h3 className="font-bold text-gray-800 mb-3">Items</h3>
                {[...lostFound].sort((a, b) => b.createdAt - a.createdAt).map(item => (
                  <div key={item.id} className={`flex items-center justify-between py-3 border-b last:border-b-0 ${item.status === 'claimed' ? 'opacity-50' : ''}`}>
                    <div>
                      <div className="font-semibold text-gray-800">{item.description}</div>
                      <div className="text-xs text-gray-500">{item.foundWhere} {item.foundBy && `· Found by ${item.foundBy}`}</div>
                      <div className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</div>
                    </div>
                    {item.status === 'unclaimed' ? (
                      <button onClick={() => claimLostItem(item.id)} className="px-3 py-1.5 rounded-xl btn-green text-sm font-semibold">
                        Claimed!
                      </button>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">Returned</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ SETTINGS ═══ */}
        {view === 'settings' && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">⚙️ Settings</h2>

            {/* Change role */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border mb-4">
              <h3 className="font-bold text-gray-800 mb-3">Change Your Job</h3>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(role => (
                  <button key={role.id} onClick={() => {
                    if (db) update(ref(db, `${FB}/staff/${currentUser.id}`), { currentRole: role.id });
                    setCurrentUser(u => ({ ...u, currentRole: role.id }));
                    showToast(`Switched to ${role.label}!`);
                  }}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${currentUser.currentRole === role.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                    <div className="text-2xl">{role.emoji}</div>
                    <div className="text-sm font-bold">{role.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Staff management */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border mb-4">
              <h3 className="font-bold text-gray-800 mb-3">Staff</h3>
              {staff.map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{s.emoji}</span>
                    <span className="font-semibold" style={{ color: s.color }}>{s.name}</span>
                  </div>
                  {staff.length > 1 && s.id !== currentUser.id && (
                    <button onClick={() => removeStaffMember(s.id)} className="text-red-400 text-sm">Remove</button>
                  )}
                </div>
              ))}
              <div className="mt-3 pt-3 border-t space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input className="input" placeholder="Name" value={newStaffForm.name} onChange={e => setNewStaffForm(f => ({ ...f, name: e.target.value }))} />
                  <input className="input" placeholder="PIN" maxLength={4} value={newStaffForm.pin} onChange={e => setNewStaffForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '') }))} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input className="input" placeholder="Emoji" value={newStaffForm.emoji} onChange={e => setNewStaffForm(f => ({ ...f, emoji: e.target.value }))} />
                  <input type="color" className="input h-10" value={newStaffForm.color} onChange={e => setNewStaffForm(f => ({ ...f, color: e.target.value }))} />
                </div>
                <button onClick={addStaffMember} disabled={!newStaffForm.name || !newStaffForm.pin}
                  className="w-full py-2 rounded-xl btn-blue font-semibold disabled:opacity-40">Add Staff</button>
              </div>
            </div>

            {/* Guest accounts */}
            {guestAccounts.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border mb-4">
                <h3 className="font-bold text-gray-800 mb-3">Guest Accounts</h3>
                {guestAccounts.map(g => (
                  <div key={g.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div>
                      <span className="font-semibold text-gray-800">{g.name}</span>
                      <span className="text-sm text-gray-500 ml-2">Room {g.roomNum}</span>
                      <span className="text-xs text-gray-400 ml-2">PIN: {g.pin}</span>
                    </div>
                    <button onClick={() => { if (db) remove(ref(db, `${FB}/guestAccounts/${g.id}`)); showToast('Guest account removed'); }}
                      className="text-red-400 text-sm">Remove</button>
                  </div>
                ))}
              </div>
            )}

            {/* Device notifications */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border mb-4">
              <h3 className="font-bold text-gray-800 mb-3">Device Notifications</h3>
              {notifPermission === 'granted' ? (
                <div className="flex items-center gap-2 text-emerald-600 font-medium">✅ Notifications enabled</div>
              ) : notifPermission === 'denied' ? (
                <div>
                  <div className="flex items-center gap-2 text-red-500 font-medium">❌ Notifications blocked</div>
                  <p className="text-sm text-gray-500 mt-1">Go to your browser settings to unblock notifications for this site.</p>
                </div>
              ) : (
                <button onClick={requestNotifPermission}
                  className="w-full py-2 rounded-xl btn-blue font-semibold">
                  🔔 Enable Notifications
                </button>
              )}
            </div>

            {/* Install app */}
            {(installPrompt || (isIOS && !isStandalone)) && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border mb-4">
                <h3 className="font-bold text-gray-800 mb-3">Install App</h3>
                {installPrompt ? (
                  <button onClick={handleInstallApp} className="w-full py-2 rounded-xl btn-amber font-semibold">
                    📲 Install Hotel App
                  </button>
                ) : (
                  <p className="text-sm text-gray-600">To install: tap <strong>Share</strong> then <strong>"Add to Home Screen"</strong></p>
                )}
              </div>
            )}

            {/* Clear data */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border">
              <h3 className="font-bold text-gray-800 mb-3">Data</h3>
              <button onClick={() => {
                if (!db) return;
                if (!confirm('Clear all notifications?')) return;
                set(ref(db, `${FB}/notifications`), null);
                showToast('Notifications cleared');
              }}
                className="w-full py-2 rounded-xl bg-gray-100 text-gray-600 font-semibold mb-2">
                Clear Notifications
              </button>
              <button onClick={() => {
                if (!db) return;
                if (!confirm('Clear all delivered orders?')) return;
                orders.filter(o => o.status === 'delivered').forEach(o => remove(ref(db, `${FB}/orders/${o.id}`)));
                showToast('Delivered orders cleared');
              }}
                className="w-full py-2 rounded-xl bg-gray-100 text-gray-600 font-semibold">
                Clear Old Orders
              </button>
            </div>
          </div>
        )}

        {/* ═══ GUEST DASHBOARD ═══ */}
        {view === 'guest-dashboard' && isGuest && (() => {
          const myRoom = rooms[currentUser.roomNum] || {};
          const theme = ROOM_THEMES.find(t => t.id === (myRoom.theme || 'default'));
          const myGuest = guests.find(g => g.id === currentUser.guestId && !g.checkedOut);
          const myOrders = orders.filter(o => o.roomNum === currentUser.roomNum && o.status !== 'delivered');

          return (
            <div>
              {/* Room key card */}
              <div className={`p-5 rounded-2xl bg-gradient-to-br ${theme?.bg || 'from-gray-50 to-slate-50'} border-2 border-amber-300 shadow-lg mb-4`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold text-blue-800">🏨 R&R Hotel</span>
                  {myGuest?.vip && <span className="text-amber-500 text-xl">⭐ VIP</span>}
                </div>
                <div className="bg-white/70 rounded-xl p-3">
                  <div className="text-sm text-gray-500 font-medium">Welcome,</div>
                  <div className="text-xl font-bold text-gray-800">{currentUser.name}</div>
                  <div className="flex justify-between mt-2">
                    <div>
                      <div className="text-xs text-gray-500">Your Room</div>
                      <div className="text-3xl font-bold text-blue-700">{currentUser.roomNum}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Nights</div>
                      <div className="text-3xl font-bold text-amber-600">{myGuest?.nights || '—'}</div>
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-center text-xs text-gray-500">
                  {theme?.emoji} {theme?.label} Suite
                </div>
              </div>

              {/* Door sign control */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border mb-4">
                <h3 className="font-bold text-gray-800 mb-2">Door Sign</h3>
                <div className="flex gap-2 flex-wrap">
                  {DOOR_SIGNS.map(s => (
                    <button key={s.id} onClick={() => setDoorSign(currentUser.roomNum, s.id)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-semibold border-2 transition-all ${(myRoom.doorSign || 'none') === s.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                      {s.emoji} {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active orders for my room */}
              {myOrders.length > 0 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border mb-4">
                  <h3 className="font-bold text-gray-800 mb-2">Your Orders</h3>
                  {myOrders.map(o => (
                    <div key={o.id} className="py-2 border-b last:border-b-0">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">{o.items.map(i => `${i.emoji} ${i.name} x${i.qty}`).join(', ')}</div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${o.status === 'ordered' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{o.status === 'ordered' ? 'Ordered' : 'Preparing'}</span>
                      </div>
                      <div className="text-xs text-gray-400">${o.total}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setView('guest-room-service')}
                  className="p-4 rounded-2xl btn-amber font-bold text-sm shadow-md flex flex-col items-center gap-1">
                  <span className="text-2xl">🍽️</span>
                  Order Room Service
                </button>
                <button onClick={() => setView('guest-review')}
                  className="p-4 rounded-2xl btn-blue font-bold text-sm shadow-md flex flex-col items-center gap-1">
                  <span className="text-2xl">📝</span>
                  Leave a Review
                </button>
              </div>
            </div>
          );
        })()}

        {/* ═══ GUEST ROOM SERVICE ═══ */}
        {view === 'guest-room-service' && isGuest && (
          <div>
            <button onClick={() => setView('guest-dashboard')} className="text-blue-600 font-semibold mb-3 flex items-center gap-1">
              ← Back to My Room
            </button>
            <h2 className="text-xl font-bold text-gray-800 mb-4">🍽️ Room Service — Room {currentUser.roomNum}</h2>

            {/* Menu */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border mb-4">
              <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                {MENU_CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setMenuCat(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap border-2 transition-all ${menuCat === cat.id ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 bg-white text-gray-600'}`}>
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {MENU_ITEMS.filter(i => i.cat === menuCat).map(item => (
                  <button key={item.id} onClick={() => addToCart(item)}
                    className="p-3 rounded-xl bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-all text-left">
                    <div className="text-2xl mb-1">{item.emoji}</div>
                    <div className="text-sm font-semibold text-gray-800">{item.name}</div>
                    <div className="text-sm text-amber-600 font-bold">${item.price}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cart */}
            {cart.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border mb-4">
                <h3 className="font-bold text-gray-800 mb-2">Your Order</h3>
                {cart.map(ci => (
                  <div key={ci.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex items-center gap-2">
                      <span>{ci.emoji}</span>
                      <span className="text-sm font-medium">{ci.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateCartQty(ci.id, -1)} className="w-7 h-7 rounded-full bg-gray-100 font-bold text-gray-600">-</button>
                      <span className="text-sm font-bold w-6 text-center">{ci.qty}</span>
                      <button onClick={() => updateCartQty(ci.id, 1)} className="w-7 h-7 rounded-full bg-gray-100 font-bold text-gray-600">+</button>
                      <span className="text-sm font-semibold text-amber-600 w-10 text-right">${ci.price * ci.qty}</span>
                      <button onClick={() => removeFromCart(ci.id)} className="text-red-400 text-sm">✕</button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between mt-3 pt-3 border-t">
                  <span className="font-bold text-gray-800">Total</span>
                  <span className="font-bold text-amber-600 text-lg">${cartTotal}</span>
                </div>
                <button onClick={() => { submitOrder(String(currentUser.roomNum)); setView('guest-dashboard'); }}
                  className="w-full mt-3 py-3 rounded-xl btn-amber font-bold shadow-md">
                  🍽️ Place Order → Room {currentUser.roomNum}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══ GUEST REVIEW ═══ */}
        {view === 'guest-review' && isGuest && (
          <div>
            <button onClick={() => setView('guest-dashboard')} className="text-blue-600 font-semibold mb-3 flex items-center gap-1">
              ← Back to My Room
            </button>
            <h2 className="text-xl font-bold text-gray-800 mb-4">📝 Leave a Review</h2>

            <div className="bg-white rounded-2xl p-4 shadow-sm border mb-4">
              <div className="space-y-3">
                <div>
                  <label className="label">Rating</label>
                  <div className="flex gap-1 justify-center">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => setReviewForm(f => ({ ...f, stars: n }))}
                        className={`text-4xl transition-transform hover:scale-110 ${n <= reviewForm.stars ? 'text-amber-400' : 'text-gray-300'}`}>
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Comment</label>
                  <textarea className="input" rows={4} value={reviewForm.comment}
                    onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                    placeholder="How is your stay so far?" />
                </div>
                <button onClick={() => {
                  if (!db) return;
                  push(ref(db, `${FB}/guestBook`), {
                    guestName: currentUser.name,
                    roomNum: String(currentUser.roomNum),
                    stars: reviewForm.stars,
                    comment: reviewForm.comment,
                    createdAt: Date.now(),
                  });
                  addNotification('review', `${currentUser.name} left a ${reviewForm.stars}-star review!`);
                  setReviewForm({ guestName: '', stars: 5, comment: '', roomNum: '' });
                  showToast('Review submitted! Thank you!');
                  setView('guest-dashboard');
                }}
                  className="w-full py-3 rounded-xl btn-blue font-bold shadow-md">
                  📝 Submit Review
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ── Bottom nav ─────────────────────────────────────────────── */}
      {isGuest ? (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-lg">
          <div className="flex justify-around max-w-2xl mx-auto">
            {[
              { id: 'guest-dashboard',    label: 'My Room',      emoji: '🏨' },
              { id: 'guest-room-service', label: 'Room Service', emoji: '🍽️' },
              { id: 'guest-review',       label: 'Review',       emoji: '📝' },
            ].map(item => (
              <button key={item.id} onClick={() => setView(item.id)}
                className={`flex flex-col items-center py-2 px-1 min-w-0 flex-1 transition-colors ${view === item.id ? 'text-amber-600' : 'text-gray-400'}`}>
                <span className="text-lg">{item.emoji}</span>
                <span className="text-[10px] font-medium truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      ) : (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-lg">
          <div className="flex justify-around max-w-2xl mx-auto">
            {navItems.map(item => (
              <button key={item.id} onClick={() => setView(item.id)}
                className={`flex flex-col items-center py-2 px-1 min-w-0 flex-1 transition-colors ${view === item.id || (view === 'room-detail' && item.id === 'dashboard') ? 'text-blue-600' : 'text-gray-400'}`}>
                <span className="text-lg">{item.emoji}</span>
                <span className="text-[10px] font-medium truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
