import { useState, useEffect, useRef } from 'react';
import { db, IS_CONFIGURED } from './firebase';
import { ref, onValue, set } from 'firebase/database';

// ─── CONSTANTS & HELPERS ──────────────────────────────────────────────────────

const STORAGE_KEY = 'roseAndRuthHospital_v1';

const loadData = () => {
  try {
    const d = localStorage.getItem(STORAGE_KEY);
    return d ? JSON.parse(d) : { patients: [] };
  } catch { return { patients: [] }; }
};

const saveData = (data) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch (e) { console.error('Storage error:', e); }
};

const genId = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

const today = () => new Date().toISOString().split('T')[0];
const nowTime = () => new Date().toTimeString().slice(0, 5);

const fmtDate = (s) => {
  if (!s) return '—';
  return new Date(s + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const ANIMAL_EMOJI = {
  dog: '🐕', cat: '🐈', rabbit: '🐰', bird: '🦜', hamster: '🐹',
  'guinea pig': '🐹', fish: '🐠', turtle: '🐢', snake: '🐍',
  horse: '🐴', lizard: '🦎', other: '🐾',
};
const emojiFor = (species) => ANIMAL_EMOJI[(species || '').toLowerCase()] || '🐾';

const STATUS = {
  waiting:      { label: '⏳ Waiting',     cls: 'bg-amber-100 text-amber-800 border-amber-300' },
  'in-treatment': { label: '🔬 Treatment',  cls: 'bg-blue-100 text-blue-800 border-blue-300' },
  discharged:   { label: '✅ Discharged',  cls: 'bg-green-100 text-green-800 border-green-300' },
};
const URGENCY = {
  routine:   { label: '✅ Routine',    cls: 'bg-green-100 text-green-800',  dot: 'bg-green-400' },
  urgent:    { label: '⚡ Urgent',     cls: 'bg-amber-100 text-amber-800',  dot: 'bg-amber-400' },
  emergency: { label: '🚨 Emergency',  cls: 'bg-red-100 text-red-800',      dot: 'bg-red-500'   },
};

const PRESET_SERVICES = [
  { name: 'Wellness Checkup', price: 25 },
  { name: 'Emergency Visit',  price: 75 },
  { name: 'Vaccination',      price: 15 },
  { name: 'X-Ray Scan',       price: 40 },
  { name: 'Wound Care & Bandaging', price: 20 },
  { name: 'Medication',       price: 10 },
  { name: 'Surgery',          price: 150 },
  { name: 'Dental Cleaning',  price: 35 },
  { name: 'Lab Tests',        price: 30 },
  { name: 'Overnight Stay',   price: 50 },
  { name: 'Grooming',         price: 25 },
  { name: 'Microchipping',    price: 20 },
  { name: 'Physical Therapy', price: 45 },
  { name: 'Ambulance Pickup', price: 30 },
  { name: 'Home Delivery',    price: 30 },
  { name: 'Nutrition Consult', price: 20 },
];

const SYMPTOM_LIST = [
  'Not eating', 'Vomiting', 'Diarrhea', 'Lethargy', 'Limping',
  'Coughing', 'Sneezing', 'Eye/Nose Discharge', 'Itching/Scratching',
  'Hair Loss', 'Swelling', 'Wound/Injury', 'Difficulty Breathing',
  'Drinking Excessively', 'Hiding/Withdrawn', 'Shaking/Trembling',
];

const MED_PRESETS = [
  'Antibiotics', 'Pain Medication', 'Anti-inflammatory',
  'Anti-nausea', 'Antihistamine', 'Vitamins/Supplements',
  'Flea Treatment', 'Dewormer', 'Eye Drops', 'Ear Drops',
];

const compressImage = (file) => new Promise((resolve) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 360;
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.65));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

const blankVisitForm = () => ({
  checkInDate: today(),
  checkInTime: nowTime(),
  chiefComplaint: '',
  symptoms: [],
  urgency: 'routine',
  doctorName: '',
  ambulanceRequested: false,
  ambulancePickupType: 'pickup',
  ambulanceAddress: '',
});

const blankPatientForm = () => ({
  animalName: '', species: 'dog', breed: '', birthday: '', color: '', photo: '',
  ownerName: '', ownerPhone: '', ownerEmail: '', ownerAddress: '',
});

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const STAFF_PASSWORD = 'rosieruth';

export default function App() {
  const [isStaff, setIsStaff]     = useState(() => sessionStorage.getItem('rrStaff') === '1');
  const [showLogin, setShowLogin] = useState(false);
  const [pwInput, setPwInput]     = useState('');
  const [pwError, setPwError]     = useState(false);

  const [data, setData]   = useState(() => loadData());
  const [view, setView]   = useState('dashboard');   // dashboard | checkin | records | patient
  const [subView, setSubView] = useState('info');    // info | visit | report | discharge | invoice | ambulance
  const [selPatId, setSelPatId]     = useState(null);
  const [selVisitId, setSelVisitId] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');

  // Public page state
  const [pubView, setPubView]       = useState('home'); // home | checkin | lookup | confirmed
  const [pubForm, setPubForm]       = useState({ animalName: '', species: 'dog', ownerName: '', complaint: '', urgency: 'routine' });
  const [pubSearch, setPubSearch]   = useState('');
  const [pubConfirmId, setPubConfirmId] = useState(null); // patientId of newly checked-in patient

  // Check-in wizard state
  const [ciStep, setCiStep]   = useState('search'); // search | new-patient | new-visit
  const [ciQuery, setCiQuery] = useState('');
  const [patForm, setPatForm] = useState(blankPatientForm);
  const [visitForm, setVisitForm] = useState(blankVisitForm);

  // Subview form state
  const [reportForm, setReportForm] = useState({ doctorName: '', diagnosis: '', treatment: '', medications: [], notes: '' });
  const [dischargeForm, setDischargeForm] = useState({ dischargeDate: today(), dischargeTime: nowTime(), instructions: '', followUpDate: '', deliveryType: 'owner-pickup', deliveryAddress: '', meds: [] });
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [customSvc, setCustomSvc] = useState({ name: '', price: '' });
  const [ambulanceForm, setAmbulanceForm] = useState({ type: 'pickup', address: '', notes: '', status: 'pending' });

  const fileRef = useRef(null);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const patients   = data.patients || [];
  const selPat     = patients.find(p => p.id === selPatId) || null;
  const selVisit   = selPat?.visits?.find(v => v.id === selVisitId) || null;

  const activeVisits = patients.flatMap(p =>
    (p.visits || []).filter(v => v.status !== 'discharged').map(v => ({ ...v, pat: p }))
  ).sort((a, b) => {
    const ord = { emergency: 0, urgent: 1, routine: 2 };
    return (ord[a.urgency] ?? 2) - (ord[b.urgency] ?? 2);
  });

  const todayDischarged = patients.flatMap(p =>
    (p.visits || []).filter(v => v.status === 'discharged' && v.dischargeDate === today()).map(v => ({ ...v, pat: p }))
  );

  const filteredPatients = search
    ? patients.filter(p =>
        p.animalName?.toLowerCase().includes(search.toLowerCase()) ||
        p.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
        p.species?.toLowerCase().includes(search.toLowerCase()))
    : [...patients].reverse();

  const ciResults = ciQuery
    ? patients.filter(p =>
        p.animalName?.toLowerCase().includes(ciQuery.toLowerCase()) ||
        p.ownerName?.toLowerCase().includes(ciQuery.toLowerCase()))
    : [];

  // ── Firebase real-time sync ──────────────────────────────────────────────────
  useEffect(() => {
    if (!IS_CONFIGURED || !db) return;
    const unsub = onValue(ref(db, 'hospital'), (snap) => {
      const val = snap.val();
      if (val) { setData(val); saveData(val); }
    });
    return unsub;
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const update = (newData) => {
    setData(newData);
    saveData(newData);
    if (IS_CONFIGURED && db) {
      set(ref(db, 'hospital'), newData).catch(console.error);
    }
  };

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const updatePatients = (fn) => {
    const newData = { ...data, patients: fn(patients) };
    update(newData);
  };

  const patchVisit = (patId, visitId, patch) => {
    updatePatients(ps => ps.map(p =>
      p.id !== patId ? p : {
        ...p,
        visits: p.visits.map(v => v.id !== visitId ? v : { ...v, ...patch })
      }
    ));
  };

  const navToPatient = (patId, visitId = null, sub = 'info') => {
    setSelPatId(patId);
    setSelVisitId(visitId);
    setSubView(sub);
    setView('patient');
  };

  // Sync subview forms when switching
  useEffect(() => {
    if (!selVisit) return;
    if (subView === 'report') {
      setReportForm({
        doctorName: selVisit.doctorName || '',
        diagnosis:  selVisit.diagnosis  || '',
        treatment:  selVisit.treatment  || '',
        medications: selVisit.medications || [],
        notes:      selVisit.notes || '',
      });
    }
    if (subView === 'discharge') {
      setDischargeForm({
        dischargeDate: today(),
        dischargeTime: nowTime(),
        instructions:   selVisit.dischargeInstructions || '',
        followUpDate:   selVisit.followUpDate || '',
        deliveryType:   selVisit.deliveryType || 'owner-pickup',
        deliveryAddress: selVisit.deliveryAddress || selPat?.ownerAddress || '',
        meds:           selVisit.dischargeMeds || [],
      });
    }
    if (subView === 'invoice') {
      setInvoiceItems(selVisit.services || []);
    }
    if (subView === 'ambulance') {
      setAmbulanceForm({
        type:    selVisit.ambulancePickupType || 'pickup',
        address: selVisit.ambulanceAddress || selPat?.ownerAddress || '',
        notes:   selVisit.ambulanceNotes   || '',
        status:  selVisit.ambulanceStatus  || 'pending',
      });
    }
  }, [subView, selVisitId]);

  // ── Check-in actions ────────────────────────────────────────────────────────
  const handlePhotoUpload = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const b64 = await compressImage(f);
    setPatForm(prev => ({ ...prev, photo: b64 }));
  };

  const submitNewPatient = () => {
    const patId   = genId();
    const visitId = genId();
    const visit = {
      id: visitId,
      ...visitForm,
      status: 'waiting',
      diagnosis: '', treatment: '', medications: [], notes: '',
      dischargeDate: null, dischargeTime: null, dischargeInstructions: '',
      followUpDate: '', deliveryType: null, deliveryAddress: '', dischargeMeds: [],
      services: [], totalAmount: 0, paymentStatus: 'pending',
      ambulanceStatus: visitForm.ambulanceRequested ? 'pending' : null,
      ambulanceNotes: '',
    };
    const patient = { id: patId, ...patForm, createdAt: today(), visits: [visit] };
    updatePatients(ps => [...ps, patient]);
    showToast(`${patForm.animalName} checked in! 🐾`);
    setPatForm(blankPatientForm);
    setVisitForm(blankVisitForm());
    setCiStep('search'); setCiQuery('');
    navToPatient(patId, visitId);
  };

  const submitNewVisit = (patId) => {
    const visitId = genId();
    const visit = {
      id: visitId,
      ...visitForm,
      status: 'waiting',
      diagnosis: '', treatment: '', medications: [], notes: '',
      dischargeDate: null, dischargeTime: null, dischargeInstructions: '',
      followUpDate: '', deliveryType: null, deliveryAddress: '', dischargeMeds: [],
      services: [], totalAmount: 0, paymentStatus: 'pending',
      ambulanceStatus: visitForm.ambulanceRequested ? 'pending' : null,
      ambulanceNotes: '',
    };
    updatePatients(ps => ps.map(p =>
      p.id !== patId ? p : { ...p, visits: [...(p.visits || []), visit] }
    ));
    const pat = patients.find(p => p.id === patId);
    showToast(`New visit started for ${pat?.animalName}! 🏥`);
    setVisitForm(blankVisitForm());
    setCiStep('search'); setCiQuery('');
    navToPatient(patId, visitId);
  };

  // ── Subview save actions ─────────────────────────────────────────────────────
  const saveReport = () => {
    patchVisit(selPatId, selVisitId, {
      ...reportForm,
      status: selVisit.status === 'waiting' ? 'in-treatment' : selVisit.status,
    });
    showToast('Medical report saved! 📋');
    setSubView('visit');
  };

  const saveDischarge = () => {
    patchVisit(selPatId, selVisitId, {
      status: 'discharged',
      dischargeDate: dischargeForm.dischargeDate,
      dischargeTime: dischargeForm.dischargeTime,
      dischargeInstructions: dischargeForm.instructions,
      followUpDate: dischargeForm.followUpDate,
      deliveryType: dischargeForm.deliveryType,
      deliveryAddress: dischargeForm.deliveryAddress,
      dischargeMeds: dischargeForm.meds,
    });
    showToast(`${selPat?.animalName} has been discharged! 🏠`);
    setSubView('info');
  };

  const saveInvoice = () => {
    const total = invoiceItems.reduce((s, i) => s + Number(i.price), 0);
    patchVisit(selPatId, selVisitId, { services: invoiceItems, totalAmount: total });
    showToast('Invoice saved! 💾');
  };

  const markPaid = () => {
    const total = invoiceItems.reduce((s, i) => s + Number(i.price), 0);
    patchVisit(selPatId, selVisitId, { services: invoiceItems, totalAmount: total, paymentStatus: 'paid' });
    showToast('Payment received! Thank you! 🎉');
  };

  const saveAmbulance = () => {
    patchVisit(selPatId, selVisitId, {
      ambulanceRequested: true,
      ambulancePickupType: ambulanceForm.type,
      ambulanceAddress:    ambulanceForm.address,
      ambulanceNotes:      ambulanceForm.notes,
      ambulanceStatus:     ambulanceForm.status,
    });
    showToast('Ambulance dispatched! 🚑');
    setSubView('visit');
  };

  // ─── VISIT FORM (shared by new-patient and new-visit steps) ─────────────────
  const VisitFormSection = () => (
    <div className="bg-white rounded-2xl shadow p-5 space-y-4">
      <h3 className="font-bold text-red-500 text-lg">🩺 Visit Details</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Check-in Date</label>
          <input type="date" className="input" value={visitForm.checkInDate}
            onChange={e => setVisitForm(f => ({ ...f, checkInDate: e.target.value }))} />
        </div>
        <div>
          <label className="label">Check-in Time</label>
          <input type="time" className="input" value={visitForm.checkInTime}
            onChange={e => setVisitForm(f => ({ ...f, checkInTime: e.target.value }))} />
        </div>
      </div>

      <div>
        <label className="label">What&apos;s wrong? <span className="text-red-400">*</span></label>
        <textarea className="input min-h-[80px]" placeholder="Describe the main reason for the visit…"
          value={visitForm.chiefComplaint}
          onChange={e => setVisitForm(f => ({ ...f, chiefComplaint: e.target.value }))} />
      </div>

      <div>
        <label className="label mb-2">Symptoms (check all that apply)</label>
        <div className="grid grid-cols-2 gap-y-1 gap-x-3">
          {SYMPTOM_LIST.map(s => (
            <label key={s} className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input type="checkbox" className="accent-pink-500 w-4 h-4"
                checked={visitForm.symptoms.includes(s)}
                onChange={e => setVisitForm(f => ({
                  ...f,
                  symptoms: e.target.checked ? [...f.symptoms, s] : f.symptoms.filter(x => x !== s)
                }))} />
              {s}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="label mb-2">Urgency Level</label>
        <div className="grid grid-cols-3 gap-2">
          {[['routine','✅ Routine','border-green-400 bg-green-500'], ['urgent','⚡ Urgent','border-amber-400 bg-amber-400'], ['emergency','🚨 Emergency','border-red-500 bg-red-500']].map(([val, lbl, ac]) => (
            <button key={val}
              onClick={() => setVisitForm(f => ({ ...f, urgency: val }))}
              className={`py-2 rounded-xl text-sm font-bold border-2 transition-all ${visitForm.urgency === val ? `${ac} text-white` : 'border-gray-200 text-gray-500 hover:border-gray-400 bg-white'}`}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Assigned Doctor</label>
        <input className="input" placeholder="e.g. Dr. Emma" value={visitForm.doctorName}
          onChange={e => setVisitForm(f => ({ ...f, doctorName: e.target.value }))} />
      </div>

      <div className="border-t border-gray-100 pt-3">
        <label className="flex items-center gap-2 font-semibold text-gray-700 cursor-pointer select-none">
          <input type="checkbox" className="accent-orange-500 w-4 h-4"
            checked={visitForm.ambulanceRequested}
            onChange={e => setVisitForm(f => ({ ...f, ambulanceRequested: e.target.checked }))} />
          🚑 Request Pet Ambulance Pickup
        </label>
        {visitForm.ambulanceRequested && (
          <div className="mt-3 ml-6 bg-orange-50 border border-orange-200 rounded-xl p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {[['pickup','🏠→🏥 Pickup'],['delivery','🏥→🏠 Delivery']].map(([v,l]) => (
                <button key={v}
                  onClick={() => setVisitForm(f => ({ ...f, ambulancePickupType: v }))}
                  className={`py-2 rounded-lg text-sm font-semibold border-2 transition-all ${visitForm.ambulancePickupType === v ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200'}`}>
                  {l}
                </button>
              ))}
            </div>
            <input className="input text-sm" placeholder="Address for pickup/delivery…"
              value={visitForm.ambulanceAddress}
              onChange={e => setVisitForm(f => ({ ...f, ambulanceAddress: e.target.value }))} />
          </div>
        )}
      </div>
    </div>
  );

  // ─── VIEWS ───────────────────────────────────────────────────────────────────

  const Dashboard = () => (
    <div className="space-y-5">
      {/* Hero */}
      <div className="bg-gradient-to-br from-pink-500 via-fuchsia-500 to-purple-600 text-white rounded-3xl p-6 text-center shadow-lg">
        <div className="text-6xl mb-2">🏥🐾</div>
        <h1 className="text-3xl font-extrabold tracking-tight">Rose &amp; Ruth&apos;s</h1>
        <p className="text-pink-100 font-medium">Animal Hospital</p>
        <p className="text-pink-200 text-sm mt-1">Where every pet gets pawsome care!</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { n: activeVisits.filter(v => v.status === 'waiting').length,       label: 'Waiting',     color: 'text-amber-500',  border: 'border-amber-400' },
          { n: activeVisits.filter(v => v.status === 'in-treatment').length,  label: 'In Treatment', color: 'text-blue-500',   border: 'border-blue-400'  },
          { n: todayDischarged.length,                                        label: 'Home Today',  color: 'text-green-500',  border: 'border-green-400' },
        ].map(({ n, label, color, border }) => (
          <div key={label} className={`bg-white rounded-2xl shadow p-3 text-center border-t-4 ${border}`}>
            <div className={`text-3xl font-extrabold ${color}`}>{n}</div>
            <div className="text-gray-500 text-xs font-semibold mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => { setCiStep('search'); setCiQuery(''); setVisitForm(blankVisitForm()); setView('checkin'); }}
          className="btn-pink py-4 rounded-2xl text-lg font-bold shadow-lg flex items-center justify-center gap-2">
          ➕ Check In
        </button>
        <button onClick={() => setView('records')}
          className="btn-purple py-4 rounded-2xl text-lg font-bold shadow-lg flex items-center justify-center gap-2">
          📁 Records
        </button>
      </div>

      {/* Active patients */}
      <div className="bg-white rounded-2xl shadow p-4">
        <h2 className="font-bold text-gray-800 text-lg mb-3">🏥 Current Patients</h2>
        {activeVisits.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-5xl mb-2">😴</div>
            <p>No patients right now — enjoy the quiet!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeVisits.map(v => (
              <div key={v.id} onClick={() => navToPatient(v.pat.id, v.id)}
                className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 hover:border-pink-200 hover:bg-pink-50 cursor-pointer transition-all">
                {PatAvatar({pat: v.pat, size: 12})}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-800">{v.pat.animalName}
                    <span className="text-gray-400 font-normal text-sm ml-1 capitalize">({v.pat.species})</span>
                  </div>
                  <div className="text-xs text-gray-500 truncate">{v.chiefComplaint}</div>
                  <div className="text-xs text-gray-400">Owner: {v.pat.ownerName}</div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${STATUS[v.status].cls}`}>{STATUS[v.status].label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${URGENCY[v.urgency].cls}`}>{URGENCY[v.urgency].label}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All patients grid */}
      {patients.length > 0 && (
        <div className="bg-white rounded-2xl shadow p-4">
          <h2 className="font-bold text-gray-800 text-lg mb-3">🐾 All Patients ({patients.length})</h2>
          <div className="grid grid-cols-3 gap-2">
            {[...patients].reverse().slice(0, 9).map(p => (
              <div key={p.id} onClick={() => navToPatient(p.id)}
                className="flex flex-col items-center gap-1 p-2 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 cursor-pointer transition-all">
                {PatAvatar({pat: p, size: 12})}
                <div className="text-xs font-semibold text-gray-700 text-center truncate w-full text-center">{p.animalName}</div>
                <div className="text-xs text-gray-400">{p.visits?.length || 0} visit{p.visits?.length !== 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>
          {patients.length > 9 && (
            <button onClick={() => setView('records')} className="mt-3 text-purple-500 text-sm font-semibold hover:underline">
              View all {patients.length} patients →
            </button>
          )}
        </div>
      )}
    </div>
  );

  const CheckIn = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-3xl p-5 text-center shadow">
        <div className="text-4xl mb-1">📋</div>
        <h2 className="text-2xl font-extrabold">Patient Check-In</h2>
        <p className="text-teal-100 text-sm">Welcome to Rose &amp; Ruth&apos;s!</p>
      </div>

      {ciStep === 'search' && (
        <>
          <div className="bg-white rounded-2xl shadow p-5">
            <h3 className="font-bold text-gray-700 mb-3">🔍 Returning Patient?</h3>
            <input className="input" placeholder="Search by pet name or owner name…"
              value={ciQuery} onChange={e => setCiQuery(e.target.value)} />
            {ciQuery && (
              <div className="mt-3 space-y-2">
                {ciResults.length === 0
                  ? <p className="text-sm text-gray-400">No matches found.</p>
                  : ciResults.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 bg-gray-50 hover:border-teal-300 transition-all">
                      {PatAvatar({pat: p, size: 10})}
                      <div className="flex-1">
                        <div className="font-bold text-gray-800">{p.animalName} <span className="text-gray-400 text-sm capitalize">({p.species})</span></div>
                        <div className="text-xs text-gray-500">Owner: {p.ownerName} · {p.visits?.length || 0} visit(s)</div>
                      </div>
                      <button className="btn-teal text-sm px-3 py-1.5 rounded-lg font-bold"
                        onClick={() => { setSelPatId(p.id); setVisitForm(blankVisitForm()); setCiStep('new-visit'); }}>
                        New Visit
                      </button>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-3">— or —</p>
            <button className="btn-pink px-8 py-3 rounded-2xl text-lg font-bold shadow-lg"
              onClick={() => { setPatForm(blankPatientForm()); setCiStep('new-patient'); }}>
              ➕ Register New Patient
            </button>
          </div>
        </>
      )}

      {ciStep === 'new-patient' && (
        <div className="space-y-4">
          {/* Animal Info */}
          <div className="bg-white rounded-2xl shadow p-5 space-y-4">
            <h3 className="font-bold text-pink-600 text-lg">🐾 Animal Information</h3>

            {/* Photo */}
            <div className="flex items-center gap-4">
              <div onClick={() => fileRef.current?.click()}
                className="w-24 h-24 rounded-full border-4 border-dashed border-pink-300 hover:border-pink-500 bg-pink-50 flex items-center justify-center cursor-pointer overflow-hidden flex-shrink-0 transition-all">
                {patForm.photo
                  ? <img src={patForm.photo} className="w-full h-full object-cover" alt="Pet" />
                  : <div className="text-center text-pink-300"><div className="text-3xl">📸</div><div className="text-xs mt-0.5">Add Photo</div></div>
                }
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              <div>
                <p className="text-sm font-semibold text-gray-700">Pet Photo</p>
                <p className="text-xs text-gray-400">Tap the circle to upload!</p>
                {patForm.photo && <button className="text-xs text-red-400 hover:text-red-600 mt-1" onClick={() => setPatForm(f => ({ ...f, photo: '' }))}>Remove</button>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Pet Name <span className="text-red-400">*</span></label>
                <input className="input" placeholder="e.g. Fluffy" value={patForm.animalName}
                  onChange={e => setPatForm(f => ({ ...f, animalName: e.target.value }))} />
              </div>
              <div>
                <label className="label">Species <span className="text-red-400">*</span></label>
                <select className="input" value={patForm.species}
                  onChange={e => setPatForm(f => ({ ...f, species: e.target.value }))}>
                  {Object.entries(ANIMAL_EMOJI).map(([s, emoji]) => (
                    <option key={s} value={s}>{emoji} {s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Breed</label>
                <input className="input" placeholder="e.g. Golden Retriever" value={patForm.breed}
                  onChange={e => setPatForm(f => ({ ...f, breed: e.target.value }))} />
              </div>
              <div>
                <label className="label">Birthday</label>
                <input type="date" className="input" value={patForm.birthday}
                  onChange={e => setPatForm(f => ({ ...f, birthday: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="label">Color / Markings</label>
                <input className="input" placeholder="e.g. Orange tabby with white paws" value={patForm.color}
                  onChange={e => setPatForm(f => ({ ...f, color: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Owner Info */}
          <div className="bg-white rounded-2xl shadow p-5 space-y-3">
            <h3 className="font-bold text-purple-600 text-lg">👤 Owner Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Owner Name <span className="text-red-400">*</span></label>
                <input className="input" placeholder="Full name" value={patForm.ownerName}
                  onChange={e => setPatForm(f => ({ ...f, ownerName: e.target.value }))} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input type="tel" className="input" placeholder="(555) 123-4567" value={patForm.ownerPhone}
                  onChange={e => setPatForm(f => ({ ...f, ownerPhone: e.target.value }))} />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" placeholder="email@example.com" value={patForm.ownerEmail}
                  onChange={e => setPatForm(f => ({ ...f, ownerEmail: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="label">Home Address</label>
                <input className="input" placeholder="123 Main St…" value={patForm.ownerAddress}
                  onChange={e => setPatForm(f => ({ ...f, ownerAddress: e.target.value }))} />
              </div>
            </div>
          </div>

          {VisitFormSection()}

          <div className="flex gap-3">
            <button className="flex-1 border-2 border-gray-300 text-gray-600 py-3 rounded-2xl font-bold hover:bg-gray-50"
              onClick={() => setCiStep('search')}>← Back</button>
            <button
              disabled={!patForm.animalName || !patForm.ownerName || !visitForm.chiefComplaint}
              className="flex-[2] btn-pink py-3 rounded-2xl font-bold shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={submitNewPatient}>
              Check In Patient! 🏥
            </button>
          </div>
        </div>
      )}

      {ciStep === 'new-visit' && (() => {
        const p = patients.find(x => x.id === selPatId);
        return (
          <div className="space-y-4">
            <div className="bg-teal-50 border-2 border-teal-300 rounded-2xl p-4 flex items-center gap-3">
              {PatAvatar({pat: p, size: 12})}
              <div>
                <div className="font-bold text-teal-800">Returning: {p?.animalName}</div>
                <div className="text-sm text-teal-600">Owner: {p?.ownerName} · {p?.visits?.length || 0} previous visit(s)</div>
              </div>
            </div>
            {VisitFormSection()}
            <div className="flex gap-3">
              <button className="flex-1 border-2 border-gray-300 text-gray-600 py-3 rounded-2xl font-bold hover:bg-gray-50"
                onClick={() => setCiStep('search')}>← Back</button>
              <button disabled={!visitForm.chiefComplaint}
                className="flex-[2] btn-teal py-3 rounded-2xl font-bold shadow-lg disabled:opacity-40"
                onClick={() => submitNewVisit(selPatId)}>
                Start Visit! 🏥
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );

  const Records = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-3xl p-5 text-center shadow">
        <div className="text-4xl mb-1">📁</div>
        <h2 className="text-2xl font-extrabold">Patient Records</h2>
        <p className="text-purple-100 text-sm">{patients.length} total patient{patients.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="bg-white rounded-2xl shadow p-4">
        <input className="input" placeholder="🔍 Search by name, owner, or species…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filteredPatients.length === 0
        ? <div className="text-center py-12 text-gray-400"><div className="text-5xl mb-2">🔍</div><p>No patients found.</p></div>
        : (
          <div className="space-y-3">
            {filteredPatients.map(p => {
              const lastVisit = p.visits?.[p.visits.length - 1];
              const isActive = p.visits?.some(v => v.status !== 'discharged');
              return (
                <div key={p.id} onClick={() => navToPatient(p.id)}
                  className="bg-white rounded-2xl shadow p-4 flex items-center gap-4 cursor-pointer hover:shadow-md border-2 border-transparent hover:border-purple-200 transition-all">
                  {PatAvatar({pat: p, size: 16})}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-800 text-lg">{p.animalName}</span>
                      <span className="text-gray-400 text-sm capitalize">{p.species}{p.breed ? ` · ${p.breed}` : ''}</span>
                      {isActive && <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-semibold border border-amber-300">In Hospital</span>}
                    </div>
                    <div className="text-sm text-gray-500">Owner: {p.ownerName}</div>
                    {p.birthday && <div className="text-sm text-gray-400">🎂 {fmtDate(p.birthday)}</div>}
                    <div className="text-xs text-gray-400 mt-0.5">{p.visits?.length || 0} visit(s){lastVisit ? ` · Last: ${fmtDate(lastVisit.checkInDate)}` : ''}</div>
                  </div>
                  <div className="text-gray-300 text-2xl">›</div>
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );

  const PatientDetail = () => {
    if (!selPat) return <div className="text-center py-12 text-gray-400">Patient not found.</div>;
    const activeVisit = selPat.visits?.find(v => v.status !== 'discharged');
    return (
      <div className="space-y-4">
        {/* Patient card */}
        <div className="bg-white rounded-2xl shadow p-5">
          <div className="flex items-center gap-4">
            {PatAvatar({pat: selPat, size: 20, ring: true})}
            <div className="flex-1">
              <h2 className="text-2xl font-extrabold text-gray-800">{selPat.animalName}</h2>
              <p className="text-gray-500 capitalize">{selPat.species}{selPat.breed ? ` · ${selPat.breed}` : ''}</p>
              {selPat.color    && <p className="text-gray-400 text-sm">{selPat.color}</p>}
              {selPat.birthday && <p className="text-gray-400 text-sm">🎂 {fmtDate(selPat.birthday)}</p>}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Owner</p>
            <div className="grid grid-cols-2 gap-1 text-sm text-gray-700">
              <div><span className="text-gray-400">Name: </span>{selPat.ownerName}</div>
              {selPat.ownerPhone && <div><span className="text-gray-400">Phone: </span>{selPat.ownerPhone}</div>}
              {selPat.ownerEmail && <div className="col-span-2"><span className="text-gray-400">Email: </span>{selPat.ownerEmail}</div>}
              {selPat.ownerAddress && <div className="col-span-2"><span className="text-gray-400">Address: </span>{selPat.ownerAddress}</div>}
            </div>
          </div>
        </div>

        {/* Active visit actions */}
        {activeVisit && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-amber-800">🏥 Current Visit</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${STATUS[activeVisit.status].cls}`}>{STATUS[activeVisit.status].label}</span>
            </div>
            <p className="text-sm text-gray-700 mb-3">{activeVisit.chiefComplaint}</p>
            {activeVisit.status === 'waiting' && (
              <button className="w-full btn-blue py-2 rounded-xl text-sm font-bold mb-2"
                onClick={() => { patchVisit(selPat.id, activeVisit.id, { status: 'in-treatment' }); showToast('Moved to treatment room! 🔬'); }}>
                🔬 Move to Treatment Room
              </button>
            )}
            <div className="grid grid-cols-2 gap-2">
              {[
                ['📋 Medical Report', 'report',    'bg-blue-100 text-blue-800 hover:bg-blue-200'],
                ['🏠 Discharge',      'discharge', 'bg-green-100 text-green-800 hover:bg-green-200'],
                ['💰 Invoice',        'invoice',   'bg-amber-100 text-amber-800 hover:bg-amber-200'],
                ['🚑 Ambulance',      'ambulance', 'bg-orange-100 text-orange-800 hover:bg-orange-200'],
              ].map(([label, sv, cls]) => (
                <button key={sv} className={`${cls} py-2 rounded-xl text-sm font-bold transition-all`}
                  onClick={() => { setSelVisitId(activeVisit.id); setSubView(sv); }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {!activeVisit && (
          <button className="btn-pink w-full py-3 rounded-2xl font-bold shadow-lg"
            onClick={() => { setSelPatId(selPat.id); setVisitForm(blankVisitForm()); setCiStep('new-visit'); setView('checkin'); }}>
            ➕ Start New Visit for {selPat.animalName}
          </button>
        )}

        {/* Visit history */}
        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="font-bold text-gray-800 mb-3">📅 Visit History ({selPat.visits?.length || 0})</h3>
          {(!selPat.visits?.length)
            ? <p className="text-gray-400 text-sm text-center py-4">No visits yet.</p>
            : (
              <div className="space-y-2">
                {[...selPat.visits].reverse().map(v => (
                  <div key={v.id} onClick={() => { setSelVisitId(v.id); setSubView('visit'); }}
                    className="p-3 rounded-xl border-2 border-gray-100 hover:border-purple-200 hover:bg-purple-50 cursor-pointer transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-800 text-sm">{fmtDate(v.checkInDate)} at {v.checkInTime}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${STATUS[v.status]?.cls}`}>{STATUS[v.status]?.label}</span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{v.chiefComplaint}</p>
                    {v.diagnosis && <p className="text-xs text-gray-400 mt-0.5">Dx: {v.diagnosis}</p>}
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${URGENCY[v.urgency]?.cls}`}>{v.urgency}</span>
                        {v.totalAmount > 0 && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${v.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            ${v.totalAmount} {v.paymentStatus === 'paid' ? '✓ Paid' : '⚠ Unpaid'}
                          </span>
                        )}
                      </div>
                      {v.doctorName && <span className="text-xs text-gray-400">{v.doctorName}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </div>
    );
  };

  const VisitDetail = () => {
    if (!selVisit || !selPat) return null;
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl shadow p-5">
          <div className="flex items-center gap-3 mb-4">
            {PatAvatar({pat: selPat, size: 12})}
            <div>
              <div className="font-bold text-gray-800 text-lg">{selPat.animalName}&apos;s Visit</div>
              <div className="text-gray-500 text-sm">{fmtDate(selVisit.checkInDate)} at {selVisit.checkInTime}</div>
            </div>
            <span className={`ml-auto text-xs px-2 py-1 rounded-full font-semibold border ${STATUS[selVisit.status]?.cls}`}>{STATUS[selVisit.status]?.label}</span>
          </div>

          <div className="space-y-3">
            {InfoBlock({label: "Chief Complaint", value: selVisit.chiefComplaint})}
            {selVisit.symptoms?.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Symptoms</p>
                <div className="flex flex-wrap gap-1">
                  {selVisit.symptoms.map(s => <span key={s} className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">{s}</span>)}
                </div>
              </div>
            )}
            {selVisit.doctorName && InfoBlock({label: "Doctor", value: selVisit.doctorName})}
            {selVisit.diagnosis  && InfoBlock({label: "Diagnosis", value: selVisit.diagnosis, color: "blue"})}
            {selVisit.treatment  && InfoBlock({label: "Treatment",  value: selVisit.treatment,  color: "green"})}
            {selVisit.medications?.length > 0 && (
              <div className="bg-purple-50 rounded-xl p-3">
                <p className="text-xs font-bold text-purple-600 uppercase mb-2">Medications Prescribed</p>
                {selVisit.medications.map((m, i) => (
                  <div key={i} className="text-sm text-gray-700">💊 {m.name}{m.dosage ? ` — ${m.dosage}` : ''}{m.frequency ? ` · ${m.frequency}` : ''}</div>
                ))}
              </div>
            )}
            {selVisit.notes && InfoBlock({label: "Notes", value: selVisit.notes, color: "yellow"})}
            {selVisit.status === 'discharged' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <p className="text-xs font-bold text-green-600 uppercase mb-2">Discharge Info</p>
                <p className="text-sm text-gray-700">{selVisit.dischargeInstructions}</p>
                {selVisit.followUpDate && <p className="text-sm text-gray-500 mt-1">Follow-up: {fmtDate(selVisit.followUpDate)}</p>}
                {selVisit.deliveryType && (
                  <p className="text-sm text-gray-500 mt-1">
                    {selVisit.deliveryType === 'home-delivery' ? '🚑 Home Delivery' : '🚶 Owner Pickup'}
                    {selVisit.deliveryAddress ? ` — ${selVisit.deliveryAddress}` : ''}
                  </p>
                )}
                {selVisit.dischargeMeds?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-bold text-green-700 mb-1">Take-home Medications:</p>
                    {selVisit.dischargeMeds.map((m, i) => <p key={i} className="text-xs text-gray-600">💊 {m.name}{m.instructions ? ` — ${m.instructions}` : ''}</p>)}
                  </div>
                )}
              </div>
            )}
            {selVisit.ambulanceRequested && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                <p className="text-xs font-bold text-orange-600 uppercase mb-2">🚑 Ambulance</p>
                <p className="text-sm text-gray-700">{selVisit.ambulancePickupType === 'pickup' ? 'Pickup from home' : 'Home delivery'} — {selVisit.ambulanceAddress}</p>
                <p className="text-sm font-semibold mt-1">Status: {selVisit.ambulanceStatus}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {selVisit.status !== 'discharged' && [
            ['📋 Medical Report', 'report',    'bg-blue-100 text-blue-800 hover:bg-blue-200'],
            ['🏠 Discharge',      'discharge', 'bg-green-100 text-green-800 hover:bg-green-200'],
            ['💰 Invoice',        'invoice',   'bg-amber-100 text-amber-800 hover:bg-amber-200'],
            ['🚑 Ambulance',      'ambulance', 'bg-orange-100 text-orange-800 hover:bg-orange-200'],
          ].map(([label, sv, cls]) => (
            <button key={sv} className={`${cls} py-3 rounded-2xl text-sm font-bold transition-all`}
              onClick={() => setSubView(sv)}>{label}</button>
          ))}
          {selVisit.status === 'discharged' && [
            ['📋 View Report', 'report',  'bg-blue-100 text-blue-800 hover:bg-blue-200'],
            ['💰 Invoice',     'invoice', 'bg-amber-100 text-amber-800 hover:bg-amber-200'],
          ].map(([label, sv, cls]) => (
            <button key={sv} className={`${cls} py-3 rounded-2xl text-sm font-bold transition-all`}
              onClick={() => setSubView(sv)}>{label}</button>
          ))}
        </div>
      </div>
    );
  };

  const MedicalReport = () => {
    if (!selVisit) return null;
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-3xl p-4 text-center shadow">
          <div className="text-3xl mb-1">📋</div>
          <h2 className="text-xl font-extrabold">Medical Report</h2>
          <p className="text-blue-100 text-sm">{selPat?.animalName} · {fmtDate(selVisit.checkInDate)}</p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5 space-y-4">
          <div>
            <label className="label">Diagnosing Doctor</label>
            <input className="input" placeholder="e.g. Dr. Emma" value={reportForm.doctorName}
              onChange={e => setReportForm(f => ({ ...f, doctorName: e.target.value }))} />
          </div>
          <div>
            <label className="label">Diagnosis</label>
            <textarea className="input min-h-[80px]" placeholder="What is wrong with the patient?" value={reportForm.diagnosis}
              onChange={e => setReportForm(f => ({ ...f, diagnosis: e.target.value }))} />
          </div>
          <div>
            <label className="label">Treatment Plan</label>
            <textarea className="input min-h-[80px]" placeholder="How are we treating the patient?" value={reportForm.treatment}
              onChange={e => setReportForm(f => ({ ...f, treatment: e.target.value }))} />
          </div>

          <div>
            <label className="label mb-2">Medications Prescribed</label>
            {reportForm.medications.map((med, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input className="input flex-1 text-sm" placeholder="Medication name" value={med.name}
                  onChange={e => { const m=[...reportForm.medications]; m[i]={...m[i],name:e.target.value}; setReportForm(f=>({...f,medications:m})); }} />
                <input className="input w-24 text-sm" placeholder="Dose" value={med.dosage}
                  onChange={e => { const m=[...reportForm.medications]; m[i]={...m[i],dosage:e.target.value}; setReportForm(f=>({...f,medications:m})); }} />
                <input className="input w-28 text-sm" placeholder="Frequency" value={med.frequency}
                  onChange={e => { const m=[...reportForm.medications]; m[i]={...m[i],frequency:e.target.value}; setReportForm(f=>({...f,medications:m})); }} />
                <button className="text-red-400 hover:text-red-600 px-1"
                  onClick={() => setReportForm(f=>({...f,medications:f.medications.filter((_,j)=>j!==i)}))}>✕</button>
              </div>
            ))}
            <div className="flex flex-wrap gap-2 mt-2">
              {MED_PRESETS.map(m => (
                <button key={m} className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full border border-blue-200"
                  onClick={() => setReportForm(f=>({...f,medications:[...f.medications,{name:m,dosage:'',frequency:''}]}))}>
                  + {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Additional Notes</label>
            <textarea className="input min-h-[80px]" placeholder="Any other observations…" value={reportForm.notes}
              onChange={e => setReportForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex-1 border-2 border-gray-300 text-gray-600 py-3 rounded-2xl font-bold hover:bg-gray-50"
            onClick={() => setSubView('visit')}>← Cancel</button>
          <button className="flex-[2] btn-blue py-3 rounded-2xl font-bold shadow-lg" onClick={saveReport}>💾 Save Report</button>
        </div>
      </div>
    );
  };

  const DischargeFormView = () => {
    if (!selVisit) return null;
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-3xl p-4 text-center shadow">
          <div className="text-3xl mb-1">🏠</div>
          <h2 className="text-xl font-extrabold">Discharge Form</h2>
          <p className="text-green-100 text-sm">{selPat?.animalName} is going home!</p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Discharge Date</label>
              <input type="date" className="input" value={dischargeForm.dischargeDate}
                onChange={e => setDischargeForm(f=>({...f,dischargeDate:e.target.value}))} /></div>
            <div><label className="label">Discharge Time</label>
              <input type="time" className="input" value={dischargeForm.dischargeTime}
                onChange={e => setDischargeForm(f=>({...f,dischargeTime:e.target.value}))} /></div>
          </div>

          <div>
            <label className="label">Home Care Instructions</label>
            <textarea className="input min-h-[100px]" placeholder="Instructions for caring for your pet at home…"
              value={dischargeForm.instructions}
              onChange={e => setDischargeForm(f=>({...f,instructions:e.target.value}))} />
          </div>

          <div>
            <label className="label mb-2">Take-home Medications</label>
            {dischargeForm.meds.map((m, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input className="input flex-1 text-sm" placeholder="Medication" value={m.name}
                  onChange={e=>{const ms=[...dischargeForm.meds];ms[i]={...ms[i],name:e.target.value};setDischargeForm(f=>({...f,meds:ms}));}} />
                <input className="input flex-1 text-sm" placeholder="Instructions" value={m.instructions}
                  onChange={e=>{const ms=[...dischargeForm.meds];ms[i]={...ms[i],instructions:e.target.value};setDischargeForm(f=>({...f,meds:ms}));}} />
                <button className="text-red-400 hover:text-red-600 px-1"
                  onClick={()=>setDischargeForm(f=>({...f,meds:f.meds.filter((_,j)=>j!==i)}))}>✕</button>
              </div>
            ))}
            <button className="text-green-600 text-sm font-semibold hover:underline"
              onClick={()=>setDischargeForm(f=>({...f,meds:[...f.meds,{name:'',instructions:''}]}))}>+ Add Medication</button>
          </div>

          <div>
            <label className="label">Follow-up Appointment</label>
            <input type="date" className="input" value={dischargeForm.followUpDate}
              onChange={e=>setDischargeForm(f=>({...f,followUpDate:e.target.value}))} />
          </div>

          <div>
            <label className="label mb-2">How is the pet going home?</label>
            <div className="grid grid-cols-2 gap-3">
              {[['owner-pickup','🚶 Owner Picks Up','border-green-400 bg-green-500'],['home-delivery','🚑 Ambulance Delivery','border-orange-400 bg-orange-500']].map(([v,l,ac])=>(
                <button key={v}
                  onClick={()=>setDischargeForm(f=>({...f,deliveryType:v}))}
                  className={`py-3 rounded-xl font-bold border-2 transition-all text-sm ${dischargeForm.deliveryType===v?`${ac} text-white`:'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                  {l}
                </button>
              ))}
            </div>
            {dischargeForm.deliveryType === 'home-delivery' && (
              <input className="input mt-2" placeholder="Delivery address…"
                value={dischargeForm.deliveryAddress}
                onChange={e=>setDischargeForm(f=>({...f,deliveryAddress:e.target.value}))} />
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex-1 border-2 border-gray-300 text-gray-600 py-3 rounded-2xl font-bold hover:bg-gray-50"
            onClick={() => setSubView('visit')}>← Cancel</button>
          <button className="flex-[2] btn-green py-3 rounded-2xl font-bold shadow-lg" onClick={saveDischarge}>🏠 Discharge Patient!</button>
        </div>
      </div>
    );
  };

  const InvoiceView = () => {
    if (!selVisit) return null;
    const total = invoiceItems.reduce((s, i) => s + Number(i.price), 0);
    const latestVisit = selPat?.visits?.find(v => v.id === selVisitId);
    const isPaid = latestVisit?.paymentStatus === 'paid';

    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-3xl p-4 text-center shadow">
          <div className="text-3xl mb-1">💰</div>
          <h2 className="text-xl font-extrabold">Invoice &amp; Payment</h2>
          <p className="text-amber-100 text-sm">Rose &amp; Ruth&apos;s Animal Hospital</p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="font-bold text-gray-800 text-lg">{selPat?.animalName}</div>
              <div className="text-gray-500 text-sm">Owner: {selPat?.ownerName}</div>
              <div className="text-gray-400 text-sm">Visit: {fmtDate(selVisit.checkInDate)}</div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {isPaid ? '✅ PAID' : '⚠️ UNPAID'}
            </span>
          </div>

          {/* Add services */}
          <div className="border-t border-b border-gray-100 py-3 mb-3">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Add Services</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_SERVICES.map(s => (
                <button key={s.name}
                  onClick={() => setInvoiceItems(prev => [...prev, { ...s, id: genId() }])}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full border border-amber-200 font-medium">
                  + {s.name} (${s.price})
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <input className="input flex-1 text-sm" placeholder="Custom service…" value={customSvc.name}
                onChange={e=>setCustomSvc(c=>({...c,name:e.target.value}))} />
              <input type="number" className="input w-20 text-sm" placeholder="$" value={customSvc.price}
                onChange={e=>setCustomSvc(c=>({...c,price:e.target.value}))} />
              <button className="btn-amber px-3 py-2 rounded-xl text-sm font-bold"
                onClick={()=>{
                  if(customSvc.name && customSvc.price){
                    setInvoiceItems(p=>[...p,{name:customSvc.name,price:parseFloat(customSvc.price),id:genId()}]);
                    setCustomSvc({name:'',price:''});
                  }
                }}>Add</button>
            </div>
          </div>

          {/* Line items */}
          <div className="space-y-2 min-h-[60px]">
            {invoiceItems.length === 0
              ? <p className="text-gray-400 text-sm text-center py-3">No services added yet — tap items above!</p>
              : invoiceItems.map((item, i) => (
                <div key={item.id || i} className="flex items-center justify-between">
                  <span className="text-gray-800">{item.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">${Number(item.price).toFixed(2)}</span>
                    <button className="text-red-300 hover:text-red-500"
                      onClick={()=>setInvoiceItems(p=>p.filter((_,j)=>j!==i))}>✕</button>
                  </div>
                </div>
              ))
            }
          </div>

          <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between items-center">
            <span className="text-xl font-bold text-gray-800">Total Due:</span>
            <span className="text-2xl font-extrabold text-green-600">${total.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex-1 btn-amber py-3 rounded-2xl font-bold shadow" onClick={saveInvoice}>💾 Save Invoice</button>
          {!isPaid && (
            <button className="flex-1 btn-green py-3 rounded-2xl font-bold shadow" onClick={markPaid}>💵 Mark as Paid!</button>
          )}
        </div>
        <button className="w-full border-2 border-gray-300 text-gray-600 py-3 rounded-2xl font-bold hover:bg-gray-50"
          onClick={() => setSubView('visit')}>← Back to Visit</button>
      </div>
    );
  };

  const AmbulanceView = () => {
    if (!selVisit) return null;
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-3xl p-4 text-center shadow">
          <div className="text-3xl mb-1">🚑</div>
          <h2 className="text-xl font-extrabold">Pet Ambulance</h2>
          <p className="text-orange-100 text-sm">Dispatch for {selPat?.animalName}</p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5 space-y-4">
          <div>
            <label className="label mb-2">Type of Service</label>
            <div className="grid grid-cols-2 gap-3">
              {[['pickup','🏠 → 🏥\nPickup from Home'],['delivery','🏥 → 🏠\nDeliver Home']].map(([v,l])=>(
                <button key={v}
                  onClick={()=>setAmbulanceForm(f=>({...f,type:v}))}
                  className={`py-4 rounded-2xl font-bold border-2 text-sm whitespace-pre-line transition-all ${ambulanceForm.type===v?'bg-orange-500 text-white border-orange-500':'bg-white text-gray-600 border-gray-200 hover:border-orange-300'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">{ambulanceForm.type === 'pickup' ? 'Pickup Address' : 'Delivery Address'}</label>
            <input className="input" placeholder="Enter address…" value={ambulanceForm.address}
              onChange={e=>setAmbulanceForm(f=>({...f,address:e.target.value}))} />
          </div>

          <div>
            <label className="label">Notes for Driver</label>
            <textarea className="input min-h-[80px]" placeholder="Any special instructions for the ambulance driver?"
              value={ambulanceForm.notes}
              onChange={e=>setAmbulanceForm(f=>({...f,notes:e.target.value}))} />
          </div>

          <div>
            <label className="label mb-2">Ambulance Status</label>
            <div className="grid grid-cols-3 gap-2">
              {[['pending','⏳ Pending','bg-amber-400'],['dispatched','🚑 Dispatched!','bg-orange-500'],['arrived','✅ Arrived!','bg-green-500']].map(([v,l,ac])=>(
                <button key={v}
                  onClick={()=>setAmbulanceForm(f=>({...f,status:v}))}
                  className={`py-2 rounded-xl font-bold border-2 text-sm transition-all ${ambulanceForm.status===v?`${ac} text-white border-transparent`:'bg-white text-gray-600 border-gray-200'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex-1 border-2 border-gray-300 text-gray-600 py-3 rounded-2xl font-bold hover:bg-gray-50"
            onClick={() => setSubView('visit')}>← Cancel</button>
          <button className="flex-[2] bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-2xl font-bold shadow-lg"
            onClick={saveAmbulance}>🚑 Dispatch Ambulance!</button>
        </div>
      </div>
    );
  };

  // ── Small shared components ──────────────────────────────────────────────────
  const PatAvatar = ({ pat, size, ring }) => (
    pat?.photo
      ? <img src={pat.photo} alt={pat?.animalName}
          className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0 ${ring ? 'border-4 border-pink-300' : ''}`} />
      : <div className={`w-${size} h-${size} rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0 ${ring ? 'border-4 border-pink-200' : ''}`}
          style={{ fontSize: `${Math.round(size * 0.45)}px` }}>
          {emojiFor(pat?.species)}
        </div>
  );

  const InfoBlock = ({ label, value, color = 'gray' }) => {
    const colors = {
      gray:   'bg-gray-50 text-gray-500',
      blue:   'bg-blue-50 text-blue-600',
      green:  'bg-green-50 text-green-600',
      yellow: 'bg-yellow-50 text-yellow-600',
    };
    return (
      <div className={`${colors[color].split(' ')[0]} rounded-xl p-3`}>
        <p className={`text-xs font-bold uppercase mb-1 ${colors[color].split(' ')[1]}`}>{label}</p>
        <p className="text-gray-800 text-sm">{value}</p>
      </div>
    );
  };

  // ── Breadcrumb ───────────────────────────────────────────────────────────────
  const Breadcrumb = () => {
    if (view === 'dashboard') return null;
    const subLabels = { info: null, visit: '📅 Visit', report: '📋 Report', discharge: '🏠 Discharge', invoice: '💰 Invoice', ambulance: '🚑 Ambulance' };
    return (
      <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-2 text-sm flex-wrap sticky top-0 z-20 shadow-sm">
        <button onClick={() => setView('dashboard')} className="text-pink-500 font-semibold hover:text-pink-700">🏥 R&amp;R Hospital</button>
        {view === 'checkin' && <><span className="text-gray-300">›</span><span className="text-gray-600 font-semibold">Check-In</span></>}
        {view === 'records' && <><span className="text-gray-300">›</span><span className="text-gray-600 font-semibold">Records</span></>}
        {view === 'patient' && (
          <>
            <span className="text-gray-300">›</span>
            <button onClick={() => setSubView('info')} className="text-purple-500 font-semibold hover:text-purple-700">
              {emojiFor(selPat?.species)} {selPat?.animalName}
            </button>
            {subView === 'visit' && <><span className="text-gray-300">›</span><span className="text-gray-600 font-semibold">📅 Visit</span></>}
            {subLabels[subView] && subView !== 'visit' && <><span className="text-gray-300">›</span><span className="text-gray-600 font-semibold">{subLabels[subView]}</span></>}
          </>
        )}
      </div>
    );
  };

  // ── Render the correct patient subview ──────────────────────────────────────
  const PatientView = () => {
    if (subView === 'visit')      return VisitDetail();
    if (subView === 'report')     return MedicalReport();
    if (subView === 'discharge')  return DischargeFormView();
    if (subView === 'invoice')    return InvoiceView();
    if (subView === 'ambulance')  return AmbulanceView();
    return PatientDetail();
  };

  // ─── STAFF LOGIN ─────────────────────────────────────────────────────────────
  const handleLogin = (e) => {
    e.preventDefault();
    if (pwInput.toLowerCase() === STAFF_PASSWORD) {
      sessionStorage.setItem('rrStaff', '1');
      setIsStaff(true);
      setShowLogin(false);
      setPwError(false);
      setPwInput('');
    } else {
      setPwError(true);
      setPwInput('');
    }
  };

  // ─── PUBLIC PAGE ─────────────────────────────────────────────────────────────
  const pubSubmitCheckIn = () => {
    const patId   = genId();
    const visitId = genId();
    const visit = {
      id: visitId,
      checkInDate: today(), checkInTime: nowTime(),
      chiefComplaint: pubForm.complaint,
      symptoms: [], urgency: pubForm.urgency,
      doctorName: '', status: 'waiting',
      ambulanceRequested: false, ambulancePickupType: 'pickup', ambulanceAddress: '',
      diagnosis: '', treatment: '', medications: [], notes: '',
      dischargeDate: null, dischargeTime: null, dischargeInstructions: '',
      followUpDate: '', deliveryType: null, deliveryAddress: '', dischargeMeds: [],
      services: [], totalAmount: 0, paymentStatus: 'pending',
      ambulanceStatus: null, ambulanceNotes: '',
    };
    const patient = { id: patId, animalName: pubForm.animalName, species: pubForm.species,
      breed: '', birthday: '', color: '', photo: '',
      ownerName: pubForm.ownerName, ownerPhone: '', ownerEmail: '', ownerAddress: '',
      createdAt: today(), visits: [visit] };
    updatePatients(ps => [...ps, patient]);
    setPubConfirmId(patId);
    setPubView('confirmed');
    setPubForm({ animalName: '', species: 'dog', ownerName: '', complaint: '', urgency: 'routine' });
  };

  if (!isStaff) {
    // Header shared by all public views
    const PubHeader = ({ back }) => (
      <div className="bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600 text-white px-6 pt-8 pb-6 text-center relative">
        {back && (
          <button onClick={() => setPubView('home')}
            className="absolute left-4 top-6 text-pink-200 hover:text-white text-sm font-semibold">
            ← Back
          </button>
        )}
        <div className="text-5xl mb-1">🏥🐾</div>
        <h1 className="text-3xl font-extrabold tracking-tight">Rose &amp; Ruth&apos;s</h1>
        <p className="text-lg font-bold text-pink-100">Animal Hospital</p>
      </div>
    );

    // ── Confirmed ─────────────────────────────────────────────────────────────
    if (pubView === 'confirmed') {
      const confirmedPat = patients.find(p => p.id === pubConfirmId);
      const qPos = patients.filter(p => p.visits?.some(v => v.status === 'waiting')).length;
      return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex flex-col">
          {PubHeader({})}
          <div className="flex-1 px-5 py-8 max-w-sm mx-auto w-full space-y-5">
            <div className="bg-white rounded-3xl shadow-xl p-7 text-center space-y-3">
              <div className="text-6xl">🎉</div>
              <h2 className="text-2xl font-extrabold text-green-600">You&apos;re Checked In!</h2>
              <p className="text-gray-700 font-semibold text-lg">{confirmedPat?.animalName} is on the list!</p>
              <p className="text-gray-400 text-sm">Please have a seat — our vets will call you shortly.</p>
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 mt-2">
                <p className="text-xs font-bold text-amber-600 uppercase mb-1">Position in Queue</p>
                <p className="text-4xl font-extrabold text-amber-700">#{qPos}</p>
              </div>
            </div>
            <button onClick={() => setPubView('lookup')}
              className="w-full bg-purple-100 text-purple-700 font-bold py-3.5 rounded-2xl hover:bg-purple-200 transition-all">
              🔍 Check Visit Status
            </button>
            <button onClick={() => setPubView('home')}
              className="w-full border-2 border-gray-200 text-gray-500 font-semibold py-3 rounded-2xl hover:bg-gray-50">
              ← Back to Home
            </button>
          </div>
          <div className="text-center pb-5">{StaffLoginLink()}</div>
        </div>
      );
    }

    // ── Self Check-In form ────────────────────────────────────────────────────
    if (pubView === 'checkin') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex flex-col pb-10">
          {PubHeader({ back: true })}
          <div className="flex-1 px-5 py-5 max-w-sm mx-auto w-full space-y-4">
            <div className="bg-white rounded-3xl shadow p-5 space-y-4">
              <h2 className="text-xl font-extrabold text-pink-600">🐾 Check In Your Pet</h2>
              <div>
                <label className="label">Your Pet&apos;s Name <span className="text-red-400">*</span></label>
                <input className="input" placeholder="e.g. Fluffy" value={pubForm.animalName}
                  onChange={e => setPubForm(f => ({ ...f, animalName: e.target.value }))} />
              </div>
              <div>
                <label className="label">Type of Animal</label>
                <select className="input" value={pubForm.species}
                  onChange={e => setPubForm(f => ({ ...f, species: e.target.value }))}>
                  {Object.entries(ANIMAL_EMOJI).map(([s, emoji]) => (
                    <option key={s} value={s}>{emoji} {s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Your Name <span className="text-red-400">*</span></label>
                <input className="input" placeholder="Owner's name" value={pubForm.ownerName}
                  onChange={e => setPubForm(f => ({ ...f, ownerName: e.target.value }))} />
              </div>
              <div>
                <label className="label">What&apos;s wrong? <span className="text-red-400">*</span></label>
                <textarea className="input min-h-[80px]" placeholder="Describe what's going on with your pet…"
                  value={pubForm.complaint}
                  onChange={e => setPubForm(f => ({ ...f, complaint: e.target.value }))} />
              </div>
              <div>
                <label className="label mb-2">How urgent is it?</label>
                <div className="grid grid-cols-3 gap-2">
                  {[['routine','✅ Routine','border-green-400 bg-green-500'],['urgent','⚡ Urgent','border-amber-400 bg-amber-400'],['emergency','🚨 Emergency','border-red-500 bg-red-500']].map(([val, lbl, ac]) => (
                    <button key={val} onClick={() => setPubForm(f => ({ ...f, urgency: val }))}
                      className={`py-2 rounded-xl text-sm font-bold border-2 transition-all ${pubForm.urgency === val ? `${ac} text-white` : 'border-gray-200 text-gray-500 bg-white'}`}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              disabled={!pubForm.animalName || !pubForm.ownerName || !pubForm.complaint}
              onClick={pubSubmitCheckIn}
              className="w-full btn-pink py-4 rounded-2xl font-extrabold text-lg shadow-lg disabled:opacity-40 disabled:cursor-not-allowed">
              Check In! 🏥
            </button>
          </div>
        </div>
      );
    }

    // ── Visit Lookup ──────────────────────────────────────────────────────────
    if (pubView === 'lookup') {
      const lookupResults = pubSearch
        ? patients.filter(p =>
            p.animalName?.toLowerCase().includes(pubSearch.toLowerCase()) ||
            p.ownerName?.toLowerCase().includes(pubSearch.toLowerCase()))
        : [];
      return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex flex-col pb-10">
          {PubHeader({ back: true })}
          <div className="flex-1 px-5 py-5 max-w-sm mx-auto w-full space-y-4">
            <div className="bg-white rounded-3xl shadow p-5 space-y-3">
              <h2 className="text-xl font-extrabold text-purple-600">🔍 Look Up Your Visit</h2>
              <input className="input" placeholder="Search by pet name or your name…"
                value={pubSearch}
                onChange={e => setPubSearch(e.target.value)}
                autoFocus />
            </div>
            {pubSearch && lookupResults.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-4">No patients found. Try a different name.</p>
            )}
            {lookupResults.map(p => {
              const activeVisit = p.visits?.find(v => v.status !== 'discharged');
              const lastVisit   = p.visits?.[p.visits.length - 1];
              const showVisit   = activeVisit || lastVisit;
              return (
                <div key={p.id} className="bg-white rounded-3xl shadow p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{emojiFor(p.species)}</span>
                    <div>
                      <div className="font-extrabold text-gray-800 text-lg">{p.animalName}</div>
                      <div className="text-sm text-gray-400">Owner: {p.ownerName}</div>
                    </div>
                    {showVisit && (
                      <span className={`ml-auto text-xs px-2 py-1 rounded-full font-semibold border ${STATUS[showVisit.status]?.cls}`}>
                        {STATUS[showVisit.status]?.label}
                      </span>
                    )}
                  </div>
                  {showVisit && (
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-1.5 text-sm">
                      <div><span className="text-gray-400">Reason: </span><span className="text-gray-700">{showVisit.chiefComplaint}</span></div>
                      {showVisit.doctorName && <div><span className="text-gray-400">Doctor: </span><span className="text-gray-700">{showVisit.doctorName}</span></div>}
                      {showVisit.diagnosis  && <div><span className="text-gray-400">Diagnosis: </span><span className="text-gray-700">{showVisit.diagnosis}</span></div>}
                      {showVisit.status === 'discharged' && showVisit.dischargeInstructions && (
                        <div><span className="text-gray-400">Home care: </span><span className="text-gray-700">{showVisit.dischargeInstructions}</span></div>
                      )}
                      {showVisit.status === 'discharged' && showVisit.followUpDate && (
                        <div><span className="text-gray-400">Follow-up: </span><span className="text-gray-700">{fmtDate(showVisit.followUpDate)}</span></div>
                      )}
                    </div>
                  )}
                  {!showVisit && <p className="text-gray-400 text-sm">No visits on record.</p>}
                </div>
              );
            })}
          </div>
          <div className="text-center pb-5">{StaffLoginLink()}</div>
        </div>
      );
    }

    // ── Home ──────────────────────────────────────────────────────────────────
    const StaffLoginLink = () => !showLogin ? (
      <button onClick={() => { setShowLogin(true); setPwError(false); setPwInput(''); }}
        className="text-gray-300 hover:text-gray-500 text-xs underline underline-offset-2 transition-colors">
        Staff Login
      </button>
    ) : (
      <form onSubmit={handleLogin} className="mx-auto max-w-xs px-5 space-y-3 bg-white rounded-3xl shadow-xl p-6 mb-4">
        <p className="text-center font-bold text-gray-700">👩‍⚕️ Staff Login</p>
        <input type="password" className="input text-center text-lg tracking-widest" placeholder="••••••••"
          value={pwInput} onChange={e => { setPwInput(e.target.value); setPwError(false); }} autoFocus />
        {pwError && <p className="text-center text-red-500 text-sm font-semibold">Wrong password! Try again 🐾</p>}
        <button type="submit"
          className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white py-3 rounded-2xl font-extrabold shadow-lg">
          Enter Clinic 🏥
        </button>
        <button type="button" onClick={() => setShowLogin(false)} className="w-full text-gray-400 text-sm hover:text-gray-600">
          Cancel
        </button>
      </form>
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex flex-col">
        {PubHeader({})}

        <div className="flex-1 px-5 py-6 space-y-4 max-w-sm mx-auto w-full">
          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setPubView('checkin')}
              className="bg-gradient-to-br from-pink-500 to-fuchsia-500 text-white rounded-3xl p-5 text-center shadow-lg hover:shadow-xl transition-all">
              <div className="text-4xl mb-2">🐾</div>
              <div className="font-extrabold text-lg leading-tight">Check In</div>
              <div className="text-pink-100 text-xs mt-0.5">Register your pet</div>
            </button>
            <button onClick={() => { setPubSearch(''); setPubView('lookup'); }}
              className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-3xl p-5 text-center shadow-lg hover:shadow-xl transition-all">
              <div className="text-4xl mb-2">🔍</div>
              <div className="font-extrabold text-lg leading-tight">My Visit</div>
              <div className="text-purple-100 text-xs mt-0.5">See your status</div>
            </button>
          </div>

          {/* Waiting room display */}
          <div className="bg-white rounded-3xl shadow p-5">
            <h3 className="font-bold text-gray-700 text-lg mb-3">🏥 Currently in Clinic</h3>
            {patients.filter(p => p.visits?.some(v => v.status !== 'discharged')).length === 0 ? (
              <div className="text-center py-4 text-gray-400">
                <div className="text-4xl mb-1">😴</div>
                <p className="text-sm">No patients right now — walk-ins welcome!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {patients.filter(p => p.visits?.some(v => v.status !== 'discharged')).map(p => {
                  const v = p.visits.find(v => v.status !== 'discharged');
                  return (
                    <div key={p.id} className="flex items-center gap-3 bg-pink-50 rounded-2xl px-4 py-3">
                      <span className="text-2xl">{emojiFor(p.species)}</span>
                      <div>
                        <div className="font-bold text-gray-800">{p.animalName}</div>
                        <div className="text-xs text-gray-400 capitalize">{p.species}</div>
                      </div>
                      <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold border ${STATUS[v?.status]?.cls}`}>
                        {STATUS[v?.status]?.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-white rounded-3xl shadow p-5 space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2"><span>🕐</span><span><strong>Hours:</strong> Every day · 8am – 8pm</span></div>
            <div className="flex items-center gap-2"><span>📞</span><span><strong>Phone:</strong> (555) PAWS-001</span></div>
            <div className="flex items-center gap-2"><span>📍</span><span><strong>Address:</strong> 1 Animal Hospital Lane</span></div>
          </div>
        </div>

        <div className="text-center pb-6">{StaffLoginLink()}</div>
      </div>
    );
  }

  // ─── MAIN STAFF RENDER ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 pb-24">
      {/* Sync banner */}
      {!IS_CONFIGURED && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-amber-700 text-xs text-center">
          ⚠️ Data is saved on <strong>this device only</strong> — not shared across devices. See <code>src/firebase.js</code> to enable sync.
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-xl text-white font-semibold text-sm animate-bounce ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
          {toast.msg}
        </div>
      )}

      {Breadcrumb()}

      <div className="max-w-lg mx-auto px-4 py-5">
        {view === 'dashboard' && Dashboard()}
        {view === 'checkin'   && CheckIn()}
        {view === 'records'   && Records()}
        {view === 'patient'   && PatientView()}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 px-4 shadow-lg z-10">
        {[
          { id: 'dashboard', label: 'Home',     emoji: '🏥' },
          { id: 'checkin',   label: 'Check In', emoji: '➕' },
          { id: 'records',   label: 'Records',  emoji: '📁' },
        ].map(({ id, label, emoji }) => (
          <button key={id}
            onClick={() => { if (id === 'checkin') { setCiStep('search'); setCiQuery(''); setVisitForm(blankVisitForm()); } setView(id); }}
            className={`flex flex-col items-center gap-0.5 px-5 py-1 rounded-2xl transition-all ${view === id ? 'text-pink-600 bg-pink-50' : 'text-gray-400 hover:text-gray-600'}`}>
            <span className="text-2xl">{emoji}</span>
            <span className="text-xs font-semibold">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
