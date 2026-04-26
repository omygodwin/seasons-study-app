import { useState, useEffect, useRef } from 'react';
import { db } from './firebase';
import { ref, onValue, set, push, remove, update } from 'firebase/database';

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════════════ */

const FB = 'movieTheater';

const SEATS = [
  { id: '1A', row: 1, type: 'beanbag',  label: 'Bean Bag right' },
  { id: '1B', row: 1, type: 'beanbag',  label: 'Bean Bag left' },
  { id: '2A', row: 2, type: 'recliner', label: 'Pink Recliner left' },
  { id: '2B', row: 2, type: 'recliner', label: 'Pink Recliner right' },
  { id: '2C', row: 2, type: 'couch',    label: 'White Couch' },
];

const SEAT_TYPE_INFO = {
  beanbag:  { emoji: '🫘', label: 'Bean Bag' },
  recliner: { emoji: '🪑', label: 'Recliner' },
  couch:    { emoji: '🛋️', label: 'Couch' },
};

const DEFAULT_GROUPS = [
  { name: 'Godwin Group', members: ['Raegan', 'Rose', 'Ruth', 'Rachel', 'Bobby'] },
];

const SEAT_STATUS = {
  AVAILABLE: 'available',
  SOLD:      'sold',
  SEATED:    'seated',  // customer arrived and is in their seat
  DIRTY:     'dirty',
  BROKEN:    'broken',
};

const SEAT_INFO = {
  available: { label: 'Available',     color: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500', emoji: '💺' },
  sold:      { label: 'Reserved',      color: 'bg-amber-100 text-amber-800 border-amber-300',       dot: 'bg-amber-500',   emoji: '🎟️' },
  seated:    { label: 'Seated',        color: 'bg-purple-100 text-purple-800 border-purple-300',    dot: 'bg-purple-500',  emoji: '👤' },
  dirty:     { label: 'Needs Cleaning', color: 'bg-orange-100 text-orange-800 border-orange-300',   dot: 'bg-orange-500',  emoji: '🧹' },
  broken:    { label: 'Broken',        color: 'bg-red-100 text-red-800 border-red-300',             dot: 'bg-red-500',     emoji: '🔧' },
};

const SHOW_STATUS = {
  SELLING:   'selling',
  STARTED:   'started',
  ENDED:     'ended',
  CANCELLED: 'cancelled',
};

const SHOW_INFO = {
  selling:   { label: 'Tickets on Sale', color: 'bg-blue-100 text-blue-800 border-blue-300',         emoji: '🎟️' },
  started:   { label: 'Now Playing',     color: 'bg-purple-100 text-purple-800 border-purple-300',   emoji: '🎬' },
  ended:     { label: 'Ended',           color: 'bg-gray-100 text-gray-800 border-gray-300',         emoji: '🎞️' },
  cancelled: { label: 'Cancelled',       color: 'bg-red-100 text-red-800 border-red-300',            emoji: '❌' },
};

const ROLES = [
  { id: 'manager',      label: 'Manager',      emoji: '👔', desc: 'Run the whole theater' },
  { id: 'ticket-booth', label: 'Ticket Booth', emoji: '🎟️', desc: 'Sell tickets and pick seats' },
  { id: 'concessions',  label: 'Concessions',  emoji: '🍿', desc: 'Snacks and drinks' },
  { id: 'usher',        label: 'Usher',        emoji: '🎬', desc: 'Start show, clean theater' },
];

const MOVIES = [
  { id: 'spider-man',     title: 'Spider-Man',           emoji: '🕷️', duration: 121 },
  { id: 'toy-story',      title: 'Toy Story',            emoji: '🧸', duration: 81 },
  { id: 'nemo',           title: 'Finding Nemo',         emoji: '🐠', duration: 100 },
  { id: 'lion-king',      title: 'The Lion King',        emoji: '🦁', duration: 88 },
  { id: 'moana',          title: 'Moana',                emoji: '🌊', duration: 107 },
  { id: 'encanto',        title: 'Encanto',              emoji: '🏠', duration: 102 },
  { id: 'inside-out',     title: 'Inside Out',           emoji: '😀', duration: 95 },
  { id: 'ratatouille',    title: 'Ratatouille',          emoji: '🐭', duration: 111 },
  { id: 'coco',           title: 'Coco',                 emoji: '💀', duration: 105 },
  { id: 'wall-e',         title: 'Wall-E',               emoji: '🤖', duration: 98 },
  { id: 'minions',        title: 'Minions',              emoji: '👶', duration: 90 },
  { id: 'shrek',          title: 'Shrek',                emoji: '🧌', duration: 90 },
  { id: 'last-song',      title: 'The Last Song',        emoji: '🎵', duration: 107 },
  { id: 'cruella',        title: 'Cruella',              emoji: '🐶', duration: 134 },
  { id: 'doubtfire',      title: 'Mrs. Doubtfire',       emoji: '👵', duration: 125 },
  { id: 'miracles',       title: 'Miracles From Heaven', emoji: '✨', duration: 109 },
  { id: 'lilo-stitch',    title: 'Lilo & Stitch',        emoji: '👽', duration: 85 },
  { id: 'hannah-montana', title: 'Hannah Montana',       emoji: '🎤', duration: 102 },
];

// All bookable showtimes throughout the day. Includes the specific 1:30/1:45/2:00/2:15/2:30/2:45 PM the user asked for.
const SHOWTIMES = [
  { label: '11:00 AM', m: 660 },
  { label: '11:30 AM', m: 690 },
  { label: '12:00 PM', m: 720 },
  { label: '12:30 PM', m: 750 },
  { label: '1:00 PM',  m: 780 },
  { label: '1:15 PM',  m: 795 },
  { label: '1:30 PM',  m: 810 },
  { label: '1:45 PM',  m: 825 },
  { label: '2:00 PM',  m: 840 },
  { label: '2:15 PM',  m: 855 },
  { label: '2:30 PM',  m: 870 },
  { label: '2:45 PM',  m: 885 },
  { label: '3:00 PM',  m: 900 },
  { label: '3:30 PM',  m: 930 },
  { label: '4:00 PM',  m: 960 },
  { label: '4:30 PM',  m: 990 },
  { label: '5:00 PM',  m: 1020 },
  { label: '5:30 PM',  m: 1050 },
  { label: '6:00 PM',  m: 1080 },
  { label: '6:30 PM',  m: 1110 },
  { label: '7:00 PM',  m: 1140 },
  { label: '7:30 PM',  m: 1170 },
  { label: '8:00 PM',  m: 1200 },
  { label: '8:30 PM',  m: 1230 },
];

const CONCESSION_CATS = [
  { id: 'popcorn', label: 'Popcorn', emoji: '🍿' },
  { id: 'snacks',  label: 'Snacks',  emoji: '🥨' },
  { id: 'candy',   label: 'Candy',   emoji: '🍬' },
  { id: 'drinks',  label: 'Drinks',  emoji: '🥤' },
];

const CONCESSION_ITEMS = [
  { id: 'pop-s',  name: 'Small Popcorn',    emoji: '🍿', price: 5, cat: 'popcorn' },
  { id: 'pop-l',  name: 'Large Popcorn',    emoji: '🍿', price: 8, cat: 'popcorn' },
  { id: 'pop-b',  name: 'Buttery Popcorn',  emoji: '🧈', price: 7, cat: 'popcorn' },
  { id: 'sn-pre', name: 'Pretzel',          emoji: '🥨', price: 6, cat: 'snacks' },
  { id: 'sn-nac', name: 'Nachos',           emoji: '🌮', price: 7, cat: 'snacks' },
  { id: 'sn-hot', name: 'Hot Dog',          emoji: '🌭', price: 6, cat: 'snacks' },
  { id: 'cy-gum', name: 'Gummy Bears',      emoji: '🍬', price: 4, cat: 'candy' },
  { id: 'cy-cho', name: 'Chocolate Bar',    emoji: '🍫', price: 4, cat: 'candy' },
  { id: 'cy-ski', name: 'Skittles',         emoji: '🌈', price: 4, cat: 'candy' },
  { id: 'cy-mm',  name: 'M&Ms',             emoji: '🟤', price: 4, cat: 'candy' },
  { id: 'dr-sod', name: 'Soda',             emoji: '🥤', price: 4, cat: 'drinks' },
  { id: 'dr-lem', name: 'Lemonade',         emoji: '🍋', price: 4, cat: 'drinks' },
  { id: 'dr-slu', name: 'Slushie',          emoji: '🧊', price: 5, cat: 'drinks' },
  { id: 'dr-wat', name: 'Water',            emoji: '💧', price: 2, cat: 'drinks' },
];

const ORDER_STATUS = {
  PENDING:   { label: 'New',       color: 'bg-blue-100 text-blue-800 border-blue-300',         emoji: '🆕' },
  PREPARING: { label: 'Preparing', color: 'bg-amber-100 text-amber-800 border-amber-300',      emoji: '👨‍🍳' },
  READY:     { label: 'Ready',     color: 'bg-emerald-100 text-emerald-800 border-emerald-300', emoji: '✅' },
  DELIVERED: { label: 'Delivered', color: 'bg-gray-100 text-gray-800 border-gray-300',         emoji: '📦' },
};

const TICKET_PRICE = 10;

const DEFAULT_STAFF = [
  { name: 'Ruth', pin: '1111', emoji: '👩', color: '#dc2626' },
  { name: 'Rose', pin: '2222', emoji: '👧', color: '#f59e0b' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS (pure)
   ═══════════════════════════════════════════════════════════════════════════ */

const todayISO = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

const blankShowSeats = () => {
  const s = {};
  SEATS.forEach((seat) => {
    s[seat.id] = { status: SEAT_STATUS.AVAILABLE, customerName: '', paid: 0 };
  });
  return s;
};

// Default daily schedule — featured movies are Raegan's "What to watch" list + a few more.
// Every movie gets the four CORE showtimes (1:45, 2:00, 2:15, 2:30 PM) plus 2-4 extras
// to spread across the day.
const CORE_SHOWTIME_IDX = [7, 8, 9, 10]; // 1:45, 2:00, 2:15, 2:30 PM
const FEATURED_DEFAULTS = [
  // [movieId, [extra showtime indexes into SHOWTIMES, beyond the core 4]]
  ['last-song',      [4, 16, 22]],       // The Last Song          + 1:00, 5:00, 8:00
  ['cruella',        [2, 15, 21]],       // Cruella                + 12:00, 4:30, 7:30
  ['doubtfire',      [3, 13, 18]],       // Mrs. Doubtfire         + 12:30, 3:30, 6:00
  ['miracles',       [5, 12, 19]],       // Miracles From Heaven   + 1:15, 3:00, 6:30
  ['lilo-stitch',    [6, 14, 20, 23]],   // Lilo & Stitch          + 1:30, 4:00, 7:00, 8:30
  ['hannah-montana', [11, 17]],          // Hannah Montana         + 2:45, 5:30
  ['spider-man',     [13, 19]],          // Spider-Man              + 3:30, 6:30
  ['toy-story',      [11, 22]],          // Toy Story              + 2:45, 8:00
];

const buildDefaultSchedule = (date) => {
  const sched = {};
  FEATURED_DEFAULTS.forEach(([movieId, extraTimeIdxs]) => {
    const movie = MOVIES.find((m) => m.id === movieId);
    if (!movie) return;
    // Every movie gets the core 4 showtimes plus its uniques. Dedupe + sort.
    const timeIdxs = Array.from(new Set([...CORE_SHOWTIME_IDX, ...extraTimeIdxs])).sort((a, b) => a - b);
    timeIdxs.forEach((tIdx) => {
      const t = SHOWTIMES[tIdx];
      if (!t) return;
      const showId = `${date}-${movie.id}-${t.m}`;
      sched[showId] = {
        movieId: movie.id,
        title: movie.title,
        emoji: movie.emoji,
        duration: movie.duration,
        date,
        startTime: t.label,
        startMinutes: t.m,
        status: SHOW_STATUS.SELLING,
        ticketPrice: TICKET_PRICE,
        seats: blankShowSeats(),
        createdAt: Date.now(),
      };
    });
  });
  return sched;
};

const minutesUntilShow = (show) => {
  if (!show?.date || show.startMinutes == null) return Infinity;
  const h = Math.floor(show.startMinutes / 60);
  const m = show.startMinutes % 60;
  const showStart = new Date(`${show.date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
  return Math.round((showStart - new Date()) / 60000);
};

const friendlyTimingHint = (show, seatStatus) => {
  if (!show) return '';
  if (show.status === SHOW_STATUS.ENDED) return '✅ Show finished';
  if (show.status === SHOW_STATUS.CANCELLED) return '❌ Cancelled';
  if (seatStatus === SEAT_STATUS.SEATED) return '👤 You\'re seated';
  if (show.status === SHOW_STATUS.STARTED) return '🎬 Now playing — go inside!';
  const m = minutesUntilShow(show);
  if (m === Infinity) return '';
  if (m <= 0) return '🎬 Showtime!';
  if (m <= 30) return `🚪 Doors open · show in ${m} min`;
  const h = Math.floor(m / 60);
  const mins = m % 60;
  return `⏰ Show in ${h > 0 ? `${h}h ` : ''}${mins}m`;
};

/* ═══════════════════════════════════════════════════════════════════════════
   APP
   ═══════════════════════════════════════════════════════════════════════════ */

export default function App() {
  // ─── auth ─────────────────────────────────────────────────────────────────
  const [staff, setStaff] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginStep, setLoginStep] = useState('pick'); // pick | pin | role
  const [loginTarget, setLoginTarget] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // ─── data ─────────────────────────────────────────────────────────────────
  const [schedule, setSchedule] = useState({});
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [groups, setGroups] = useState([]);
  const [poll, setPoll] = useState(null);
  const [votes, setVotes] = useState([]);

  // ─── voter / customer identity (persisted) ────────────────────────────────
  const [voteGroup, setVoteGroup] = useState(() => {
    try { return localStorage.getItem('mt-voteGroup') || 'Godwin Group'; } catch { return 'Godwin Group'; }
  });
  const [voteName, setVoteName] = useState(() => {
    try { return localStorage.getItem('mt-voteName') || ''; } catch { return ''; }
  });
  useEffect(() => { try { localStorage.setItem('mt-voteGroup', voteGroup); } catch {} }, [voteGroup]);
  useEffect(() => { try { localStorage.setItem('mt-voteName', voteName); } catch {} }, [voteName]);

  // ─── notifications: permission + dedupe refs ──────────────────────────────
  const [notifPermission, setNotifPermission] = useState(() =>
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const seenOrderKeys = useRef(new Set());
  const seenSeatKeys = useRef(new Set());
  const seenShowKeys = useRef(new Set());
  const notifInitialDone = useRef(false);

  // ─── poll-creation form ───────────────────────────────────────────────────
  const [pollSelection, setPollSelection] = useState([]);

  // ─── ui ───────────────────────────────────────────────────────────────────
  const [view, setView] = useState('home'); // home | seats | vote | concessions | schedule | notifications
  const [toast, setToast] = useState(null);
  const [mode, setMode] = useState('public');

  // ─── ticking clock so timing hints recompute every 30s ────────────────────
  const [, setNowTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setNowTick((t) => t + 1), 30000);
    return () => clearInterval(iv);
  }, []);

  // ─── forms / modal state ──────────────────────────────────────────────────
  const [seatPickerShowId, setSeatPickerShowId] = useState(null);
  const [seatPickerSelected, setSeatPickerSelected] = useState([]);
  const [seatPickerName, setSeatPickerName] = useState('');

  const [seatsViewShowId, setSeatsViewShowId] = useState(null);

  const [addMovieId, setAddMovieId] = useState(MOVIES[0].id);
  const [addStartTime, setAddStartTime] = useState(SHOWTIMES[6].label); // 1:30 PM

  const [cart, setCart] = useState([]);
  const [orderCustomer, setOrderCustomer] = useState('');
  const [orderSeat, setOrderSeat] = useState('');
  const [menuCat, setMenuCat] = useState('popcorn');

  // Redirect public users away from staff-only views
  useEffect(() => {
    if (!currentUser && (view === 'schedule' || view === 'notifications')) {
      setView('home');
    }
  }, [currentUser, view]);

  const isLoggedIn = !!currentUser;
  const role = currentUser?.role;
  const can = (...allowed) => allowed.includes(role) || role === 'manager';

  const showToast = (msg, dur = 2200) => {
    setToast(msg);
    setTimeout(() => setToast(null), dur);
  };

  /* ═══════════════════════════════════════════════════════════════════════
     FIREBASE SYNC
     ═══════════════════════════════════════════════════════════════════════ */

  useEffect(() => {
    if (!db) return;
    const unsubs = [];
    const listen = (path, setter, isArray = true) => {
      const r = ref(db, `${FB}/${path}`);
      const u = onValue(r, (snap) => {
        const val = snap.val();
        if (isArray) {
          setter(val ? Object.entries(val).map(([id, v]) => ({ id, ...v })) : []);
        } else {
          setter(val);
        }
      });
      unsubs.push(() => u());
    };

    // staff: seed defaults if empty
    const staffRef = ref(db, `${FB}/staff`);
    const usStaff = onValue(staffRef, (snap) => {
      const val = snap.val();
      if (!val || Object.keys(val).length === 0) {
        const init = {};
        DEFAULT_STAFF.forEach((s, i) => { init[`s${i}`] = s; });
        set(staffRef, init);
      } else {
        setStaff(Object.entries(val).map(([id, v]) => ({ id, ...v })));
      }
    });
    unsubs.push(() => usStaff());

    // schedule: auto-seed today if no shows for today exist
    const scheduleRef = ref(db, `${FB}/schedule`);
    const usSchedule = onValue(scheduleRef, (snap) => {
      const val = snap.val() || {};
      const today = todayISO();
      const hasToday = Object.values(val).some((s) => s && s.date === today);
      if (!hasToday) {
        const seed = buildDefaultSchedule(today);
        update(scheduleRef, seed);
      } else {
        setSchedule(val);
      }
    });
    unsubs.push(() => usSchedule());

    listen('orders', setOrders);
    listen('notifications', setNotifications);
    listen('poll', setPoll, false);
    listen('votes', setVotes);

    // groups: seed Godwin Group if empty
    const groupsRef = ref(db, `${FB}/groups`);
    const usGroups = onValue(groupsRef, (snap) => {
      const val = snap.val();
      if (!val || Object.keys(val).length === 0) {
        const init = {};
        DEFAULT_GROUPS.forEach((g, i) => { init[`g${i}`] = g; });
        set(groupsRef, init);
      } else {
        setGroups(Object.entries(val).map(([id, v]) => ({ id, ...v, members: v.members || [] })));
      }
    });
    unsubs.push(() => usGroups());

    return () => unsubs.forEach((u) => u());
  }, []);

  /* ═══════════════════════════════════════════════════════════════════════
     COMPUTED
     ═══════════════════════════════════════════════════════════════════════ */

  const scheduleList = Object.entries(schedule || {}).map(([id, s]) => ({
    id,
    ...s,
    seats: (s && s.seats) || {},
  }));

  const todayShows = scheduleList
    .filter((s) => s.date === todayISO())
    .sort((a, b) => (a.startMinutes || 0) - (b.startMinutes || 0));

  const activeShow = scheduleList.find((s) => s.status === SHOW_STATUS.STARTED) || null;

  // myName: identity for matching tickets/orders (logged-in staff name OR voter identity)
  const myName = (currentUser?.name || voteName || '').trim();
  const myNameLower = myName.toLowerCase();

  // myTickets: every seat across schedule that's reserved/seated under my name
  const myTickets = [];
  scheduleList.forEach((s) => {
    Object.entries(s.seats || {}).forEach(([seatId, seat]) => {
      if (
        seat?.customerName &&
        seat.customerName.trim().toLowerCase() === myNameLower &&
        myNameLower &&
        (seat.status === SEAT_STATUS.SOLD || seat.status === SEAT_STATUS.SEATED)
      ) {
        myTickets.push({ showId: s.id, seatId, show: s, seat });
      }
    });
  });
  myTickets.sort((a, b) => (a.show.startMinutes || 0) - (b.show.startMinutes || 0));

  /* ═══════════════════════════════════════════════════════════════════════
     ACTIONS
     ═══════════════════════════════════════════════════════════════════════ */

  const notify = (type, msg) => {
    if (!db) return;
    push(ref(db, `${FB}/notifications`), {
      type, msg, createdAt: Date.now(), by: currentUser?.name || 'Guest',
    });
  };

  /* ─── Notification helpers ─── */

  const requestNotifPermission = async () => {
    if (typeof Notification === 'undefined') {
      showToast('Notifications not supported on this device');
      return;
    }
    if (Notification.permission === 'granted') {
      setNotifPermission('granted');
      showToast('🔔 Already enabled!');
      return;
    }
    if (Notification.permission === 'denied') {
      showToast('Blocked — enable notifications in browser settings');
      return;
    }
    const result = await Notification.requestPermission();
    setNotifPermission(result);
    if (result === 'granted') {
      showToast('🔔 Notifications enabled!');
      try {
        new Notification("🎬 You're all set!", {
          body: "We'll alert you about your tickets and shows.",
          icon: 'icon-192.png',
        });
      } catch {}
    }
  };

  const fireNotif = (title, body) => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    try {
      new Notification(title, { body, icon: 'icon-192.png', tag: title });
    } catch {}
  };

  /* ─── Foreground notifications: watch effect ─── */

  useEffect(() => {
    if (notifPermission !== 'granted') return;
    const myRole = currentUser?.role;

    if (!notifInitialDone.current) {
      orders.forEach((o) => seenOrderKeys.current.add(`${o.id}:${o.status}`));
      scheduleList.forEach((s) => {
        Object.entries(s.seats || {}).forEach(([seatId, seat]) => {
          seenSeatKeys.current.add(`${s.id}:${seatId}:${seat.status}:${seat.customerName || ''}`);
        });
        seenShowKeys.current.add(`${s.id}:${s.status}`);
      });
      notifInitialDone.current = true;
      return;
    }

    // Order status transitions
    orders.forEach((o) => {
      const key = `${o.id}:${o.status}`;
      if (seenOrderKeys.current.has(key)) return;
      seenOrderKeys.current.add(key);
      const cust = (o.customerName || '').trim().toLowerCase();
      if (cust && cust === myNameLower) {
        if (o.status === 'PREPARING') fireNotif('👨‍🍳 Your snacks are being made!', 'Hang tight!');
        if (o.status === 'READY') fireNotif('🍿 Your snacks are ready!', o.seat ? `Coming to seat ${o.seat}` : 'Pick up at the counter');
        if (o.status === 'DELIVERED') fireNotif('📦 Order delivered!', 'Enjoy!');
      }
      if ((myRole === 'concessions' || myRole === 'manager') && o.status === 'PENDING') {
        fireNotif('🆕 New order!', `${o.customerName || 'Customer'}: $${o.total || 0}`);
      }
      if ((myRole === 'usher' || myRole === 'manager') && o.status === 'READY' && o.seat) {
        fireNotif('🚀 Order ready to deliver', `${o.customerName || 'Customer'} → seat ${o.seat}`);
      }
    });

    // Seat transitions across the whole schedule
    scheduleList.forEach((s) => {
      Object.entries(s.seats || {}).forEach(([seatId, seat]) => {
        const key = `${s.id}:${seatId}:${seat.status}:${seat.customerName || ''}`;
        if (seenSeatKeys.current.has(key)) return;
        seenSeatKeys.current.add(key);
        const cust = (seat.customerName || '').trim().toLowerCase();
        if (cust && cust === myNameLower && seat.status === SEAT_STATUS.SOLD) {
          fireNotif('🎟️ Ticket confirmed!', `${s.title} at ${s.startTime} · Seat ${seatId}`);
        }
        // Ticket Booth + Manager: alert on every new ticket sale
        if ((myRole === 'ticket-booth' || myRole === 'manager') && seat.status === SEAT_STATUS.SOLD && seat.customerName) {
          fireNotif('🎟️ New ticket sold!', `${seat.customerName} → ${s.title} ${s.startTime} · ${seatId}`);
        }
        // Usher + Manager: alert when a customer takes their seat
        if ((myRole === 'usher' || myRole === 'manager') && seat.status === SEAT_STATUS.SEATED && seat.customerName) {
          fireNotif('🪑 Customer seated', `${seat.customerName} took seat ${seatId} (${s.title})`);
        }
      });
    });

    // Show status transitions
    scheduleList.forEach((s) => {
      const key = `${s.id}:${s.status}`;
      if (seenShowKeys.current.has(key)) return;
      seenShowKeys.current.add(key);
      if (s.status === SHOW_STATUS.STARTED) {
        const myEntry = Object.entries(s.seats || {}).find(([_, seat]) =>
          seat?.customerName?.trim().toLowerCase() === myNameLower
        );
        if (myEntry) {
          fireNotif(`🎬 ${s.title} is starting!`, `Your seat: ${myEntry[0]}`);
        }
      }
    });
  }, [orders, schedule, notifPermission, currentUser, voteName, myNameLower]);

  /* ─── Schedule actions (manager) ─── */

  const seedTodaysSchedule = () => {
    if (!db) return;
    const today = todayISO();
    const seed = buildDefaultSchedule(today);
    // Atomically remove every existing show for today, then write the new seed.
    // (update() merges — without nulling the old keys, stale showings hang around.)
    const updates = {};
    todayShows.forEach((s) => { updates[s.id] = null; });
    Object.entries(seed).forEach(([id, val]) => { updates[id] = val; });
    update(ref(db, `${FB}/schedule`), updates);
    notify('schedule-seeded', `🎬 Today's schedule reset (${Object.keys(seed).length} showings)`);
    showToast(`Generated ${Object.keys(seed).length} showings!`);
  };

  const clearTodaysSchedule = () => {
    if (!db) return;
    if (!confirm("Clear today's entire schedule? Any sold tickets will be lost.")) return;
    const updates = {};
    todayShows.forEach((s) => { updates[s.id] = null; });
    update(ref(db, `${FB}/schedule`), updates);
    showToast("Cleared today's schedule");
  };

  const addShowing = (movieId, startTimeLabel) => {
    if (!db) return;
    const movie = MOVIES.find((m) => m.id === movieId);
    const t = SHOWTIMES.find((x) => x.label === startTimeLabel);
    if (!movie || !t) return;
    const date = todayISO();
    const showId = `${date}-${movie.id}-${t.m}`;
    if (schedule[showId]) {
      showToast('That showing already exists');
      return;
    }
    update(ref(db, `${FB}/schedule/${showId}`), {
      movieId: movie.id,
      title: movie.title,
      emoji: movie.emoji,
      duration: movie.duration,
      date,
      startTime: t.label,
      startMinutes: t.m,
      status: SHOW_STATUS.SELLING,
      ticketPrice: TICKET_PRICE,
      seats: blankShowSeats(),
      createdAt: Date.now(),
    });
    notify('showing-added', `🎬 Added ${movie.title} at ${t.label}`);
    showToast(`Added ${movie.title} at ${t.label}!`);
  };

  const removeShowing = (showId) => {
    if (!db) return;
    if (!confirm('Delete this showing? Any sold tickets will be lost.')) return;
    update(ref(db, `${FB}/schedule`), { [showId]: null });
    showToast('Showing removed');
  };

  const startShowing = (showId) => {
    if (!db) return;
    const show = schedule[showId];
    if (!show) return;
    update(ref(db, `${FB}/schedule/${showId}`), { ...show, status: SHOW_STATUS.STARTED, startedAt: Date.now() });
    notify('show-started', `🎬 ${show.title} (${show.startTime}) is now playing!`);
    showToast(`🎬 ${show.title} started!`);
  };

  const endShowing = (showId) => {
    if (!db) return;
    const show = schedule[showId];
    if (!show) return;
    const updates = {};
    Object.entries(show.seats || {}).forEach(([seatId, seat]) => {
      if (seat.status === SEAT_STATUS.SOLD || seat.status === SEAT_STATUS.SEATED) {
        updates[`schedule/${showId}/seats/${seatId}`] = { status: SEAT_STATUS.DIRTY, customerName: '', paid: 0 };
      }
    });
    updates[`schedule/${showId}/status`] = SHOW_STATUS.ENDED;
    updates[`schedule/${showId}/endedAt`] = Date.now();
    update(ref(db, FB), updates);
    notify('show-ended', `🎞️ ${show.title} (${show.startTime}) ended — time to clean up!`);
    showToast(`Show ended.`);
  };

  const cancelShowing = (showId) => {
    if (!db) return;
    const show = schedule[showId];
    if (!show) return;
    if (!confirm(`Cancel ${show.title} at ${show.startTime}?`)) return;
    const updates = {};
    Object.entries(show.seats || {}).forEach(([seatId, seat]) => {
      if (seat.status === SEAT_STATUS.SOLD || seat.status === SEAT_STATUS.SEATED) {
        updates[`schedule/${showId}/seats/${seatId}`] = { status: SEAT_STATUS.AVAILABLE, customerName: '', paid: 0 };
      }
    });
    updates[`schedule/${showId}/status`] = SHOW_STATUS.CANCELLED;
    update(ref(db, FB), updates);
    notify('show-cancelled', `❌ ${show.title} at ${show.startTime} cancelled`);
    showToast('Show cancelled');
  };

  /* ─── Ticket actions ─── */

  const openSeatPicker = (showId) => {
    setSeatPickerShowId(showId);
    setSeatPickerSelected([]);
    setSeatPickerName(myName || '');
  };

  const closeSeatPicker = () => {
    setSeatPickerShowId(null);
    setSeatPickerSelected([]);
    setSeatPickerName('');
  };

  const toggleSeatPickerSelection = (seatId) => {
    const show = schedule[seatPickerShowId];
    if (!show) return;
    const seat = show.seats?.[seatId];
    if (seat?.status !== SEAT_STATUS.AVAILABLE) return;
    setSeatPickerSelected((s) => (s.includes(seatId) ? s.filter((x) => x !== seatId) : [...s, seatId]));
  };

  const confirmSeatPicker = () => {
    if (!db || !seatPickerShowId || seatPickerSelected.length === 0) return;
    const name = seatPickerName.trim();
    if (!name) { showToast('Please enter a name'); return; }
    const show = schedule[seatPickerShowId];
    if (!show) return;
    const updates = {};
    let total = 0;
    seatPickerSelected.forEach((seatId) => {
      const seat = show.seats?.[seatId];
      if (!seat || seat.status !== SEAT_STATUS.AVAILABLE) return;
      const price = show.ticketPrice || TICKET_PRICE;
      updates[`schedule/${seatPickerShowId}/seats/${seatId}`] = {
        status: SEAT_STATUS.SOLD, customerName: name, paid: price,
      };
      total += price;
    });
    if (Object.keys(updates).length === 0) {
      showToast('Those seats are no longer available');
      return;
    }
    update(ref(db, FB), updates);
    notify('ticket-sold', `🎟️ ${name} bought ${seatPickerSelected.join(', ')} for ${show.title} at ${show.startTime} ($${total})`);
    showToast(`🎟️ Tickets confirmed!`);
    closeSeatPicker();
  };

  const takeSeat = (showId, seatId) => {
    if (!db) return;
    const show = schedule[showId];
    if (!show) return;
    const seat = show.seats?.[seatId];
    if (!seat || seat.status !== SEAT_STATUS.SOLD) return;
    update(ref(db, `${FB}/schedule/${showId}/seats/${seatId}`), {
      ...seat,
      status: SEAT_STATUS.SEATED,
    });
    notify('seat-taken', `🪑 ${seat.customerName} took seat ${seatId} for ${show.title}`);
    showToast('🪑 Welcome! Enjoy the show!');
  };

  const refundSeatAction = (showId, seatId) => {
    if (!db) return;
    update(ref(db, `${FB}/schedule/${showId}/seats/${seatId}`), {
      status: SEAT_STATUS.AVAILABLE, customerName: '', paid: 0,
    });
    notify('ticket-refund', `↩️ Seat ${seatId} refunded`);
  };

  const cleanSeatAction = (showId, seatId) => {
    if (!db) return;
    update(ref(db, `${FB}/schedule/${showId}/seats/${seatId}`), {
      status: SEAT_STATUS.AVAILABLE, customerName: '', paid: 0,
    });
    notify('seat-clean', `🧹 Seat ${seatId} cleaned`);
    showToast(`Seat ${seatId} cleaned`);
  };

  const toggleBrokenAction = (showId, seatId) => {
    if (!db) return;
    const show = schedule[showId];
    const seat = show?.seats?.[seatId];
    if (!seat) return;
    const next = seat.status === SEAT_STATUS.BROKEN ? SEAT_STATUS.AVAILABLE : SEAT_STATUS.BROKEN;
    update(ref(db, `${FB}/schedule/${showId}/seats/${seatId}`), {
      status: next, customerName: '', paid: 0,
    });
    notify('seat-broken', next === SEAT_STATUS.BROKEN ? `🔧 Seat ${seatId} marked broken` : `✅ Seat ${seatId} fixed`);
  };

  /* ─── Cart / Orders ─── */

  const addToCart = (item) => {
    setCart((c) => {
      const found = c.find((x) => x.id === item.id);
      if (found) return c.map((x) => (x.id === item.id ? { ...x, qty: x.qty + 1 } : x));
      return [...c, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart((c) =>
      c.map((x) => (x.id === id ? { ...x, qty: x.qty - 1 } : x)).filter((x) => x.qty > 0),
    );
  };

  const cartTotal = cart.reduce((sum, x) => sum + x.price * x.qty, 0);

  const submitOrder = () => {
    if (!db || cart.length === 0 || !orderCustomer.trim()) return;
    push(ref(db, `${FB}/orders`), {
      customerName: orderCustomer.trim(),
      seat: orderSeat || null,
      items: cart.map((x) => ({ id: x.id, name: x.name, emoji: x.emoji, price: x.price, qty: x.qty })),
      total: cartTotal,
      status: 'PENDING',
      createdAt: Date.now(),
    });
    notify('order-new', `🍿 Order for ${orderCustomer.trim()}: $${cartTotal}`);
    showToast('Order placed!');
    setCart([]);
    setOrderCustomer('');
    setOrderSeat('');
  };

  const setOrderStatus = (orderId, status) => {
    if (!db) return;
    update(ref(db, `${FB}/orders/${orderId}`), { status });
    if (status === 'READY') notify('order-ready', `✅ Order ready for pickup!`);
  };

  const deleteOrder = (orderId) => {
    if (!db) return;
    remove(ref(db, `${FB}/orders/${orderId}`));
  };

  const clearAllNotifications = () => {
    if (!db) return;
    if (!confirm('Clear all notifications?')) return;
    set(ref(db, `${FB}/notifications`), null);
  };

  /* ─── Voting actions ─── */

  const addGroup = (name) => {
    if (!db || !name?.trim()) return;
    push(ref(db, `${FB}/groups`), { name: name.trim(), members: [] });
    showToast(`Added group "${name.trim()}"`);
  };

  const addMember = (groupId, memberName) => {
    if (!db || !groupId || !memberName?.trim()) return;
    const g = groups.find((x) => x.id === groupId);
    if (!g) return;
    const next = [...(g.members || []), memberName.trim()];
    update(ref(db, `${FB}/groups/${groupId}`), { members: next });
    setVoteName(memberName.trim());
    showToast(`Added ${memberName.trim()}`);
  };

  const startPoll = (movieIds) => {
    if (!db || !movieIds || movieIds.length < 2) return;
    set(ref(db, `${FB}/votes`), null);
    set(ref(db, `${FB}/poll`), {
      movieIds, status: 'open', createdAt: Date.now(), startedBy: currentUser?.name || '',
    });
    setPollSelection([]);
    notify('poll-started', `🗳️ Voting started — ${movieIds.length} movies on the ballot!`);
    showToast('Poll started!');
  };

  const castVote = (movieId) => {
    if (!db || !movieId) return;
    if (!poll || poll.status !== 'open') {
      showToast('Voting is closed');
      return;
    }
    push(ref(db, `${FB}/votes`), {
      group: voteGroup, voter: voteName || '', movieId, createdAt: Date.now(),
    });
    showToast(`Voted! 🗳️`);
  };

  const closePoll = () => {
    if (!db || !poll) return;
    update(ref(db, `${FB}/poll`), { status: 'closed', closedAt: Date.now() });
    notify('poll-closed', `📊 Voting closed`);
    showToast('Voting closed');
  };

  const clearPoll = () => {
    if (!db) return;
    if (!confirm('Clear poll and all votes?')) return;
    set(ref(db, `${FB}/poll`), null);
    set(ref(db, `${FB}/votes`), null);
    showToast('Poll cleared');
  };

  /* ═══════════════════════════════════════════════════════════════════════
     LOGIN SCREEN (staff mode + no user)
     ═══════════════════════════════════════════════════════════════════════ */

  const tryPin = () => {
    if (loginTarget && pinInput === loginTarget.pin) {
      setLoginStep('role');
      setPinInput('');
      setPinError('');
    } else {
      setPinError('Wrong PIN — try again!');
      setPinInput('');
    }
  };

  const effectiveStaff = staff.length > 0
    ? staff
    : DEFAULT_STAFF.map((s, i) => ({ ...s, id: `default-${i}` }));

  const exitToPublic = () => {
    setMode('public');
    setLoginStep('pick');
    setLoginTarget(null);
    setPinInput('');
    setPinError('');
  };

  if (mode === 'staff' && !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-amber-50 to-yellow-50 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <div className="text-7xl mb-2">🎬</div>
          <h1 className="text-4xl font-bold text-red-800 mb-1">Ruth & Rose's Movie Theater</h1>
          <p className="text-amber-700 italic">Staff Login</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border-4 border-amber-400">
          {loginStep === 'pick' && (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Who's working today?</h2>
              <div className="space-y-3">
                {effectiveStaff.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setLoginTarget(s); setLoginStep('pin'); }}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-red-400 hover:bg-red-50 active:bg-red-100 transition-all min-h-[64px]"
                  >
                    <span className="text-4xl">{s.emoji}</span>
                    <span className="text-xl font-semibold text-gray-800">{s.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {loginStep === 'pin' && loginTarget && (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                Hi {loginTarget.emoji} {loginTarget.name}!
              </h2>
              <p className="text-center text-gray-600 mb-4">Enter your secret PIN</p>
              <input
                type="password"
                inputMode="numeric"
                autoFocus
                value={pinInput}
                onChange={(e) => { setPinInput(e.target.value); setPinError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && tryPin()}
                className="input text-center text-3xl tracking-widest mb-3"
                placeholder="••••"
                maxLength={4}
              />
              {pinError && <p className="text-red-600 text-sm text-center mb-2">{pinError}</p>}
              <div className="flex gap-2">
                <button onClick={() => { setLoginStep('pick'); setPinInput(''); setPinError(''); }} className="btn-gray flex-1 px-4 py-3 rounded-xl font-semibold min-h-[48px]">Back</button>
                <button onClick={tryPin} className="btn-red flex-1 px-4 py-3 rounded-xl font-semibold min-h-[48px]">Continue</button>
              </div>
            </>
          )}

          {loginStep === 'role' && loginTarget && (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Pick your role!</h2>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setCurrentUser({ ...loginTarget, role: r.id, roleLabel: r.label });
                      setLoginStep('pick');
                      setLoginTarget(null);
                      showToast(`Welcome, ${r.label}!`);
                    }}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-red-400 hover:bg-red-50 active:bg-red-100 transition-all min-h-[110px]"
                  >
                    <span className="text-4xl">{r.emoji}</span>
                    <span className="font-bold text-gray-800 text-center">{r.label}</span>
                    <span className="text-xs text-gray-500 text-center">{r.desc}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="mt-5 pt-4 border-t border-gray-100 text-center">
            <button onClick={exitToPublic} className="text-sm text-gray-500 hover:text-gray-700 active:text-gray-800 font-semibold min-h-[36px] px-3">
              ← Back to Theater
            </button>
          </div>
        </div>

        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl z-50 font-semibold">
            {toast}
          </div>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════
     MAIN APP
     ═══════════════════════════════════════════════════════════════════════ */

  const ALL_TABS = [
    { id: 'home',         label: 'Now Playing', emoji: '🎬' },
    { id: 'seats',        label: 'Seats',       emoji: '💺' },
    { id: 'vote',         label: 'Vote',        emoji: '🗳️' },
    { id: 'concessions',  label: 'Concessions', emoji: '🍿' },
    { id: 'schedule',     label: 'Schedule',    emoji: '📅', staffOnly: true },
    { id: 'notifications',label: 'Activity',    emoji: '🔔', staffOnly: true },
  ];
  const TABS = ALL_TABS.filter((t) => currentUser || !t.staffOnly);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-700 to-red-900 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-3xl">🎬</span>
            <div className="min-w-0">
              <div className="font-bold leading-tight truncate">R&R Movie Theater</div>
              <div className="text-xs text-amber-200 leading-tight truncate">
                {currentUser
                  ? `${currentUser.emoji} ${currentUser.name} · ${currentUser.roleLabel}`
                  : '🍿 Now playing!'}
              </div>
            </div>
          </div>
          {currentUser ? (
            <button
              onClick={() => { setCurrentUser(null); setMode('public'); setView('home'); }}
              className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white px-3 py-2 rounded-lg text-sm font-semibold min-h-[40px] whitespace-nowrap"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={() => setMode('staff')}
              className="bg-red-950/70 hover:bg-black active:bg-black text-amber-200 hover:text-amber-100 px-3 py-2 rounded-lg text-xs font-semibold min-h-[36px] border border-amber-300/40 whitespace-nowrap"
              title="Staff login"
            >
              🔑 Staff
            </button>
          )}
        </div>

        {/* Tabs */}
        <nav className="bg-red-950/80 overflow-x-auto">
          <div className="max-w-5xl mx-auto flex gap-1.5 p-1.5">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setView(t.id)}
                className={`flex-1 min-w-[88px] px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors min-h-[44px] ${
                  view === t.id
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-red-900/40 text-amber-100 hover:bg-red-800 active:bg-red-700'
                }`}
              >
                <span className="mr-1">{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {view === 'home' && NowPlayingView()}
        {view === 'seats' && SeatsView()}
        {view === 'vote' && VoteView()}
        {view === 'concessions' && ConcessionsView()}
        {view === 'schedule' && ScheduleView()}
        {view === 'notifications' && NotificationsView()}
      </main>

      {/* Pick-seats modal */}
      {seatPickerShowId && schedule[seatPickerShowId] && PickSeatsModal()}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl z-50 font-semibold">
          {toast}
        </div>
      )}
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════════
     VIEWS (closures over state)
     ═══════════════════════════════════════════════════════════════════════ */

  function NowPlayingView() {
    const sellableShowsByMovie = {};
    todayShows.forEach((s) => {
      if (s.status === SHOW_STATUS.CANCELLED) return;
      if (!sellableShowsByMovie[s.movieId]) {
        const m = MOVIES.find((m) => m.id === s.movieId) || { title: s.title, emoji: s.emoji, duration: s.duration };
        sellableShowsByMovie[s.movieId] = { ...m, id: s.movieId, shows: [] };
      }
      sellableShowsByMovie[s.movieId].shows.push(s);
    });
    Object.values(sellableShowsByMovie).forEach((m) => m.shows.sort((a, b) => a.startMinutes - b.startMinutes));
    const movieList = Object.values(sellableShowsByMovie).sort((a, b) => (a.title || '').localeCompare(b.title || ''));

    return (
      <div className="space-y-4">
        {/* Notification opt-in banner */}
        {notifPermission === 'default' && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-center gap-3 shadow-md">
            <span className="text-3xl">🔔</span>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-800">Get notified!</div>
              <div className="text-sm text-gray-600">
                {currentUser
                  ? `We'll alert you about new tickets and ${currentUser.roleLabel} tasks.`
                  : "We'll let you know when your show starts or your snacks are ready."}
              </div>
            </div>
            <button onClick={requestNotifPermission} className="btn-red px-3 py-2 rounded-xl font-semibold whitespace-nowrap min-h-[44px]">
              Enable
            </button>
          </div>
        )}

        {/* My Tickets */}
        {myTickets.length > 0 && (
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 shadow-md">
            <h3 className="font-bold text-emerald-900 mb-3">🎟️ Your Tickets ({myTickets.length})</h3>
            <div className="space-y-2">
              {myTickets.map((t) => <MyTicketCard key={`${t.showId}:${t.seatId}`} ticket={t} />)}
            </div>
          </div>
        )}

        {/* Heading + active show banner */}
        <div className="flex items-end justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-red-900">🎬 Now Playing</h1>
            <p className="text-amber-800 text-sm">Today's showtimes</p>
          </div>
          {can('manager') && todayShows.length > 0 && (
            <button onClick={seedTodaysSchedule} className="text-xs text-gray-500 hover:text-gray-700 underline">
              ↻ Regenerate
            </button>
          )}
        </div>

        {activeShow && (
          <div className="bg-purple-100 border-2 border-purple-400 rounded-2xl p-4 shadow-md">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{activeShow.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs uppercase tracking-wider text-purple-700 font-bold">🎬 Now Playing</div>
                <div className="font-bold text-purple-900">{activeShow.title}</div>
                <div className="text-xs text-purple-700">{activeShow.startTime} · {activeShow.duration} min</div>
              </div>
            </div>
          </div>
        )}

        {/* Movies */}
        {movieList.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-md">
            <div className="text-5xl mb-2">🎞️</div>
            <div className="font-bold text-gray-800">No showings yet today</div>
            {can('manager') ? (
              <button onClick={seedTodaysSchedule} className="btn-red mt-3 px-4 py-2 rounded-xl font-semibold min-h-[44px]">
                🎬 Generate Today's Schedule
              </button>
            ) : (
              <div className="text-sm text-gray-500 mt-1">Ask the manager to schedule some shows!</div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {movieList.map((m) => <MovieCard key={m.id} movie={m} />)}
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button onClick={() => setView('vote')} className="btn-purple px-3 py-3 rounded-xl font-semibold min-h-[48px]">
            🗳️ Vote
          </button>
          <button onClick={() => setView('concessions')} className="btn-gold px-3 py-3 rounded-xl font-semibold min-h-[48px]">
            🍿 Snacks
          </button>
          <button onClick={() => setView('seats')} className="btn-red px-3 py-3 rounded-xl font-semibold min-h-[48px]">
            💺 Seats
          </button>
        </div>
      </div>
    );
  }

  function MovieCard({ movie }) {
    return (
      <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-4">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-5xl">{movie.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-xl text-gray-800">{movie.title}</div>
            <div className="text-sm text-gray-500">{movie.duration} min</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {movie.shows.map((s) => <ShowtimeChip key={s.id} show={s} />)}
        </div>
      </div>
    );
  }

  function ShowtimeChip({ show }) {
    const seats = Object.values(show.seats || {});
    const total = SEATS.length;
    const avail = seats.filter((x) => x?.status === SEAT_STATUS.AVAILABLE).length;
    const isStarted = show.status === SHOW_STATUS.STARTED;
    const isEnded = show.status === SHOW_STATUS.ENDED;
    const isSoldOut = avail === 0 && !isEnded && !isStarted;
    const disabled = isEnded;

    let cls = 'bg-amber-100 border-amber-400 text-amber-900 hover:bg-amber-200 active:bg-amber-300';
    if (isStarted) cls = 'bg-purple-100 border-purple-500 text-purple-700 ring-2 ring-purple-300';
    else if (isEnded) cls = 'bg-gray-100 border-gray-300 text-gray-400 line-through cursor-not-allowed';
    else if (isSoldOut) cls = 'bg-red-100 border-red-400 text-red-700 line-through';

    return (
      <button
        onClick={() => !disabled && openSeatPicker(show.id)}
        disabled={disabled}
        className={`px-3 py-2 rounded-xl font-bold border-2 min-h-[58px] min-w-[80px] flex flex-col items-center justify-center ${cls}`}
      >
        <div className="text-base leading-tight">{show.startTime}</div>
        <div className="text-[9px] opacity-80 leading-tight mt-0.5">
          {isStarted ? '🎬 Now Playing' :
            isEnded ? 'Ended' :
            isSoldOut ? 'Sold Out · Walk Up' :
            `${avail}/${total} left`}
        </div>
      </button>
    );
  }

  function MyTicketCard({ ticket }) {
    const { showId, seatId, show, seat } = ticket;
    const isSeated = seat.status === SEAT_STATUS.SEATED;
    const showEnded = show.status === SHOW_STATUS.ENDED || show.status === SHOW_STATUS.CANCELLED;
    const seatType = SEATS.find((s) => s.id === seatId);
    const typeInfo = SEAT_TYPE_INFO[seatType?.type] || { emoji: '💺', label: 'Seat' };

    return (
      <div className="bg-white rounded-xl p-3 border-2 border-emerald-200">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{show.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-gray-800 truncate">{show.title}</div>
            <div className="text-xs text-gray-600">🕐 {show.startTime} · {typeInfo.emoji} Seat {seatId}</div>
          </div>
          {isSeated ? (
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-lg text-xs font-bold whitespace-nowrap">✅ Seated</span>
          ) : !showEnded ? (
            <button onClick={() => takeSeat(showId, seatId)} className="btn-red px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap">
              🪑 Take Seat
            </button>
          ) : null}
        </div>
        <div className="text-xs text-gray-500 mt-1">{friendlyTimingHint(show, seat.status)}</div>
      </div>
    );
  }

  /* ─── Seats view ─── */

  function SeatsView() {
    if (todayShows.length === 0) {
      return (
        <div className="bg-white rounded-2xl p-6 text-center shadow-md">
          <div className="text-5xl mb-2">🎞️</div>
          <div className="font-bold">No shows scheduled today</div>
          {can('manager') && (
            <button onClick={seedTodaysSchedule} className="btn-red mt-3 px-4 py-2 rounded-xl font-semibold">
              🎬 Generate Today's Schedule
            </button>
          )}
        </div>
      );
    }

    const targetShowId =
      seatsViewShowId && schedule[seatsViewShowId]
        ? seatsViewShowId
        : (activeShow?.id || todayShows.find((s) => s.status === SHOW_STATUS.SELLING)?.id || todayShows[0].id);
    const show = schedule[targetShowId] ? { id: targetShowId, ...schedule[targetShowId] } : null;
    if (!show) return null;

    const seatList = SEATS.map((s) => ({ ...s, ...((show.seats || {})[s.id] || { status: SEAT_STATUS.AVAILABLE }) }));
    const seat1A = seatList.find((s) => s.id === '1A');
    const seat1B = seatList.find((s) => s.id === '1B');
    const recliners = seatList.filter((s) => s.type === 'recliner');
    const couch = seatList.find((s) => s.type === 'couch');

    return (
      <div className="space-y-4">
        {/* Show selector */}
        <div className="bg-white rounded-2xl shadow-md p-3">
          <label className="label mb-2">Show</label>
          <select
            value={targetShowId}
            onChange={(e) => setSeatsViewShowId(e.target.value)}
            className="input"
          >
            {todayShows.map((s) => (
              <option key={s.id} value={s.id}>
                {s.emoji} {s.title} · {s.startTime}
                {s.status === SHOW_STATUS.STARTED ? ' · NOW PLAYING' :
                  s.status === SHOW_STATUS.ENDED ? ' · ENDED' :
                  s.status === SHOW_STATUS.CANCELLED ? ' · CANCELLED' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Show summary */}
        <div className={`rounded-2xl shadow-md p-4 border-2 ${SHOW_INFO[show.status]?.color || 'border-gray-200 bg-white'}`}>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{show.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-lg truncate">{show.title}</div>
              <div className="text-xs">🕐 {show.startTime} · {show.duration} min</div>
            </div>
            <div className="text-xs font-semibold whitespace-nowrap">{SHOW_INFO[show.status]?.emoji} {SHOW_INFO[show.status]?.label}</div>
          </div>
          {show.status === SHOW_STATUS.SELLING && (
            <button onClick={() => openSeatPicker(show.id)} className="btn-red w-full mt-3 px-4 py-2 rounded-xl font-semibold min-h-[44px]">
              🎟️ Buy Tickets
            </button>
          )}
        </div>

        {/* Screen */}
        <div className="bg-gradient-to-b from-gray-300 to-gray-100 rounded-t-3xl py-4 text-center text-gray-700 font-bold tracking-widest shadow-inner">
          🎬 SCREEN 🎬
        </div>

        {/* Theater map */}
        <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 space-y-6">
          <div>
            <div className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-2 text-center">
              Row 1 · Bean Bags 🫘
            </div>
            <div className="bg-gradient-to-b from-amber-100 to-amber-200 border-2 border-amber-300 rounded-xl py-1.5 text-center text-[11px] text-amber-800 font-semibold tracking-wider mb-2">
              🎯 Shuffleboard Table (behind)
            </div>
            <div className="bg-rose-50 border-2 border-dashed border-rose-200 rounded-2xl p-3 flex items-end justify-center gap-3 sm:gap-6">
              <SeatTile seat={seat1B} showId={show.id} />
              <SeatTile seat={seat1A} showId={show.id} />
            </div>
            <div className="text-[10px] text-gray-400 text-center mt-1">1B (left) · 1A (right) — pink bean bags on the carpet</div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-2 text-center">
              Row 2 · Living Room 🛋️
            </div>
            <div className="flex flex-wrap justify-center items-end gap-3">
              {recliners.map((s) => <SeatTile key={s.id} seat={s} showId={show.id} />)}
              {couch && (
                <div className="flex flex-col items-center">
                  <div className="text-[10px] text-gray-400 mb-1">— Couch —</div>
                  <SeatTile seat={couch} showId={show.id} />
                </div>
              )}
            </div>
            <div className="text-[10px] text-gray-400 text-center mt-2">2A & 2B = pink recliners · 2C = white couch</div>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-2xl shadow-md p-4">
          <div className="flex flex-wrap gap-3 justify-center text-sm">
            {Object.entries(SEAT_INFO).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-full ${v.dot}`}></span>
                <span className="text-gray-700">{v.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function SeatTile({ seat, showId }) {
    if (!seat) return null;
    const info = SEAT_INFO[seat.status] || SEAT_INFO.available;
    const typeInfo = SEAT_TYPE_INFO[seat.type] || { emoji: '💺', label: 'Seat' };
    const onTap = () => {
      if (seat.status === SEAT_STATUS.AVAILABLE) {
        // Both staff and public can buy via the picker
        openSeatPicker(showId);
        // Pre-select this seat
        setTimeout(() => setSeatPickerSelected([seat.id]), 0);
      } else if (seat.status === SEAT_STATUS.SOLD && can('ticket-booth')) {
        if (confirm(`Refund seat ${seat.id} (${seat.customerName})?`)) refundSeatAction(showId, seat.id);
      } else if (seat.status === SEAT_STATUS.SOLD && !currentUser && (seat.customerName || '').trim().toLowerCase() === myNameLower && myNameLower) {
        // Customer tapping their own reserved seat → take it
        takeSeat(showId, seat.id);
      } else if (seat.status === SEAT_STATUS.DIRTY && can('usher')) {
        cleanSeatAction(showId, seat.id);
      } else if (seat.status === SEAT_STATUS.BROKEN && can('usher', 'manager')) {
        toggleBrokenAction(showId, seat.id);
      } else if (!currentUser) {
        if (seat.status === SEAT_STATUS.SOLD) {
          showToast(`${seat.id} is taken${seat.customerName ? ` by ${seat.customerName}` : ''}`);
        } else if (seat.status === SEAT_STATUS.SEATED) {
          showToast(`${seat.id} is occupied`);
        }
      }
    };
    const longPress = useRef(null);
    const onPressStart = () => {
      if (!can('manager', 'usher')) return;
      longPress.current = setTimeout(() => toggleBrokenAction(showId, seat.id), 700);
    };
    const onPressEnd = () => clearTimeout(longPress.current);

    return (
      <button
        onClick={onTap}
        onPointerDown={onPressStart}
        onPointerUp={onPressEnd}
        onPointerLeave={onPressEnd}
        title={seat.label || seat.id}
        className={`flex flex-col items-center justify-center w-24 min-h-[120px] rounded-xl border-2 ${info.color} font-bold transition-all active:scale-95 px-1 py-2`}
      >
        <span className="text-3xl leading-none mb-1">{typeInfo.emoji}</span>
        <span className="text-xl leading-tight">{seat.id}</span>
        <span className="text-[10px] uppercase tracking-wide opacity-70 leading-tight">{typeInfo.label}</span>
        {seat.customerName ? (
          <span className="text-[10px] truncate max-w-full mt-1 leading-tight">🎟️ {seat.customerName}</span>
        ) : (
          <span className="text-[10px] mt-1 leading-tight opacity-80">{info.label}</span>
        )}
      </button>
    );
  }

  /* ─── Pick-seats modal ─── */

  function PickSeatsModal() {
    const show = schedule[seatPickerShowId];
    if (!show) return null;
    const ticketPrice = show.ticketPrice || TICKET_PRICE;
    const total = seatPickerSelected.length * ticketPrice;
    const showSeatsList = SEATS.map((s) => ({ ...s, ...((show.seats || {})[s.id] || { status: SEAT_STATUS.AVAILABLE }) }));
    const seat1A = showSeatsList.find((s) => s.id === '1A');
    const seat1B = showSeatsList.find((s) => s.id === '1B');
    const recliners = showSeatsList.filter((s) => s.type === 'recliner');
    const couch = showSeatsList.find((s) => s.type === 'couch');

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-3 z-50" onClick={closeSeatPicker}>
        <div className="bg-white rounded-2xl shadow-2xl p-5 max-w-md w-full max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start gap-3 mb-3">
            <span className="text-4xl">{show.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-xl text-gray-800 truncate">{show.title}</div>
              <div className="text-sm text-gray-600">🕐 {show.startTime} · {show.duration} min</div>
            </div>
            <button onClick={closeSeatPicker} className="text-gray-400 hover:text-gray-600 text-3xl leading-none w-8 h-8">×</button>
          </div>

          <p className="text-sm text-gray-600 mb-3">Tap available seats — ${ticketPrice} each</p>

          {/* Mini screen */}
          <div className="bg-gradient-to-b from-gray-300 to-gray-100 rounded-t-xl py-2 text-center text-gray-600 text-xs font-bold tracking-wider mb-3">
            🎬 SCREEN 🎬
          </div>

          {/* Bean bags row */}
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-2 flex items-end justify-center gap-3 mb-2">
            <PickerSeatTile seat={seat1B} />
            <PickerSeatTile seat={seat1A} />
          </div>
          {/* Living room row */}
          <div className="flex items-end justify-center gap-2 mb-3 flex-wrap">
            {recliners.map((s) => <PickerSeatTile key={s.id} seat={s} />)}
            {couch && <PickerSeatTile seat={couch} />}
          </div>

          {seatPickerSelected.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3 mb-3">
              <div className="flex justify-between font-bold text-gray-800">
                <span>Selected: {seatPickerSelected.join(', ')}</span>
                <span className="text-red-600">${total}</span>
              </div>
            </div>
          )}

          <label className="label">Your name</label>
          <input
            value={seatPickerName}
            onChange={(e) => setSeatPickerName(e.target.value)}
            placeholder="Who's buying?"
            className="input mb-3"
          />

          <div className="flex gap-2">
            <button onClick={closeSeatPicker} className="btn-gray flex-1 px-4 py-3 rounded-xl font-semibold min-h-[48px]">Cancel</button>
            <button
              onClick={confirmSeatPicker}
              disabled={seatPickerSelected.length === 0 || !seatPickerName.trim()}
              className="btn-red flex-1 px-4 py-3 rounded-xl font-semibold min-h-[48px] disabled:opacity-50"
            >
              {seatPickerSelected.length > 0 ? `Buy ${seatPickerSelected.length} · $${total}` : 'Pick a seat'}
            </button>
          </div>

          <p className="text-[10px] text-gray-500 mt-3 text-center">
            🚪 Doors open 30 min before showtime — come back to "Now Playing" to take your seat.
          </p>
        </div>
      </div>
    );
  }

  function PickerSeatTile({ seat }) {
    if (!seat) return null;
    const typeInfo = SEAT_TYPE_INFO[seat.type] || { emoji: '💺', label: 'Seat' };
    const isAvailable = seat.status === SEAT_STATUS.AVAILABLE;
    const isSelected = seatPickerSelected.includes(seat.id);

    let cls = 'bg-emerald-100 border-emerald-300 text-emerald-800';
    if (isSelected) cls = 'bg-red-200 border-red-500 text-red-900 ring-2 ring-red-400';
    else if (seat.status === SEAT_STATUS.SOLD) cls = 'bg-amber-100 border-amber-300 text-amber-800';
    else if (seat.status === SEAT_STATUS.SEATED) cls = 'bg-purple-100 border-purple-300 text-purple-800';
    else if (seat.status === SEAT_STATUS.DIRTY) cls = 'bg-orange-100 border-orange-300 text-orange-800';
    else if (seat.status === SEAT_STATUS.BROKEN) cls = 'bg-red-100 border-red-300 text-red-800';

    return (
      <button
        onClick={() => isAvailable && toggleSeatPickerSelection(seat.id)}
        disabled={!isAvailable}
        className={`flex flex-col items-center justify-center w-20 min-h-[88px] rounded-xl border-2 font-bold p-1 ${cls} ${!isAvailable ? 'cursor-not-allowed opacity-70' : 'active:scale-95'}`}
      >
        <span className="text-2xl leading-none">{typeInfo.emoji}</span>
        <span className="text-base leading-tight mt-0.5">{seat.id}</span>
        <span className="text-[8px] uppercase opacity-70 leading-tight">{typeInfo.label}</span>
      </button>
    );
  }

  /* ─── Concessions view (unchanged data flow) ─── */

  function ConcessionsView() {
    const visibleItems = CONCESSION_ITEMS.filter((it) => it.cat === menuCat);
    const activeOrders = orders.filter((o) => o.status !== 'DELIVERED');
    const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED');

    // For "deliver to seat" dropdown, look at SOLD or SEATED across all of today's shows
    const deliveryOptions = [];
    todayShows.forEach((s) => {
      if (s.status === SHOW_STATUS.ENDED || s.status === SHOW_STATUS.CANCELLED) return;
      Object.entries(s.seats || {}).forEach(([seatId, seat]) => {
        if (seat.status === SEAT_STATUS.SOLD || seat.status === SEAT_STATUS.SEATED) {
          deliveryOptions.push({ value: `${s.startTime}|${seatId}`, label: `${seatId} · ${seat.customerName} · ${s.title} ${s.startTime}` });
        }
      });
    });

    return (
      <div className="space-y-4">
        {/* Category tabs */}
        <div className="bg-white rounded-2xl shadow-md p-2 flex gap-2 overflow-x-auto">
          {CONCESSION_CATS.map((c) => (
            <button
              key={c.id}
              onClick={() => setMenuCat(c.id)}
              className={`flex-1 min-w-[80px] px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap min-h-[44px] ${
                menuCat === c.id ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-1">{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>

        {/* Menu items */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {visibleItems.map((it) => (
            <button
              key={it.id}
              onClick={() => addToCart(it)}
              className="bg-white rounded-xl shadow-md p-3 hover:shadow-lg active:scale-95 transition-all text-center min-h-[120px] flex flex-col items-center justify-center"
            >
              <span className="text-4xl mb-1">{it.emoji}</span>
              <div className="font-bold text-gray-800 text-sm">{it.name}</div>
              <div className="text-red-600 font-bold mt-1">${it.price}</div>
            </button>
          ))}
        </div>

        {/* Cart */}
        {cart.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-4 border-2 border-amber-300">
            <h3 className="font-bold text-gray-800 mb-3">🛒 Order Cart</h3>
            <div className="space-y-2 mb-3">
              {cart.map((x) => (
                <div key={x.id} className="flex items-center gap-2">
                  <span className="text-2xl">{x.emoji}</span>
                  <span className="flex-1 text-sm">{x.name}</span>
                  <button onClick={() => removeFromCart(x.id)} className="btn-gray w-8 h-8 rounded-full font-bold">−</button>
                  <span className="font-bold w-6 text-center">{x.qty}</span>
                  <button onClick={() => addToCart(x)} className="btn-red w-8 h-8 rounded-full font-bold">+</button>
                  <span className="font-semibold text-gray-700 w-14 text-right">${x.price * x.qty}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-red-600">${cartTotal}</span>
              </div>
              <input
                value={orderCustomer}
                onChange={(e) => setOrderCustomer(e.target.value)}
                placeholder="Customer name"
                className="input"
              />
              <select value={orderSeat} onChange={(e) => setOrderSeat(e.target.value)} className="input">
                <option value="">Pickup at counter</option>
                {deliveryOptions.map((o) => (
                  <option key={o.value} value={o.value.split('|')[1]}>{o.label}</option>
                ))}
              </select>
              <button
                onClick={submitOrder}
                disabled={!orderCustomer.trim()}
                className="btn-red w-full px-4 py-3 rounded-xl font-semibold min-h-[48px] disabled:opacity-50"
              >
                Place Order — ${cartTotal}
              </button>
            </div>
          </div>
        )}

        {activeOrders.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-4">
            <h3 className="font-bold text-gray-800 mb-3">Active Orders ({activeOrders.length})</h3>
            <div className="space-y-2">
              {activeOrders.map((o) => <OrderCard key={o.id} order={o} />)}
            </div>
          </div>
        )}

        {deliveredOrders.length > 0 && (
          <details className="bg-white rounded-2xl shadow-md p-4">
            <summary className="font-bold text-gray-800 cursor-pointer">Delivered ({deliveredOrders.length})</summary>
            <div className="space-y-2 mt-3">
              {deliveredOrders.slice(-10).reverse().map((o) => <OrderCard key={o.id} order={o} />)}
            </div>
          </details>
        )}
      </div>
    );
  }

  function OrderCard({ order }) {
    const info = ORDER_STATUS[order.status] || ORDER_STATUS.PENDING;
    const itemSummary = (order.items || []).map((i) => `${i.qty}× ${i.emoji}`).join(' ');
    return (
      <div className="border-2 border-gray-200 rounded-xl p-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="font-bold text-gray-800">{order.customerName}</div>
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${info.color}`}>
            <span>{info.emoji}</span><span>{info.label}</span>
          </div>
        </div>
        <div className="text-sm text-gray-600 mb-1">{itemSummary || '—'}</div>
        <div className="text-sm text-gray-500 mb-2">
          {order.seat ? `Deliver to seat ${order.seat}` : 'Pickup at counter'} · ${order.total}
        </div>
        {can('concessions', 'usher') && (
          <div className="flex flex-wrap gap-2">
            {order.status === 'PENDING' && (
              <button onClick={() => setOrderStatus(order.id, 'PREPARING')} className="btn-gold px-3 py-1.5 rounded-lg text-sm font-semibold min-h-[36px]">
                Start Preparing
              </button>
            )}
            {order.status === 'PREPARING' && (
              <button onClick={() => setOrderStatus(order.id, 'READY')} className="btn-green px-3 py-1.5 rounded-lg text-sm font-semibold min-h-[36px]">
                Mark Ready
              </button>
            )}
            {order.status === 'READY' && (
              <button onClick={() => setOrderStatus(order.id, 'DELIVERED')} className="btn-blue px-3 py-1.5 rounded-lg text-sm font-semibold min-h-[36px]">
                Mark Delivered
              </button>
            )}
            {can('manager') && (
              <button onClick={() => deleteOrder(order.id)} className="btn-gray px-3 py-1.5 rounded-lg text-sm font-semibold min-h-[36px]">
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ─── Schedule view (manager / usher) ─── */

  function ScheduleView() {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl shadow-md p-4">
          <h3 className="font-bold text-gray-800 mb-3">📅 Today's Schedule</h3>
          <div className="flex flex-wrap gap-2">
            <button onClick={seedTodaysSchedule} className="btn-red px-3 py-2 rounded-xl text-sm font-semibold min-h-[40px]">
              🎬 Generate Default
            </button>
            <button onClick={clearTodaysSchedule} className="btn-gray px-3 py-2 rounded-xl text-sm font-semibold min-h-[40px]">
              🗑️ Clear All
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-4">
          <h3 className="font-bold text-gray-800 mb-3">➕ Add Showing</h3>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <select value={addMovieId} onChange={(e) => setAddMovieId(e.target.value)} className="input">
              {MOVIES.map((m) => <option key={m.id} value={m.id}>{m.emoji} {m.title}</option>)}
            </select>
            <select value={addStartTime} onChange={(e) => setAddStartTime(e.target.value)} className="input">
              {SHOWTIMES.map((t) => <option key={t.label} value={t.label}>{t.label}</option>)}
            </select>
          </div>
          <button onClick={() => addShowing(addMovieId, addStartTime)} className="btn-red w-full px-4 py-2 rounded-xl font-semibold min-h-[44px]">
            + Add Showing
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-4">
          <h3 className="font-bold text-gray-800 mb-3">Showings ({todayShows.length})</h3>
          {todayShows.length === 0 ? (
            <div className="text-center text-gray-500 py-4">No showings yet — generate or add some!</div>
          ) : (
            <div className="space-y-2">
              {todayShows.map((s) => <ShowControlRow key={s.id} show={s} />)}
            </div>
          )}
        </div>
      </div>
    );
  }

  function ShowControlRow({ show }) {
    const seatVals = Object.values(show.seats || {});
    const sold = seatVals.filter((s) => s?.status === SEAT_STATUS.SOLD).length;
    const seated = seatVals.filter((s) => s?.status === SEAT_STATUS.SEATED).length;
    const dirty = seatVals.filter((s) => s?.status === SEAT_STATUS.DIRTY).length;

    return (
      <div className="border-2 border-gray-200 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-3xl">{show.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-gray-800 truncate">{show.title}</div>
            <div className="text-xs text-gray-500">
              🕐 {show.startTime} · {sold + seated}/5 sold
              {seated > 0 && ` · ${seated} seated`}
              {dirty > 0 && ` · ${dirty} dirty`}
            </div>
          </div>
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${SHOW_INFO[show.status]?.color || 'bg-gray-100'}`}>
            <span>{SHOW_INFO[show.status]?.emoji || '⚪'}</span>
            <span>{SHOW_INFO[show.status]?.label || show.status}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {show.status === SHOW_STATUS.SELLING && (
            <button onClick={() => startShowing(show.id)} className="btn-purple px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[36px]">
              🎬 Start
            </button>
          )}
          {show.status === SHOW_STATUS.STARTED && (
            <button onClick={() => endShowing(show.id)} className="btn-red px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[36px]">
              🎞️ End
            </button>
          )}
          {(show.status === SHOW_STATUS.SELLING || show.status === SHOW_STATUS.STARTED) && (
            <button onClick={() => cancelShowing(show.id)} className="btn-gray px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[36px]">
              Cancel
            </button>
          )}
          <button
            onClick={() => { setSeatsViewShowId(show.id); setView('seats'); }}
            className="btn-blue px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[36px]"
          >
            💺 Seats
          </button>
          {can('manager') && (
            <button onClick={() => removeShowing(show.id)} className="btn-gray px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[36px]">
              Delete
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ─── Vote view (unchanged behavior) ─── */

  function VoteView() {
    const myVoterKey = `${voteGroup}::${voteName || 'Anonymous'}`;
    const latestVotePerVoter = {};
    votes.forEach((v) => {
      const key = `${v.group}::${v.voter || 'Anonymous'}`;
      if (!latestVotePerVoter[key] || (v.createdAt || 0) > (latestVotePerVoter[key].createdAt || 0)) {
        latestVotePerVoter[key] = v;
      }
    });
    const tallyByMovie = {};
    Object.values(latestVotePerVoter).forEach((v) => {
      if (!poll || !poll.movieIds || poll.movieIds.includes(v.movieId)) {
        tallyByMovie[v.movieId] = (tallyByMovie[v.movieId] || 0) + 1;
      }
    });
    const totalVotes = Object.values(tallyByMovie).reduce((a, b) => a + b, 0);
    const myVote = latestVotePerVoter[myVoterKey]?.movieId || null;

    const currentGroup = groups.find((g) => g.name === voteGroup) || groups[0];
    const groupMembers = currentGroup?.members || [];

    const pollMovies = poll?.movieIds
      ? poll.movieIds.map((id) => MOVIES.find((m) => m.id === id)).filter(Boolean)
      : [];

    const handleAddGroup = () => {
      const name = prompt('New group name?');
      if (name?.trim()) {
        addGroup(name.trim());
        setVoteGroup(name.trim());
      }
    };
    const handleAddMember = () => {
      if (!currentGroup) { showToast('Pick a group first'); return; }
      const name = prompt(`Add a name to "${currentGroup.name}"?`);
      if (name?.trim()) addMember(currentGroup.id, name.trim());
    };

    const sortedPollMovies = pollMovies.slice().sort((a, b) => (tallyByMovie[b.id] || 0) - (tallyByMovie[a.id] || 0));
    const winnerCount = sortedPollMovies[0] ? (tallyByMovie[sortedPollMovies[0].id] || 0) : 0;

    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl shadow-md p-4">
          <h3 className="font-bold text-gray-800 mb-3">🗳️ Who's Voting?</h3>

          <label className="label">Your Group</label>
          <div className="flex gap-2 mb-3">
            <select value={voteGroup} onChange={(e) => { setVoteGroup(e.target.value); setVoteName(''); }} className="input flex-1">
              {groups.map((g) => <option key={g.id} value={g.name}>{g.name}</option>)}
              {groups.length === 0 && <option>Loading...</option>}
            </select>
            <button onClick={handleAddGroup} className="btn-gold px-3 py-2 rounded-xl font-semibold whitespace-nowrap min-h-[44px]">+ Group</button>
          </div>

          <label className="label">Your Name (optional)</label>
          <div className="flex gap-2">
            <select value={voteName} onChange={(e) => setVoteName(e.target.value)} className="input flex-1">
              <option value="">🎭 Anonymous</option>
              {groupMembers.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <button onClick={handleAddMember} className="btn-gold px-3 py-2 rounded-xl font-semibold whitespace-nowrap min-h-[44px]">+ Name</button>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Voting & buying as: <span className="font-semibold">{voteName || 'Anonymous'}</span> from <span className="font-semibold">{voteGroup}</span>
          </p>

          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
            <span className="text-2xl">🔔</span>
            <div className="flex-1 min-w-0 text-sm">
              {notifPermission === 'granted' ? (
                <span className="font-semibold text-emerald-700">Notifications on — we'll ping you about your tickets and orders!</span>
              ) : notifPermission === 'denied' ? (
                <span className="text-gray-500">Notifications blocked. Enable them in your browser settings.</span>
              ) : notifPermission === 'unsupported' ? (
                <span className="text-gray-500">Notifications not supported on this device.</span>
              ) : (
                <span className="text-gray-700">Get notified when your snacks are ready or show starts.</span>
              )}
            </div>
            {notifPermission === 'default' && (
              <button onClick={requestNotifPermission} className="btn-red px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap min-h-[40px]">Enable</button>
            )}
          </div>
        </div>

        {poll && poll.status === 'open' && (
          <div className="bg-white rounded-2xl shadow-md p-4">
            <h3 className="font-bold text-gray-800 mb-1">🍿 What should we watch?</h3>
            <p className="text-sm text-gray-500 mb-4">Tap to vote · {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} so far</p>
            <div className="space-y-2">
              {pollMovies.map((m) => {
                const count = tallyByMovie[m.id] || 0;
                const pct = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
                const isMyVote = myVote === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => castVote(m.id)}
                    className={`w-full text-left rounded-xl border-2 p-3 transition-all active:scale-[0.99] ${
                      isMyVote ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-gray-200 hover:border-red-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{m.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-800 truncate">{m.title}</div>
                        <div className="text-xs text-gray-500">{m.duration} min</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600 text-lg leading-none">{count}</div>
                        <div className="text-xs text-gray-500">{pct}%</div>
                      </div>
                    </div>
                    <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    {isMyVote && <div className="text-xs text-red-600 font-semibold mt-1">✓ Your vote</div>}
                  </button>
                );
              })}
            </div>
            {can('manager') && (
              <div className="flex gap-2 mt-4">
                <button onClick={closePoll} className="btn-gold flex-1 px-4 py-3 rounded-xl font-semibold min-h-[48px]">🛑 Close Voting</button>
                <button onClick={clearPoll} className="btn-gray px-4 py-3 rounded-xl font-semibold min-h-[48px]">Cancel</button>
              </div>
            )}
          </div>
        )}

        {poll && poll.status === 'closed' && (
          <div className="bg-white rounded-2xl shadow-md p-4">
            <h3 className="font-bold text-gray-800 mb-1">📊 Voting Results</h3>
            <p className="text-sm text-gray-500 mb-4">{totalVotes} total {totalVotes === 1 ? 'vote' : 'votes'}</p>
            <div className="space-y-2">
              {sortedPollMovies.map((m) => {
                const count = tallyByMovie[m.id] || 0;
                const isWinner = count === winnerCount && count > 0;
                return (
                  <div key={m.id} className={`rounded-xl border-2 p-3 ${isWinner ? 'border-amber-500 bg-amber-50' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{m.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-800 truncate">{isWinner && '🏆 '}{m.title}</div>
                      </div>
                      <div className="font-bold text-red-600 text-lg">{count}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            {can('manager') && (
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <button
                  onClick={() => {
                    const winner = sortedPollMovies[0];
                    if (winner && winnerCount > 0) {
                      setAddMovieId(winner.id);
                      setView('schedule');
                      showToast(`Winner: ${winner.title} — pick a time!`);
                    } else {
                      showToast('No votes yet!');
                    }
                  }}
                  className="btn-red flex-1 px-4 py-3 rounded-xl font-semibold min-h-[48px]"
                >
                  🎬 Schedule Winner
                </button>
                <button onClick={clearPoll} className="btn-gray flex-1 px-4 py-3 rounded-xl font-semibold min-h-[48px]">Clear & Start Over</button>
              </div>
            )}
          </div>
        )}

        {!poll && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            {can('manager') ? (
              <>
                <h3 className="font-bold text-gray-800 mb-2">🗳️ Start a New Poll</h3>
                <p className="text-sm text-gray-500 mb-3">Pick the movies people can vote on:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4 max-h-96 overflow-y-auto">
                  {MOVIES.map((m) => {
                    const checked = pollSelection.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        onClick={() => setPollSelection((p) => (checked ? p.filter((x) => x !== m.id) : [...p, m.id]))}
                        className={`p-2 rounded-xl border-2 text-left transition-all ${
                          checked ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300'
                        }`}
                      >
                        <div className="text-2xl">{m.emoji}</div>
                        <div className="font-bold text-xs text-gray-800 truncate">{m.title}</div>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => startPoll(pollSelection)}
                  disabled={pollSelection.length < 2}
                  className="btn-red w-full px-4 py-3 rounded-xl font-bold min-h-[48px] disabled:opacity-50"
                >
                  🗳️ Start Poll ({pollSelection.length} {pollSelection.length === 1 ? 'movie' : 'movies'})
                </button>
                <p className="text-xs text-gray-500 mt-2">Need at least 2 movies to start a poll.</p>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="text-5xl mb-2">🗳️</div>
                <div className="font-bold text-gray-800">No poll yet</div>
                <div className="text-sm text-gray-500">Ask the manager to start one!</div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ─── Notifications view ─── */

  function NotificationsView() {
    const recent = notifications.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 80);
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl shadow-md p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800">🔔 Recent Activity</h3>
            {can('manager') && notifications.length > 0 && (
              <button onClick={clearAllNotifications} className="btn-gray px-3 py-1 rounded-lg text-xs font-semibold">Clear All</button>
            )}
          </div>
          {recent.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🌙</div>
              No activity yet — start selling tickets!
            </div>
          ) : (
            <div className="space-y-1.5">
              {recent.map((n) => (
                <div key={n.id} className="flex items-start gap-2 py-1.5 border-b border-gray-100 last:border-0">
                  <div className="flex-1 text-sm text-gray-700">{n.msg}</div>
                  <div className="text-xs text-gray-400 whitespace-nowrap">
                    {n.by ? `${n.by} · ` : ''}{n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
}
