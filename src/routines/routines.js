/* Every routine is one of these configs, rendered by RoutineApp.
 *
 * `minutes` is how long the step usually takes. Nothing here stores a start
 * time: RoutineApp works backwards from `defaultLeave` (or whatever leave time
 * she picks), so the only number worth tuning is `minutes`.
 *
 * `storageKey` must be unique per routine — it is what keeps today's ticks on
 * one routine from showing up on the other. */

export const MORNING_ROUTINE = {
  id: 'morning',
  title: 'September Morning Routine',
  subtitle: 'Tea, skincare, and out the door 💖🏀',
  sheetTitle: 'September Morning Routine 💖🏀',
  doneMessage: '🏆 Whole routine done — glowing and out the door. Have the best day! 💖',
  storageKey: 'roseMorningRoutine',
  defaultLeave: '07:30',
  steps: [
    {
      id: 'wake',
      label: 'Wake up',
      emoji: '☀️',
      minutes: 5,
      note: 'Feet on the floor. Snooze steals the whole routine.',
    },
    {
      id: 'tea',
      label: 'Get tea',
      emoji: '🍵',
      minutes: 5,
      note: 'Start it first — it can steep while you shower.',
    },
    {
      id: 'shower',
      label: 'Shower',
      emoji: '🚿',
      minutes: 15,
      note: 'Warm, not hot. Hot water is hard on your skin.',
    },
    {
      id: 'change',
      label: 'Change',
      emoji: '👚',
      minutes: 5,
      note: 'Outfit picked last night = 5 free minutes this morning.',
    },
    {
      id: 'breakfast',
      label: 'Breakfast',
      emoji: '🥞',
      minutes: 15,
      note: 'Something with protein so you still have legs at practice.',
    },
    {
      id: 'blowdry',
      label: 'Blow dry hair',
      emoji: '💨',
      minutes: 15,
      note: 'Finish on the cool shot — it sets the style.',
    },
    {
      id: 'skincare',
      label: 'Skincare',
      emoji: '🧴',
      minutes: 10,
      note: 'Cleanse → serum → moisturizer → SPF. Sunscreen every single day.',
    },
    {
      id: 'shoes',
      label: 'Shoes & socks',
      emoji: '👟',
      minutes: 5,
      note: 'Sports socks if it is a practice day.',
    },
    {
      id: 'leave',
      label: 'Leave',
      emoji: '🎒',
      minutes: 0,
      note: 'Bag, water bottle, tea. Go have a great day. 💖',
    },
  ],
};

export const SCHOOL_ROUTINE = {
  id: 'school',
  title: 'School Routine',
  subtitle: 'Up, packed, and out the door 🎒💙',
  sheetTitle: 'School Routine 🎒💖',
  doneMessage: '🏆 Dressed, fed and packed. Go have a great day at school! 💖',
  storageKey: 'roseSchoolRoutine',
  defaultLeave: '07:30',
  steps: [
    {
      id: 'wake',
      label: 'Wake up',
      emoji: '☀️',
      minutes: 5,
      note: 'Lights on, feet on the floor.',
    },
    {
      id: 'dressed',
      label: 'Get dressed',
      emoji: '👕',
      minutes: 10,
      note: 'Easiest step of the day if you laid it out last night.',
    },
    {
      id: 'hair',
      label: 'Brush hair',
      emoji: '🎀',
      minutes: 5,
      note: 'Start at the ends and work up — way fewer tangles.',
    },
    {
      id: 'breakfast',
      label: 'Eat breakfast',
      emoji: '🥣',
      minutes: 15,
      note: 'Something with protein so you are not starving by third period.',
    },
    {
      id: 'lunch',
      label: 'Pack my lunch',
      emoji: '🥪',
      minutes: 10,
      note: 'Lunch, a snack, and anything that has to go back today.',
    },
    {
      id: 'water',
      label: 'Fill up my water bottle',
      emoji: '💧',
      minutes: 5,
      note: 'All the way to the top — you will want it at practice.',
    },
    {
      id: 'leave',
      label: 'Leave',
      emoji: '🎒',
      minutes: 0,
      note: 'Backpack, lunch, water bottle. Go get it. 💪',
    },
  ],
};
