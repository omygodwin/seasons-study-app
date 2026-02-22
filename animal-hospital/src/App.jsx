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

const timeAgo = (ts) => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const ANIMAL_EMOJI = {
  dog: '🐕', cat: '🐈', rabbit: '🐰', bird: '🦜', hamster: '🐹',
  'guinea pig': '🐹', fish: '🐠', turtle: '🐢', snake: '🐍',
  horse: '🐴', lizard: '🦎', other: '🐾',
};
const emojiFor = (species) => ANIMAL_EMOJI[(species || '').toLowerCase()] || '🐾';

const STATUS = {
  waiting:        { label: '⏳ Waiting',    cls: 'bg-amber-100 text-amber-800 border-amber-300' },
  'in-treatment': { label: '🔬 Treatment',  cls: 'bg-blue-100 text-blue-800 border-blue-300' },
  discharged:     { label: '✅ Discharged', cls: 'bg-green-100 text-green-800 border-green-300' },
};
const URGENCY = {
  routine:   { label: '✅ Routine',   cls: 'bg-green-100 text-green-800',  dot: 'bg-green-400' },
  urgent:    { label: '⚡ Urgent',    cls: 'bg-amber-100 text-amber-800',  dot: 'bg-amber-400' },
  emergency: { label: '🚨 Emergency', cls: 'bg-red-100 text-red-800',      dot: 'bg-red-500'   },
};

const PRESET_SERVICES = [
  { name: 'Wellness Checkup', price: 25 }, { name: 'Emergency Visit', price: 75 },
  { name: 'Vaccination', price: 15 }, { name: 'X-Ray Scan', price: 40 },
  { name: 'Wound Care & Bandaging', price: 20 }, { name: 'Medication', price: 10 },
  { name: 'Surgery', price: 150 }, { name: 'Dental Cleaning', price: 35 },
  { name: 'Lab Tests', price: 30 }, { name: 'Overnight Stay', price: 50 },
  { name: 'Grooming', price: 25 }, { name: 'Microchipping', price: 20 },
  { name: 'Physical Therapy', price: 45 }, { name: 'Ambulance Pickup', price: 30 },
  { name: 'Home Delivery', price: 30 }, { name: 'Nutrition Consult', price: 20 },
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
  checkInDate: today(), checkInTime: nowTime(), chiefComplaint: '', symptoms: [],
  urgency: 'routine', doctorName: '', ambulanceRequested: false,
  ambulancePickupType: 'pickup', ambulanceAddress: '',
});

const blankPatientForm = () => ({
  animalName: '', species: 'dog', breed: '', birthday: '', color: '', photo: '',
  ownerName: '', ownerPhone: '', ownerEmail: '', ownerAddress: '',
});

// ─── TREATMENT TIMER CONSTANTS ──────────────────────────────────────────────

const TREATMENT_STAGES = [
  { key: 'checkin',     label: 'Check-In',    emoji: '📋', defaultMinutes: 10 },
  { key: 'examination', label: 'Exam',        emoji: '🔍', defaultMinutes: 15 },
  { key: 'diagnosis',   label: 'Diagnosis',   emoji: '🧪', defaultMinutes: 20 },
  { key: 'treatment',   label: 'Treatment',   emoji: '💉', defaultMinutes: 30 },
  { key: 'observation', label: 'Observation', emoji: '👀', defaultMinutes: 45 },
  { key: 'discharge',   label: 'Discharge',   emoji: '🏠', defaultMinutes: 10 },
];

const URGENCY_TIME_MULT = { routine: 1.0, urgent: 0.75, emergency: 0.5 };

// ─── AI TREATMENT RULES ENGINE ──────────────────────────────────────────────

const SYMPTOM_CONDITION_MAP = {
  'Not eating': [
    { condition: 'Gastrointestinal upset', confidence: 'high', related: ['Vomiting', 'Diarrhea', 'Lethargy'] },
    { condition: 'Dental disease', confidence: 'medium', related: [] },
    { condition: 'Stress/anxiety', confidence: 'low', related: ['Hiding/Withdrawn', 'Shaking/Trembling'] },
    { condition: 'Intestinal parasites', confidence: 'medium', related: ['Diarrhea', 'Lethargy'] },
  ],
  'Vomiting': [
    { condition: 'Gastrointestinal upset', confidence: 'high', related: ['Not eating', 'Diarrhea', 'Lethargy'] },
    { condition: 'Foreign body ingestion', confidence: 'medium', related: ['Not eating', 'Lethargy'] },
    { condition: 'Pancreatitis', confidence: 'medium', related: ['Not eating', 'Lethargy', 'Diarrhea'] },
  ],
  'Diarrhea': [
    { condition: 'Gastrointestinal upset', confidence: 'high', related: ['Vomiting', 'Not eating', 'Lethargy'] },
    { condition: 'Intestinal parasites', confidence: 'high', related: ['Lethargy', 'Not eating'] },
    { condition: 'Dietary indiscretion', confidence: 'medium', related: ['Vomiting'] },
  ],
  'Lethargy': [
    { condition: 'Infection', confidence: 'medium', related: ['Not eating', 'Shaking/Trembling'] },
    { condition: 'Pain/discomfort', confidence: 'medium', related: ['Hiding/Withdrawn'] },
    { condition: 'Anemia', confidence: 'low', related: ['Not eating'] },
  ],
  'Limping': [
    { condition: 'Sprain/strain', confidence: 'high', related: ['Swelling'] },
    { condition: 'Fracture', confidence: 'medium', related: ['Swelling', 'Wound/Injury'] },
    { condition: 'Arthritis', confidence: 'medium', related: ['Lethargy'] },
    { condition: 'Paw pad injury', confidence: 'medium', related: ['Wound/Injury'] },
  ],
  'Coughing': [
    { condition: 'Upper respiratory infection', confidence: 'high', related: ['Sneezing', 'Eye/Nose Discharge'] },
    { condition: 'Kennel cough', confidence: 'high', related: ['Sneezing'] },
    { condition: 'Allergies', confidence: 'medium', related: ['Sneezing', 'Itching/Scratching'] },
  ],
  'Sneezing': [
    { condition: 'Upper respiratory infection', confidence: 'high', related: ['Coughing', 'Eye/Nose Discharge'] },
    { condition: 'Allergies', confidence: 'medium', related: ['Itching/Scratching', 'Eye/Nose Discharge'] },
  ],
  'Eye/Nose Discharge': [
    { condition: 'Upper respiratory infection', confidence: 'high', related: ['Coughing', 'Sneezing'] },
    { condition: 'Conjunctivitis', confidence: 'medium', related: [] },
    { condition: 'Allergies', confidence: 'medium', related: ['Sneezing', 'Itching/Scratching'] },
  ],
  'Itching/Scratching': [
    { condition: 'Fleas/parasites', confidence: 'high', related: ['Hair Loss'] },
    { condition: 'Allergic dermatitis', confidence: 'high', related: ['Hair Loss', 'Swelling'] },
    { condition: 'Skin infection', confidence: 'medium', related: ['Hair Loss', 'Swelling'] },
  ],
  'Hair Loss': [
    { condition: 'Fleas/parasites', confidence: 'high', related: ['Itching/Scratching'] },
    { condition: 'Allergic dermatitis', confidence: 'medium', related: ['Itching/Scratching'] },
    { condition: 'Hormonal imbalance', confidence: 'low', related: ['Lethargy', 'Drinking Excessively'] },
  ],
  'Swelling': [
    { condition: 'Abscess', confidence: 'high', related: ['Wound/Injury', 'Lethargy'] },
    { condition: 'Allergic reaction', confidence: 'medium', related: ['Itching/Scratching'] },
    { condition: 'Fracture', confidence: 'medium', related: ['Limping'] },
  ],
  'Wound/Injury': [
    { condition: 'Laceration', confidence: 'high', related: ['Swelling'] },
    { condition: 'Bite wound', confidence: 'medium', related: ['Swelling'] },
    { condition: 'Abscess', confidence: 'medium', related: ['Swelling', 'Lethargy'] },
  ],
  'Difficulty Breathing': [
    { condition: 'Pneumonia', confidence: 'high', related: ['Coughing', 'Lethargy'] },
    { condition: 'Asthma', confidence: 'medium', related: ['Coughing'] },
    { condition: 'Heart disease', confidence: 'medium', related: ['Coughing', 'Lethargy'] },
  ],
  'Drinking Excessively': [
    { condition: 'Kidney disease', confidence: 'medium', related: ['Lethargy', 'Not eating'] },
    { condition: 'Diabetes', confidence: 'medium', related: ['Lethargy'] },
    { condition: 'Urinary tract infection', confidence: 'medium', related: [] },
  ],
  'Hiding/Withdrawn': [
    { condition: 'Stress/anxiety', confidence: 'high', related: ['Not eating', 'Shaking/Trembling'] },
    { condition: 'Pain/discomfort', confidence: 'medium', related: ['Lethargy'] },
  ],
  'Shaking/Trembling': [
    { condition: 'Pain/discomfort', confidence: 'high', related: ['Lethargy', 'Hiding/Withdrawn'] },
    { condition: 'Stress/anxiety', confidence: 'medium', related: ['Hiding/Withdrawn', 'Not eating'] },
    { condition: 'Toxin exposure', confidence: 'medium', related: ['Vomiting', 'Diarrhea'] },
  ],
};

const CONDITION_TREATMENT_MAP = {
  'Gastrointestinal upset': {
    treatment: 'Fluid therapy, bland diet protocol, anti-nausea medication, monitoring vitals',
    medications: [{ name: 'Anti-nausea', dosage: 'As directed', frequency: 'Every 8 hours' }, { name: 'Vitamins/Supplements', dosage: 'Probiotics', frequency: 'Once daily' }],
    estimatedMinutes: { examination: 15, diagnosis: 10, treatment: 30, observation: 60 },
    homeCare: 'Feed bland diet (boiled chicken and rice) for 3-5 days. Ensure fresh water. Return if symptoms worsen.',
  },
  'Dental disease': {
    treatment: 'Dental examination, cleaning under sedation if needed, pain management',
    medications: [{ name: 'Pain Medication', dosage: 'As directed', frequency: 'Every 12 hours for 5 days' }, { name: 'Antibiotics', dosage: 'As directed', frequency: 'Twice daily for 7 days' }],
    estimatedMinutes: { examination: 15, diagnosis: 15, treatment: 60, observation: 30 },
    homeCare: 'Soft food only for 5-7 days. Complete all antibiotics. Brush teeth gently after healing.',
  },
  'Stress/anxiety': {
    treatment: 'Environmental enrichment counseling, calming techniques, possible anxiolytic medication',
    medications: [{ name: 'Vitamins/Supplements', dosage: 'Calming supplement', frequency: 'Once daily' }],
    estimatedMinutes: { examination: 15, diagnosis: 10, treatment: 15, observation: 20 },
    homeCare: 'Provide quiet, safe space. Maintain routine. Consider pheromone diffusers.',
  },
  'Intestinal parasites': {
    treatment: 'Fecal test, deworming medication, supportive care',
    medications: [{ name: 'Dewormer', dosage: 'Weight-based', frequency: 'Once, repeat in 2 weeks' }, { name: 'Vitamins/Supplements', dosage: 'Probiotics', frequency: 'Once daily for 7 days' }],
    estimatedMinutes: { examination: 10, diagnosis: 15, treatment: 15, observation: 15 },
    homeCare: 'Clean all bedding. Pick up waste promptly. Repeat deworming as directed.',
  },
  'Foreign body ingestion': {
    treatment: 'X-ray imaging, possible endoscopy or surgery, IV fluids, monitoring',
    medications: [{ name: 'Anti-nausea', dosage: 'As directed', frequency: 'Every 8 hours' }, { name: 'Pain Medication', dosage: 'As directed', frequency: 'Every 12 hours' }],
    estimatedMinutes: { examination: 15, diagnosis: 30, treatment: 90, observation: 120 },
    homeCare: 'Monitor closely for vomiting or distress. Restrict activity. Follow up within 48 hours.',
  },
  'Pancreatitis': {
    treatment: 'IV fluid therapy, pain management, anti-nausea, fasting then bland diet',
    medications: [{ name: 'Anti-nausea', dosage: 'As directed', frequency: 'Every 8 hours' }, { name: 'Pain Medication', dosage: 'As directed', frequency: 'Every 12 hours' }],
    estimatedMinutes: { examination: 15, diagnosis: 20, treatment: 45, observation: 90 },
    homeCare: 'Low-fat diet permanently. Small frequent meals. Follow up in 1 week.',
  },
  'Dietary indiscretion': {
    treatment: 'Supportive care, bland diet, monitoring',
    medications: [{ name: 'Anti-nausea', dosage: 'As directed', frequency: 'As needed' }],
    estimatedMinutes: { examination: 10, diagnosis: 10, treatment: 15, observation: 30 },
    homeCare: 'Bland diet for 2-3 days. Ensure hydration. Keep away from garbage.',
  },
  'Infection': {
    treatment: 'Culture and sensitivity testing, antibiotic therapy, supportive care',
    medications: [{ name: 'Antibiotics', dosage: 'As directed', frequency: 'Twice daily for 10-14 days' }],
    estimatedMinutes: { examination: 15, diagnosis: 20, treatment: 20, observation: 30 },
    homeCare: 'Complete full course of antibiotics. Monitor temperature. Return if fever develops.',
  },
  'Pain/discomfort': {
    treatment: 'Pain assessment, appropriate analgesic therapy, identify underlying cause',
    medications: [{ name: 'Pain Medication', dosage: 'As directed', frequency: 'Every 8-12 hours' }],
    estimatedMinutes: { examination: 15, diagnosis: 20, treatment: 15, observation: 30 },
    homeCare: 'Rest and restricted activity. Give pain meds as prescribed. Follow up if pain worsens.',
  },
  'Anemia': {
    treatment: 'Blood work, determine cause, possible transfusion, iron supplementation',
    medications: [{ name: 'Vitamins/Supplements', dosage: 'Iron supplement', frequency: 'Once daily' }],
    estimatedMinutes: { examination: 15, diagnosis: 30, treatment: 30, observation: 60 },
    homeCare: 'High-quality diet. Monitor energy levels. Follow up for blood work in 1 week.',
  },
  'Sprain/strain': {
    treatment: 'Rest, cold compress, anti-inflammatory medication, possible bandaging',
    medications: [{ name: 'Anti-inflammatory', dosage: 'As directed', frequency: 'Once daily for 7 days' }, { name: 'Pain Medication', dosage: 'As directed', frequency: 'Every 12 hours as needed' }],
    estimatedMinutes: { examination: 15, diagnosis: 10, treatment: 20, observation: 20 },
    homeCare: 'Strict rest for 7-10 days. Short leash walks only. Cold compress 10 min 3x daily.',
  },
  'Fracture': {
    treatment: 'X-ray imaging, splinting or surgical repair, pain management',
    medications: [{ name: 'Pain Medication', dosage: 'As directed', frequency: 'Every 8 hours' }, { name: 'Anti-inflammatory', dosage: 'As directed', frequency: 'Once daily' }],
    estimatedMinutes: { examination: 15, diagnosis: 20, treatment: 120, observation: 60 },
    homeCare: 'Strict cage rest. No jumping or running. Keep bandage dry. Follow up in 1 week.',
  },
  'Arthritis': {
    treatment: 'Joint supplements, pain management, weight management, physical therapy',
    medications: [{ name: 'Anti-inflammatory', dosage: 'As directed', frequency: 'Once daily' }, { name: 'Vitamins/Supplements', dosage: 'Joint supplement', frequency: 'Once daily' }],
    estimatedMinutes: { examination: 15, diagnosis: 10, treatment: 15, observation: 15 },
    homeCare: 'Moderate gentle exercise daily. Keep at healthy weight. Provide soft bedding.',
  },
  'Paw pad injury': {
    treatment: 'Wound cleaning, bandaging, pain management',
    medications: [{ name: 'Pain Medication', dosage: 'As directed', frequency: 'Every 12 hours' }],
    estimatedMinutes: { examination: 10, diagnosis: 5, treatment: 20, observation: 15 },
    homeCare: 'Keep bandage clean and dry. Use booties outdoors. Recheck in 3-5 days.',
  },
  'Upper respiratory infection': {
    treatment: 'Antibiotic therapy, supportive care, rest, steam therapy',
    medications: [{ name: 'Antibiotics', dosage: 'As directed', frequency: 'Twice daily for 7-10 days' }, { name: 'Eye Drops', dosage: '1 drop each eye', frequency: 'Three times daily' }],
    estimatedMinutes: { examination: 10, diagnosis: 10, treatment: 20, observation: 30 },
    homeCare: 'Keep in warm, quiet area. Use humidifier. Complete antibiotics. Isolate from other pets.',
  },
  'Kennel cough': {
    treatment: 'Cough suppressant, rest, isolation, antibiotics if bacterial',
    medications: [{ name: 'Antibiotics', dosage: 'As directed', frequency: 'Twice daily for 10 days' }],
    estimatedMinutes: { examination: 10, diagnosis: 10, treatment: 15, observation: 20 },
    homeCare: 'Isolate from other dogs for 2 weeks. Use harness instead of collar. Rest.',
  },
  'Allergies': {
    treatment: 'Identify allergen, antihistamine therapy, possible hypoallergenic diet',
    medications: [{ name: 'Antihistamine', dosage: 'As directed', frequency: 'Once or twice daily' }],
    estimatedMinutes: { examination: 15, diagnosis: 15, treatment: 15, observation: 20 },
    homeCare: 'Avoid known allergens. Hypoallergenic shampoo weekly. Monitor for flare-ups.',
  },
  'Conjunctivitis': {
    treatment: 'Eye examination, antibiotic eye drops, warm compress',
    medications: [{ name: 'Eye Drops', dosage: '1-2 drops per eye', frequency: 'Three times daily for 7 days' }],
    estimatedMinutes: { examination: 10, diagnosis: 10, treatment: 10, observation: 15 },
    homeCare: 'Apply eye drops as directed. Clean discharge with warm damp cloth.',
  },
  'Fleas/parasites': {
    treatment: 'Topical flea treatment, environmental decontamination advice',
    medications: [{ name: 'Flea Treatment', dosage: 'Topical', frequency: 'Once, repeat in 30 days' }, { name: 'Antihistamine', dosage: 'As directed', frequency: 'As needed' }],
    estimatedMinutes: { examination: 10, diagnosis: 5, treatment: 15, observation: 15 },
    homeCare: 'Wash all bedding in hot water. Vacuum thoroughly. Treat all pets in household.',
  },
  'Allergic dermatitis': {
    treatment: 'Anti-itch medication, medicated shampoo, allergy testing if chronic',
    medications: [{ name: 'Antihistamine', dosage: 'As directed', frequency: 'Twice daily' }, { name: 'Anti-inflammatory', dosage: 'Short course', frequency: 'Once daily' }],
    estimatedMinutes: { examination: 15, diagnosis: 15, treatment: 20, observation: 20 },
    homeCare: 'Medicated baths 1-2x per week. Avoid known triggers. Monitor for hot spots.',
  },
  'Skin infection': {
    treatment: 'Antibiotics, medicated shampoo, wound care if needed',
    medications: [{ name: 'Antibiotics', dosage: 'As directed', frequency: 'Twice daily for 14 days' }],
    estimatedMinutes: { examination: 10, diagnosis: 10, treatment: 20, observation: 20 },
    homeCare: 'Complete antibiotics. Medicated shampoo as directed. Keep area clean and dry.',
  },
  'Hormonal imbalance': {
    treatment: 'Blood work for hormone levels, appropriate hormone therapy',
    medications: [{ name: 'Vitamins/Supplements', dosage: 'As directed', frequency: 'Once daily' }],
    estimatedMinutes: { examination: 15, diagnosis: 30, treatment: 15, observation: 20 },
    homeCare: 'Administer medications as prescribed. Follow up for blood work in 4-6 weeks.',
  },
  'Abscess': {
    treatment: 'Lance and drain, flush wound, antibiotics, pain management',
    medications: [{ name: 'Antibiotics', dosage: 'As directed', frequency: 'Twice daily for 10-14 days' }, { name: 'Pain Medication', dosage: 'As directed', frequency: 'Every 12 hours' }],
    estimatedMinutes: { examination: 10, diagnosis: 10, treatment: 30, observation: 30 },
    homeCare: 'Keep wound clean. Warm compress 3x daily. Complete antibiotics.',
  },
  'Allergic reaction': {
    treatment: 'Antihistamine injection, monitoring, epinephrine if severe',
    medications: [{ name: 'Antihistamine', dosage: 'Injectable then oral', frequency: 'As directed' }],
    estimatedMinutes: { examination: 10, diagnosis: 5, treatment: 15, observation: 60 },
    homeCare: 'Monitor closely for 24 hours. Avoid allergen. Seek emergency care if swelling returns.',
  },
  'Laceration': {
    treatment: 'Wound cleaning, suturing if needed, bandaging, antibiotics',
    medications: [{ name: 'Antibiotics', dosage: 'As directed', frequency: 'Twice daily for 7 days' }, { name: 'Pain Medication', dosage: 'As directed', frequency: 'Every 12 hours' }],
    estimatedMinutes: { examination: 10, diagnosis: 5, treatment: 30, observation: 20 },
    homeCare: 'Keep wound clean and dry. Use cone to prevent licking. Change bandage daily.',
  },
  'Bite wound': {
    treatment: 'Wound cleaning, antibiotics, pain management, possible drain',
    medications: [{ name: 'Antibiotics', dosage: 'As directed', frequency: 'Twice daily for 10-14 days' }, { name: 'Pain Medication', dosage: 'As directed', frequency: 'Every 8-12 hours' }],
    estimatedMinutes: { examination: 10, diagnosis: 10, treatment: 30, observation: 30 },
    homeCare: 'Monitor for infection. Complete antibiotics. Keep away from other animals.',
  },
  'Pneumonia': {
    treatment: 'Chest X-ray, antibiotic therapy, oxygen therapy if needed',
    medications: [{ name: 'Antibiotics', dosage: 'As directed', frequency: 'Twice daily for 14 days' }],
    estimatedMinutes: { examination: 15, diagnosis: 20, treatment: 30, observation: 120 },
    homeCare: 'Rest in warm, humid environment. Complete antibiotics. Monitor breathing. Recheck in 3-5 days.',
  },
  'Asthma': {
    treatment: 'Bronchodilator therapy, reduce environmental triggers',
    medications: [{ name: 'Anti-inflammatory', dosage: 'As directed', frequency: 'Once daily' }],
    estimatedMinutes: { examination: 15, diagnosis: 15, treatment: 20, observation: 30 },
    homeCare: 'Avoid smoke, dust, strong scents. Use air purifier. Reduce stress.',
  },
  'Heart disease': {
    treatment: 'Cardiac evaluation, echocardiogram, cardiac medication',
    medications: [{ name: 'Vitamins/Supplements', dosage: 'Cardiac support', frequency: 'Once daily' }],
    estimatedMinutes: { examination: 20, diagnosis: 30, treatment: 20, observation: 30 },
    homeCare: 'Low-sodium diet. Moderate exercise only. Monitor breathing rate at rest.',
  },
  'Kidney disease': {
    treatment: 'Blood work, urinalysis, fluid therapy, renal diet',
    medications: [{ name: 'Vitamins/Supplements', dosage: 'Renal support', frequency: 'Once daily' }],
    estimatedMinutes: { examination: 15, diagnosis: 25, treatment: 30, observation: 30 },
    homeCare: 'Prescription renal diet. Ensure ample fresh water. Recheck in 2-4 weeks.',
  },
  'Diabetes': {
    treatment: 'Blood glucose testing, insulin therapy initiation, diet counseling',
    medications: [{ name: 'Vitamins/Supplements', dosage: 'As directed', frequency: 'With meals' }],
    estimatedMinutes: { examination: 15, diagnosis: 25, treatment: 30, observation: 60 },
    homeCare: 'Consistent feeding schedule. Monitor water intake and urination.',
  },
  'Urinary tract infection': {
    treatment: 'Urinalysis, antibiotic therapy, increased water intake',
    medications: [{ name: 'Antibiotics', dosage: 'As directed', frequency: 'Twice daily for 7-14 days' }, { name: 'Pain Medication', dosage: 'As directed', frequency: 'Every 12 hours for 3 days' }],
    estimatedMinutes: { examination: 10, diagnosis: 15, treatment: 15, observation: 15 },
    homeCare: 'Encourage water intake. Frequent potty breaks. Complete antibiotics.',
  },
  'Toxin exposure': {
    treatment: 'Identify toxin, decontamination, IV fluids, monitoring',
    medications: [{ name: 'Anti-nausea', dosage: 'As directed', frequency: 'Every 8 hours' }],
    estimatedMinutes: { examination: 10, diagnosis: 15, treatment: 30, observation: 120 },
    homeCare: 'Monitor closely for 48 hours. Remove access to toxin. Follow up for blood work.',
  },
};

const generateSuggestion = (symptoms) => {
  if (!symptoms?.length) return null;
  const scores = {};
  const cw = { high: 3, medium: 2, low: 1 };
  symptoms.forEach(sym => {
    (SYMPTOM_CONDITION_MAP[sym] || []).forEach(({ condition, confidence, related }) => {
      if (!scores[condition]) scores[condition] = { score: 0, matched: [] };
      scores[condition].score += cw[confidence];
      if (!scores[condition].matched.includes(sym)) scores[condition].matched.push(sym);
      related.forEach(r => { if (symptoms.includes(r)) scores[condition].score += 1; });
    });
  });
  const ranked = Object.entries(scores).sort(([, a], [, b]) => b.score - a.score).slice(0, 3);
  if (!ranked.length) return null;
  const top = ranked[0][0];
  const info = CONDITION_TREATMENT_MAP[top] || {};
  const te = info.estimatedMinutes || {};
  return {
    conditions: ranked.map(([name, { score, matched }]) => ({ name, score, matched, info: CONDITION_TREATMENT_MAP[name] })),
    topCondition: top,
    treatment: info.treatment || '',
    medications: info.medications || [],
    totalMinutes: 20 + Object.values(te).reduce((s, m) => s + m, 0),
    stageEstimates: { checkin: 10, examination: te.examination || 15, diagnosis: te.diagnosis || 20, treatment: te.treatment || 30, observation: te.observation || 45, discharge: 10 },
    homeCare: info.homeCare || '',
  };
};

// ─── NOTIFICATION TYPES ─────────────────────────────────────────────────────

const NOTIF_TYPES = {
  'check-in':     { emoji: '📋', label: 'Check-In' },
  'emergency':    { emoji: '🚨', label: 'Emergency' },
  'stage-change': { emoji: '⏭️', label: 'Stage Change' },
  'discharge':    { emoji: '🏠', label: 'Discharge' },
  'payment':      { emoji: '💰', label: 'Payment' },
};

const ALERT_SETTINGS_DEFAULT = {
  alertNewCheckIn: true, alertEmergency: true, alertDischarge: true,
  alertPayment: true, alertStageChange: true,
};

const ALERT_TO_NOTIF = {
  alertNewCheckIn: 'check-in', alertEmergency: 'emergency',
  alertStageChange: 'stage-change', alertDischarge: 'discharge', alertPayment: 'payment',
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function App() {
  // ── Auth state ──────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState(() => {
    try { const s = sessionStorage.getItem('rrUser'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [loginMode, setLoginMode] = useState('none'); // none | staff | family | register
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', confirm: '', displayName: '', ownerName: '' });
  const [registerError, setRegisterError] = useState('');
  const [staffAccounts, setStaffAccounts] = useState({});
  const [familyAccounts, setFamilyAccounts] = useState({});

  // ── Core data state ─────────────────────────────────────────────────────────
  const [data, setData] = useState(() => loadData());
  const [view, setView] = useState('dashboard');
  const [subView, setSubView] = useState('info');
  const [selPatId, setSelPatId] = useState(null);
  const [selVisitId, setSelVisitId] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');

  // ── Public page state ───────────────────────────────────────────────────────
  const [pubView, setPubView] = useState('home');
  const [pubForm, setPubForm] = useState({ animalName: '', species: 'dog', ownerName: '', complaint: '', urgency: 'routine' });
  const [pubSearch, setPubSearch] = useState('');
  const [pubConfirmId, setPubConfirmId] = useState(null);

  // ── Check-in wizard state ──────────────────────────────────────────────────
  const [ciStep, setCiStep] = useState('search');
  const [ciQuery, setCiQuery] = useState('');
  const [patForm, setPatForm] = useState(blankPatientForm);
  const [visitForm, setVisitForm] = useState(blankVisitForm);

  // ── Subview form state ─────────────────────────────────────────────────────
  const [reportForm, setReportForm] = useState({ doctorName: '', diagnosis: '', treatment: '', medications: [], notes: '' });
  const [dischargeForm, setDischargeForm] = useState({ dischargeDate: today(), dischargeTime: nowTime(), instructions: '', followUpDate: '', deliveryType: 'owner-pickup', deliveryAddress: '', meds: [] });
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [customSvc, setCustomSvc] = useState({ name: '', price: '' });
  const [ambulanceForm, setAmbulanceForm] = useState({ type: 'pickup', address: '', notes: '', status: 'pending' });

  // ── Notifications state ────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  // ── Timer state ────────────────────────────────────────────────────────────
  const [timers, setTimers] = useState({});
  const [timerTick, setTimerTick] = useState(0);

  // ── Treatment suggestion state ─────────────────────────────────────────────
  const [suggestion, setSuggestion] = useState(null);
  const [showSuggestion, setShowSuggestion] = useState(false);

  // ── Discharge papers state ─────────────────────────────────────────────────
  const [dischargePapers, setDischargePapers] = useState({});
  const [editingPaper, setEditingPaper] = useState(null);

  // ── PWA & Device notifications state ─────────────────────────────────────
  const [notifPermission, setNotifPermission] = useState(() => typeof Notification !== 'undefined' ? Notification.permission : 'denied');
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(true);
  const notifPromptDismissed = useRef(localStorage.getItem('rrNotifDismissed') === '1');
  const seenNotifIds = useRef(new Set());

  const fileRef = useRef(null);

  // ── Derived values ─────────────────────────────────────────────────────────
  const isStaff = currentUser?.role === 'staff';
  const isFamily = currentUser?.role === 'family';
  const isLoggedIn = !!currentUser;
  const patients = data.patients || [];
  const selPat = patients.find(p => p.id === selPatId) || null;
  const selVisit = selPat?.visits?.find(v => v.id === selVisitId) || null;

  const myPatients = isFamily
    ? patients.filter(p => currentUser.patientIds?.includes(p.id) || p.ownerName?.toLowerCase() === currentUser.ownerName?.toLowerCase())
    : patients;

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

  // Staff alert settings
  const mySettings = isStaff ? (staffAccounts[currentUser.username]?.settings || ALERT_SETTINGS_DEFAULT) : {};
  const enabledNotifTypes = Object.entries(mySettings).filter(([, v]) => v).map(([k]) => ALERT_TO_NOTIF[k]).filter(Boolean);
  const filteredNotifs = isStaff ? notifications.filter(n => enabledNotifTypes.includes(n.type)) : [];
  const unreadNotifs = filteredNotifs.filter(n => !n.readBy?.[currentUser?.username]).length;

  // ── PWA helpers ──────────────────────────────────────────────────────────────
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

  const requestNotifPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
    if (result === 'granted') showToast('Device notifications enabled!');
  };

  const sendBrowserNotif = (title, body, tag, isEmergency = false) => {
    if (notifPermission !== 'granted') return;
    try {
      const n = new Notification(title, {
        body,
        icon: '/seasons-study-app/hospital/icon-192.png',
        badge: '/seasons-study-app/hospital/icon-192.png',
        tag: tag || undefined,
        requireInteraction: isEmergency,
      });
      n.onclick = () => { window.focus(); n.close(); };
      if (isEmergency) {
        try { new Audio('/seasons-study-app/hospital/alert.wav').play(); } catch {}
      }
    } catch {}
  };

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') setInstallPrompt(null);
  };

  // ── PWA install prompt listener ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // ── Firebase real-time sync ──────────────────────────────────────────────────
  useEffect(() => {
    if (!IS_CONFIGURED || !db) return;
    const unsubs = [];
    unsubs.push(onValue(ref(db, 'hospital'), (snap) => {
      const val = snap.val();
      if (val) { setData(val); saveData(val); }
    }));
    unsubs.push(onValue(ref(db, 'accounts/staff'), (snap) => {
      const val = snap.val();
      if (!val) {
        // Seed default staff accounts on first run
        const defaults = {
          ruth: { username: 'ruth', password: 'ruth123', displayName: 'Ruth', role: 'staff', settings: ALERT_SETTINGS_DEFAULT },
          rose: { username: 'rose', password: 'rose123', displayName: 'Rose', role: 'staff', settings: ALERT_SETTINGS_DEFAULT },
        };
        set(ref(db, 'accounts/staff'), defaults);
        setStaffAccounts(defaults);
      } else {
        setStaffAccounts(val);
      }
    }));
    unsubs.push(onValue(ref(db, 'accounts/families'), (snap) => {
      setFamilyAccounts(snap.val() || {});
    }));
    unsubs.push(onValue(ref(db, 'notifications'), (snap) => {
      const val = snap.val();
      const arr = val ? Object.entries(val).map(([k, v]) => ({ ...v, id: k })).sort((a, b) => b.timestamp - a.timestamp) : [];
      // Fire browser notification for new items from other tabs (recent = last 30s)
      const cutoff = Date.now() - 30000;
      arr.filter(n => n.timestamp > cutoff && !seenNotifIds.current.has(n.id)).forEach(n => {
        seenNotifIds.current.add(n.id);
        const nt = NOTIF_TYPES[n.type];
        const shouldNotify = isStaff ? enabledNotifTypes.includes(n.type) : (isFamily && n.patientId && currentUser?.patientIds?.includes(n.patientId));
        if (shouldNotify) sendBrowserNotif(`${nt?.emoji || '🔔'} ${nt?.label || 'Alert'}`, n.message, `fb-${n.id}`, n.type === 'emergency');
      });
      setNotifications(arr);
    }));
    unsubs.push(onValue(ref(db, 'timers'), (snap) => {
      setTimers(snap.val() || {});
    }));
    unsubs.push(onValue(ref(db, 'dischargePapers'), (snap) => {
      setDischargePapers(snap.val() || {});
    }));
    return () => unsubs.forEach(u => u());
  }, []);

  // Timer tick - 1 second interval (only when there are active timers and user is logged in)
  const hasActiveTimers = Object.keys(timers).length > 0 && isLoggedIn;
  useEffect(() => {
    if (!hasActiveTimers) return;
    const iv = setInterval(() => setTimerTick(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, [hasActiveTimers]);

  // ── Core helpers ───────────────────────────────────────────────────────────
  const update = (newData) => {
    setData(newData);
    saveData(newData);
    if (IS_CONFIGURED && db) set(ref(db, 'hospital'), newData).catch(console.error);
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
      p.id !== patId ? p : { ...p, visits: p.visits.map(v => v.id !== visitId ? v : { ...v, ...patch }) }
    ));
  };

  const navToPatient = (patId, visitId = null, sub = 'info') => {
    setSelPatId(patId); setSelVisitId(visitId); setSubView(sub); setView('patient');
  };

  // ── Notification helpers ───────────────────────────────────────────────────
  const addNotification = (type, message, patientId, visitId) => {
    const notif = { type, message, patientId: patientId || null, visitId: visitId || null, timestamp: Date.now(), readBy: {} };
    if (IS_CONFIGURED && db) set(ref(db, 'notifications/' + genId()), notif);
    setNotifications(prev => [{ ...notif, id: genId() }, ...prev]);
    // Bridge to Browser Notification API
    const nt = NOTIF_TYPES[type];
    const isEmergency = type === 'emergency';
    if (isStaff && enabledNotifTypes.includes(type)) {
      sendBrowserNotif(`${nt?.emoji || '🔔'} ${nt?.label || 'Alert'}`, message, `notif-${Date.now()}`, isEmergency);
    } else if (isFamily && patientId && currentUser?.patientIds?.includes(patientId)) {
      sendBrowserNotif(`${nt?.emoji || '🔔'} ${nt?.label || 'Alert'}`, message, `notif-${Date.now()}`, isEmergency);
    }
  };

  const markNotifRead = (notifId) => {
    if (!currentUser?.username) return;
    const path = `notifications/${notifId}/readBy/${currentUser.username}`;
    if (IS_CONFIGURED && db) set(ref(db, path), true);
    setNotifications(prev => prev.map(n => n.id !== notifId ? n : { ...n, readBy: { ...n.readBy, [currentUser.username]: true } }));
  };

  const markAllRead = () => {
    if (!currentUser?.username) return;
    filteredNotifs.forEach(n => {
      if (!n.readBy?.[currentUser.username]) markNotifRead(n.id);
    });
  };

  // ── Timer helpers ──────────────────────────────────────────────────────────
  const createTimer = (visitId, urgency, overrides = {}) => {
    const mult = URGENCY_TIME_MULT[urgency] || 1;
    const stages = {};
    TREATMENT_STAGES.forEach(({ key, defaultMinutes }) => {
      stages[key] = { estimatedMinutes: overrides[key] || Math.round(defaultMinutes * mult), startedAt: null, completedAt: null };
    });
    stages.checkin.startedAt = Date.now();
    const td = { stages, currentStage: 'checkin', createdBy: currentUser?.username || 'public' };
    if (IS_CONFIGURED && db) set(ref(db, `timers/${visitId}`), td);
    setTimers(prev => ({ ...prev, [visitId]: td }));
  };

  const advanceStage = (visitId) => {
    const timer = timers[visitId];
    if (!timer) return;
    const keys = TREATMENT_STAGES.map(s => s.key);
    const idx = keys.indexOf(timer.currentStage);
    if (idx < 0 || idx >= keys.length - 1) return;
    const now = Date.now();
    const updated = { ...timer, stages: { ...timer.stages } };
    updated.stages[timer.currentStage] = { ...timer.stages[timer.currentStage], completedAt: now };
    const next = keys[idx + 1];
    updated.stages[next] = { ...timer.stages[next], startedAt: now };
    updated.currentStage = next;
    if (IS_CONFIGURED && db) set(ref(db, `timers/${visitId}`), updated);
    setTimers(prev => ({ ...prev, [visitId]: updated }));
    const pat = patients.find(p => p.visits?.some(v => v.id === visitId));
    addNotification('stage-change', `${pat?.animalName || 'Patient'} moved to ${TREATMENT_STAGES.find(s => s.key === next)?.label}`, pat?.id, visitId);
  };

  const getTimerInfo = (visitId) => {
    void timerTick; // force re-render dependency
    const timer = timers[visitId];
    if (!timer) return null;
    const keys = TREATMENT_STAGES.map(s => s.key);
    const currentIdx = keys.indexOf(timer.currentStage);
    const completedCount = keys.filter(k => timer.stages[k]?.completedAt).length;
    const stage = timer.stages[timer.currentStage];
    if (!stage?.startedAt) return { currentStage: timer.currentStage, currentIdx, completedCount, remainingMin: stage?.estimatedMinutes || 0, pct: 0, overtime: false, stages: timer.stages, totalRemaining: 0 };
    const elapsed = (Date.now() - stage.startedAt) / 60000;
    const remaining = stage.estimatedMinutes - elapsed;
    // Calculate total remaining across all unfinished stages
    let totalRemaining = Math.max(0, remaining);
    for (let i = currentIdx + 1; i < keys.length; i++) {
      totalRemaining += timer.stages[keys[i]]?.estimatedMinutes || 0;
    }
    return { currentStage: timer.currentStage, currentIdx, completedCount, remainingMin: Math.max(0, remaining), pct: Math.min(100, (elapsed / stage.estimatedMinutes) * 100), overtime: remaining < 0, stages: timer.stages, totalRemaining };
  };

  // ── Discharge paper helpers ────────────────────────────────────────────────
  const generateDischargePaper = (patient, visit) => ({
    hospitalName: "Rose & Ruth's Animal Hospital",
    hospitalPhone: "(555) PAWS-001",
    hospitalAddress: "1 Animal Hospital Lane",
    generatedAt: new Date().toISOString(),
    patientName: patient.animalName, species: patient.species, breed: patient.breed || '', color: patient.color || '', birthday: patient.birthday || '', photo: patient.photo || '',
    ownerName: patient.ownerName, ownerPhone: patient.ownerPhone || '', ownerEmail: patient.ownerEmail || '', ownerAddress: patient.ownerAddress || '',
    checkInDate: visit.checkInDate, checkInTime: visit.checkInTime, dischargeDate: visit.dischargeDate || today(), dischargeTime: visit.dischargeTime || nowTime(),
    chiefComplaint: visit.chiefComplaint, symptoms: visit.symptoms || [], urgency: visit.urgency, doctor: visit.doctorName || '',
    diagnosis: visit.diagnosis || '', treatment: visit.treatment || '', notes: visit.notes || '',
    medicationsGiven: visit.medications || [], takeHomeMeds: visit.dischargeMeds || [],
    homeCareInstructions: visit.dischargeInstructions || '', followUpDate: visit.followUpDate || '',
    services: visit.services || [], totalAmount: visit.totalAmount || 0, paymentStatus: visit.paymentStatus || 'pending',
    finalized: false, editedBy: currentUser?.username || '',
  });

  // ── Auth handlers ──────────────────────────────────────────────────────────
  const handleStaffLogin = () => {
    const key = loginForm.username.toLowerCase();
    const acc = staffAccounts[key];
    if (acc && acc.password === loginForm.password) {
      const user = { username: acc.username, displayName: acc.displayName, role: 'staff' };
      sessionStorage.setItem('rrUser', JSON.stringify(user));
      setCurrentUser(user);
      setLoginMode('none'); setLoginError(''); setLoginForm({ username: '', password: '' });
    } else {
      setLoginError('Wrong username or password!');
    }
  };

  const handleFamilyLogin = () => {
    const match = Object.entries(familyAccounts).find(
      ([, acc]) => acc.username.toLowerCase() === loginForm.username.toLowerCase() && acc.password === loginForm.password
    );
    if (match) {
      const [id, acc] = match;
      const user = { username: acc.username, displayName: acc.displayName, role: 'family', patientIds: acc.patientIds || [], ownerName: acc.ownerName, id };
      sessionStorage.setItem('rrUser', JSON.stringify(user));
      setCurrentUser(user);
      setLoginMode('none'); setLoginError(''); setLoginForm({ username: '', password: '' });
    } else {
      setLoginError('Wrong username or password!');
    }
  };

  const handleRegister = () => {
    if (!registerForm.username || !registerForm.password || !registerForm.displayName || !registerForm.ownerName) {
      setRegisterError('Please fill all fields!'); return;
    }
    if (registerForm.password !== registerForm.confirm) {
      setRegisterError('Passwords do not match!'); return;
    }
    if (registerForm.password.length < 4) {
      setRegisterError('Password must be at least 4 characters!'); return;
    }
    // Check uniqueness
    const exists = Object.values(familyAccounts).some(a => a.username.toLowerCase() === registerForm.username.toLowerCase());
    if (exists) { setRegisterError('Username already taken!'); return; }
    // Auto-link patients by owner name
    const linked = patients.filter(p => p.ownerName?.toLowerCase() === registerForm.ownerName.toLowerCase()).map(p => p.id);
    const famId = genId();
    const acc = { username: registerForm.username, password: registerForm.password, displayName: registerForm.displayName, ownerName: registerForm.ownerName, patientIds: linked, createdAt: today() };
    if (IS_CONFIGURED && db) set(ref(db, `accounts/families/${famId}`), acc);
    setFamilyAccounts(prev => ({ ...prev, [famId]: acc }));
    // Auto-login
    const user = { username: acc.username, displayName: acc.displayName, role: 'family', patientIds: linked, ownerName: acc.ownerName, id: famId };
    sessionStorage.setItem('rrUser', JSON.stringify(user));
    setCurrentUser(user);
    setLoginMode('none'); setRegisterError(''); setRegisterForm({ username: '', password: '', confirm: '', displayName: '', ownerName: '' });
    showToast(`Welcome, ${acc.displayName}! ${linked.length} pet(s) linked!`);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('rrUser');
    setCurrentUser(null);
    setView('dashboard'); setSubView('info');
    setPubView('home');
  };

  // ── Settings helpers ───────────────────────────────────────────────────────
  const updateSetting = (key, value) => {
    if (!isStaff) return;
    const path = `accounts/staff/${currentUser.username}/settings/${key}`;
    if (IS_CONFIGURED && db) set(ref(db, path), value);
    setStaffAccounts(prev => ({
      ...prev,
      [currentUser.username]: {
        ...prev[currentUser.username],
        settings: { ...prev[currentUser.username]?.settings, [key]: value }
      }
    }));
  };

  // Sync subview forms when switching
  useEffect(() => {
    if (!selVisit) return;
    if (subView === 'report') {
      setReportForm({
        doctorName: selVisit.doctorName || '', diagnosis: selVisit.diagnosis || '',
        treatment: selVisit.treatment || '', medications: selVisit.medications || [], notes: selVisit.notes || '',
      });
      // Auto-generate suggestion from symptoms
      if (selVisit.symptoms?.length > 0) {
        const sug = generateSuggestion(selVisit.symptoms);
        setSuggestion(sug);
        setShowSuggestion(!!sug && !selVisit.diagnosis);
      }
    }
    if (subView === 'discharge') {
      setDischargeForm({
        dischargeDate: today(), dischargeTime: nowTime(),
        instructions: selVisit.dischargeInstructions || '', followUpDate: selVisit.followUpDate || '',
        deliveryType: selVisit.deliveryType || 'owner-pickup',
        deliveryAddress: selVisit.deliveryAddress || selPat?.ownerAddress || '',
        meds: selVisit.dischargeMeds || [],
      });
    }
    if (subView === 'invoice') setInvoiceItems(selVisit.services || []);
    if (subView === 'ambulance') {
      setAmbulanceForm({
        type: selVisit.ambulancePickupType || 'pickup',
        address: selVisit.ambulanceAddress || selPat?.ownerAddress || '',
        notes: selVisit.ambulanceNotes || '', status: selVisit.ambulanceStatus || 'pending',
      });
    }
  }, [subView, selVisitId]);

  // ── Check-in actions ────────────────────────────────────────────────────────
  const handlePhotoUpload = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const b64 = await compressImage(f);
    setPatForm(prev => ({ ...prev, photo: b64 }));
  };

  const submitNewPatient = () => {
    const patId = genId(), visitId = genId();
    const visit = { id: visitId, ...visitForm, status: 'waiting', diagnosis: '', treatment: '', medications: [], notes: '',
      dischargeDate: null, dischargeTime: null, dischargeInstructions: '', followUpDate: '', deliveryType: null, deliveryAddress: '', dischargeMeds: [],
      services: [], totalAmount: 0, paymentStatus: 'pending', ambulanceStatus: visitForm.ambulanceRequested ? 'pending' : null, ambulanceNotes: '' };
    const patient = { id: patId, ...patForm, createdAt: today(), visits: [visit] };
    updatePatients(ps => [...ps, patient]);
    createTimer(visitId, visitForm.urgency);
    addNotification(visitForm.urgency === 'emergency' ? 'emergency' : 'check-in', `${patForm.animalName} checked in!`, patId, visitId);
    showToast(`${patForm.animalName} checked in!`);
    // Pre-generate AI suggestion from check-in symptoms
    if (visitForm.symptoms.length > 0) {
      const sug = generateSuggestion(visitForm.symptoms);
      setSuggestion(sug); setShowSuggestion(!!sug);
    }
    setPatForm(blankPatientForm()); setVisitForm(blankVisitForm()); setCiStep('search'); setCiQuery('');
    navToPatient(patId, visitId);
  };

  const submitNewVisit = (patId) => {
    const visitId = genId();
    const visit = { id: visitId, ...visitForm, status: 'waiting', diagnosis: '', treatment: '', medications: [], notes: '',
      dischargeDate: null, dischargeTime: null, dischargeInstructions: '', followUpDate: '', deliveryType: null, deliveryAddress: '', dischargeMeds: [],
      services: [], totalAmount: 0, paymentStatus: 'pending', ambulanceStatus: visitForm.ambulanceRequested ? 'pending' : null, ambulanceNotes: '' };
    updatePatients(ps => ps.map(p => p.id !== patId ? p : { ...p, visits: [...(p.visits || []), visit] }));
    const pat = patients.find(p => p.id === patId);
    createTimer(visitId, visitForm.urgency);
    addNotification(visitForm.urgency === 'emergency' ? 'emergency' : 'check-in', `New visit for ${pat?.animalName}!`, patId, visitId);
    showToast(`New visit started for ${pat?.animalName}!`);
    // Pre-generate AI suggestion from check-in symptoms
    if (visitForm.symptoms.length > 0) {
      const sug = generateSuggestion(visitForm.symptoms);
      setSuggestion(sug); setShowSuggestion(!!sug);
    }
    setVisitForm(blankVisitForm()); setCiStep('search'); setCiQuery('');
    navToPatient(patId, visitId);
  };

  // ── Subview save actions ─────────────────────────────────────────────────────
  const saveReport = () => {
    const newStatus = selVisit.status === 'waiting' ? 'in-treatment' : selVisit.status;
    patchVisit(selPatId, selVisitId, { ...reportForm, status: newStatus });
    if (newStatus === 'in-treatment' && selVisit.status === 'waiting') {
      // Advance timer to examination
      const timer = timers[selVisitId];
      if (timer && timer.currentStage === 'checkin') advanceStage(selVisitId);
    }
    showToast('Medical report saved!');
    setSubView('visit');
  };

  const saveDischarge = () => {
    const visitPatch = {
      status: 'discharged', dischargeDate: dischargeForm.dischargeDate, dischargeTime: dischargeForm.dischargeTime,
      dischargeInstructions: dischargeForm.instructions, followUpDate: dischargeForm.followUpDate,
      deliveryType: dischargeForm.deliveryType, deliveryAddress: dischargeForm.deliveryAddress, dischargeMeds: dischargeForm.meds,
    };
    patchVisit(selPatId, selVisitId, visitPatch);
    // Auto-complete all timer stages
    const timer = timers[selVisitId];
    if (timer) {
      const now = Date.now();
      const updated = { ...timer, stages: { ...timer.stages }, currentStage: 'discharge' };
      TREATMENT_STAGES.forEach(({ key }) => {
        updated.stages[key] = { ...timer.stages[key], completedAt: timer.stages[key]?.completedAt || now, startedAt: timer.stages[key]?.startedAt || now };
      });
      if (IS_CONFIGURED && db) set(ref(db, `timers/${selVisitId}`), updated);
      setTimers(prev => ({ ...prev, [selVisitId]: updated }));
    }
    // Auto-generate discharge paper
    const mergedVisit = { ...selVisit, ...visitPatch };
    const paper = generateDischargePaper(selPat, mergedVisit);
    if (IS_CONFIGURED && db) set(ref(db, `dischargePapers/${selVisitId}`), paper);
    setDischargePapers(prev => ({ ...prev, [selVisitId]: paper }));
    addNotification('discharge', `${selPat?.animalName} has been discharged!`, selPatId, selVisitId);
    showToast(`${selPat?.animalName} has been discharged!`);
    setSubView('info');
  };

  const saveInvoice = () => {
    const total = invoiceItems.reduce((s, i) => s + Number(i.price), 0);
    patchVisit(selPatId, selVisitId, { services: invoiceItems, totalAmount: total });
    showToast('Invoice saved!');
  };

  const markPaid = () => {
    const total = invoiceItems.reduce((s, i) => s + Number(i.price), 0);
    patchVisit(selPatId, selVisitId, { services: invoiceItems, totalAmount: total, paymentStatus: 'paid' });
    addNotification('payment', `Payment received for ${selPat?.animalName}!`, selPatId, selVisitId);
    showToast('Payment received!');
  };

  const saveAmbulance = () => {
    patchVisit(selPatId, selVisitId, {
      ambulanceRequested: true, ambulancePickupType: ambulanceForm.type,
      ambulanceAddress: ambulanceForm.address, ambulanceNotes: ambulanceForm.notes, ambulanceStatus: ambulanceForm.status,
    });
    showToast('Ambulance dispatched!');
    setSubView('visit');
  };

  const applySuggestion = () => {
    if (!suggestion) return;
    setReportForm(f => ({
      ...f,
      diagnosis: suggestion.topCondition,
      treatment: suggestion.treatment,
      medications: suggestion.medications.map(m => ({ ...m })),
    }));
    // Update timer estimates if available
    if (suggestion.stageEstimates && timers[selVisitId]) {
      const timer = timers[selVisitId];
      const updated = { ...timer, stages: { ...timer.stages } };
      Object.entries(suggestion.stageEstimates).forEach(([key, mins]) => {
        if (updated.stages[key]) updated.stages[key] = { ...updated.stages[key], estimatedMinutes: mins };
      });
      if (IS_CONFIGURED && db) set(ref(db, `timers/${selVisitId}`), updated);
      setTimers(prev => ({ ...prev, [selVisitId]: updated }));
    }
    setShowSuggestion(false);
    showToast('Treatment plan applied!');
  };

  const saveDischargePaper = (paper) => {
    if (IS_CONFIGURED && db) set(ref(db, `dischargePapers/${selVisitId}`), paper);
    setDischargePapers(prev => ({ ...prev, [selVisitId]: paper }));
    showToast(paper.finalized ? 'Discharge paper finalized!' : 'Discharge paper saved!');
  };

  // ── Public check-in ────────────────────────────────────────────────────────
  const pubSubmitCheckIn = () => {
    const patId = genId(), visitId = genId();
    const visit = { id: visitId, checkInDate: today(), checkInTime: nowTime(), chiefComplaint: pubForm.complaint,
      symptoms: [], urgency: pubForm.urgency, doctorName: '', status: 'waiting',
      ambulanceRequested: false, ambulancePickupType: 'pickup', ambulanceAddress: '',
      diagnosis: '', treatment: '', medications: [], notes: '',
      dischargeDate: null, dischargeTime: null, dischargeInstructions: '',
      followUpDate: '', deliveryType: null, deliveryAddress: '', dischargeMeds: [],
      services: [], totalAmount: 0, paymentStatus: 'pending', ambulanceStatus: null, ambulanceNotes: '' };
    const patient = { id: patId, animalName: pubForm.animalName, species: pubForm.species,
      breed: '', birthday: '', color: '', photo: '',
      ownerName: pubForm.ownerName, ownerPhone: '', ownerEmail: '', ownerAddress: '',
      createdAt: today(), visits: [visit] };
    updatePatients(ps => [...ps, patient]);
    createTimer(visitId, pubForm.urgency);
    addNotification(pubForm.urgency === 'emergency' ? 'emergency' : 'check-in', `${pubForm.animalName} self-checked in!`, patId, visitId);
    setPubConfirmId(patId);
    setPubView('confirmed');
    setPubForm({ animalName: '', species: 'dog', ownerName: '', complaint: '', urgency: 'routine' });
  };

  // ─── SHARED COMPONENTS ─────────────────────────────────────────────────────

  const PatAvatar = ({ pat, size, ring }) => (
    pat?.photo
      ? <img src={pat.photo} alt={pat?.animalName} className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0 ${ring ? 'border-4 border-pink-300' : ''}`} />
      : <div className={`w-${size} h-${size} rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0 ${ring ? 'border-4 border-pink-200' : ''}`}
          style={{ fontSize: `${Math.round(size * 0.45)}px` }}>{emojiFor(pat?.species)}</div>
  );

  const InfoBlock = ({ label, value, color = 'gray' }) => {
    const c = { gray: 'bg-gray-50 text-gray-500', blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600', yellow: 'bg-yellow-50 text-yellow-600' };
    return (<div className={`${c[color].split(' ')[0]} rounded-xl p-3`}>
      <p className={`text-xs font-bold uppercase mb-1 ${c[color].split(' ')[1]}`}>{label}</p>
      <p className="text-gray-800 text-sm">{value}</p>
    </div>);
  };

  // ── Timer Display Component ────────────────────────────────────────────────
  const TimerCard = ({ visitId, compact }) => {
    const info = getTimerInfo(visitId);
    if (!info) return null;
    const keys = TREATMENT_STAGES.map(s => s.key);
    return (
      <div className={`bg-white rounded-2xl ${compact ? 'p-3' : 'shadow p-4'} border border-purple-100`}>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-purple-700 text-sm">{compact ? '⏱️ Progress' : '⏱️ Treatment Progress'}</h4>
          {info.totalRemaining > 0 && <span className="text-xs text-gray-500">~{Math.ceil(info.totalRemaining)} min left</span>}
        </div>
        {/* Progress bar */}
        <div className="flex gap-0.5 mb-2">
          {TREATMENT_STAGES.map(({ key, emoji }, i) => {
            const s = info.stages[key];
            const isCurrent = key === info.currentStage;
            const isDone = !!s?.completedAt;
            return (
              <div key={key} className="flex-1 relative group">
                <div className={`h-2 rounded-full transition-all ${isDone ? 'bg-green-400' : isCurrent ? 'bg-purple-400' : 'bg-gray-200'}`}>
                  {isCurrent && !isDone && <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${info.pct}%` }} />}
                </div>
                <div className={`text-center mt-1 ${compact ? 'text-[9px]' : 'text-xs'} ${isCurrent ? 'text-purple-700 font-bold' : isDone ? 'text-green-600' : 'text-gray-400'}`}>
                  {emoji}
                </div>
              </div>
            );
          })}
        </div>
        {/* Current stage info */}
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold ${info.overtime ? 'text-red-500' : 'text-purple-600'}`}>
            {TREATMENT_STAGES[info.currentIdx]?.emoji} {TREATMENT_STAGES[info.currentIdx]?.label}
            {info.overtime ? ' (overtime)' : ` — ${Math.ceil(info.remainingMin)} min left`}
          </span>
          {isStaff && info.currentIdx < keys.length - 1 && (
            <button onClick={() => advanceStage(visitId)}
              className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-lg font-bold hover:bg-purple-200">
              Next Stage
            </button>
          )}
        </div>
      </div>
    );
  };

  // ── Notification Panel ─────────────────────────────────────────────────────
  const NotificationPanel = () => (
    <div className="fixed inset-0 bg-black/30 z-50 flex justify-end" onClick={() => setShowNotifPanel(false)}>
      <div className="bg-white w-80 max-w-full h-full shadow-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 flex items-center justify-between">
          <h3 className="font-bold text-lg">Notifications</h3>
          <div className="flex gap-2">
            {unreadNotifs > 0 && <button onClick={markAllRead} className="text-xs bg-white/20 px-2 py-1 rounded-lg">Mark all read</button>}
            <button onClick={() => setShowNotifPanel(false)} className="text-xl">&times;</button>
          </div>
        </div>
        {filteredNotifs.length === 0 ? (
          <div className="text-center py-12 text-gray-400"><div className="text-4xl mb-2">🔔</div><p>No notifications yet</p></div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifs.slice(0, 50).map(n => {
              const nt = NOTIF_TYPES[n.type] || {};
              const isRead = n.readBy?.[currentUser?.username];
              return (
                <div key={n.id} className={`p-3 flex gap-3 ${isRead ? 'bg-white' : 'bg-purple-50'} hover:bg-gray-50 cursor-pointer`}
                  onClick={() => { markNotifRead(n.id); if (n.patientId) navToPatient(n.patientId, n.visitId); setShowNotifPanel(false); }}>
                  <span className="text-xl">{nt.emoji || '📌'}</span>
                  <div className="flex-1">
                    <p className={`text-sm ${isRead ? 'text-gray-600' : 'text-gray-800 font-semibold'}`}>{n.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.timestamp)}</p>
                  </div>
                  {!isRead && <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ── Treatment Suggestion Card ──────────────────────────────────────────────
  const SuggestionCard = () => {
    if (!suggestion || !showSuggestion) return null;
    return (
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-indigo-700 text-sm">🤖 AI Treatment Suggestion</h4>
          <button onClick={() => setShowSuggestion(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        {/* Conditions ranked */}
        <div className="space-y-1">
          {suggestion.conditions.map((c, i) => (
            <div key={c.name} className="flex items-center gap-2">
              <span className={`text-xs font-bold ${i === 0 ? 'text-indigo-600' : 'text-gray-400'}`}>#{i + 1}</span>
              <span className={`text-sm ${i === 0 ? 'font-bold text-indigo-800' : 'text-gray-600'}`}>{c.name}</span>
              <span className="text-xs text-gray-400">({c.matched.join(', ')})</span>
            </div>
          ))}
        </div>
        {/* Suggested treatment */}
        <div className="bg-white rounded-xl p-3 text-sm">
          <p className="text-xs font-bold text-indigo-600 uppercase mb-1">Suggested Treatment</p>
          <p className="text-gray-700">{suggestion.treatment}</p>
        </div>
        {/* Suggested meds */}
        {suggestion.medications.length > 0 && (
          <div className="bg-white rounded-xl p-3">
            <p className="text-xs font-bold text-indigo-600 uppercase mb-1">Suggested Medications</p>
            {suggestion.medications.map((m, i) => (
              <p key={i} className="text-sm text-gray-700">💊 {m.name} — {m.dosage} · {m.frequency}</p>
            ))}
          </div>
        )}
        <div className="text-xs text-gray-500">Estimated time: ~{suggestion.totalMinutes} min</div>
        <div className="flex gap-2">
          <button onClick={applySuggestion} className="flex-1 btn-purple py-2 rounded-xl text-sm font-bold">Apply Suggestion</button>
          <button onClick={() => setShowSuggestion(false)} className="px-4 py-2 border-2 border-gray-200 text-gray-500 rounded-xl text-sm font-bold hover:bg-gray-50">Dismiss</button>
        </div>
      </div>
    );
  };

  // ─── VISIT FORM (shared by new-patient and new-visit) ──────────────────────
  const VisitFormSection = () => (
    <div className="bg-white rounded-2xl shadow p-5 space-y-4">
      <h3 className="font-bold text-red-500 text-lg">🩺 Visit Details</h3>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Check-in Date</label>
          <input type="date" className="input" value={visitForm.checkInDate} onChange={e => setVisitForm(f => ({ ...f, checkInDate: e.target.value }))} /></div>
        <div><label className="label">Check-in Time</label>
          <input type="time" className="input" value={visitForm.checkInTime} onChange={e => setVisitForm(f => ({ ...f, checkInTime: e.target.value }))} /></div>
      </div>
      <div>
        <label className="label">What&apos;s wrong? <span className="text-red-400">*</span></label>
        <textarea className="input min-h-[80px]" placeholder="Describe the main reason for the visit..."
          value={visitForm.chiefComplaint} onChange={e => setVisitForm(f => ({ ...f, chiefComplaint: e.target.value }))} />
      </div>
      <div>
        <label className="label mb-2">Symptoms (check all that apply) <span className="text-red-400">*</span></label>
        <div className="grid grid-cols-2 gap-y-1 gap-x-3">
          {SYMPTOM_LIST.map(s => (
            <label key={s} className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input type="checkbox" className="accent-pink-500 w-4 h-4" checked={visitForm.symptoms.includes(s)}
                onChange={e => setVisitForm(f => ({ ...f, symptoms: e.target.checked ? [...f.symptoms, s] : f.symptoms.filter(x => x !== s) }))} />
              {s}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="label mb-2">Urgency Level</label>
        <div className="grid grid-cols-3 gap-2">
          {[['routine','✅ Routine','border-green-400 bg-green-500'],['urgent','⚡ Urgent','border-amber-400 bg-amber-400'],['emergency','🚨 Emergency','border-red-500 bg-red-500']].map(([val,lbl,ac]) => (
            <button key={val} onClick={() => setVisitForm(f => ({ ...f, urgency: val }))}
              className={`py-2 rounded-xl text-sm font-bold border-2 transition-all ${visitForm.urgency === val ? `${ac} text-white` : 'border-gray-200 text-gray-500 hover:border-gray-400 bg-white'}`}>{lbl}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Assigned Doctor</label>
        <input className="input" placeholder="e.g. Dr. Emma" value={visitForm.doctorName} onChange={e => setVisitForm(f => ({ ...f, doctorName: e.target.value }))} />
      </div>
      <div className="border-t border-gray-100 pt-3">
        <label className="flex items-center gap-2 font-semibold text-gray-700 cursor-pointer select-none">
          <input type="checkbox" className="accent-orange-500 w-4 h-4" checked={visitForm.ambulanceRequested}
            onChange={e => setVisitForm(f => ({ ...f, ambulanceRequested: e.target.checked }))} />
          🚑 Request Pet Ambulance Pickup
        </label>
        {visitForm.ambulanceRequested && (
          <div className="mt-3 ml-6 bg-orange-50 border border-orange-200 rounded-xl p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {[['pickup','🏠→🏥 Pickup'],['delivery','🏥→🏠 Delivery']].map(([v,l]) => (
                <button key={v} onClick={() => setVisitForm(f => ({ ...f, ambulancePickupType: v }))}
                  className={`py-2 rounded-lg text-sm font-semibold border-2 transition-all ${visitForm.ambulancePickupType === v ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200'}`}>{l}</button>
              ))}
            </div>
            <input className="input text-sm" placeholder="Address for pickup/delivery..." value={visitForm.ambulanceAddress}
              onChange={e => setVisitForm(f => ({ ...f, ambulanceAddress: e.target.value }))} />
          </div>
        )}
      </div>
    </div>
  );

  // ─── VIEWS ───────────────────────────────────────────────────────────────────

  const Dashboard = () => (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-pink-500 via-fuchsia-500 to-purple-600 text-white rounded-3xl p-6 text-center shadow-lg">
        <div className="text-6xl mb-2">🏥🐾</div>
        <h1 className="text-3xl font-extrabold tracking-tight">Rose &amp; Ruth&apos;s</h1>
        <p className="text-pink-100 font-medium">Animal Hospital</p>
        {currentUser && <p className="text-pink-200 text-sm mt-1">Welcome, {currentUser.displayName}!</p>}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { n: activeVisits.filter(v => v.status === 'waiting').length, label: 'Waiting', color: 'text-amber-500', border: 'border-amber-400' },
          { n: activeVisits.filter(v => v.status === 'in-treatment').length, label: 'In Treatment', color: 'text-blue-500', border: 'border-blue-400' },
          { n: todayDischarged.length, label: 'Home Today', color: 'text-green-500', border: 'border-green-400' },
        ].map(({ n, label, color, border }) => (
          <div key={label} className={`bg-white rounded-2xl shadow p-3 text-center border-t-4 ${border}`}>
            <div className={`text-3xl font-extrabold ${color}`}>{n}</div>
            <div className="text-gray-500 text-xs font-semibold mt-0.5">{label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => { setCiStep('search'); setCiQuery(''); setVisitForm(blankVisitForm()); setView('checkin'); }}
          className="btn-pink py-4 rounded-2xl text-lg font-bold shadow-lg flex items-center justify-center gap-2">➕ Check In</button>
        <button onClick={() => setView('records')}
          className="btn-purple py-4 rounded-2xl text-lg font-bold shadow-lg flex items-center justify-center gap-2">📁 Records</button>
      </div>
      <div className="bg-white rounded-2xl shadow p-4">
        <h2 className="font-bold text-gray-800 text-lg mb-3">🏥 Current Patients</h2>
        {activeVisits.length === 0 ? (
          <div className="text-center py-8 text-gray-400"><div className="text-5xl mb-2">😴</div><p>No patients right now!</p></div>
        ) : (
          <div className="space-y-2">
            {activeVisits.map(v => (
              <div key={v.id} onClick={() => navToPatient(v.pat.id, v.id)}
                className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 hover:border-pink-200 hover:bg-pink-50 cursor-pointer transition-all">
                {PatAvatar({ pat: v.pat, size: 12 })}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-800">{v.pat.animalName} <span className="text-gray-400 font-normal text-sm ml-1 capitalize">({v.pat.species})</span></div>
                  <div className="text-xs text-gray-500 truncate">{v.chiefComplaint}</div>
                  <div className="text-xs text-gray-400">Owner: {v.pat.ownerName}</div>
                  {timers[v.id] && (() => { const ti = getTimerInfo(v.id); return ti ? <div className="text-xs text-purple-500 mt-0.5">⏱️ {TREATMENT_STAGES[ti.currentIdx]?.label} — ~{Math.ceil(ti.remainingMin)}m left</div> : null; })()}
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
      {patients.length > 0 && (
        <div className="bg-white rounded-2xl shadow p-4">
          <h2 className="font-bold text-gray-800 text-lg mb-3">🐾 All Patients ({patients.length})</h2>
          <div className="grid grid-cols-3 gap-2">
            {[...patients].reverse().slice(0, 9).map(p => (
              <div key={p.id} onClick={() => navToPatient(p.id)}
                className="flex flex-col items-center gap-1 p-2 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 cursor-pointer transition-all">
                {PatAvatar({ pat: p, size: 12 })}
                <div className="text-xs font-semibold text-gray-700 text-center truncate w-full">{p.animalName}</div>
                <div className="text-xs text-gray-400">{p.visits?.length || 0} visit{p.visits?.length !== 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>
          {patients.length > 9 && <button onClick={() => setView('records')} className="mt-3 text-purple-500 text-sm font-semibold hover:underline">View all {patients.length} patients &rarr;</button>}
        </div>
      )}
    </div>
  );

  const CheckIn = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-3xl p-5 text-center shadow">
        <div className="text-4xl mb-1">📋</div><h2 className="text-2xl font-extrabold">Patient Check-In</h2>
        <p className="text-teal-100 text-sm">Welcome to Rose &amp; Ruth&apos;s!</p>
      </div>
      {ciStep === 'search' && (<>
        <div className="bg-white rounded-2xl shadow p-5">
          <h3 className="font-bold text-gray-700 mb-3">🔍 Returning Patient?</h3>
          <input className="input" placeholder="Search by pet name or owner name..." value={ciQuery} onChange={e => setCiQuery(e.target.value)} />
          {ciQuery && (<div className="mt-3 space-y-2">
            {ciResults.length === 0 ? <p className="text-sm text-gray-400">No matches found.</p>
              : ciResults.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 bg-gray-50 hover:border-teal-300 transition-all">
                  {PatAvatar({ pat: p, size: 10 })}
                  <div className="flex-1"><div className="font-bold text-gray-800">{p.animalName} <span className="text-gray-400 text-sm capitalize">({p.species})</span></div>
                    <div className="text-xs text-gray-500">Owner: {p.ownerName} · {p.visits?.length || 0} visit(s)</div></div>
                  <button className="btn-teal text-sm px-3 py-1.5 rounded-lg font-bold"
                    onClick={() => { setSelPatId(p.id); setVisitForm(blankVisitForm()); setCiStep('new-visit'); }}>New Visit</button>
                </div>))}
          </div>)}
        </div>
        <div className="text-center"><p className="text-gray-400 text-sm mb-3">— or —</p>
          <button className="btn-pink px-8 py-3 rounded-2xl text-lg font-bold shadow-lg"
            onClick={() => { setPatForm(blankPatientForm()); setCiStep('new-patient'); }}>➕ Register New Patient</button>
        </div>
      </>)}
      {ciStep === 'new-patient' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow p-5 space-y-4">
            <h3 className="font-bold text-pink-600 text-lg">🐾 Animal Information</h3>
            <div className="flex items-center gap-4">
              <div onClick={() => fileRef.current?.click()} className="w-24 h-24 rounded-full border-4 border-dashed border-pink-300 hover:border-pink-500 bg-pink-50 flex items-center justify-center cursor-pointer overflow-hidden flex-shrink-0 transition-all">
                {patForm.photo ? <img src={patForm.photo} className="w-full h-full object-cover" alt="Pet" />
                  : <div className="text-center text-pink-300"><div className="text-3xl">📸</div><div className="text-xs mt-0.5">Add Photo</div></div>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              <div><p className="text-sm font-semibold text-gray-700">Pet Photo</p><p className="text-xs text-gray-400">Tap to upload!</p>
                {patForm.photo && <button className="text-xs text-red-400 hover:text-red-600 mt-1" onClick={() => setPatForm(f => ({ ...f, photo: '' }))}>Remove</button>}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Pet Name <span className="text-red-400">*</span></label><input className="input" placeholder="e.g. Fluffy" value={patForm.animalName} onChange={e => setPatForm(f => ({ ...f, animalName: e.target.value }))} /></div>
              <div><label className="label">Species <span className="text-red-400">*</span></label>
                <select className="input" value={patForm.species} onChange={e => setPatForm(f => ({ ...f, species: e.target.value }))}>
                  {Object.entries(ANIMAL_EMOJI).map(([s, emoji]) => (<option key={s} value={s}>{emoji} {s.charAt(0).toUpperCase() + s.slice(1)}</option>))}</select></div>
              <div><label className="label">Breed</label><input className="input" placeholder="e.g. Golden Retriever" value={patForm.breed} onChange={e => setPatForm(f => ({ ...f, breed: e.target.value }))} /></div>
              <div><label className="label">Birthday <span className="text-red-400">*</span></label><input type="date" className="input" value={patForm.birthday} onChange={e => setPatForm(f => ({ ...f, birthday: e.target.value }))} /></div>
              <div className="col-span-2"><label className="label">Color / Markings</label><input className="input" placeholder="e.g. Orange tabby" value={patForm.color} onChange={e => setPatForm(f => ({ ...f, color: e.target.value }))} /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow p-5 space-y-3">
            <h3 className="font-bold text-purple-600 text-lg">👤 Owner Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="label">Owner Name <span className="text-red-400">*</span></label><input className="input" placeholder="Full name" value={patForm.ownerName} onChange={e => setPatForm(f => ({ ...f, ownerName: e.target.value }))} /></div>
              <div><label className="label">Phone</label><input type="tel" className="input" placeholder="(555) 123-4567" value={patForm.ownerPhone} onChange={e => setPatForm(f => ({ ...f, ownerPhone: e.target.value }))} /></div>
              <div><label className="label">Email</label><input type="email" className="input" placeholder="email@example.com" value={patForm.ownerEmail} onChange={e => setPatForm(f => ({ ...f, ownerEmail: e.target.value }))} /></div>
              <div className="col-span-2"><label className="label">Home Address</label><input className="input" placeholder="123 Main St..." value={patForm.ownerAddress} onChange={e => setPatForm(f => ({ ...f, ownerAddress: e.target.value }))} /></div>
            </div>
          </div>
          {VisitFormSection()}
          <div className="flex gap-3">
            <button className="flex-1 border-2 border-gray-300 text-gray-600 py-3 rounded-2xl font-bold hover:bg-gray-50" onClick={() => setCiStep('search')}>← Back</button>
            <button disabled={!patForm.animalName || !patForm.ownerName || !patForm.birthday || !visitForm.chiefComplaint || visitForm.symptoms.length === 0}
              className="flex-[2] btn-pink py-3 rounded-2xl font-bold shadow-lg disabled:opacity-40 disabled:cursor-not-allowed" onClick={submitNewPatient}>Check In Patient! 🏥</button>
          </div>
        </div>
      )}
      {ciStep === 'new-visit' && (() => {
        const p = patients.find(x => x.id === selPatId);
        return (<div className="space-y-4">
          <div className="bg-teal-50 border-2 border-teal-300 rounded-2xl p-4 flex items-center gap-3">
            {PatAvatar({ pat: p, size: 12 })}
            <div><div className="font-bold text-teal-800">Returning: {p?.animalName}</div><div className="text-sm text-teal-600">Owner: {p?.ownerName} · {p?.visits?.length || 0} previous visit(s)</div></div>
          </div>
          {VisitFormSection()}
          <div className="flex gap-3">
            <button className="flex-1 border-2 border-gray-300 text-gray-600 py-3 rounded-2xl font-bold hover:bg-gray-50" onClick={() => setCiStep('search')}>← Back</button>
            <button disabled={!visitForm.chiefComplaint || visitForm.symptoms.length === 0} className="flex-[2] btn-teal py-3 rounded-2xl font-bold shadow-lg disabled:opacity-40" onClick={() => submitNewVisit(selPatId)}>Start Visit! 🏥</button>
          </div>
        </div>);
      })()}
    </div>
  );

  const Records = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-3xl p-5 text-center shadow">
        <div className="text-4xl mb-1">📁</div><h2 className="text-2xl font-extrabold">Patient Records</h2>
        <p className="text-purple-100 text-sm">{patients.length} total patient{patients.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="bg-white rounded-2xl shadow p-4"><input className="input" placeholder="🔍 Search by name, owner, or species..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      {filteredPatients.length === 0 ? <div className="text-center py-12 text-gray-400"><div className="text-5xl mb-2">🔍</div><p>No patients found.</p></div>
        : <div className="space-y-3">{filteredPatients.map(p => {
          const lastVisit = p.visits?.[p.visits.length - 1]; const isActive = p.visits?.some(v => v.status !== 'discharged');
          return (<div key={p.id} onClick={() => navToPatient(p.id)} className="bg-white rounded-2xl shadow p-4 flex items-center gap-4 cursor-pointer hover:shadow-md border-2 border-transparent hover:border-purple-200 transition-all">
            {PatAvatar({ pat: p, size: 16 })}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap"><span className="font-bold text-gray-800 text-lg">{p.animalName}</span>
                <span className="text-gray-400 text-sm capitalize">{p.species}{p.breed ? ` · ${p.breed}` : ''}</span>
                {isActive && <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-semibold border border-amber-300">In Hospital</span>}</div>
              <div className="text-sm text-gray-500">Owner: {p.ownerName}</div>
              <div className="text-xs text-gray-400 mt-0.5">{p.visits?.length || 0} visit(s){lastVisit ? ` · Last: ${fmtDate(lastVisit.checkInDate)}` : ''}</div>
            </div><div className="text-gray-300 text-2xl">&rsaquo;</div>
          </div>);
        })}</div>}
    </div>
  );

  const PatientDetail = () => {
    if (!selPat) return <div className="text-center py-12 text-gray-400">Patient not found.</div>;
    const activeVisit = selPat.visits?.find(v => v.status !== 'discharged');
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl shadow p-5">
          <div className="flex items-center gap-4">
            {PatAvatar({ pat: selPat, size: 20, ring: true })}
            <div className="flex-1">
              <h2 className="text-2xl font-extrabold text-gray-800">{selPat.animalName}</h2>
              <p className="text-gray-500 capitalize">{selPat.species}{selPat.breed ? ` · ${selPat.breed}` : ''}</p>
              {selPat.color && <p className="text-gray-400 text-sm">{selPat.color}</p>}
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
        {/* Timer for active visit */}
        {activeVisit && timers[activeVisit.id] && <TimerCard visitId={activeVisit.id} />}
        {activeVisit && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-amber-800">🏥 Current Visit</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${STATUS[activeVisit.status].cls}`}>{STATUS[activeVisit.status].label}</span>
            </div>
            <p className="text-sm text-gray-700 mb-3">{activeVisit.chiefComplaint}</p>
            {activeVisit.status === 'waiting' && (
              <button className="w-full btn-blue py-2 rounded-xl text-sm font-bold mb-2"
                onClick={() => { patchVisit(selPat.id, activeVisit.id, { status: 'in-treatment' }); if (timers[activeVisit.id]?.currentStage === 'checkin') advanceStage(activeVisit.id); showToast('Moved to treatment!'); }}>
                🔬 Move to Treatment Room</button>
            )}
            <div className="grid grid-cols-2 gap-2">
              {[['📋 Medical Report','report','bg-blue-100 text-blue-800 hover:bg-blue-200'],['🏠 Discharge','discharge','bg-green-100 text-green-800 hover:bg-green-200'],
                ['💰 Invoice','invoice','bg-amber-100 text-amber-800 hover:bg-amber-200'],['🚑 Ambulance','ambulance','bg-orange-100 text-orange-800 hover:bg-orange-200']
              ].map(([label,sv,cls]) => (
                <button key={sv} className={`${cls} py-2 rounded-xl text-sm font-bold transition-all`}
                  onClick={() => { setSelVisitId(activeVisit.id); setSubView(sv); }}>{label}</button>
              ))}
            </div>
          </div>
        )}
        {!activeVisit && (
          <button className="btn-pink w-full py-3 rounded-2xl font-bold shadow-lg"
            onClick={() => { setSelPatId(selPat.id); setVisitForm(blankVisitForm()); setCiStep('new-visit'); setView('checkin'); }}>
            ➕ Start New Visit for {selPat.animalName}</button>
        )}
        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="font-bold text-gray-800 mb-3">📅 Visit History ({selPat.visits?.length || 0})</h3>
          {(!selPat.visits?.length) ? <p className="text-gray-400 text-sm text-center py-4">No visits yet.</p>
            : <div className="space-y-2">{[...selPat.visits].reverse().map(v => (
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
                    {v.totalAmount > 0 && <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${v.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>${v.totalAmount} {v.paymentStatus === 'paid' ? '✓' : '⚠'}</span>}
                  </div>
                  {v.doctorName && <span className="text-xs text-gray-400">{v.doctorName}</span>}
                </div>
              </div>
            ))}</div>}
        </div>
        {/* Discharge papers for completed visits */}
        {selPat.visits?.filter(v => v.status === 'discharged' && dischargePapers[v.id]).length > 0 && (
          <div className="bg-white rounded-2xl shadow p-4">
            <h3 className="font-bold text-gray-800 mb-3">📄 Discharge Papers</h3>
            {selPat.visits.filter(v => v.status === 'discharged' && dischargePapers[v.id]).map(v => (
              <button key={v.id} onClick={() => { setSelVisitId(v.id); setSubView('discharge-paper'); }}
                className="w-full text-left p-3 rounded-xl border-2 border-gray-100 hover:border-green-200 hover:bg-green-50 cursor-pointer transition-all mb-2">
                <div className="font-semibold text-gray-800 text-sm">📄 {fmtDate(v.checkInDate)} — {v.chiefComplaint}</div>
                <div className="text-xs text-gray-400">{dischargePapers[v.id]?.finalized ? '✅ Finalized' : '📝 Draft'}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const VisitDetail = () => {
    if (!selVisit || !selPat) return null;
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl shadow p-5">
          <div className="flex items-center gap-3 mb-4">
            {PatAvatar({ pat: selPat, size: 12 })}
            <div><div className="font-bold text-gray-800 text-lg">{selPat.animalName}&apos;s Visit</div>
              <div className="text-gray-500 text-sm">{fmtDate(selVisit.checkInDate)} at {selVisit.checkInTime}</div></div>
            <span className={`ml-auto text-xs px-2 py-1 rounded-full font-semibold border ${STATUS[selVisit.status]?.cls}`}>{STATUS[selVisit.status]?.label}</span>
          </div>
          {timers[selVisitId] && <TimerCard visitId={selVisitId} compact />}
          <div className="space-y-3 mt-3">
            {InfoBlock({ label: "Chief Complaint", value: selVisit.chiefComplaint })}
            {selVisit.symptoms?.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs font-bold text-gray-500 uppercase mb-2">Symptoms</p>
                <div className="flex flex-wrap gap-1">{selVisit.symptoms.map(s => <span key={s} className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">{s}</span>)}</div></div>)}
            {selVisit.doctorName && InfoBlock({ label: "Doctor", value: selVisit.doctorName })}
            {selVisit.diagnosis && InfoBlock({ label: "Diagnosis", value: selVisit.diagnosis, color: "blue" })}
            {selVisit.treatment && InfoBlock({ label: "Treatment", value: selVisit.treatment, color: "green" })}
            {selVisit.medications?.length > 0 && (
              <div className="bg-purple-50 rounded-xl p-3"><p className="text-xs font-bold text-purple-600 uppercase mb-2">Medications</p>
                {selVisit.medications.map((m, i) => <div key={i} className="text-sm text-gray-700">💊 {m.name}{m.dosage ? ` — ${m.dosage}` : ''}{m.frequency ? ` · ${m.frequency}` : ''}</div>)}</div>)}
            {selVisit.notes && InfoBlock({ label: "Notes", value: selVisit.notes, color: "yellow" })}
            {selVisit.status === 'discharged' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <p className="text-xs font-bold text-green-600 uppercase mb-2">Discharge Info</p>
                <p className="text-sm text-gray-700">{selVisit.dischargeInstructions}</p>
                {selVisit.followUpDate && <p className="text-sm text-gray-500 mt-1">Follow-up: {fmtDate(selVisit.followUpDate)}</p>}
                {selVisit.deliveryType && <p className="text-sm text-gray-500 mt-1">{selVisit.deliveryType === 'home-delivery' ? '🚑 Home Delivery' : '🚶 Owner Pickup'}{selVisit.deliveryAddress ? ` — ${selVisit.deliveryAddress}` : ''}</p>}
                {selVisit.dischargeMeds?.length > 0 && <div className="mt-2"><p className="text-xs font-bold text-green-700 mb-1">Take-home Meds:</p>
                  {selVisit.dischargeMeds.map((m, i) => <p key={i} className="text-xs text-gray-600">💊 {m.name}{m.instructions ? ` — ${m.instructions}` : ''}</p>)}</div>}
              </div>)}
            {selVisit.ambulanceRequested && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                <p className="text-xs font-bold text-orange-600 uppercase mb-2">🚑 Ambulance</p>
                <p className="text-sm text-gray-700">{selVisit.ambulancePickupType === 'pickup' ? 'Pickup from home' : 'Home delivery'} — {selVisit.ambulanceAddress}</p>
                <p className="text-sm font-semibold mt-1">Status: {selVisit.ambulanceStatus}</p>
              </div>)}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {selVisit.status !== 'discharged' && [
            ['📋 Medical Report','report','bg-blue-100 text-blue-800 hover:bg-blue-200'],['🏠 Discharge','discharge','bg-green-100 text-green-800 hover:bg-green-200'],
            ['💰 Invoice','invoice','bg-amber-100 text-amber-800 hover:bg-amber-200'],['🚑 Ambulance','ambulance','bg-orange-100 text-orange-800 hover:bg-orange-200'],
          ].map(([label,sv,cls]) => <button key={sv} className={`${cls} py-3 rounded-2xl text-sm font-bold transition-all`} onClick={() => setSubView(sv)}>{label}</button>)}
          {selVisit.status === 'discharged' && [
            ['📋 View Report','report','bg-blue-100 text-blue-800 hover:bg-blue-200'],['💰 Invoice','invoice','bg-amber-100 text-amber-800 hover:bg-amber-200'],
            ...(dischargePapers[selVisitId] ? [['📄 Discharge Paper','discharge-paper','bg-green-100 text-green-800 hover:bg-green-200']] : []),
          ].map(([label,sv,cls]) => <button key={sv} className={`${cls} py-3 rounded-2xl text-sm font-bold transition-all`} onClick={() => setSubView(sv)}>{label}</button>)}
        </div>
      </div>
    );
  };

  const MedicalReport = () => {
    if (!selVisit) return null;
    // Build quick-fill conditions from patient's check-in symptoms
    const quickConditions = (() => {
      const syms = selVisit.symptoms || [];
      if (!syms.length) return Object.keys(CONDITION_TREATMENT_MAP).slice(0, 12).map(name => ({ name, confidence: null }));
      const seen = new Set();
      const result = [];
      syms.forEach(s => {
        (SYMPTOM_CONDITION_MAP[s] || []).forEach(c => {
          if (!seen.has(c.condition) && CONDITION_TREATMENT_MAP[c.condition]) {
            seen.add(c.condition);
            result.push({ name: c.condition, confidence: c.confidence });
          }
        });
      });
      return result.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.confidence] || 3) - ({ high: 0, medium: 1, low: 2 }[b.confidence] || 3));
    })();
    const applyCondition = (condName) => {
      const info = CONDITION_TREATMENT_MAP[condName];
      if (!info) return;
      setReportForm(f => ({
        ...f,
        diagnosis: condName,
        treatment: info.treatment,
        medications: info.medications.map(m => ({ ...m })),
      }));
      if (info.estimatedMinutes && timers[selVisitId]) {
        const timer = timers[selVisitId];
        const updated = { ...timer, stages: { ...timer.stages } };
        Object.entries(info.estimatedMinutes).forEach(([key, mins]) => {
          if (updated.stages[key]) updated.stages[key] = { ...updated.stages[key], estimatedMinutes: mins };
        });
        if (IS_CONFIGURED && db) set(ref(db, `timers/${selVisitId}`), updated);
        setTimers(prev => ({ ...prev, [selVisitId]: updated }));
      }
      showToast(`Applied: ${condName}`);
    };
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-3xl p-4 text-center shadow">
          <div className="text-3xl mb-1">📋</div><h2 className="text-xl font-extrabold">Medical Report</h2>
          <p className="text-blue-100 text-sm">{selPat?.animalName} · {fmtDate(selVisit.checkInDate)}</p>
        </div>
        {SuggestionCard()}
        {/* Quick diagnosis buttons */}
        {quickConditions.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-4">
            <h4 className="font-bold text-gray-700 text-sm mb-2">⚡ Quick Diagnosis {(selVisit.symptoms || []).length > 0 ? <span className="text-xs text-gray-400 font-normal">· based on check-in symptoms</span> : <span className="text-xs text-gray-400 font-normal">· tap to auto-fill report</span>}</h4>
            <div className="flex flex-wrap gap-2">
              {quickConditions.map(c => {
                const cls = c.confidence === 'high' ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                  : c.confidence === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100';
                return (
                  <button key={c.name} onClick={() => applyCondition(c.name)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-all ${cls}`}>
                    {c.confidence === 'high' && '🔴 '}{c.confidence === 'medium' && '🟡 '}{c.name}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">Tap any condition to auto-fill diagnosis, treatment &amp; meds. You can still edit everything below.</p>
          </div>
        )}
        <div className="bg-white rounded-2xl shadow p-5 space-y-4">
          <div><label className="label">Diagnosing Doctor</label><input className="input" placeholder="e.g. Dr. Emma" value={reportForm.doctorName} onChange={e => setReportForm(f => ({ ...f, doctorName: e.target.value }))} /></div>
          <div><label className="label">Diagnosis</label><textarea className="input min-h-[80px]" placeholder="What is wrong with the patient?" value={reportForm.diagnosis} onChange={e => setReportForm(f => ({ ...f, diagnosis: e.target.value }))} /></div>
          <div><label className="label">Treatment Plan</label><textarea className="input min-h-[80px]" placeholder="How are we treating the patient?" value={reportForm.treatment} onChange={e => setReportForm(f => ({ ...f, treatment: e.target.value }))} /></div>
          <div>
            <label className="label mb-2">Medications Prescribed</label>
            {reportForm.medications.map((med, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input className="input flex-1 text-sm" placeholder="Medication" value={med.name} onChange={e => { const m = [...reportForm.medications]; m[i] = { ...m[i], name: e.target.value }; setReportForm(f => ({ ...f, medications: m })); }} />
                <input className="input w-24 text-sm" placeholder="Dose" value={med.dosage} onChange={e => { const m = [...reportForm.medications]; m[i] = { ...m[i], dosage: e.target.value }; setReportForm(f => ({ ...f, medications: m })); }} />
                <input className="input w-28 text-sm" placeholder="Freq" value={med.frequency} onChange={e => { const m = [...reportForm.medications]; m[i] = { ...m[i], frequency: e.target.value }; setReportForm(f => ({ ...f, medications: m })); }} />
                <button className="text-red-400 hover:text-red-600 px-1" onClick={() => setReportForm(f => ({ ...f, medications: f.medications.filter((_, j) => j !== i) }))}>✕</button>
              </div>
            ))}
            <div className="flex flex-wrap gap-2 mt-2">
              {MED_PRESETS.map(m => <button key={m} className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full border border-blue-200"
                onClick={() => setReportForm(f => ({ ...f, medications: [...f.medications, { name: m, dosage: '', frequency: '' }] }))}>+ {m}</button>)}
            </div>
          </div>
          <div><label className="label">Additional Notes</label><textarea className="input min-h-[80px]" placeholder="Any other observations..." value={reportForm.notes} onChange={e => setReportForm(f => ({ ...f, notes: e.target.value }))} /></div>
        </div>
        <div className="flex gap-3">
          <button className="flex-1 border-2 border-gray-300 text-gray-600 py-3 rounded-2xl font-bold hover:bg-gray-50" onClick={() => setSubView('visit')}>← Cancel</button>
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
          <div className="text-3xl mb-1">🏠</div><h2 className="text-xl font-extrabold">Discharge Form</h2>
          <p className="text-green-100 text-sm">{selPat?.animalName} is going home!</p>
        </div>
        <div className="bg-white rounded-2xl shadow p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Discharge Date</label><input type="date" className="input" value={dischargeForm.dischargeDate} onChange={e => setDischargeForm(f => ({ ...f, dischargeDate: e.target.value }))} /></div>
            <div><label className="label">Discharge Time</label><input type="time" className="input" value={dischargeForm.dischargeTime} onChange={e => setDischargeForm(f => ({ ...f, dischargeTime: e.target.value }))} /></div>
          </div>
          <div><label className="label">Home Care Instructions</label>
            <textarea className="input min-h-[100px]" placeholder="Instructions for caring for your pet at home..."
              value={dischargeForm.instructions} onChange={e => setDischargeForm(f => ({ ...f, instructions: e.target.value }))} /></div>
          <div>
            <label className="label mb-2">Take-home Medications</label>
            {dischargeForm.meds.map((m, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input className="input flex-1 text-sm" placeholder="Medication" value={m.name} onChange={e => { const ms = [...dischargeForm.meds]; ms[i] = { ...ms[i], name: e.target.value }; setDischargeForm(f => ({ ...f, meds: ms })); }} />
                <input className="input flex-1 text-sm" placeholder="Instructions" value={m.instructions} onChange={e => { const ms = [...dischargeForm.meds]; ms[i] = { ...ms[i], instructions: e.target.value }; setDischargeForm(f => ({ ...f, meds: ms })); }} />
                <button className="text-red-400 hover:text-red-600 px-1" onClick={() => setDischargeForm(f => ({ ...f, meds: f.meds.filter((_, j) => j !== i) }))}>✕</button>
              </div>))}
            <button className="text-green-600 text-sm font-semibold hover:underline" onClick={() => setDischargeForm(f => ({ ...f, meds: [...f.meds, { name: '', instructions: '' }] }))}>+ Add Medication</button>
          </div>
          <div><label className="label">Follow-up Appointment</label><input type="date" className="input" value={dischargeForm.followUpDate} onChange={e => setDischargeForm(f => ({ ...f, followUpDate: e.target.value }))} /></div>
          <div><label className="label mb-2">How is the pet going home?</label>
            <div className="grid grid-cols-2 gap-3">
              {[['owner-pickup','🚶 Owner Picks Up','border-green-400 bg-green-500'],['home-delivery','🚑 Ambulance Delivery','border-orange-400 bg-orange-500']].map(([v,l,ac]) => (
                <button key={v} onClick={() => setDischargeForm(f => ({ ...f, deliveryType: v }))}
                  className={`py-3 rounded-xl font-bold border-2 transition-all text-sm ${dischargeForm.deliveryType === v ? `${ac} text-white` : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>{l}</button>))}
            </div>
            {dischargeForm.deliveryType === 'home-delivery' && <input className="input mt-2" placeholder="Delivery address..." value={dischargeForm.deliveryAddress} onChange={e => setDischargeForm(f => ({ ...f, deliveryAddress: e.target.value }))} />}
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex-1 border-2 border-gray-300 text-gray-600 py-3 rounded-2xl font-bold hover:bg-gray-50" onClick={() => setSubView('visit')}>← Cancel</button>
          <button className="flex-[2] btn-green py-3 rounded-2xl font-bold shadow-lg" onClick={saveDischarge}>🏠 Discharge Patient!</button>
        </div>
      </div>
    );
  };

  const InvoiceView = () => {
    if (!selVisit) return null;
    const total = invoiceItems.reduce((s, i) => s + Number(i.price), 0);
    const isPaid = selPat?.visits?.find(v => v.id === selVisitId)?.paymentStatus === 'paid';
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-3xl p-4 text-center shadow">
          <div className="text-3xl mb-1">💰</div><h2 className="text-xl font-extrabold">Invoice &amp; Payment</h2></div>
        <div className="bg-white rounded-2xl shadow p-5">
          <div className="flex justify-between items-start mb-4">
            <div><div className="font-bold text-gray-800 text-lg">{selPat?.animalName}</div><div className="text-gray-500 text-sm">Owner: {selPat?.ownerName}</div></div>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{isPaid ? '✅ PAID' : '⚠️ UNPAID'}</span>
          </div>
          <div className="border-t border-b border-gray-100 py-3 mb-3">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Add Services</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_SERVICES.map(s => <button key={s.name} onClick={() => setInvoiceItems(p => [...p, { ...s, id: genId() }])}
                className="bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full border border-amber-200 font-medium">+ {s.name} (${s.price})</button>)}
            </div>
            <div className="flex gap-2 mt-3">
              <input className="input flex-1 text-sm" placeholder="Custom service..." value={customSvc.name} onChange={e => setCustomSvc(c => ({ ...c, name: e.target.value }))} />
              <input type="number" className="input w-20 text-sm" placeholder="$" value={customSvc.price} onChange={e => setCustomSvc(c => ({ ...c, price: e.target.value }))} />
              <button className="btn-amber px-3 py-2 rounded-xl text-sm font-bold" onClick={() => { if (customSvc.name && customSvc.price) { setInvoiceItems(p => [...p, { name: customSvc.name, price: parseFloat(customSvc.price), id: genId() }]); setCustomSvc({ name: '', price: '' }); } }}>Add</button>
            </div>
          </div>
          <div className="space-y-2 min-h-[60px]">
            {invoiceItems.length === 0 ? <p className="text-gray-400 text-sm text-center py-3">No services added yet</p>
              : invoiceItems.map((item, i) => (
                <div key={item.id || i} className="flex items-center justify-between">
                  <span className="text-gray-800">{item.name}</span>
                  <div className="flex items-center gap-3"><span className="font-semibold">${Number(item.price).toFixed(2)}</span>
                    <button className="text-red-300 hover:text-red-500" onClick={() => setInvoiceItems(p => p.filter((_, j) => j !== i))}>✕</button></div>
                </div>))}
          </div>
          <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between items-center">
            <span className="text-xl font-bold text-gray-800">Total Due:</span>
            <span className="text-2xl font-extrabold text-green-600">${total.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex-1 btn-amber py-3 rounded-2xl font-bold shadow" onClick={saveInvoice}>💾 Save Invoice</button>
          {!isPaid && <button className="flex-1 btn-green py-3 rounded-2xl font-bold shadow" onClick={markPaid}>💵 Mark as Paid!</button>}
        </div>
        <button className="w-full border-2 border-gray-300 text-gray-600 py-3 rounded-2xl font-bold hover:bg-gray-50" onClick={() => setSubView('visit')}>← Back to Visit</button>
      </div>
    );
  };

  const AmbulanceView = () => {
    if (!selVisit) return null;
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-3xl p-4 text-center shadow">
          <div className="text-3xl mb-1">🚑</div><h2 className="text-xl font-extrabold">Pet Ambulance</h2></div>
        <div className="bg-white rounded-2xl shadow p-5 space-y-4">
          <div><label className="label mb-2">Type of Service</label>
            <div className="grid grid-cols-2 gap-3">
              {[['pickup','🏠 → 🏥\nPickup'],['delivery','🏥 → 🏠\nDelivery']].map(([v,l]) => (
                <button key={v} onClick={() => setAmbulanceForm(f => ({ ...f, type: v }))}
                  className={`py-4 rounded-2xl font-bold border-2 text-sm whitespace-pre-line transition-all ${ambulanceForm.type === v ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200'}`}>{l}</button>))}
            </div></div>
          <div><label className="label">{ambulanceForm.type === 'pickup' ? 'Pickup Address' : 'Delivery Address'}</label>
            <input className="input" placeholder="Enter address..." value={ambulanceForm.address} onChange={e => setAmbulanceForm(f => ({ ...f, address: e.target.value }))} /></div>
          <div><label className="label">Notes for Driver</label>
            <textarea className="input min-h-[80px]" placeholder="Any special instructions?" value={ambulanceForm.notes} onChange={e => setAmbulanceForm(f => ({ ...f, notes: e.target.value }))} /></div>
          <div><label className="label mb-2">Ambulance Status</label>
            <div className="grid grid-cols-3 gap-2">
              {[['pending','⏳ Pending','bg-amber-400'],['dispatched','🚑 Dispatched!','bg-orange-500'],['arrived','✅ Arrived!','bg-green-500']].map(([v,l,ac]) => (
                <button key={v} onClick={() => setAmbulanceForm(f => ({ ...f, status: v }))}
                  className={`py-2 rounded-xl font-bold border-2 text-sm transition-all ${ambulanceForm.status === v ? `${ac} text-white border-transparent` : 'bg-white text-gray-600 border-gray-200'}`}>{l}</button>))}
            </div></div>
        </div>
        <div className="flex gap-3">
          <button className="flex-1 border-2 border-gray-300 text-gray-600 py-3 rounded-2xl font-bold hover:bg-gray-50" onClick={() => setSubView('visit')}>← Cancel</button>
          <button className="flex-[2] bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-2xl font-bold shadow-lg" onClick={saveAmbulance}>🚑 Dispatch!</button>
        </div>
      </div>
    );
  };

  // ── Settings View (Staff) ──────────────────────────────────────────────────
  const SettingsView = () => {
    const settings = mySettings;
    const alerts = [
      ['alertNewCheckIn', '📋 New Check-Ins', 'Get notified when a new patient checks in'],
      ['alertEmergency', '🚨 Emergency Patients', 'Get notified for emergency cases'],
      ['alertStageChange', '⏭️ Stage Changes', 'Get notified when patients move to next stage'],
      ['alertDischarge', '🏠 Discharges', 'Get notified when patients are discharged'],
      ['alertPayment', '💰 Payments', 'Get notified when payments are received'],
    ];
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-3xl p-5 text-center shadow">
          <div className="text-4xl mb-1">⚙️</div><h2 className="text-2xl font-extrabold">{currentUser?.displayName}&apos;s Settings</h2>
          <p className="text-gray-300 text-sm">Customize your experience</p>
        </div>
        <div className="bg-white rounded-2xl shadow p-5">
          <h3 className="font-bold text-gray-800 mb-4">🔔 Alert Preferences</h3>
          <div className="space-y-3">
            {alerts.map(([key, label, desc]) => (
              <label key={key} className="flex items-center justify-between p-3 rounded-xl border-2 border-gray-100 hover:border-purple-200 cursor-pointer transition-all">
                <div><div className="font-semibold text-gray-800 text-sm">{label}</div><div className="text-xs text-gray-400">{desc}</div></div>
                <input type="checkbox" className="accent-purple-500 w-5 h-5" checked={settings[key] ?? true} onChange={e => updateSetting(key, e.target.checked)} />
              </label>
            ))}
          </div>
        </div>
        {/* Device Notifications */}
        <div className="bg-white rounded-2xl shadow p-5">
          <h3 className="font-bold text-gray-800 mb-3">📱 Device Notifications</h3>
          {typeof Notification === 'undefined' ? (
            <p className="text-sm text-gray-400">Your browser does not support notifications.</p>
          ) : notifPermission === 'granted' ? (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border-2 border-green-200">
              <span className="text-green-500 text-lg">✅</span>
              <div><p className="text-sm font-semibold text-green-700">Notifications enabled!</p><p className="text-xs text-green-500">You&apos;ll receive device alerts for your enabled categories above.</p></div>
            </div>
          ) : notifPermission === 'denied' ? (
            <div className="p-3 bg-red-50 rounded-xl border-2 border-red-200">
              <p className="text-sm font-semibold text-red-600">Notifications blocked</p>
              <p className="text-xs text-red-400 mt-1">To enable: open your browser settings → Site permissions → allow notifications for this site.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Get device alerts (banners &amp; sounds) for check-ins, emergencies, and more.</p>
              <button onClick={requestNotifPermission} className="w-full btn-purple py-2.5 rounded-xl font-bold text-sm shadow">🔔 Enable Device Notifications</button>
            </div>
          )}
          {isIOS && !isStandalone && (
            <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-xs text-blue-600 font-semibold">📲 For the best experience on iOS:</p>
              <p className="text-xs text-blue-500 mt-1">Tap <strong>Share</strong> ↗ → <strong>Add to Home Screen</strong> to install this app and get notifications.</p>
            </div>
          )}
        </div>
        {/* Install App */}
        {installPrompt && (
          <div className="bg-white rounded-2xl shadow p-5">
            <h3 className="font-bold text-gray-800 mb-3">📲 Install App</h3>
            <p className="text-sm text-gray-600 mb-3">Install to your home screen for quick access — works like a native app!</p>
            <button onClick={handleInstallApp} className="w-full btn-pink py-2.5 rounded-xl font-bold text-sm shadow">📲 Install App</button>
          </div>
        )}
        <div className="bg-white rounded-2xl shadow p-5">
          <h3 className="font-bold text-gray-800 mb-3">👤 Account Info</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><span className="text-gray-400">Username:</span> {currentUser?.username}</p>
            <p><span className="text-gray-400">Role:</span> Staff</p>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full border-2 border-red-300 text-red-500 py-3 rounded-2xl font-bold hover:bg-red-50">Logout</button>
      </div>
    );
  };

  // ── Discharge Paper View ───────────────────────────────────────────────────
  const DischargePaperView = () => {
    const paper = dischargePapers[selVisitId];
    if (!paper) return <div className="text-center py-12 text-gray-400">No discharge paper found.</div>;
    const ep = editingPaper || paper;
    const isEditing = !!editingPaper;
    return (
      <div className="space-y-4">
        <div className="no-print flex gap-2">
          {!paper.finalized && !isEditing && <button onClick={() => setEditingPaper({ ...paper })} className="flex-1 btn-blue py-2 rounded-xl text-sm font-bold">📝 Edit</button>}
          {isEditing && <button onClick={() => { saveDischargePaper(editingPaper); setEditingPaper(null); }} className="flex-1 btn-green py-2 rounded-xl text-sm font-bold">💾 Save</button>}
          {isEditing && <button onClick={() => setEditingPaper(null)} className="px-4 py-2 border-2 border-gray-200 text-gray-500 rounded-xl text-sm font-bold">Cancel</button>}
          {!paper.finalized && !isEditing && <button onClick={() => saveDischargePaper({ ...paper, finalized: true })} className="flex-1 btn-purple py-2 rounded-xl text-sm font-bold">✅ Finalize</button>}
          <button onClick={() => window.print()} className="px-4 py-2 border-2 border-gray-200 text-gray-600 rounded-xl text-sm font-bold">🖨️ Print</button>
        </div>
        <div className="discharge-paper bg-white rounded-2xl shadow p-6 space-y-4">
          {/* Letterhead */}
          <div className="text-center border-b-2 border-pink-200 pb-4">
            <h1 className="text-2xl font-extrabold text-pink-600">🏥 Rose &amp; Ruth&apos;s Animal Hospital</h1>
            <p className="text-gray-500 text-sm">{ep.hospitalAddress} · {ep.hospitalPhone}</p>
            <p className="text-xs text-gray-400 mt-1">DISCHARGE SUMMARY</p>
          </div>
          {/* Patient & Owner */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-pink-50 rounded-xl p-3">
              <p className="text-xs font-bold text-pink-600 uppercase mb-1">Patient</p>
              <p className="font-bold text-gray-800">{ep.patientName} {emojiFor(ep.species)}</p>
              <p className="text-sm text-gray-600 capitalize">{ep.species}{ep.breed ? ` · ${ep.breed}` : ''}</p>
              {ep.birthday && <p className="text-xs text-gray-400">Born: {fmtDate(ep.birthday)}</p>}
            </div>
            <div className="bg-purple-50 rounded-xl p-3">
              <p className="text-xs font-bold text-purple-600 uppercase mb-1">Owner</p>
              <p className="font-bold text-gray-800">{ep.ownerName}</p>
              {ep.ownerPhone && <p className="text-sm text-gray-600">{ep.ownerPhone}</p>}
              {ep.ownerEmail && <p className="text-sm text-gray-600">{ep.ownerEmail}</p>}
            </div>
          </div>
          {/* Visit Summary */}
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-xs font-bold text-blue-600 uppercase mb-1">Visit Summary</p>
            <p className="text-sm text-gray-700"><span className="text-gray-400">Admitted:</span> {fmtDate(ep.checkInDate)} at {ep.checkInTime}</p>
            <p className="text-sm text-gray-700"><span className="text-gray-400">Discharged:</span> {fmtDate(ep.dischargeDate)} at {ep.dischargeTime}</p>
            <p className="text-sm text-gray-700"><span className="text-gray-400">Complaint:</span> {ep.chiefComplaint}</p>
            {ep.doctor && <p className="text-sm text-gray-700"><span className="text-gray-400">Doctor:</span> {ep.doctor}</p>}
          </div>
          {/* Diagnosis & Treatment */}
          <div className="space-y-2">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Diagnosis</p>
              {isEditing ? <textarea className="input min-h-[60px] text-sm" value={ep.diagnosis} onChange={e => setEditingPaper(p => ({ ...p, diagnosis: e.target.value }))} />
                : <p className="text-sm text-gray-800">{ep.diagnosis || '—'}</p>}
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Treatment Given</p>
              {isEditing ? <textarea className="input min-h-[60px] text-sm" value={ep.treatment} onChange={e => setEditingPaper(p => ({ ...p, treatment: e.target.value }))} />
                : <p className="text-sm text-gray-800">{ep.treatment || '—'}</p>}
            </div>
          </div>
          {/* Medications */}
          {(ep.medicationsGiven?.length > 0 || ep.takeHomeMeds?.length > 0) && (
            <div className="grid grid-cols-2 gap-3">
              {ep.medicationsGiven?.length > 0 && <div className="bg-purple-50 rounded-xl p-3">
                <p className="text-xs font-bold text-purple-600 uppercase mb-1">During Visit</p>
                {ep.medicationsGiven.map((m, i) => <p key={i} className="text-xs text-gray-700">💊 {m.name} — {m.dosage}</p>)}
              </div>}
              {ep.takeHomeMeds?.length > 0 && <div className="bg-green-50 rounded-xl p-3">
                <p className="text-xs font-bold text-green-600 uppercase mb-1">Take Home</p>
                {ep.takeHomeMeds.map((m, i) => <p key={i} className="text-xs text-gray-700">💊 {m.name}{m.instructions ? ` — ${m.instructions}` : ''}</p>)}
              </div>}
            </div>
          )}
          {/* Home Care */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <p className="text-xs font-bold text-green-600 uppercase mb-1">Home Care Instructions</p>
            {isEditing ? <textarea className="input min-h-[80px] text-sm" value={ep.homeCareInstructions} onChange={e => setEditingPaper(p => ({ ...p, homeCareInstructions: e.target.value }))} />
              : <p className="text-sm text-gray-800">{ep.homeCareInstructions || '—'}</p>}
          </div>
          {ep.followUpDate && <div className="bg-amber-50 rounded-xl p-3">
            <p className="text-xs font-bold text-amber-600 uppercase mb-1">Follow-Up Appointment</p>
            <p className="text-sm text-gray-800">{fmtDate(ep.followUpDate)}</p>
          </div>}
          {/* Billing */}
          {ep.services?.length > 0 && <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Billing Summary</p>
            {ep.services.map((s, i) => <div key={i} className="flex justify-between text-sm"><span>{s.name}</span><span>${Number(s.price).toFixed(2)}</span></div>)}
            <div className="border-t mt-2 pt-2 flex justify-between font-bold"><span>Total</span><span>${Number(ep.totalAmount).toFixed(2)}</span></div>
            <p className={`text-xs mt-1 font-semibold ${ep.paymentStatus === 'paid' ? 'text-green-600' : 'text-red-600'}`}>{ep.paymentStatus === 'paid' ? '✅ Paid' : '⚠️ Unpaid'}</p>
          </div>}
          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">Thank you for trusting Rose &amp; Ruth&apos;s Animal Hospital!</p>
            <p className="text-xs text-gray-400 mt-1">Where every pet gets pawsome care! 🐾</p>
          </div>
        </div>
        <button className="no-print w-full border-2 border-gray-300 text-gray-600 py-3 rounded-2xl font-bold hover:bg-gray-50" onClick={() => { setEditingPaper(null); setSubView('visit'); }}>← Back</button>
      </div>
    );
  };

  // ── Family Dashboard ───────────────────────────────────────────────────────
  const FamilyDashboard = () => (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 pb-10">
      <div className="bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600 text-white px-6 pt-8 pb-6 text-center">
        <div className="text-5xl mb-1">🏥🐾</div>
        <h1 className="text-3xl font-extrabold">Rose &amp; Ruth&apos;s</h1>
        <p className="text-pink-100 text-sm mt-1">Welcome, {currentUser?.displayName}!</p>
        <button onClick={handleLogout} className="mt-2 text-pink-200 text-xs underline hover:text-white">Logout</button>
      </div>
      <div className="px-5 py-5 max-w-lg mx-auto space-y-4">
        {/* Notification enable banner for families */}
        {notifPermission === 'default' && !notifPromptDismissed.current && (
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-2xl p-4 shadow-lg">
            <p className="font-bold text-sm">🔔 Get notified about your pet!</p>
            <p className="text-purple-100 text-xs mt-1">Receive alerts when your pet moves to a new stage or is ready for pickup.</p>
            <div className="flex gap-2 mt-3">
              <button onClick={requestNotifPermission} className="flex-1 bg-white text-purple-600 py-2 rounded-xl font-bold text-sm shadow">Enable Alerts</button>
              <button onClick={() => { notifPromptDismissed.current = true; localStorage.setItem('rrNotifDismissed', '1'); showToast('You can enable alerts later in settings.'); }}
                className="px-4 py-2 text-purple-200 text-sm font-semibold hover:text-white">Not now</button>
            </div>
          </div>
        )}
        {/* iOS install instructions */}
        {isIOS && !isStandalone && showInstallBanner && (
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200 relative">
            <button onClick={() => setShowInstallBanner(false)} className="absolute top-2 right-3 text-blue-300 hover:text-blue-500 text-lg">&times;</button>
            <p className="text-sm font-bold text-blue-700">📲 Install this app</p>
            <p className="text-xs text-blue-500 mt-1">Tap <strong>Share</strong> ↗ then <strong>Add to Home Screen</strong> for the best experience with notifications!</p>
          </div>
        )}
        <h2 className="font-bold text-gray-800 text-lg">🐾 My Pets</h2>
        {myPatients.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-5 text-center text-gray-400">
            <div className="text-4xl mb-2">🔍</div>
            <p>No pets linked to your account yet.</p>
            <p className="text-xs mt-1">Make sure your owner name matches when checking in!</p>
          </div>
        ) : myPatients.map(p => {
          const activeV = p.visits?.find(v => v.status !== 'discharged');
          const lastV = p.visits?.[p.visits.length - 1];
          return (
            <div key={p.id} className="bg-white rounded-2xl shadow p-5 space-y-3">
              <div className="flex items-center gap-3">
                {PatAvatar({ pat: p, size: 14 })}
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-lg">{p.animalName}</h3>
                  <p className="text-gray-500 text-sm capitalize">{p.species}{p.breed ? ` · ${p.breed}` : ''}</p>
                </div>
                {activeV && <span className={`text-xs px-2 py-1 rounded-full font-semibold border ${STATUS[activeV.status].cls}`}>{STATUS[activeV.status].label}</span>}
              </div>
              {/* Timer for active visit */}
              {activeV && timers[activeV.id] && <TimerCard visitId={activeV.id} compact />}
              {/* Active visit info */}
              {activeV && (
                <div className="bg-amber-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-amber-600 uppercase mb-1">Current Visit</p>
                  <p className="text-sm text-gray-700">{activeV.chiefComplaint}</p>
                  {activeV.doctorName && <p className="text-xs text-gray-500 mt-1">Doctor: {activeV.doctorName}</p>}
                  {activeV.diagnosis && <p className="text-xs text-gray-500 mt-1">Diagnosis: {activeV.diagnosis}</p>}
                </div>)}
              {/* Last visit if discharged */}
              {!activeV && lastV && (
                <div className="bg-green-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-green-600 uppercase mb-1">Last Visit — {fmtDate(lastV.checkInDate)}</p>
                  <p className="text-sm text-gray-700">{lastV.chiefComplaint}</p>
                  {lastV.diagnosis && <p className="text-xs text-gray-500 mt-1">Diagnosis: {lastV.diagnosis}</p>}
                  {lastV.dischargeInstructions && <p className="text-xs text-gray-500 mt-1">Home care: {lastV.dischargeInstructions}</p>}
                  {lastV.followUpDate && <p className="text-xs text-gray-500 mt-1">Follow-up: {fmtDate(lastV.followUpDate)}</p>}
                </div>)}
              {/* Discharge papers */}
              {p.visits?.filter(v => dischargePapers[v.id]?.finalized).length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">📄 Discharge Papers</p>
                  {p.visits.filter(v => dischargePapers[v.id]?.finalized).map(v => (
                    <button key={v.id} onClick={() => { setSelPatId(p.id); setSelVisitId(v.id); setSubView('discharge-paper'); setView('patient'); }}
                      className="w-full text-left p-2 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 text-sm text-gray-700 mb-1">
                      📄 {fmtDate(v.checkInDate)} — {v.chiefComplaint}
                    </button>
                  ))}
                </div>)}
              <p className="text-xs text-gray-400">{p.visits?.length || 0} total visit(s)</p>
            </div>
          );
        })}
        {/* Recent updates for my pets */}
        {(() => {
          const myNotifs = notifications.filter(n => myPatients.some(p => p.id === n.patientId)).slice(0, 10);
          if (!myNotifs.length) return null;
          return (
            <div className="bg-white rounded-2xl shadow p-4">
              <h3 className="font-bold text-gray-800 mb-3">🔔 Recent Updates</h3>
              <div className="space-y-2">
                {myNotifs.map(n => (
                  <div key={n.id} className="flex gap-2 p-2 rounded-lg bg-gray-50">
                    <span>{NOTIF_TYPES[n.type]?.emoji || '📌'}</span>
                    <div><p className="text-sm text-gray-700">{n.message}</p><p className="text-xs text-gray-400">{timeAgo(n.timestamp)}</p></div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );

  // ── Breadcrumb ─────────────────────────────────────────────────────────────
  const Breadcrumb = () => {
    const subLabels = { info: null, visit: '📅 Visit', report: '📋 Report', discharge: '🏠 Discharge', invoice: '💰 Invoice', ambulance: '🚑 Ambulance', 'discharge-paper': '📄 Paper' };
    return (
      <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-2 text-sm flex-wrap sticky top-0 z-20 shadow-sm">
        <button onClick={() => setView('dashboard')} className="text-pink-500 font-semibold hover:text-pink-700">🏥 R&amp;R</button>
        {view === 'checkin' && <><span className="text-gray-300">&rsaquo;</span><span className="text-gray-600 font-semibold">Check-In</span></>}
        {view === 'records' && <><span className="text-gray-300">&rsaquo;</span><span className="text-gray-600 font-semibold">Records</span></>}
        {view === 'settings' && <><span className="text-gray-300">&rsaquo;</span><span className="text-gray-600 font-semibold">Settings</span></>}
        {view === 'patient' && (<>
          <span className="text-gray-300">&rsaquo;</span>
          <button onClick={() => setSubView('info')} className="text-purple-500 font-semibold hover:text-purple-700">{emojiFor(selPat?.species)} {selPat?.animalName}</button>
          {subView === 'visit' && <><span className="text-gray-300">&rsaquo;</span><span className="text-gray-600 font-semibold">📅 Visit</span></>}
          {subLabels[subView] && subView !== 'visit' && <><span className="text-gray-300">&rsaquo;</span><span className="text-gray-600 font-semibold">{subLabels[subView]}</span></>}
        </>)}
        {/* Right side: notifications bell + logout */}
        <div className="ml-auto flex items-center gap-2">
          {isStaff && (
            <button onClick={() => setShowNotifPanel(!showNotifPanel)} className="relative p-1">
              <span className="text-xl">🔔</span>
              {unreadNotifs > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{unreadNotifs > 9 ? '9+' : unreadNotifs}</span>}
            </button>
          )}
          <button onClick={handleLogout} className="text-gray-400 text-xs hover:text-gray-600 font-semibold">Logout</button>
        </div>
      </div>
    );
  };

  // ── Patient subview router ─────────────────────────────────────────────────
  const PatientView = () => {
    if (subView === 'visit') return VisitDetail();
    if (subView === 'report') return MedicalReport();
    if (subView === 'discharge') return DischargeFormView();
    if (subView === 'invoice') return InvoiceView();
    if (subView === 'ambulance') return AmbulanceView();
    if (subView === 'discharge-paper') return DischargePaperView();
    return PatientDetail();
  };

  // ─── PUBLIC PAGE (not logged in) ──────────────────────────────────────────
  if (!isLoggedIn) {
    const PubHeader = ({ back }) => (
      <div className="bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600 text-white px-6 pt-8 pb-6 text-center relative">
        {back && <button onClick={() => setPubView('home')} className="absolute left-4 top-6 text-pink-200 hover:text-white text-sm font-semibold">← Back</button>}
        <div className="text-5xl mb-1">🏥🐾</div>
        <h1 className="text-3xl font-extrabold tracking-tight">Rose &amp; Ruth&apos;s</h1>
        <p className="text-lg font-bold text-pink-100">Animal Hospital</p>
      </div>
    );

    const LoginButtons = () => (
      <div className="space-y-3">
        {loginMode === 'none' && (
          <div className="flex gap-2">
            <button onClick={() => { setLoginMode('staff'); setLoginError(''); }} className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white py-2.5 rounded-2xl font-bold text-sm shadow">👩‍⚕️ Staff Login</button>
            <button onClick={() => { setLoginMode('family'); setLoginError(''); }} className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-2.5 rounded-2xl font-bold text-sm shadow">👨‍👩‍👧 Family Login</button>
          </div>
        )}
        {loginMode === 'none' && <button onClick={() => { setLoginMode('register'); setRegisterError(''); }} className="w-full border-2 border-purple-300 text-purple-600 py-2 rounded-2xl font-bold text-sm hover:bg-purple-50">📝 Create Family Account</button>}
        {(loginMode === 'staff' || loginMode === 'family') && (
          <div className="bg-white rounded-3xl shadow-xl p-5 space-y-3">
            <p className="text-center font-bold text-gray-700">{loginMode === 'staff' ? '👩‍⚕️ Staff Login' : '👨‍👩‍👧 Family Login'}</p>
            <input className="input" placeholder="Username" value={loginForm.username} onChange={e => { setLoginForm(f => ({ ...f, username: e.target.value })); setLoginError(''); }} />
            <input type="password" className="input" placeholder="Password" value={loginForm.password} onChange={e => { setLoginForm(f => ({ ...f, password: e.target.value })); setLoginError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') loginMode === 'staff' ? handleStaffLogin() : handleFamilyLogin(); }} />
            {loginError && <p className="text-center text-red-500 text-sm font-semibold">{loginError}</p>}
            <button onClick={loginMode === 'staff' ? handleStaffLogin : handleFamilyLogin}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white py-3 rounded-2xl font-extrabold shadow-lg">Login</button>
            <button onClick={() => { setLoginMode('none'); setLoginError(''); }} className="w-full text-gray-400 text-sm hover:text-gray-600">Cancel</button>
          </div>
        )}
        {loginMode === 'register' && (
          <div className="bg-white rounded-3xl shadow-xl p-5 space-y-3">
            <p className="text-center font-bold text-gray-700">📝 Create Family Account</p>
            <input className="input" placeholder="Choose a username" value={registerForm.username} onChange={e => { setRegisterForm(f => ({ ...f, username: e.target.value })); setRegisterError(''); }} />
            <input type="password" className="input" placeholder="Password (4+ chars)" value={registerForm.password} onChange={e => setRegisterForm(f => ({ ...f, password: e.target.value }))} />
            <input type="password" className="input" placeholder="Confirm password" value={registerForm.confirm} onChange={e => setRegisterForm(f => ({ ...f, confirm: e.target.value }))} />
            <input className="input" placeholder="Your family/display name" value={registerForm.displayName} onChange={e => setRegisterForm(f => ({ ...f, displayName: e.target.value }))} />
            <input className="input" placeholder="Owner name (to link pets)" value={registerForm.ownerName} onChange={e => setRegisterForm(f => ({ ...f, ownerName: e.target.value }))} />
            <p className="text-xs text-gray-400">Use the same owner name you used when checking in pets to auto-link them!</p>
            {registerError && <p className="text-center text-red-500 text-sm font-semibold">{registerError}</p>}
            <button onClick={handleRegister} className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 rounded-2xl font-extrabold shadow-lg">Create Account</button>
            <button onClick={() => { setLoginMode('none'); setRegisterError(''); }} className="w-full text-gray-400 text-sm hover:text-gray-600">Cancel</button>
          </div>
        )}
      </div>
    );

    // Confirmed
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
              <p className="text-gray-400 text-sm">Our vets will call you shortly.</p>
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 mt-2">
                <p className="text-xs font-bold text-amber-600 uppercase mb-1">Position in Queue</p>
                <p className="text-4xl font-extrabold text-amber-700">#{qPos}</p>
              </div>
              {confirmedPat?.visits?.[0] && timers[confirmedPat.visits[0].id] && <TimerCard visitId={confirmedPat.visits[0].id} compact />}
            </div>
            <button onClick={() => setPubView('lookup')} className="w-full bg-purple-100 text-purple-700 font-bold py-3.5 rounded-2xl hover:bg-purple-200">🔍 Check Visit Status</button>
            <button onClick={() => setPubView('home')} className="w-full border-2 border-gray-200 text-gray-500 font-semibold py-3 rounded-2xl hover:bg-gray-50">← Back to Home</button>
          </div>
          <div className="text-center pb-5">{LoginButtons()}</div>
        </div>
      );
    }

    // Self check-in
    if (pubView === 'checkin') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex flex-col pb-10">
          {PubHeader({ back: true })}
          <div className="flex-1 px-5 py-5 max-w-sm mx-auto w-full space-y-4">
            <div className="bg-white rounded-3xl shadow p-5 space-y-4">
              <h2 className="text-xl font-extrabold text-pink-600">🐾 Check In Your Pet</h2>
              <div><label className="label">Your Pet&apos;s Name <span className="text-red-400">*</span></label>
                <input className="input" placeholder="e.g. Fluffy" value={pubForm.animalName} onChange={e => setPubForm(f => ({ ...f, animalName: e.target.value }))} /></div>
              <div><label className="label">Type of Animal</label>
                <select className="input" value={pubForm.species} onChange={e => setPubForm(f => ({ ...f, species: e.target.value }))}>
                  {Object.entries(ANIMAL_EMOJI).map(([s, emoji]) => <option key={s} value={s}>{emoji} {s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select></div>
              <div><label className="label">Your Name <span className="text-red-400">*</span></label>
                <input className="input" placeholder="Owner's name" value={pubForm.ownerName} onChange={e => setPubForm(f => ({ ...f, ownerName: e.target.value }))} /></div>
              <div><label className="label">What&apos;s wrong? <span className="text-red-400">*</span></label>
                <textarea className="input min-h-[80px]" placeholder="Describe what's going on..." value={pubForm.complaint} onChange={e => setPubForm(f => ({ ...f, complaint: e.target.value }))} /></div>
              <div><label className="label mb-2">How urgent is it?</label>
                <div className="grid grid-cols-3 gap-2">
                  {[['routine','✅ Routine','border-green-400 bg-green-500'],['urgent','⚡ Urgent','border-amber-400 bg-amber-400'],['emergency','🚨 Emergency','border-red-500 bg-red-500']].map(([val,lbl,ac]) => (
                    <button key={val} onClick={() => setPubForm(f => ({ ...f, urgency: val }))}
                      className={`py-2 rounded-xl text-sm font-bold border-2 transition-all ${pubForm.urgency === val ? `${ac} text-white` : 'border-gray-200 text-gray-500 bg-white'}`}>{lbl}</button>))}
                </div></div>
            </div>
            <button disabled={!pubForm.animalName || !pubForm.ownerName || !pubForm.complaint} onClick={pubSubmitCheckIn}
              className="w-full btn-pink py-4 rounded-2xl font-extrabold text-lg shadow-lg disabled:opacity-40 disabled:cursor-not-allowed">Check In! 🏥</button>
          </div>
        </div>
      );
    }

    // Visit lookup
    if (pubView === 'lookup') {
      const lookupResults = pubSearch ? patients.filter(p =>
        p.animalName?.toLowerCase().includes(pubSearch.toLowerCase()) || p.ownerName?.toLowerCase().includes(pubSearch.toLowerCase())) : [];
      return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex flex-col pb-10">
          {PubHeader({ back: true })}
          <div className="flex-1 px-5 py-5 max-w-sm mx-auto w-full space-y-4">
            <div className="bg-white rounded-3xl shadow p-5 space-y-3">
              <h2 className="text-xl font-extrabold text-purple-600">🔍 Look Up Your Visit</h2>
              <input className="input" placeholder="Search by pet name or your name..." value={pubSearch} onChange={e => setPubSearch(e.target.value)} autoFocus />
            </div>
            {pubSearch && lookupResults.length === 0 && <p className="text-center text-gray-400 text-sm py-4">No patients found.</p>}
            {lookupResults.map(p => {
              const activeVisit = p.visits?.find(v => v.status !== 'discharged');
              const lastVisit = p.visits?.[p.visits.length - 1];
              const showVisit = activeVisit || lastVisit;
              return (
                <div key={p.id} className="bg-white rounded-3xl shadow p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{emojiFor(p.species)}</span>
                    <div><div className="font-extrabold text-gray-800 text-lg">{p.animalName}</div><div className="text-sm text-gray-400">Owner: {p.ownerName}</div></div>
                    {showVisit && <span className={`ml-auto text-xs px-2 py-1 rounded-full font-semibold border ${STATUS[showVisit.status]?.cls}`}>{STATUS[showVisit.status]?.label}</span>}
                  </div>
                  {/* Timer */}
                  {activeVisit && timers[activeVisit.id] && <TimerCard visitId={activeVisit.id} compact />}
                  {showVisit && (
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-1.5 text-sm">
                      <div><span className="text-gray-400">Reason: </span>{showVisit.chiefComplaint}</div>
                      {showVisit.doctorName && <div><span className="text-gray-400">Doctor: </span>{showVisit.doctorName}</div>}
                      {showVisit.diagnosis && <div><span className="text-gray-400">Diagnosis: </span>{showVisit.diagnosis}</div>}
                      {showVisit.status === 'discharged' && showVisit.dischargeInstructions && <div><span className="text-gray-400">Home care: </span>{showVisit.dischargeInstructions}</div>}
                      {showVisit.status === 'discharged' && showVisit.followUpDate && <div><span className="text-gray-400">Follow-up: </span>{fmtDate(showVisit.followUpDate)}</div>}
                    </div>)}
                </div>);
            })}
          </div>
          <div className="px-5 max-w-sm mx-auto w-full">{LoginButtons()}</div>
        </div>
      );
    }

    // Home
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex flex-col">
        {PubHeader({})}
        <div className="flex-1 px-5 py-6 space-y-4 max-w-sm mx-auto w-full">
          {/* iOS install instructions */}
          {isIOS && !isStandalone && showInstallBanner && (
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200 relative">
              <button onClick={() => setShowInstallBanner(false)} className="absolute top-2 right-3 text-blue-300 hover:text-blue-500 text-lg">&times;</button>
              <p className="text-sm font-bold text-blue-700">📲 Install our app!</p>
              <p className="text-xs text-blue-500 mt-1">Tap <strong>Share</strong> ↗ then <strong>Add to Home Screen</strong> to get quick access and notifications.</p>
            </div>
          )}
          {/* Install prompt for Android/desktop */}
          {installPrompt && (
            <button onClick={handleInstallApp} className="w-full bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-2xl p-4 shadow-lg font-bold text-sm text-center">
              📲 Install App for Quick Access
            </button>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setPubView('checkin')} className="bg-gradient-to-br from-pink-500 to-fuchsia-500 text-white rounded-3xl p-5 text-center shadow-lg hover:shadow-xl transition-all">
              <div className="text-4xl mb-2">🐾</div><div className="font-extrabold text-lg leading-tight">Check In</div><div className="text-pink-100 text-xs mt-0.5">Register your pet</div></button>
            <button onClick={() => { setPubSearch(''); setPubView('lookup'); }} className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-3xl p-5 text-center shadow-lg hover:shadow-xl transition-all">
              <div className="text-4xl mb-2">🔍</div><div className="font-extrabold text-lg leading-tight">My Visit</div><div className="text-purple-100 text-xs mt-0.5">See your status</div></button>
          </div>
          <div className="bg-white rounded-3xl shadow p-5">
            <h3 className="font-bold text-gray-700 text-lg mb-3">🏥 Currently in Clinic</h3>
            {patients.filter(p => p.visits?.some(v => v.status !== 'discharged')).length === 0 ? (
              <div className="text-center py-4 text-gray-400"><div className="text-4xl mb-1">😴</div><p className="text-sm">No patients right now!</p></div>
            ) : (
              <div className="space-y-2">
                {patients.filter(p => p.visits?.some(v => v.status !== 'discharged')).map(p => {
                  const v = p.visits.find(v => v.status !== 'discharged');
                  return (
                    <div key={p.id} className="flex items-center gap-3 bg-pink-50 rounded-2xl px-4 py-3">
                      <span className="text-2xl">{emojiFor(p.species)}</span>
                      <div><div className="font-bold text-gray-800">{p.animalName}</div><div className="text-xs text-gray-400 capitalize">{p.species}</div></div>
                      <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold border ${STATUS[v?.status]?.cls}`}>{STATUS[v?.status]?.label}</span>
                    </div>);
                })}
              </div>)}
          </div>
          <div className="bg-white rounded-3xl shadow p-5 space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2"><span>🕐</span><span><strong>Hours:</strong> Every day · 8am – 8pm</span></div>
            <div className="flex items-center gap-2"><span>📞</span><span><strong>Phone:</strong> (555) PAWS-001</span></div>
            <div className="flex items-center gap-2"><span>📍</span><span><strong>Address:</strong> 1 Animal Hospital Lane</span></div>
          </div>
          {LoginButtons()}
        </div>
      </div>
    );
  }

  // ─── FAMILY VIEW ─────────────────────────────────────────────────────────────
  if (isFamily) {
    // If navigated to patient detail (e.g., for discharge paper), render that
    if (view === 'patient' && subView === 'discharge-paper') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 pb-10">
          <div className="bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600 text-white px-6 pt-6 pb-4 flex items-center justify-between">
            <button onClick={() => { setView('dashboard'); setSubView('info'); }} className="text-pink-200 hover:text-white text-sm font-semibold">← Back</button>
            <span className="font-bold">📄 Discharge Paper</span>
            <span />
          </div>
          <div className="px-5 py-5 max-w-lg mx-auto">{DischargePaperView()}</div>
        </div>
      );
    }
    return FamilyDashboard();
  }

  // ─── MAIN STAFF RENDER ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 pb-24">
      {!IS_CONFIGURED && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-amber-700 text-xs text-center">
          ⚠️ Data on <strong>this device only</strong> — see <code>src/firebase.js</code> to enable sync.
        </div>
      )}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-xl text-white font-semibold text-sm animate-bounce ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>{toast.msg}</div>
      )}
      {showNotifPanel && NotificationPanel()}
      {Breadcrumb()}
      <div className="max-w-lg mx-auto px-4 py-5">
        {view === 'dashboard' && Dashboard()}
        {view === 'checkin' && CheckIn()}
        {view === 'records' && Records()}
        {view === 'patient' && PatientView()}
        {view === 'settings' && SettingsView()}
      </div>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 px-4 shadow-lg z-10">
        {[
          { id: 'dashboard', label: 'Home', emoji: '🏥' },
          { id: 'checkin', label: 'Check In', emoji: '➕' },
          { id: 'records', label: 'Records', emoji: '📁' },
          { id: 'settings', label: 'Settings', emoji: '⚙️' },
        ].map(({ id, label, emoji }) => (
          <button key={id}
            onClick={() => { if (id === 'checkin') { setCiStep('search'); setCiQuery(''); setVisitForm(blankVisitForm()); } setView(id); }}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-2xl transition-all ${view === id ? 'text-pink-600 bg-pink-50' : 'text-gray-400 hover:text-gray-600'}`}>
            <span className="text-2xl">{emoji}</span>
            <span className="text-xs font-semibold">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}