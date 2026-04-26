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
  SOLD: 'sold',
  DIRTY: 'dirty',
  BROKEN: 'broken',
};

const SEAT_INFO = {
  [SEAT_STATUS.AVAILABLE]: { label: 'Available', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500', emoji: '💺' },
  [SEAT_STATUS.SOLD]:      { label: 'Sold',      color: 'bg-amber-100 text-amber-800 border-amber-300',   dot: 'bg-amber-500', emoji: '🎟️' },
  [SEAT_STATUS.DIRTY]:     { label: 'Needs Cleaning', color: 'bg-orange-100 text-orange-800 border-orange-300', dot: 'bg-orange-500', emoji: '🧹' },
  [SEAT_STATUS.BROKEN]:    { label: 'Broken',    color: 'bg-red-100 text-red-800 border-red-300',         dot: 'bg-red-500', emoji: '🔧' },
};

const SHOW_STATUS = {
  SELLING: 'selling',
  STARTED: 'started',
  ENDED: 'ended',
};

const SHOW_INFO = {
  [SHOW_STATUS.SELLING]: { label: 'Selling Tickets', color: 'bg-blue-100 text-blue-800 border-blue-300',   emoji: '🎟️' },
  [SHOW_STATUS.STARTED]: { label: 'Now Playing',     color: 'bg-purple-100 text-purple-800 border-purple-300', emoji: '🎬' },
  [SHOW_STATUS.ENDED]:   { label: 'Show Ended',      color: 'bg-gray-100 text-gray-800 border-gray-300',  emoji: '🎞️' },
};

const ROLES = [
  { id: 'manager',      label: 'Manager',      emoji: '👔', desc: 'Run the whole theater' },
  { id: 'ticket-booth', label: 'Ticket Booth', emoji: '🎟️', desc: 'Sell tickets and pick seats' },
  { id: 'concessions',  label: 'Concessions',  emoji: '🍿', desc: 'Snacks and drinks' },
  { id: 'usher',        label: 'Usher',        emoji: '🎬', desc: 'Start show, clean theater' },
];

const MOVIES = [
  { id: 'frozen',      title: 'Frozen',         emoji: '❄️', duration: 102 },
  { id: 'toy-story',   title: 'Toy Story',      emoji: '🧸', duration: 81 },
  { id: 'nemo',        title: 'Finding Nemo',   emoji: '🐠', duration: 100 },
  { id: 'lion-king',   title: 'The Lion King',  emoji: '🦁', duration: 88 },
  { id: 'moana',       title: 'Moana',          emoji: '🌊', duration: 107 },
  { id: 'encanto',     title: 'Encanto',        emoji: '🏠', duration: 102 },
  { id: 'inside-out',  title: 'Inside Out',     emoji: '😀', duration: 95 },
  { id: 'ratatouille', title: 'Ratatouille',    emoji: '🐭', duration: 111 },
  { id: 'coco',        title: 'Coco',           emoji: '💀', duration: 105 },
  { id: 'wall-e',      title: 'Wall-E',         emoji: '🤖', duration: 98 },
  { id: 'minions',     title: 'Minions',        emoji: '👶', duration: 90 },
  { id: 'shrek',       title: 'Shrek',          emoji: '🧌', duration: 90 },
  { id: 'last-song',   title: 'The Last Song',  emoji: '🎵', duration: 107 },
  { id: 'cruella',     title: 'Cruella',        emoji: '🐶', duration: 134 },
  { id: 'doubtfire',   title: 'Mrs. Doubtfire', emoji: '👵', duration: 125 },
  { id: 'miracles',    title: 'Miracles From Heaven', emoji: '✨', duration: 109 },
  { id: 'lilo-stitch', title: 'Lilo & Stitch',  emoji: '👽', duration: 85 },
  { id: 'hannah-montana', title: 'Hannah Montana', emoji: '🎤', duration: 102 },
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
  PENDING:   { label: 'New',       color: 'bg-blue-100 text-blue-800 border-blue-300',     emoji: '🆕' },
  PREPARING: { label: 'Preparing', color: 'bg-amber-100 text-amber-800 border-amber-300',  emoji: '👨‍🍳' },
  READY:     { label: 'Ready',     color: 'bg-emerald-100 text-emerald-800 border-emerald-300', emoji: '✅' },
  DELIVERED: { label: 'Delivered', color: 'bg-gray-100 text-gray-800 border-gray-300',     emoji: '📦' },
};

const TICKET_PRICE = 10;

const DEFAULT_STAFF = [
  { name: 'Ruth', pin: '1111', emoji: '👩', color: '#dc2626' },
  { name: 'Rose', pin: '2222', emoji: '👧', color: '#f59e0b' },
];

const blankSeats = () => {
  const s = {};
  SEATS.forEach((seat) => {
    s[seat.id] = { status: SEAT_STATUS.AVAILABLE, customerName: '', paid: 0 };
  });
  return s;
};

/* ═══════════════════════════════════════════════════════════════════════════
   APP
   ═══════════════════════════════════════════════════════════════════════════ */

export default function App() {
  // auth
  const [staff, setStaff] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginStep, setLoginStep] = useState('pick'); // pick | pin | role
  const [loginTarget, setLoginTarget] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // data
  const [seats, setSeats] = useState(blankSeats());
  const [currentShow, setCurrentShow] = useState(null);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showHistory, setShowHistory] = useState([]);
  const [groups, setGroups] = useState([]);
  const [poll, setPoll] = useState(null);
  const [votes, setVotes] = useState([]);

  // voter identity (persisted to localStorage so a kid stays "themselves" across reloads)
  const [voteGroup, setVoteGroup] = useState(() => {
    try { return localStorage.getItem('mt-voteGroup') || 'Godwin Group'; } catch { return 'Godwin Group'; }
  });
  const [voteName, setVoteName] = useState(() => {
    try { return localStorage.getItem('mt-voteName') || ''; } catch { return ''; }
  });
  useEffect(() => { try { localStorage.setItem('mt-voteGroup', voteGroup); } catch {} }, [voteGroup]);
  useEffect(() => { try { localStorage.setItem('mt-voteName', voteName); } catch {} }, [voteName]);

  // poll-creation form (manager only)
  const [pollSelection, setPollSelection] = useState([]);

  // ui
  const [view, setView] = useState('dashboard');
  const [toast, setToast] = useState(null);
  // 'public' = customer-facing (no login). 'staff' = login flow / signed in.
  const [mode, setMode] = useState('public');

  // If a public user is on a staff-only tab (e.g. after signing out), kick to Home
  useEffect(() => {
    if (!currentUser && (view === 'show' || view === 'notifications')) {
      setView('dashboard');
    }
  }, [currentUser, view]);

  // forms
  const [sellSeatId, setSellSeatId] = useState(null);
  const [sellName, setSellName] = useState('');
  const [scheduleMovieId, setScheduleMovieId] = useState(MOVIES[0].id);
  const [scheduleStartTime, setScheduleStartTime] = useState('7:00 PM');
  const [cart, setCart] = useState([]);
  const [orderCustomer, setOrderCustomer] = useState('');
  const [orderSeat, setOrderSeat] = useState('');
  const [menuCat, setMenuCat] = useState('popcorn');

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

    // staff: seed with defaults if empty
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

    // seats: seed if empty
    const seatsRef = ref(db, `${FB}/seats`);
    const usSeats = onValue(seatsRef, (snap) => {
      const val = snap.val();
      if (!val) {
        set(seatsRef, blankSeats());
      } else {
        setSeats(val);
      }
    });
    unsubs.push(() => usSeats());

    listen('currentShow', setCurrentShow, false);
    listen('orders', setOrders);
    listen('notifications', setNotifications);
    listen('showHistory', setShowHistory);
    listen('poll', setPoll, false);
    listen('votes', setVotes);

    // groups: seed with Godwin Group if empty
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
     ACTIONS
     ═══════════════════════════════════════════════════════════════════════ */

  const notify = (type, msg) => {
    if (!db) return;
    push(ref(db, `${FB}/notifications`), {
      type, msg, createdAt: Date.now(), by: currentUser?.name || 'Unknown',
    });
  };

  const seatList = SEATS.map((s) => ({ ...s, ...seats[s.id] }));

  const sellSeat = (seatId, customerName) => {
    if (!db || !customerName.trim()) return;
    if (!currentShow || currentShow.status !== SHOW_STATUS.SELLING) {
      showToast('Wait — no show is selling tickets right now');
      return;
    }
    update(ref(db, `${FB}/seats/${seatId}`), {
      status: SEAT_STATUS.SOLD,
      customerName: customerName.trim(),
      paid: TICKET_PRICE,
    });
    notify('ticket-sold', `🎟️ ${customerName.trim()} bought seat ${seatId}`);
    showToast(`Sold seat ${seatId} to ${customerName.trim()}!`);
    setSellSeatId(null);
    setSellName('');
  };

  const refundSeat = (seatId) => {
    if (!db) return;
    update(ref(db, `${FB}/seats/${seatId}`), {
      status: SEAT_STATUS.AVAILABLE,
      customerName: '',
      paid: 0,
    });
    notify('ticket-refund', `↩️ Seat ${seatId} refunded`);
    showToast(`Seat ${seatId} refunded`);
  };

  const cleanSeat = (seatId) => {
    if (!db) return;
    update(ref(db, `${FB}/seats/${seatId}`), {
      status: SEAT_STATUS.AVAILABLE,
      customerName: '',
      paid: 0,
    });
    notify('seat-clean', `🧹 Seat ${seatId} cleaned`);
    showToast(`Seat ${seatId} is sparkly clean!`);
  };

  const toggleBroken = (seatId) => {
    if (!db) return;
    const s = seats[seatId];
    const next = s.status === SEAT_STATUS.BROKEN ? SEAT_STATUS.AVAILABLE : SEAT_STATUS.BROKEN;
    update(ref(db, `${FB}/seats/${seatId}`), { status: next, customerName: '', paid: 0 });
    notify('seat-broken', next === SEAT_STATUS.BROKEN ? `🔧 Seat ${seatId} marked broken` : `✅ Seat ${seatId} fixed`);
  };

  const scheduleShow = () => {
    if (!db) return;
    const movie = MOVIES.find((m) => m.id === scheduleMovieId);
    if (!movie) return;

    // reset seats: only keep BROKEN; reset everything else to AVAILABLE
    const nextSeats = {};
    SEATS.forEach((s) => {
      const cur = seats[s.id];
      if (cur && cur.status === SEAT_STATUS.BROKEN) {
        nextSeats[s.id] = { status: SEAT_STATUS.BROKEN, customerName: '', paid: 0 };
      } else {
        nextSeats[s.id] = { status: SEAT_STATUS.AVAILABLE, customerName: '', paid: 0 };
      }
    });

    const show = {
      movieId: movie.id,
      title: movie.title,
      emoji: movie.emoji,
      duration: movie.duration,
      startTime: scheduleStartTime,
      status: SHOW_STATUS.SELLING,
      createdAt: Date.now(),
    };

    set(ref(db, `${FB}/seats`), nextSeats);
    set(ref(db, `${FB}/currentShow`), show);
    notify('show-scheduled', `🎬 ${movie.emoji} ${movie.title} at ${scheduleStartTime} — tickets on sale!`);
    showToast(`${movie.title} is now selling tickets!`);
  };

  const startShow = () => {
    if (!db || !currentShow) return;
    update(ref(db, `${FB}/currentShow`), { status: SHOW_STATUS.STARTED, startedAt: Date.now() });
    notify('show-started', `🎬 ${currentShow.emoji} ${currentShow.title} is now playing!`);
    showToast('🎬 Lights down — show started!');
  };

  const endShow = () => {
    if (!db || !currentShow) return;
    // sold seats become dirty
    const nextSeats = {};
    SEATS.forEach((s) => {
      const cur = seats[s.id];
      if (!cur) return;
      if (cur.status === SEAT_STATUS.SOLD) {
        nextSeats[s.id] = { status: SEAT_STATUS.DIRTY, customerName: '', paid: 0 };
      } else {
        nextSeats[s.id] = cur;
      }
    });
    set(ref(db, `${FB}/seats`), nextSeats);

    // archive show
    push(ref(db, `${FB}/showHistory`), { ...currentShow, endedAt: Date.now(), status: SHOW_STATUS.ENDED });
    set(ref(db, `${FB}/currentShow`), null);
    notify('show-ended', `🎞️ ${currentShow.title} ended — time to clean up!`);
    showToast('Show ended! Time to clean.');
  };

  const cancelShow = () => {
    if (!db || !currentShow) return;
    if (!confirm(`Cancel ${currentShow.title}? All sold tickets will be refunded.`)) return;
    const nextSeats = {};
    SEATS.forEach((s) => {
      const cur = seats[s.id];
      if (!cur) return;
      if (cur.status === SEAT_STATUS.BROKEN) {
        nextSeats[s.id] = { status: SEAT_STATUS.BROKEN, customerName: '', paid: 0 };
      } else {
        nextSeats[s.id] = { status: SEAT_STATUS.AVAILABLE, customerName: '', paid: 0 };
      }
    });
    set(ref(db, `${FB}/seats`), nextSeats);
    set(ref(db, `${FB}/currentShow`), null);
    notify('show-cancelled', `❌ ${currentShow.title} cancelled — tickets refunded`);
    showToast('Show cancelled');
  };

  const addToCart = (item) => {
    setCart((c) => {
      const found = c.find((x) => x.id === item.id);
      if (found) return c.map((x) => (x.id === item.id ? { ...x, qty: x.qty + 1 } : x));
      return [...c, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart((c) =>
      c
        .map((x) => (x.id === id ? { ...x, qty: x.qty - 1 } : x))
        .filter((x) => x.qty > 0),
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
      movieIds,
      status: 'open',
      createdAt: Date.now(),
      startedBy: currentUser?.name || '',
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
      group: voteGroup,
      voter: voteName || '',
      movieId,
      createdAt: Date.now(),
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
     LOGIN SCREEN
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

  // Fall back to DEFAULT_STAFF if Firebase hasn't synced yet (or writes are blocked
  // by db rules) so the login screen is always usable.
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
          <p className="text-amber-700 italic">Now showing!</p>
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
            <button
              onClick={exitToPublic}
              className="text-sm text-gray-500 hover:text-gray-700 active:text-gray-800 font-semibold min-h-[36px] px-3"
            >
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
    { id: 'dashboard',    label: 'Home',         emoji: '🏠' },
    { id: 'seats',        label: 'Seats',        emoji: '💺' },
    { id: 'vote',         label: 'Vote',         emoji: '🗳️' },
    { id: 'concessions',  label: 'Concessions',  emoji: '🍿' },
    { id: 'show',         label: 'Show Control', emoji: '🎬', staffOnly: true },
    { id: 'notifications',label: 'Activity',     emoji: '🔔', staffOnly: true },
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
              onClick={() => { setCurrentUser(null); setMode('public'); setView('dashboard'); }}
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
          <div className="max-w-5xl mx-auto flex">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setView(t.id)}
                className={`flex-1 min-w-[88px] px-3 py-3 text-sm font-semibold whitespace-nowrap transition-colors min-h-[48px] ${
                  view === t.id ? 'bg-amber-500 text-white' : 'text-amber-100 hover:bg-red-800'
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
        {view === 'dashboard' && <DashboardView />}
        {view === 'seats' && <SeatsView />}
        {view === 'vote' && <VoteView />}
        {view === 'concessions' && <ConcessionsView />}
        {view === 'show' && <ShowView />}
        {view === 'notifications' && <NotificationsView />}
      </main>

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

  function DashboardView() {
    const sold = seatList.filter((s) => s.status === SEAT_STATUS.SOLD).length;
    const available = seatList.filter((s) => s.status === SEAT_STATUS.AVAILABLE).length;
    const dirty = seatList.filter((s) => s.status === SEAT_STATUS.DIRTY).length;
    const broken = seatList.filter((s) => s.status === SEAT_STATUS.BROKEN).length;
    const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
    const preparingOrders = orders.filter((o) => o.status === 'PREPARING').length;
    const readyOrders = orders.filter((o) => o.status === 'READY').length;
    const totalRevenue = seatList.reduce((sum, s) => sum + (s.paid || 0), 0)
                       + orders.filter((o) => o.status !== 'DELETED').reduce((sum, o) => sum + (o.total || 0), 0);

    return (
      <div className="space-y-4">
        {/* Now showing card */}
        <div className="bg-white rounded-2xl shadow-md border-4 border-red-300 overflow-hidden">
          {currentShow ? (
            <div className="p-6">
              <div className="flex items-center gap-4 mb-3">
                <span className="text-6xl">{currentShow.emoji}</span>
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-wider text-red-600 font-bold">Now Showing</div>
                  <div className="text-2xl font-bold text-gray-800">{currentShow.title}</div>
                  <div className="text-gray-600">🕐 {currentShow.startTime} · {currentShow.duration} min</div>
                </div>
              </div>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border ${SHOW_INFO[currentShow.status].color}`}>
                <span>{SHOW_INFO[currentShow.status].emoji}</span>
                <span>{SHOW_INFO[currentShow.status].label}</span>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="text-5xl mb-2">🎞️</div>
              <div className="text-xl font-bold text-gray-800">No show right now</div>
              <div className="text-gray-600 mb-3">{can('manager', 'usher') ? 'Schedule the next show!' : 'Ask the manager to start one!'}</div>
              {can('manager', 'usher') && (
                <button onClick={() => setView('show')} className="btn-red px-5 py-2 rounded-xl font-semibold min-h-[44px]">
                  🎬 Schedule Show
                </button>
              )}
            </div>
          )}
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Available" value={available} emoji="💺" color="bg-emerald-50 border-emerald-300 text-emerald-800" />
          <StatCard label="Sold" value={sold} emoji="🎟️" color="bg-amber-50 border-amber-300 text-amber-800" />
          <StatCard label="Need Cleaning" value={dirty} emoji="🧹" color="bg-orange-50 border-orange-300 text-orange-800" />
          <StatCard label="Broken" value={broken} emoji="🔧" color="bg-red-50 border-red-300 text-red-800" />
          <StatCard label="New Orders" value={pendingOrders} emoji="🆕" color="bg-blue-50 border-blue-300 text-blue-800" />
          <StatCard label="Preparing" value={preparingOrders} emoji="👨‍🍳" color="bg-amber-50 border-amber-300 text-amber-800" />
          <StatCard label="Ready" value={readyOrders} emoji="✅" color="bg-emerald-50 border-emerald-300 text-emerald-800" />
          <StatCard label="Revenue" value={`$${totalRevenue}`} emoji="💰" color="bg-yellow-50 border-yellow-300 text-yellow-800" />
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl shadow-md p-4">
          <h3 className="font-bold text-gray-800 mb-3">{currentUser ? 'Quick Actions' : 'What you can do'}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {currentUser ? (
              <>
                <button onClick={() => setView('seats')} className="btn-red px-3 py-3 rounded-xl font-semibold min-h-[48px]">
                  🎟️ Sell Tickets
                </button>
                <button onClick={() => setView('concessions')} className="btn-gold px-3 py-3 rounded-xl font-semibold min-h-[48px]">
                  🍿 Take Order
                </button>
                {can('manager', 'usher') && (
                  <button onClick={() => setView('show')} className="btn-purple px-3 py-3 rounded-xl font-semibold min-h-[48px]">
                    🎬 Show Control
                  </button>
                )}
                <button onClick={() => setView('notifications')} className="btn-blue px-3 py-3 rounded-xl font-semibold min-h-[48px]">
                  🔔 Activity
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setView('vote')} className="btn-purple px-3 py-3 rounded-xl font-semibold min-h-[48px]">
                  🗳️ Vote on Movie
                </button>
                <button onClick={() => setView('concessions')} className="btn-gold px-3 py-3 rounded-xl font-semibold min-h-[48px]">
                  🍿 Order Snacks
                </button>
                <button onClick={() => setView('seats')} className="btn-red px-3 py-3 rounded-xl font-semibold min-h-[48px]">
                  💺 See Seats
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  function StatCard({ label, value, emoji, color }) {
    return (
      <div className={`rounded-xl border-2 p-3 ${color}`}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          <div>
            <div className="text-xs font-semibold opacity-80">{label}</div>
            <div className="text-2xl font-bold">{value}</div>
          </div>
        </div>
      </div>
    );
  }

  function SeatsView() {
    const seat1A = seatList.find((s) => s.id === '1A');
    const seat1B = seatList.find((s) => s.id === '1B');
    const recliners = seatList.filter((s) => s.type === 'recliner');
    const couch = seatList.find((s) => s.type === 'couch');

    return (
      <div className="space-y-4">
        {/* Screen */}
        <div className="bg-gradient-to-b from-gray-300 to-gray-100 rounded-t-3xl py-4 text-center text-gray-700 font-bold tracking-widest shadow-inner">
          🎬 SCREEN 🎬
        </div>

        {/* Theater map */}
        <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 space-y-6">
          {/* Row 1 — Bean Bags on the floor (in front of the shuffleboard) */}
          <div>
            <div className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-2 text-center">
              Row 1 · Bean Bags 🫘
            </div>
            {/* Shuffleboard backdrop */}
            <div className="bg-gradient-to-b from-amber-100 to-amber-200 border-2 border-amber-300 rounded-xl py-1.5 text-center text-[11px] text-amber-800 font-semibold tracking-wider mb-2">
              🎯 Shuffleboard Table (behind)
            </div>
            {/* Bean bags on the carpet */}
            <div className="bg-rose-50 border-2 border-dashed border-rose-200 rounded-2xl p-3 flex items-end justify-center gap-3 sm:gap-6">
              <SeatTile seat={seat1B} />
              <SeatTile seat={seat1A} />
            </div>
            <div className="text-[10px] text-gray-400 text-center mt-1">1B (left) · 1A (right) — pink bean bags on the carpet</div>
          </div>

          {/* Row 2 — Living Room */}
          <div>
            <div className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-2 text-center">
              Row 2 · Living Room 🛋️
            </div>
            <div className="flex flex-wrap justify-center items-end gap-3">
              {recliners.map((s) => <SeatTile key={s.id} seat={s} />)}
              {couch && (
                <div className="flex flex-col items-center">
                  <div className="text-[10px] text-gray-400 mb-1">— Couch —</div>
                  <SeatTile seat={couch} />
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

        {/* Sell modal */}
        {sellSeatId && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-40" onClick={() => { setSellSeatId(null); setSellName(''); }}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">Sell Seat {sellSeatId}</h3>
              <p className="text-gray-600 mb-4">${TICKET_PRICE} ticket</p>
              <label className="label">Customer name</label>
              <input
                autoFocus
                value={sellName}
                onChange={(e) => setSellName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sellSeat(sellSeatId, sellName)}
                placeholder="Who's buying?"
                className="input mb-4"
              />
              <div className="flex gap-2">
                <button onClick={() => { setSellSeatId(null); setSellName(''); }} className="btn-gray flex-1 px-4 py-3 rounded-xl font-semibold min-h-[48px]">
                  Cancel
                </button>
                <button onClick={() => sellSeat(sellSeatId, sellName)} disabled={!sellName.trim()} className="btn-red flex-1 px-4 py-3 rounded-xl font-semibold min-h-[48px] disabled:opacity-50">
                  Sell Ticket
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function SeatTile({ seat }) {
    if (!seat) return null;
    const info = SEAT_INFO[seat.status];
    const typeInfo = SEAT_TYPE_INFO[seat.type] || { emoji: '💺', label: 'Seat' };
    const onTap = () => {
      if (seat.status === SEAT_STATUS.AVAILABLE && can('ticket-booth')) {
        setSellSeatId(seat.id);
      } else if (seat.status === SEAT_STATUS.SOLD && can('ticket-booth')) {
        if (confirm(`Refund seat ${seat.id} (${seat.customerName})?`)) refundSeat(seat.id);
      } else if (seat.status === SEAT_STATUS.DIRTY && can('usher')) {
        cleanSeat(seat.id);
      } else if (seat.status === SEAT_STATUS.BROKEN && can('usher', 'manager')) {
        toggleBroken(seat.id);
      } else if (!currentUser) {
        if (seat.status === SEAT_STATUS.AVAILABLE) {
          showToast(`Ask the Ticket Booth to buy ${seat.id}! 🎟️`);
        } else if (seat.status === SEAT_STATUS.SOLD) {
          showToast(`${seat.id} is taken${seat.customerName ? ` by ${seat.customerName}` : ''} 🎟️`);
        }
      }
    };
    const longPress = useRef(null);
    const onPressStart = () => {
      if (!can('manager', 'usher')) return;
      longPress.current = setTimeout(() => toggleBroken(seat.id), 700);
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

  function ConcessionsView() {
    const visibleItems = CONCESSION_ITEMS.filter((it) => it.cat === menuCat);
    const activeOrders = orders.filter((o) => o.status !== 'DELIVERED');
    const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED');

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
              <input value={orderCustomer} onChange={(e) => setOrderCustomer(e.target.value)} placeholder="Customer name" className="input" />
              <select value={orderSeat} onChange={(e) => setOrderSeat(e.target.value)} className="input">
                <option value="">Pickup at counter</option>
                {seatList.filter((s) => s.status === SEAT_STATUS.SOLD).map((s) => (
                  <option key={s.id} value={s.id}>Deliver to {s.id} ({s.customerName})</option>
                ))}
              </select>
              <button onClick={submitOrder} disabled={!orderCustomer.trim()} className="btn-red w-full px-4 py-3 rounded-xl font-semibold min-h-[48px] disabled:opacity-50">
                Place Order — ${cartTotal}
              </button>
            </div>
          </div>
        )}

        {/* Active orders */}
        {activeOrders.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-4">
            <h3 className="font-bold text-gray-800 mb-3">Active Orders ({activeOrders.length})</h3>
            <div className="space-y-2">
              {activeOrders.map((o) => <OrderCard key={o.id} order={o} />)}
            </div>
          </div>
        )}

        {/* Recent delivered */}
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

  function ShowView() {
    const allClean = seatList.every((s) => s.status !== SEAT_STATUS.DIRTY);
    const noOneSeated = seatList.every((s) => s.status !== SEAT_STATUS.SOLD);

    return (
      <div className="space-y-4">
        {/* Current show controls */}
        {currentShow ? (
          <div className="bg-white rounded-2xl shadow-md border-4 border-purple-300 p-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-6xl">{currentShow.emoji}</span>
              <div className="flex-1">
                <div className="text-2xl font-bold text-gray-800">{currentShow.title}</div>
                <div className="text-gray-600">🕐 {currentShow.startTime} · {currentShow.duration} min</div>
                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border mt-1 ${SHOW_INFO[currentShow.status].color}`}>
                  <span>{SHOW_INFO[currentShow.status].emoji}</span><span>{SHOW_INFO[currentShow.status].label}</span>
                </div>
              </div>
            </div>
            {can('manager', 'usher') ? (
              <div className="flex flex-wrap gap-2">
                {currentShow.status === SHOW_STATUS.SELLING && (
                  <>
                    <button onClick={startShow} className="btn-purple flex-1 min-w-[140px] px-4 py-3 rounded-xl font-semibold min-h-[48px]">
                      🎬 Start Show
                    </button>
                    <button onClick={cancelShow} className="btn-gray flex-1 min-w-[140px] px-4 py-3 rounded-xl font-semibold min-h-[48px]">
                      Cancel
                    </button>
                  </>
                )}
                {currentShow.status === SHOW_STATUS.STARTED && (
                  <button onClick={endShow} className="btn-red w-full px-4 py-3 rounded-xl font-semibold min-h-[48px]">
                    🎞️ End Show
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Only Manager or Usher can control the show.</p>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md p-6 text-center">
            <div className="text-5xl mb-2">🎞️</div>
            <div className="text-lg font-bold text-gray-800">No show running</div>
            <div className="text-gray-600 text-sm">Schedule the next one below!</div>
          </div>
        )}

        {/* Schedule next show */}
        {can('manager', 'usher') && !currentShow && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="font-bold text-gray-800 mb-4">🎬 Schedule Next Show</h3>
            {!allClean && (
              <p className="text-orange-700 bg-orange-50 border border-orange-300 rounded-lg p-3 text-sm mb-3">
                ⚠️ Some seats still need cleaning. You can still schedule, but cleaning is more fun first!
              </p>
            )}
            {!noOneSeated && (
              <p className="text-orange-700 bg-orange-50 border border-orange-300 rounded-lg p-3 text-sm mb-3">
                ⚠️ Some seats are still sold from a previous show.
              </p>
            )}

            <label className="label">Movie</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
              {MOVIES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setScheduleMovieId(m.id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    scheduleMovieId === m.id ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300'
                  }`}
                >
                  <div className="text-3xl mb-1">{m.emoji}</div>
                  <div className="font-bold text-sm text-gray-800">{m.title}</div>
                  <div className="text-xs text-gray-500">{m.duration} min</div>
                </button>
              ))}
            </div>

            <label className="label">Start time</label>
            <select value={scheduleStartTime} onChange={(e) => setScheduleStartTime(e.target.value)} className="input mb-4">
              {['10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '5:30 PM', '7:00 PM', '8:30 PM'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <button onClick={scheduleShow} className="btn-red w-full px-4 py-3 rounded-xl font-bold text-lg min-h-[52px]">
              🎟️ Open Box Office
            </button>
          </div>
        )}

        {/* Show history */}
        {showHistory.length > 0 && (
          <details className="bg-white rounded-2xl shadow-md p-4">
            <summary className="font-bold text-gray-800 cursor-pointer">🎞️ Past Shows ({showHistory.length})</summary>
            <div className="space-y-2 mt-3">
              {showHistory.slice().reverse().map((s) => (
                <div key={s.id} className="border-2 border-gray-200 rounded-xl p-3 flex items-center gap-3">
                  <span className="text-3xl">{s.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800 truncate">{s.title}</div>
                    <div className="text-xs text-gray-500">
                      🕐 {s.startTime} · {new Date(s.endedAt || s.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {can('manager') && (
                    <button onClick={() => remove(ref(db, `${FB}/showHistory/${s.id}`))} className="btn-gray px-2 py-1 rounded-lg text-xs">
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    );
  }

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
        {/* Identity card */}
        <div className="bg-white rounded-2xl shadow-md p-4">
          <h3 className="font-bold text-gray-800 mb-3">🗳️ Who's Voting?</h3>

          <label className="label">Your Group</label>
          <div className="flex gap-2 mb-3">
            <select
              value={voteGroup}
              onChange={(e) => { setVoteGroup(e.target.value); setVoteName(''); }}
              className="input flex-1"
            >
              {groups.map((g) => <option key={g.id} value={g.name}>{g.name}</option>)}
              {groups.length === 0 && <option>Loading...</option>}
            </select>
            <button onClick={handleAddGroup} className="btn-gold px-3 py-2 rounded-xl font-semibold whitespace-nowrap min-h-[44px]">
              + Group
            </button>
          </div>

          <label className="label">Your Name (optional)</label>
          <div className="flex gap-2">
            <select
              value={voteName}
              onChange={(e) => setVoteName(e.target.value)}
              className="input flex-1"
            >
              <option value="">🎭 Anonymous</option>
              {groupMembers.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <button onClick={handleAddMember} className="btn-gold px-3 py-2 rounded-xl font-semibold whitespace-nowrap min-h-[44px]">
              + Name
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Voting as: <span className="font-semibold">{voteName || 'Anonymous'}</span> from <span className="font-semibold">{voteGroup}</span>
          </p>
        </div>

        {/* Open poll */}
        {poll && poll.status === 'open' && (
          <div className="bg-white rounded-2xl shadow-md p-4">
            <h3 className="font-bold text-gray-800 mb-1">🍿 What should we watch?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Tap to vote · {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} so far
            </p>
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
                    {isMyVote && (
                      <div className="text-xs text-red-600 font-semibold mt-1">✓ Your vote</div>
                    )}
                  </button>
                );
              })}
            </div>
            {can('manager') && (
              <div className="flex gap-2 mt-4">
                <button onClick={closePoll} className="btn-gold flex-1 px-4 py-3 rounded-xl font-semibold min-h-[48px]">
                  🛑 Close Voting
                </button>
                <button onClick={clearPoll} className="btn-gray px-4 py-3 rounded-xl font-semibold min-h-[48px]">
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {/* Closed poll */}
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
                      setScheduleMovieId(winner.id);
                      setView('show');
                      showToast(`Winner: ${winner.title} — pick a time!`);
                    } else {
                      showToast('No votes yet!');
                    }
                  }}
                  className="btn-red flex-1 px-4 py-3 rounded-xl font-semibold min-h-[48px]"
                >
                  🎬 Schedule Winner
                </button>
                <button onClick={clearPoll} className="btn-gray flex-1 px-4 py-3 rounded-xl font-semibold min-h-[48px]">
                  Clear & Start Over
                </button>
              </div>
            )}
          </div>
        )}

        {/* No poll → manager can start one */}
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
                        onClick={() => setPollSelection((p) => checked ? p.filter((x) => x !== m.id) : [...p, m.id])}
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

  function NotificationsView() {
    const recent = notifications.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 50);
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl shadow-md p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800">🔔 Recent Activity</h3>
            {can('manager') && notifications.length > 0 && (
              <button onClick={clearAllNotifications} className="btn-gray px-3 py-1 rounded-lg text-xs font-semibold">
                Clear All
              </button>
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
