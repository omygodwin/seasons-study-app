// School Basketball Tournament Data
// All data extracted from tournament bracket images and schedules

export const ADMIN_PIN = "1234";

export const courts = [
  { id: 1, name: "Court 1", location: "Indoor hoop near the gym lobby" },
  { id: 2, name: "Court 2", location: "Indoor hoop near the Stage" },
  { id: 3, name: "Court 3", location: "Black Top Court next to the Turf Field" },
  { id: 4, name: "Court 4", location: "Black Top Court near to the fence line" },
  { id: 5, name: "Court 5", location: "Portable Hoop on the Turf Field" },
];

// All teams organized by division
export const divisions = [
  "3rd Boys",
  "3rd Girls",
  "4th Boys",
  "4th Girls",
  "5th Boys",
  "5th Girls",
];

export const teams = [
  // --- 3rd Grade Boys ---
  { name: "Camo Cranberries", division: "3rd Boys", seed: 1, roster: ["Field Lux", "Atticus Heath", "Sean Zimmerman"] },
  { name: "Bucket Corgis", division: "3rd Boys", seed: 8, roster: ["Bennett Nelson", "Whit Payne", "Tripp Johnson"] },
  { name: "Net Swishers", division: "3rd Boys", seed: 5, roster: ["Peter Bryce", "Sam Hite", "Avett Teass"] },
  { name: "Grizzly Bears", division: "3rd Boys", seed: 4, roster: ["Charles Freeman", "Zach Pleasants", "Austin Chorey"] },
  { name: "Hersheys", division: "3rd Boys", seed: 3, roster: ["Cohen Silvers", "Luke Ashley", "Hugh White"] },
  { name: "Burnt Chicken Nuggets", division: "3rd Boys", seed: 6, roster: ["Graham Barrett", "Liam Hanley", "Joshua Kim", "Brooks Buerlein"] },
  { name: "The Hoops", division: "3rd Boys", seed: 7, roster: ["Knox Cunningham", "William Fields", "Liam Vu"] },
  { name: "Tropical Boys", division: "3rd Boys", seed: 2, roster: ["Marvin Pivonka", "Pearse Moore", "Ben Taylor", "Aiden Campbell"] },

  // --- 3rd Grade Girls ---
  { name: "The Bananas", division: "3rd Girls", seed: 1, roster: ["Mollie James Luck", "Selah Merrill", "Luciana Portell"] },
  { name: "Dunkin' Donuts", division: "3rd Girls", seed: 8, roster: ["Ruth Godwin", "Campbell Smith", "Poppy Nash"] },
  { name: "Neon Fruits", division: "3rd Girls", seed: 5, roster: ["Poppy Ring", "Aliyana Ellis-Monsanto", "Pate Crigler", "Annabelle Guerreri"] },
  { name: "Pink Superstars", division: "3rd Girls", seed: 4, roster: ["Olivia April", "James Joyce", "Morgan Capogreco", "Addie Mae Davis"] },
  { name: "Eagles", division: "3rd Girls", seed: 3, roster: ["Liv Dugger", "Emmaline Mathas", "Lucy Farley"] },
  { name: "Sassy Fashion", division: "3rd Girls", seed: 6, roster: ["Eliza Lynn", "Claire Robbins", "Eva Stump"] },
  { name: "Good Vibes", division: "3rd Girls", seed: 7, roster: ["Magnolia Baggett", "Maddie Ritter", "Olivia Keyser"] },
  { name: "Crazy Coconuts", division: "3rd Girls", seed: 2, roster: ["Junie Stauffer", "Isabel Lynn", "Olivia Grace Passanessi", "Anya Keng"] },

  // --- 4th Grade Boys ---
  { name: "BUNZ", division: "4th Boys", seed: 1, roster: ["Finn Gregory", "Coleman McFarland", "Hawkins Taliaferro"] },
  { name: "CC&G", division: "4th Boys", seed: 8, roster: ["Christian Pitts", "Calvin McDonald", "Gideon Will"] },
  { name: "Scammer Bananers", division: "4th Boys", seed: 5, roster: ["Aiden Shumate", "George Sanders", "Eli Rice", "Daniel Chen"] },
  { name: "NC Tarheels", division: "4th Boys", seed: 4, roster: ["Wilson Wright", "John Robbins", "Johnny Smith", "Waylon Wood"] },
  { name: "The Kobes", division: "4th Boys", seed: 3, roster: ["William Peterson", "Emerson Gray", "Jack Payne"] },
  { name: "Hoopers", division: "4th Boys", seed: 6, roster: ["Reece Vega", "Luke Lawrence", "Ellis Parker", "Ethan Castline"] },
  { name: "GOATS", division: "4th Boys", seed: 7, roster: ["Aiden Ross", "Tyler Galie", "Sandor Nieto-Ralston"] },
  { name: "Peppa Pig Biggies", division: "4th Boys", seed: 2, roster: ["Luke Dizon", "Wesley Fields", "Goodwin Frazer", "Joseph Bates"] },

  // --- 4th Grade Girls ---
  { name: "Nothing But Nets", division: "4th Girls", seed: 1, roster: ["Elise Thompson", "Emmie Smith", "Anna Jarrell"] },
  { name: "Triple Basket Girls", division: "4th Girls", seed: 8, roster: ["Eila McKinney", "Chloe Leedham", "Winnie Greer"] },
  { name: "The Sea Turtles", division: "4th Girls", seed: 5, roster: ["Carter Teague", "Hadley McGarey", "Darcy Fairchild"] },
  { name: "Pink Palm Trees", division: "4th Girls", seed: 4, roster: ["Mya Trudel", "Charlotte King", "Olivia Bryne", "Charlotte Turner"] },
  { name: "Super Stars", division: "4th Girls", seed: 3, roster: ["Addie Bouck", "Brynn Schweiker", "Charlotte Canales"] },
  { name: "Crumble Cookies", division: "4th Girls", seed: 6, roster: ["Priscilla Baggett", "Emma Schuster", "Zoe Lee"] },
  { name: "The Howlers", division: "4th Girls", seed: 7, roster: ["Ella Turner", "CeCe McDonald", "Harper Car"] },
  { name: "Dream Team Champions", division: "4th Girls", seed: 2, roster: ["Libby Thomas", "Virginia Ball", "Zelie Moore"] },

  // --- 5th Grade Boys (7 teams - Gnarly Dudes has a first-round bye) ---
  { name: "Gnarly Dudes", division: "5th Boys", seed: 1, roster: ["Ben Weikel", "Hobson Herndon", "Ari Mannem"] },
  { name: "Bucks", division: "5th Boys", seed: 5, roster: ["Jack Lukens", "James Griffin", "Eli Besecker"] },
  { name: "BKTSCWOD", division: "5th Boys", seed: 4, roster: ["Eli Gala", "Jacob Cavignac", "Landon White"] },
  { name: "Cliffbars Arent Healthy", division: "5th Boys", seed: 3, roster: ["Austin Morton", "Wyatt Pritchard", "Ethan Campbell"] },
  { name: "The Goats", division: "5th Boys", seed: 6, roster: ["Adrian Atcho", "George Hite", "George Moore"] },
  { name: "Knee Walkers", division: "5th Boys", seed: 7, roster: ["Emmett Noble", "Aiden Taylor", "Grayson Lewis"] },
  { name: "The Bucket Boys", division: "5th Boys", seed: 2, roster: ["Henry Pivonka", "Toddy Henderson", "Cars Luck"] },

  // --- 5th Grade Girls ---
  { name: "The Sawiches", division: "5th Girls", seed: 1, roster: ["Johanna Venton", "Anna McConnell", "Lauren Craddock", "Bonnie Froehlich"] },
  { name: "B-Ball Blizzards", division: "5th Girls", seed: 8, roster: ["Liza Love Catalino", "Helen Glassick", "Serena Rossman", "Annala Brijbasse"] },
  { name: "The Biggie Eagles", division: "5th Girls", seed: 5, roster: ["Annabelle Walker", "Bea Hilliard", "Josie Bartow", "Emily Gentzler"] },
  { name: "Ducky Dudes", division: "5th Girls", seed: 4, roster: ["Rose Godwin", "Kacey Kotarski", "Elise Lee"] },
  { name: "The A.Q. (Attitude Queens)", division: "5th Girls", seed: 3, roster: ["Alan Heath", "CeCe Stauffer", "Josie O'Brien"] },
  { name: "Da Thunderbolts", division: "5th Girls", seed: 6, roster: ["Laura Lee Aldrich", "Eva Moore", "Charlotte Sever", "Callie Martin"] },
  { name: "B-Ball Queens", division: "5th Girls", seed: 7, roster: ["Nora Mutter", "Corinne Freeman", "Anna Huffman", "Faith Merrill"] },
  { name: "The Blue Stars", division: "5th Girls", seed: 2, roster: ["Keaton Griffith", "Vivian Henderson", "Georgia Walters", "Sophia Dakolios"] },
];

// Bracket structure for each division
// Each division has 8 teams in standard seeded bracket: 1v8, 5v4, 3v6, 7v2
export const brackets = {
  "3rd Boys": {
    quarterFinals: [
      { gameId: "3B-QF1", team1: "Camo Cranberries", team2: "Bucket Corgis", seed1: 1, seed2: 8 },
      { gameId: "3B-QF2", team1: "Net Swishers", team2: "Grizzly Bears", seed1: 5, seed2: 4 },
      { gameId: "3B-QF3", team1: "Hersheys", team2: "Burnt Chicken Nuggets", seed1: 3, seed2: 6 },
      { gameId: "3B-QF4", team1: "The Hoops", team2: "Tropical Boys", seed1: 7, seed2: 2 },
    ],
    semiFinals: [
      { gameId: "3B-SF1", team1: null, team2: null, seed1: null, seed2: null, source: ["3B-QF1", "3B-QF2"] },
      { gameId: "3B-SF2", team1: null, team2: null, seed1: null, seed2: null, source: ["3B-QF3", "3B-QF4"] },
    ],
    final: [
      { gameId: "3B-F", team1: null, team2: null, seed1: null, seed2: null, source: ["3B-SF1", "3B-SF2"] },
    ],
  },
  "3rd Girls": {
    quarterFinals: [
      { gameId: "3G-QF1", team1: "The Bananas", team2: "Dunkin' Donuts", seed1: 1, seed2: 8 },
      { gameId: "3G-QF2", team1: "Neon Fruits", team2: "Pink Superstars", seed1: 5, seed2: 4 },
      { gameId: "3G-QF3", team1: "Eagles", team2: "Sassy Fashion", seed1: 3, seed2: 6 },
      { gameId: "3G-QF4", team1: "Good Vibes", team2: "Crazy Coconuts", seed1: 7, seed2: 2 },
    ],
    semiFinals: [
      { gameId: "3G-SF1", team1: null, team2: null, seed1: null, seed2: null, source: ["3G-QF1", "3G-QF2"] },
      { gameId: "3G-SF2", team1: null, team2: null, seed1: null, seed2: null, source: ["3G-QF3", "3G-QF4"] },
    ],
    final: [
      { gameId: "3G-F", team1: null, team2: null, seed1: null, seed2: null, source: ["3G-SF1", "3G-SF2"] },
    ],
  },
  "4th Boys": {
    quarterFinals: [
      { gameId: "4B-QF1", team1: "BUNZ", team2: "CC&G", seed1: 1, seed2: 8 },
      { gameId: "4B-QF2", team1: "Scammer Bananers", team2: "NC Tarheels", seed1: 5, seed2: 4 },
      { gameId: "4B-QF3", team1: "The Kobes", team2: "Hoopers", seed1: 3, seed2: 6 },
      { gameId: "4B-QF4", team1: "GOATS", team2: "Peppa Pig Biggies", seed1: 7, seed2: 2 },
    ],
    semiFinals: [
      { gameId: "4B-SF1", team1: null, team2: null, seed1: null, seed2: null, source: ["4B-QF1", "4B-QF2"] },
      { gameId: "4B-SF2", team1: null, team2: null, seed1: null, seed2: null, source: ["4B-QF3", "4B-QF4"] },
    ],
    final: [
      { gameId: "4B-F", team1: null, team2: null, seed1: null, seed2: null, source: ["4B-SF1", "4B-SF2"] },
    ],
  },
  "4th Girls": {
    quarterFinals: [
      { gameId: "4G-QF1", team1: "Nothing But Nets", team2: "Triple Basket Girls", seed1: 1, seed2: 8 },
      { gameId: "4G-QF2", team1: "The Sea Turtles", team2: "Pink Palm Trees", seed1: 5, seed2: 4 },
      { gameId: "4G-QF3", team1: "Super Stars", team2: "Crumble Cookies", seed1: 3, seed2: 6 },
      { gameId: "4G-QF4", team1: "The Howlers", team2: "Dream Team Champions", seed1: 7, seed2: 2 },
    ],
    semiFinals: [
      { gameId: "4G-SF1", team1: null, team2: null, seed1: null, seed2: null, source: ["4G-QF1", "4G-QF2"] },
      { gameId: "4G-SF2", team1: null, team2: null, seed1: null, seed2: null, source: ["4G-QF3", "4G-QF4"] },
    ],
    final: [
      { gameId: "4G-F", team1: null, team2: null, seed1: null, seed2: null, source: ["4G-SF1", "4G-SF2"] },
    ],
  },
  "5th Boys": {
    quarterFinals: [
      { gameId: "5B-QF1", team1: "Gnarly Dudes", team2: null, seed1: 1, seed2: null, bye: true },
      { gameId: "5B-QF2", team1: "Bucks", team2: "BKTSCWOD", seed1: 5, seed2: 4 },
      { gameId: "5B-QF3", team1: "Cliffbars Arent Healthy", team2: "The Goats", seed1: 3, seed2: 6 },
      { gameId: "5B-QF4", team1: "Knee Walkers", team2: "The Bucket Boys", seed1: 7, seed2: 2 },
    ],
    semiFinals: [
      { gameId: "5B-SF1", team1: null, team2: null, seed1: null, seed2: null, source: ["5B-QF1", "5B-QF2"] },
      { gameId: "5B-SF2", team1: null, team2: null, seed1: null, seed2: null, source: ["5B-QF3", "5B-QF4"] },
    ],
    final: [
      { gameId: "5B-F", team1: null, team2: null, seed1: null, seed2: null, source: ["5B-SF1", "5B-SF2"] },
    ],
  },
  "5th Girls": {
    quarterFinals: [
      { gameId: "5G-QF1", team1: "The Sawiches", team2: "B-Ball Blizzards", seed1: 1, seed2: 8 },
      { gameId: "5G-QF2", team1: "The Biggie Eagles", team2: "Ducky Dudes", seed1: 5, seed2: 4 },
      { gameId: "5G-QF3", team1: "The A.Q. (Attitude Queens)", team2: "Da Thunderbolts", seed1: 3, seed2: 6 },
      { gameId: "5G-QF4", team1: "B-Ball Queens", team2: "The Blue Stars", seed1: 7, seed2: 2 },
    ],
    semiFinals: [
      { gameId: "5G-SF1", team1: null, team2: null, seed1: null, seed2: null, source: ["5G-QF1", "5G-QF2"] },
      { gameId: "5G-SF2", team1: null, team2: null, seed1: null, seed2: null, source: ["5G-QF3", "5G-QF4"] },
    ],
    final: [
      { gameId: "5G-F", team1: null, team2: null, seed1: null, seed2: null, source: ["5G-SF1", "5G-SF2"] },
    ],
  },
};

// Schedule: all games with court assignments and time slots
// Slot numbers represent the order of games on each court
export const schedule = [
  // Court 1 - Round 1
  { gameId: "5G-QF1", court: 1, slot: 1, round: "Quarter-Final", division: "5th Girls", team1: "The Sawiches", team2: "B-Ball Blizzards" },
  { gameId: "5B-QF1", court: 1, slot: 2, round: "Quarter-Final", division: "5th Boys", team1: "Bucks", team2: "BKTSCWOD" },
  { gameId: "5G-QF2", court: 1, slot: 3, round: "Quarter-Final", division: "5th Girls", team1: "The Biggie Eagles", team2: "Ducky Dudes" },
  { gameId: "5B-QF2", court: 1, slot: 4, round: "Quarter-Final", division: "5th Boys", team1: "Cliffbars Arent Healthy", team2: "The Goats" },
  { gameId: "5G-QF3", court: 1, slot: 5, round: "Quarter-Final", division: "5th Girls", team1: "The A.Q. (Attitude Queens)", team2: "Da Thunderbolts" },
  // Court 1 - Later rounds
  { gameId: "3B-SF1", court: 1, slot: 6, round: "Semi-Final", division: "3rd Boys", team1: null, team2: null, label: "3rd Grade Boys Semi-Final Game 1" },
  { gameId: "3B-SF2", court: 1, slot: 7, round: "Semi-Final", division: "3rd Boys", team1: null, team2: null, label: "3rd Grade Boys Semi-Final Game 2" },
  { gameId: "4B-F", court: 1, slot: 8, round: "Final", division: "4th Boys", team1: null, team2: null, label: "4th Grade Boys FINAL" },
  { gameId: "5B-F", court: 1, slot: 9, round: "Final", division: "5th Boys", team1: null, team2: null, label: "5th Grade Boys FINAL" },

  // Court 2 - Round 1
  { gameId: "5G-QF1-C2", court: 2, slot: 1, round: "Quarter-Final", division: "5th Girls", team1: "BUNZ", team2: "CC&G", crossDivision: true, label: "5th Girls vs 4th Boys" },
  { gameId: "5B-QF1-C2", court: 2, slot: 2, round: "Quarter-Final", division: "5th Boys", team1: "Nothing But Nets", team2: "Triple Basket Girls", crossDivision: true, label: "5th Boys vs 4th Girls" },
  { gameId: "5G-QF3-C2", court: 2, slot: 3, round: "Quarter-Final", division: "5th Girls", team1: "Scammer Bananers", team2: "NC Tarheels", crossDivision: true, label: "5th Girls vs 4th Boys" },
  { gameId: "5B-QF3-C2", court: 2, slot: 4, round: "Quarter-Final", division: "5th Boys", team1: "The Sea Turtles", team2: "Pink Palm Trees", crossDivision: true, label: "5th Boys vs 4th Girls" },
  { gameId: "5G-QF4-C2", court: 2, slot: 5, round: "Quarter-Final", division: "5th Girls", team1: "The Kobes", team2: "Hoopers", crossDivision: true, label: "5th Girls vs 4th Boys" },
  // Court 2 - Later rounds
  { gameId: "5B-SF1", court: 2, slot: 6, round: "Semi-Final", division: "5th Boys", team1: null, team2: null, label: "5th Grade Boys Semi-Final Game 1" },
  { gameId: "4G-SF1", court: 2, slot: 7, round: "Semi-Final", division: "4th Girls", team1: null, team2: null, label: "4th Grade Girls Semi-Final Game 1" },
  { gameId: "3G-F", court: 2, slot: 8, round: "Final", division: "3rd Girls", team1: null, team2: null, label: "3rd Grade Girls FINAL" },
  { gameId: "5G-F", court: 2, slot: 9, round: "Final", division: "5th Girls", team1: null, team2: null, label: "5th Grade Girls FINAL" },

  // Court 3 - Round 1
  { gameId: "4B-QF1-C3", court: 3, slot: 1, round: "Quarter-Final", division: "4th Boys", team1: "The Blue Stars", team2: "B-Ball Queens", crossDivision: true, label: "4th Boys vs 5th Girls" },
  { gameId: "4G-QF1", court: 3, slot: 2, round: "Quarter-Final", division: "4th Girls", team1: "Peppa Pig Biggies", team2: "GOATS", crossDivision: true, label: "4th Girls vs 4th Boys" },
  { gameId: "4B-QF2-C3", court: 3, slot: 3, round: "Quarter-Final", division: "4th Boys", team1: "Super Stars", team2: "Crumble Cookies", crossDivision: true, label: "4th Boys vs 4th Girls" },
  { gameId: "4G-QF2", court: 3, slot: 4, round: "Quarter-Final", division: "4th Girls", team1: "The Bucket Boys", team2: "Knee Walkers", crossDivision: true, label: "4th Girls vs 5th Boys" },
  { gameId: "4B-QF3-C3", court: 3, slot: 5, round: "Quarter-Final", division: "4th Boys", team1: "Dream Team Champions", team2: "The Howlers", crossDivision: true, label: "4th Boys vs 4th Girls" },
  // Court 3 - Later rounds
  { gameId: "5B-QF-PLAY", court: 3, slot: 6, round: "Quarter-Final", division: "5th Boys", team1: "Gnarly Dudes", team2: null, label: "Gnarly Dudes vs. Winner Game 1 (Court 1) (5B)" },
  { gameId: "5G-SF2", court: 3, slot: 7, round: "Semi-Final", division: "5th Girls", team1: null, team2: null, label: "5th Grade Girls Semi-Final Game 2" },
  { gameId: "3B-F", court: 3, slot: 8, round: "Final", division: "3rd Boys", team1: null, team2: null, label: "3rd Grade Boys FINAL" },

  // Court 4 - Round 1
  { gameId: "3B-QF1", court: 4, slot: 1, round: "Quarter-Final", division: "3rd Boys", team1: "Camo Cranberries", team2: "Bucket Corgis" },
  { gameId: "3B-QF2", court: 4, slot: 2, round: "Quarter-Final", division: "3rd Boys", team1: "Net Swishers", team2: "Grizzly Bears" },
  { gameId: "3B-QF3", court: 4, slot: 3, round: "Quarter-Final", division: "3rd Boys", team1: "Hersheys", team2: "Burnt Chicken Nuggets" },
  { gameId: "3B-QF4", court: 4, slot: 4, round: "Quarter-Final", division: "3rd Boys", team1: "Tropical Boys", team2: "The Hoops" },
  // Court 4 - Later rounds
  { gameId: "4B-SF2", court: 4, slot: 5, round: "Semi-Final", division: "4th Boys", team1: null, team2: null, label: "4th Grade Boys Semi-Final Game 2" },
  { gameId: "5B-SF2", court: 4, slot: 6, round: "Semi-Final", division: "5th Boys", team1: null, team2: null, label: "5th Grade Boys Semi-Final Game 2" },
  { gameId: "4G-F", court: 4, slot: 7, round: "Final", division: "4th Girls", team1: null, team2: null, label: "4th Grade Girls FINAL" },

  // Court 5 - Round 1
  { gameId: "3G-QF1", court: 5, slot: 1, round: "Quarter-Final", division: "3rd Girls", team1: "The Bananas", team2: "Dunkin' Donuts" },
  { gameId: "3G-QF2", court: 5, slot: 2, round: "Quarter-Final", division: "3rd Girls", team1: "Neon Fruits", team2: "Pink Superstars" },
  { gameId: "3G-QF3", court: 5, slot: 3, round: "Quarter-Final", division: "3rd Girls", team1: "Eagles", team2: "Sassy Fashion" },
  { gameId: "3G-QF4", court: 5, slot: 4, round: "Quarter-Final", division: "3rd Girls", team1: "Crazy Coconuts", team2: "Good Vibes" },
  // Court 5 - Later rounds
  { gameId: "3G-SF1", court: 5, slot: 5, round: "Semi-Final", division: "3rd Girls", team1: null, team2: null, label: "3rd Grade Girls Semi-Final Game 1" },
  { gameId: "3G-SF2", court: 5, slot: 6, round: "Semi-Final", division: "3rd Girls", team1: null, team2: null, label: "3rd Grade Girls Semi-Final Game 2" },
  { gameId: "4G-SF2", court: 5, slot: 7, round: "Semi-Final", division: "4th Girls", team1: null, team2: null, label: "4th Grade Girls Semi-Final Game 2" },
];

// Build player lookup: maps player name -> { teamName, division }
export const playerLookup = {};
teams.forEach((team) => {
  team.roster.forEach((player) => {
    playerLookup[player] = { teamName: team.name, division: team.division };
  });
});

// Helper: get all games for a specific team
export function getTeamSchedule(teamName) {
  return schedule.filter(
    (game) => game.team1 === teamName || game.team2 === teamName
  );
}

// Helper: get team info by name
export function getTeamByName(teamName) {
  return teams.find((t) => t.name === teamName);
}

// Helper: get all teams in a division
export function getTeamsByDivision(division) {
  return teams.filter((t) => t.division === division);
}

// Helper: get bracket for a division
export function getBracket(division) {
  return brackets[division];
}

// LocalStorage helpers for game results
const RESULTS_KEY = "tournament-results";
const SELECTED_CHILDREN_KEY = "tournament-selected-children";
const ACTIVE_CHILD_KEY = "tournament-active-child-index";

export function getGameResults() {
  try {
    const stored = localStorage.getItem(RESULTS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function saveGameResult(gameId, score1, score2, winner) {
  const results = getGameResults();
  results[gameId] = { score1, score2, winner };
  localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
}

// Multi-child support
export function getSelectedChildren() {
  try {
    const stored = localStorage.getItem(SELECTED_CHILDREN_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function getActiveChildIndex() {
  try {
    const stored = localStorage.getItem(ACTIVE_CHILD_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

export function setActiveChildIndex(index) {
  localStorage.setItem(ACTIVE_CHILD_KEY, String(index));
}

export function getSelectedChild() {
  const children = getSelectedChildren();
  if (children.length === 0) return null;
  const idx = getActiveChildIndex();
  return children[Math.min(idx, children.length - 1)] || null;
}

export function saveSelectedChild(playerName, teamName, division) {
  const children = getSelectedChildren();
  const existing = children.findIndex(
    (c) => c.playerName === playerName && c.teamName === teamName
  );
  if (existing >= 0) {
    setActiveChildIndex(existing);
    return;
  }
  children.push({ playerName, teamName, division });
  localStorage.setItem(SELECTED_CHILDREN_KEY, JSON.stringify(children));
  setActiveChildIndex(children.length - 1);
}

export function removeChild(index) {
  const children = getSelectedChildren();
  children.splice(index, 1);
  localStorage.setItem(SELECTED_CHILDREN_KEY, JSON.stringify(children));
  const activeIdx = getActiveChildIndex();
  if (activeIdx >= children.length) {
    setActiveChildIndex(Math.max(0, children.length - 1));
  }
}

export function clearSelectedChild() {
  localStorage.removeItem(SELECTED_CHILDREN_KEY);
  localStorage.removeItem(ACTIVE_CHILD_KEY);
}

// Elimination & next game helpers
export function isTeamEliminated(teamName, division) {
  const results = getGameResults();
  const bracket = getBracket(division);
  if (!bracket) return false;

  const resolved = resolveFullBracket(bracket, results);
  const allGames = [
    ...resolved.quarterFinals,
    ...resolved.semiFinals,
    ...resolved.final,
  ];

  for (const game of allGames) {
    const r = results[game.gameId];
    if (r && r.winner && (game.team1 === teamName || game.team2 === teamName)) {
      if (r.winner !== teamName) return true;
    }
  }
  return false;
}

export function getTeamNextGame(teamName, division) {
  const results = getGameResults();
  const bracket = getBracket(division);
  if (!bracket) return null;

  const resolved = resolveFullBracket(bracket, results);
  const allGames = [
    ...resolved.quarterFinals,
    ...resolved.semiFinals,
    ...resolved.final,
  ];

  for (const game of allGames) {
    if (game.team1 === teamName || game.team2 === teamName) {
      const r = results[game.gameId];
      if (!r || r.winner == null) {
        const scheduleEntry = schedule.find((s) => s.gameId === game.gameId);
        return {
          gameId: game.gameId,
          opponent: game.team1 === teamName ? game.team2 : game.team1,
          round: scheduleEntry?.round || '',
          court: scheduleEntry?.court,
          slot: scheduleEntry?.slot,
          game,
        };
      }
    }
  }
  return null;
}

// Resolve bracket fully (exported for reuse)
export function resolveFullBracket(bracket, results) {
  const resolved = JSON.parse(JSON.stringify(bracket));

  function getWinner(game, result) {
    if (game.bye) return { winner: game.team1, seed: game.seed1 };
    if (result && result.winner) {
      const seed = result.winner === game.team1 ? game.seed1 : game.seed2;
      return { winner: result.winner, seed };
    }
    return null;
  }

  resolved.semiFinals.forEach((sf) => {
    if (sf.source) {
      const [src1Id, src2Id] = sf.source;
      const src1 = resolved.quarterFinals.find((g) => g.gameId === src1Id);
      const src2 = resolved.quarterFinals.find((g) => g.gameId === src2Id);
      const w1 = getWinner(src1, results[src1Id]);
      const w2 = getWinner(src2, results[src2Id]);
      if (w1) { sf.team1 = w1.winner; sf.seed1 = w1.seed; }
      if (w2) { sf.team2 = w2.winner; sf.seed2 = w2.seed; }
    }
  });

  resolved.final.forEach((f) => {
    if (f.source) {
      const [src1Id, src2Id] = f.source;
      const r1 = results[src1Id];
      const r2 = results[src2Id];
      const src1 = resolved.semiFinals.find((g) => g.gameId === src1Id);
      const src2 = resolved.semiFinals.find((g) => g.gameId === src2Id);
      if (r1 && r1.winner) {
        f.team1 = r1.winner;
        f.seed1 = src1 && r1.winner === src1.team1 ? src1.seed1 : src1 ? src1.seed2 : null;
      }
      if (r2 && r2.winner) {
        f.team2 = r2.winner;
        f.seed2 = src2 && r2.winner === src2.team1 ? src2.seed1 : src2 ? src2.seed2 : null;
      }
    }
  });

  return resolved;
}
