import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGuidanceTab } from './guidanceContext';
import Flashcards from './Flashcards';
import { RIVERS, CONTINENTS, OCEANS } from './data/mapFeatures';
import {
  Pill,
  CrayonChip,
  Toolbar,
  Feedback,
  RiverMap,
  WorldMap,
} from './GeographyStudyApp';
import {
  US_VIEWBOX,
  WORLD_VIEWBOX,
  US_LAND,
  US_LAKES,
  US_RIVER_PATHS,
  CONTINENT_PATHS,
  OCEAN_LABELS,
} from './data/mapPaths';
import {
  NA_VIEWBOX,
  NA_LAND,
  NA_LAKES,
  NA_BORDERS,
  REGION_PATHS,
  REGION_LABELS,
} from './data/regionPaths';

/* Social Studies Unit 1: geography of North America, the first Americans,
 * European explorers, and the English colonies.
 *
 * Built from Rose's 31-question Unit 1 Study Guide. Where her first answer on
 * the sheet and the teacher's correction differ, the correction wins (the
 * Puritans settled Massachusetts Bay, not debtors; the Iroquois and Pueblo were
 * farmers). Where the sheet was thin, the standard answer fills it in — this is
 * the Virginia SOL USI.2-USI.5 sequence, so the curriculum framework is what the
 * test is written from.
 *
 * The teacher has not said what the test looks like, only that it mixes map,
 * multiple choice, fill in the blank and short answer, so the practice test is
 * sectioned that way. Questions 1 and 2 on the sheet (continents, oceans,
 * rivers) are the same maps as the Maps & Rivers topic and reuse them. */

// --- MAP DATA ---

/* In the worksheet's number order, so the printed key lines up with hers. */
const REGIONS = [
  { id: 'coastalrange', num: 1, name: 'Coastal Range', color: '#1d4ed8', fact: 'Fog, mist and rain along the Pacific.' },
  { id: 'basinrange', num: 2, name: 'Basin and Range', color: '#f97316', fact: 'Hot desert basins with little usable water.' },
  { id: 'rockies', num: 3, name: 'Rocky Mountains', color: '#7c2d12', fact: 'The Continental Divide runs along them.' },
  { id: 'greatplains', num: 4, name: 'Great Plains', color: '#eab308', fact: 'Prairies — tall grass, few trees, wheat.' },
  { id: 'interiorlowlands', num: 5, name: 'Interior Lowlands', color: '#65a30d', fact: 'Rivers and grassy hills — Tornado Alley.' },
  { id: 'appalachian', num: 6, name: 'Appalachian Mountains', color: '#15803d', fact: 'Old, rounded mountains.' },
  { id: 'coastalplain', num: 7, name: 'Coastal Plain', color: '#06b6d4', fact: 'Along the Atlantic and the Gulf of Mexico.' },
  { id: 'canadianshield', num: 8, name: 'Canadian Shield', color: '#be185d', fact: 'Wraps around Hudson Bay like a horseshoe.' },
];

const NA_VIEW = NA_VIEWBOX.split(' ').map(Number);
const WORLD_VIEW = WORLD_VIEWBOX.split(' ').map(Number);

// --- FLASHCARD DECKS ---

const DECKS = [
  {
    id: 'regions',
    label: 'Regions',
    emoji: '🏔️',
    cards: [
      {
        term: 'Coastal Range',
        note: 'Where? What is it like?',
        definition:
          'Rugged mountains along the Pacific coast, from California up through Canada to Alaska. Lots of fog, mist and rain, and low-lying valleys with fertile soil.',
      },
      {
        term: 'Basin and Range',
        note: 'Where? What is it like?',
        definition:
          'West of the Rockies. Wide desert basins with separate mountain ranges. Very hot, with little usable water, but rich in minerals. Death Valley, the lowest point in North America, is here.',
      },
      {
        term: 'Rocky Mountains',
        note: 'Where? What is it like?',
        definition:
          'High, rugged mountains between the Great Plains and the Basin and Range, stretching from Alaska almost to Mexico. Lots of snow in winter and flooding when it melts. The Continental Divide runs along them, and gold was found in them.',
      },
      {
        term: 'Great Plains',
        note: 'Where? What is it like?',
        definition:
          'Prairies: a wide, fairly flat area of land with tall grasses and few trees, between the Interior Lowlands and the Rockies. Low precipitation. Farms, ranches and wheat.',
      },
      {
        term: 'Interior Lowlands',
        note: 'Where? What is it like?',
        definition:
          'Between the Appalachians and the Great Plains. Flat lands with many rivers, broad river valleys and grassy hills. Unpredictable weather, nicknamed "Tornado Alley".',
      },
      {
        term: 'Appalachian Mountains',
        note: 'Where? What is it like?',
        definition:
          'Old, rounded mountains and rolling foothills west of the Coastal Plain, from Canada down to Alabama. The oldest mountains in North America. The name is Native American in origin.',
      },
      {
        term: 'Coastal Plain',
        note: 'Where? What is it like?',
        definition:
          'Low, flat land along the Atlantic Ocean and the Gulf of Mexico. Fertile soil, thick forests, hundreds of rivers, good harbors and a fishing industry.',
      },
      {
        term: 'Canadian Shield',
        note: 'Where? What is it like?',
        definition:
          'Wrapped around Hudson Bay like a horseshoe. A rocky, frigid region with thin, poor soil and lots of lakes and swampy areas.',
      },
    ],
  },
  {
    id: 'natives',
    label: 'Tribes',
    emoji: '🏹',
    cards: [
      {
        term: 'Archaeology',
        definition:
          'The study of humans and cultures of the past by recovering and analyzing artifacts.',
      },
      {
        term: 'Artifact',
        note: 'Give two examples.',
        definition:
          'An object made or used by humans for a specific purpose, like arrowheads, spears, tools and pots.',
      },
      {
        term: 'Natural Resources',
        definition: 'Things people use that come from nature, like plants, animals, water and soil.',
      },
      {
        term: 'Human Resources',
        definition: 'The people who work to make goods and provide services.',
      },
      {
        term: 'Capital Resources',
        definition:
          'Goods made by people and used to help make other goods and services, like tools and machines.',
      },
      {
        term: 'Inuit',
        note: 'Where? Clothes, food, housing?',
        definition:
          'The Arctic (Alaska and northern Canada). Wore parkas made of seal skin and heavy fur. Hunted seals, walrus and whales. Lived in igloos.',
      },
      {
        term: 'Kwakiutl',
        note: 'Where? Food, housing, one more fact?',
        definition:
          'The Pacific Northwest coast. Fished (especially salmon) and hunted in the forests. Lived in cedar plank houses. Known for the potlatch and for totem poles.',
      },
      {
        term: 'Potlatch',
        note: 'Which group?',
        definition: 'A Kwakiutl gift-giving celebration, a contest to see who could give away the most.',
      },
      {
        term: 'Lakota',
        note: 'Where? Food, housing, lifestyle?',
        definition:
          'The Great Plains. Hunted buffalo. Lived in teepees. Nomadic: they moved from place to place following the buffalo.',
      },
      {
        term: 'Nomadic',
        definition: 'Moving from place to place instead of staying in one spot, like the Lakota following the buffalo.',
      },
      {
        term: 'Pueblo',
        note: 'Where? Food, housing, one more fact?',
        definition:
          'The dry Southwest. Lived in adobe houses (sun-dried clay bricks). Few large animals to hunt, so they farmed corn, beans and squash, using irrigation to bring water to their fields.',
      },
      {
        term: 'Iroquois',
        note: 'Where? Food, housing, one more fact?',
        definition:
          'The Eastern Woodlands (around New York). Lived in longhouses. Farmed corn, beans and squash, hunted, fished and gathered fruits. Five tribes joined together (later six) to form the Iroquois League.',
      },
    ],
  },
  {
    id: 'explorers',
    label: 'Explorers',
    emoji: '⛵',
    cards: [
      {
        term: 'The Three G’s',
        note: 'Why did Europeans go exploring?',
        definition:
          'God: to spread their religion. Glory: power and fame for themselves and their country. Gold: to get rich and make money.',
      },
      {
        term: 'Obstacles to exploring',
        definition:
          'Poor maps and navigation tools made journeys hard to plan. Also fear of the unknown, disease and running out of food.',
      },
      {
        term: 'Benefits of exploring',
        definition: 'Improved ships and navigation, new trade, and new land.',
      },
      {
        term: 'John Cabot',
        note: 'Which nation? What did he explore?',
        definition: 'Sailed for ENGLAND. Explored Newfoundland (“new found land”) in eastern Canada.',
      },
      {
        term: 'Francisco Coronado',
        note: 'Which nation? What did he explore?',
        definition:
          'Sailed for SPAIN. Explored the Southwest (Mexico, Texas, Oklahoma, Kansas) looking for the Seven Cities of Gold. His group saw the Grand Canyon.',
      },
      {
        term: 'Robert La Salle',
        note: 'Which nation? What did he explore?',
        definition: 'Sailed for FRANCE. Explored the Mississippi River valley and claimed it for France.',
      },
      {
        term: 'Samuel de Champlain',
        note: 'Which nation? What did he explore?',
        definition: 'Sailed for FRANCE. Explored the St. Lawrence River and founded Quebec.',
      },
      {
        term: 'How Native Americans and Europeans cooperated',
        definition:
          'Trading (furs, tools, food), farming (Native Americans showed settlers how to grow crops), and other economic reasons.',
      },
      {
        term: 'How Native Americans and Europeans conflicted',
        definition:
          'Over land, trade and culture (including religion), because of different languages, and through European diseases that killed many Native Americans.',
      },
      {
        term: 'Columbian Exchange',
        note: 'What was exchanged?',
        definition:
          'The global exchange between the Eastern and Western Hemispheres after Columbus: plants, animals and diseases moved both ways.',
      },
    ],
  },
  {
    id: 'colonies',
    label: 'Colonies',
    emoji: '🏠',
    cards: [
      {
        term: 'Why the English started colonies',
        note: 'Think religious and economic.',
        definition:
          'Religious reasons (freedom to practice their religion) and economic reasons (to make money and own land).',
      },
      {
        term: 'Roanoke',
        note: 'Other name? What happened?',
        definition: 'The “Lost Colony.” The colonists disappeared, and no one knows for sure what happened to them.',
      },
      {
        term: 'Jamestown',
        note: 'Why is it important? When?',
        definition: 'The first PERMANENT English settlement in North America, founded in 1607 in Virginia.',
      },
      {
        term: 'Virginia Company of London',
        note: 'Who gave it permission?',
        definition: 'The company that started Jamestown. King James I gave it the right to start a colony in the New World.',
      },
      {
        term: 'Tobacco',
        definition: 'The cash crop of Jamestown, and later of all of Virginia.',
      },
      {
        term: 'Cash crop',
        definition: 'A crop grown to sell for money.',
      },
      {
        term: 'Plymouth',
        note: 'Who? When? What ship?',
        definition: 'Founded in 1620 by the Pilgrims (and others called “Strangers”), who sailed on the Mayflower.',
      },
      {
        term: 'Mayflower Compact',
        definition:
          'An agreement signed by the Pilgrims and the Strangers to form a government and make fair laws for their colony.',
      },
      {
        term: 'Massachusetts Bay Colony',
        note: 'Why? Who lived there?',
        definition: 'Founded by the Puritans so they could practice their religion freely.',
      },
      {
        term: 'Pennsylvania',
        note: 'Founded by? Who else lived there?',
        definition: 'Founded by William Penn. Quakers lived there, and it offered religious freedom.',
      },
      {
        term: 'Georgia',
        note: 'Founded by? Who lived there?',
        definition: 'Founded by James Oglethorpe for debtors: people who owe money.',
      },
      {
        term: 'New England colonies',
        note: 'Which colonies? What economy?',
        definition:
          'Massachusetts, Rhode Island, Connecticut, New Hampshire (and Maine). Relied on production and industry: fishing, shipbuilding, lumber and trade.',
      },
      {
        term: 'Mid-Atlantic (Middle) colonies',
        note: 'Which colonies? What economy?',
        definition:
          'New York, Pennsylvania, New Jersey and Delaware. Relied on grains (like wheat) and livestock, the “breadbasket” colonies.',
      },
      {
        term: 'Southern colonies',
        note: 'Which colonies? What economy?',
        definition:
          'Maryland, Virginia, North Carolina, South Carolina and Georgia. Relied on plantations growing tobacco, rice and indigo (a plant used to make blue dye).',
      },
    ],
  },
];

const STORAGE_KEY = 'flashcards:socialstudies1';

// --- WHO AM I? MATCHING DRILL ---

/* Every clue belongs to a group, and the buttons are every answer in that
 * group. Unlike the cards, groups are mixed by default: telling the Great
 * Plains from the Interior Lowlands, or the Lakota from the Iroquois, is a
 * discrimination task, which is where interleaving earns its keep. */
const MATCH_GROUPS = {
  region: {
    label: 'Regions',
    emoji: '🏔️',
    prompt: 'Which region?',
    answers: REGIONS.map((r) => r.name),
  },
  tribe: {
    label: 'Tribes',
    emoji: '🏹',
    prompt: 'Which Native American group?',
    answers: ['Inuit', 'Kwakiutl', 'Lakota', 'Pueblo', 'Iroquois'],
  },
  explorer: {
    label: 'Explorers',
    emoji: '⛵',
    prompt: 'Which explorer?',
    answers: ['John Cabot', 'Francisco Coronado', 'Robert La Salle', 'Samuel de Champlain'],
  },
  colony: {
    label: 'Colonial Regions',
    emoji: '🏠',
    prompt: 'Which colonial region?',
    answers: ['New England', 'Mid-Atlantic', 'Southern'],
  },
};

const MATCH_CLUES = [
  // regions
  { group: 'region', clue: 'Lots of fog, mist and rain along the Pacific Ocean', answer: 'Coastal Range' },
  { group: 'region', clue: 'Low-lying valleys with fertile soil, next to the Pacific', answer: 'Coastal Range' },
  { group: 'region', clue: 'Wide desert basins', answer: 'Basin and Range' },
  { group: 'region', clue: 'Very hot, with little usable water', answer: 'Basin and Range' },
  { group: 'region', clue: 'Rich in minerals; Death Valley is here', answer: 'Basin and Range' },
  { group: 'region', clue: 'The Continental Divide runs along it', answer: 'Rocky Mountains' },
  { group: 'region', clue: 'Lots of snow in winter; gold was found here', answer: 'Rocky Mountains' },
  { group: 'region', clue: 'Prairies: wide, fairly flat land with tall grasses and few trees', answer: 'Great Plains' },
  { group: 'region', clue: 'Low precipitation, farms and ranches, wheat', answer: 'Great Plains' },
  { group: 'region', clue: 'Unpredictable weather, nicknamed "Tornado Alley"', answer: 'Interior Lowlands' },
  { group: 'region', clue: 'Flat lands, many rivers, broad river valleys and grassy hills', answer: 'Interior Lowlands' },
  { group: 'region', clue: 'Rounded mountains and rolling foothills', answer: 'Appalachian Mountains' },
  { group: 'region', clue: 'The oldest mountains in North America; the name is Native American', answer: 'Appalachian Mountains' },
  { group: 'region', clue: 'Fishing industry, fertile soil and thick forests', answer: 'Coastal Plain' },
  { group: 'region', clue: 'Low land along the Atlantic Ocean and the Gulf of Mexico', answer: 'Coastal Plain' },
  { group: 'region', clue: 'A rocky, frigid region with thin, poor soil', answer: 'Canadian Shield' },
  { group: 'region', clue: 'Lakes and swampy areas, wrapped around Hudson Bay', answer: 'Canadian Shield' },
  // tribes
  { group: 'tribe', clue: 'Parkas, seal skins and heavy fur', answer: 'Inuit' },
  { group: 'tribe', clue: 'Lived in igloos in the Arctic', answer: 'Inuit' },
  { group: 'tribe', clue: 'Hunted walrus, seals and whales', answer: 'Inuit' },
  { group: 'tribe', clue: 'The potlatch: a gift-giving contest', answer: 'Kwakiutl' },
  { group: 'tribe', clue: 'Fished and hunted in the Pacific Northwest', answer: 'Kwakiutl' },
  { group: 'tribe', clue: 'Cedar plank houses and totem poles', answer: 'Kwakiutl' },
  { group: 'tribe', clue: 'Hunted buffalo on the Great Plains', answer: 'Lakota' },
  { group: 'tribe', clue: 'Lived in teepees', answer: 'Lakota' },
  { group: 'tribe', clue: 'A nomadic lifestyle', answer: 'Lakota' },
  { group: 'tribe', clue: 'Houses made of adobe', answer: 'Pueblo' },
  { group: 'tribe', clue: 'Used irrigation to bring water to their crops in the desert', answer: 'Pueblo' },
  { group: 'tribe', clue: 'Not many large animals to hunt', answer: 'Pueblo' },
  { group: 'tribe', clue: 'Lived in longhouses', answer: 'Iroquois' },
  { group: 'tribe', clue: 'Five tribes (later six) joined together', answer: 'Iroquois' },
  { group: 'tribe', clue: 'Eastern Woodlands: hunted, fished, gathered fruits and farmed', answer: 'Iroquois' },
  // explorers
  { group: 'explorer', clue: 'Sailed for England', answer: 'John Cabot' },
  { group: 'explorer', clue: 'Explored Newfoundland, the “new found land”', answer: 'John Cabot' },
  { group: 'explorer', clue: 'Sailed for Spain', answer: 'Francisco Coronado' },
  { group: 'explorer', clue: 'Explored Mexico, Texas, Oklahoma and Kansas; saw the Grand Canyon', answer: 'Francisco Coronado' },
  { group: 'explorer', clue: 'Searched for the Seven Cities of Gold', answer: 'Francisco Coronado' },
  { group: 'explorer', clue: 'Explored the Mississippi River valley for France', answer: 'Robert La Salle' },
  { group: 'explorer', clue: 'Claimed the land along the Mississippi for France', answer: 'Robert La Salle' },
  { group: 'explorer', clue: 'Explored the St. Lawrence River for France', answer: 'Samuel de Champlain' },
  { group: 'explorer', clue: 'Founded Quebec', answer: 'Samuel de Champlain' },
  // colonial regions
  { group: 'colony', clue: 'Massachusetts', answer: 'New England' },
  { group: 'colony', clue: 'Rhode Island', answer: 'New England' },
  { group: 'colony', clue: 'Connecticut', answer: 'New England' },
  { group: 'colony', clue: 'New Hampshire', answer: 'New England' },
  { group: 'colony', clue: 'Maine', answer: 'New England' },
  { group: 'colony', clue: 'New York', answer: 'Mid-Atlantic' },
  { group: 'colony', clue: 'Pennsylvania', answer: 'Mid-Atlantic' },
  { group: 'colony', clue: 'New Jersey', answer: 'Mid-Atlantic' },
  { group: 'colony', clue: 'Delaware', answer: 'Mid-Atlantic' },
  { group: 'colony', clue: 'Maryland', answer: 'Southern' },
  { group: 'colony', clue: 'Virginia', answer: 'Southern' },
  { group: 'colony', clue: 'North Carolina', answer: 'Southern' },
  { group: 'colony', clue: 'South Carolina', answer: 'Southern' },
  { group: 'colony', clue: 'Georgia', answer: 'Southern' },
  { group: 'colony', clue: 'Economy: fishing, shipbuilding, lumber and trade', answer: 'New England' },
  { group: 'colony', clue: 'Economy: grains and livestock (the “breadbasket”)', answer: 'Mid-Atlantic' },
  { group: 'colony', clue: 'Economy: plantations growing tobacco, rice and indigo', answer: 'Southern' },
];

// --- QUIZ BANK ---
// type: 'map' (built below from the map data) | 'mc' | 'fill' | 'short'

const QUIZ_BANK = [
  // ---- Multiple Choice ----
  { type: 'mc', question: 'What was the first permanent English settlement in North America?', options: ['Jamestown', 'Roanoke', 'Plymouth', 'Quebec'], correct: 0 },
  { type: 'mc', question: 'When was Jamestown founded?', options: ['1492', '1587', '1607', '1620'], correct: 2 },
  { type: 'mc', question: 'What was the cash crop of Jamestown (and later all of Virginia)?', options: ['Cotton', 'Tobacco', 'Wheat', 'Rice'], correct: 1 },
  { type: 'mc', question: 'Who gave the Virginia Company of London the right to start a colony in the New World?', options: ['King James I', 'Queen Elizabeth I', 'William Penn', 'John Smith'], correct: 0 },
  { type: 'mc', question: 'Who founded the colony of Georgia?', options: ['William Penn', 'James Oglethorpe', 'John Cabot', 'King James I'], correct: 1 },
  { type: 'mc', question: 'Who lived in Georgia when it was founded?', options: ['Quakers', 'Puritans', 'Debtors', 'Pilgrims'], correct: 2 },
  { type: 'mc', question: 'Who settled the Massachusetts Bay Colony?', options: ['Puritans', 'Quakers', 'Debtors', 'Explorers from Spain'], correct: 0 },
  { type: 'mc', question: 'Why was the Massachusetts Bay Colony founded?', options: ['To grow tobacco', 'To practice their religion freely', 'To give debtors a new start', 'To search for gold'], correct: 1 },
  { type: 'mc', question: 'Which colony was founded by William Penn?', options: ['Georgia', 'Virginia', 'Pennsylvania', 'Massachusetts'], correct: 2 },
  { type: 'mc', question: 'Which religious group lived in Pennsylvania?', options: ['Quakers', 'Puritans', 'Pilgrims', 'Debtors'], correct: 0 },
  { type: 'mc', question: 'Which ship did the Pilgrims sail on to Plymouth?', options: ['Santa Maria', 'Mayflower', 'Half Moon', 'Discovery'], correct: 1 },
  { type: 'mc', question: 'In what year was the Plymouth colony founded?', options: ['1607', '1587', '1620', '1776'], correct: 2 },
  { type: 'mc', question: 'What was the Mayflower Compact?', options: ['A map of the New England coast', 'An agreement to form a government and make fair laws', 'A trade deal with the Iroquois', 'A letter from the king giving them land'], correct: 1 },
  { type: 'mc', question: 'What is the other name for the Roanoke colony?', options: ['The First Colony', 'The Lost Colony', 'The Breadbasket', 'New England'], correct: 1 },
  { type: 'mc', question: 'Georgia, Virginia and the Carolinas are part of which colonial region?', options: ['New England', 'Mid-Atlantic', 'Southern', 'Canadian Shield'], correct: 2 },
  { type: 'mc', question: 'New York, Pennsylvania, New Jersey and Delaware are part of which colonial region?', options: ['New England', 'Mid-Atlantic', 'Southern', 'Great Plains'], correct: 1 },
  { type: 'mc', question: 'Massachusetts, Rhode Island, Connecticut and New Hampshire are part of which colonial region?', options: ['New England', 'Mid-Atlantic', 'Southern', 'Coastal Plain'], correct: 0 },
  { type: 'mc', question: 'Which colonial region relied on fishing, shipbuilding and trade?', options: ['Southern', 'Mid-Atlantic', 'New England', 'All three'], correct: 2 },
  { type: 'mc', question: 'Which colonial region was called the “breadbasket” because of its grains and livestock?', options: ['New England', 'Mid-Atlantic', 'Southern', 'None of them'], correct: 1 },
  { type: 'mc', question: 'Tobacco, rice and indigo were grown in which colonial region?', options: ['New England', 'Mid-Atlantic', 'Southern', 'Canadian Shield'], correct: 2 },
  { type: 'mc', question: 'Which of these is NOT one of the three G’s?', options: ['God', 'Gold', 'Glory', 'Grain'], correct: 3 },
  { type: 'mc', question: 'In the three G’s, what did “Glory” mean?', options: ['Spreading religion', 'Power and fame', 'Making money', 'Finding new food'], correct: 1 },
  { type: 'mc', question: 'Which was an obstacle to exploring?', options: ['Improved ships', 'Poor maps and navigation', 'New trade', 'Getting new land'], correct: 1 },
  { type: 'mc', question: 'Which nation did John Cabot sail for?', options: ['Spain', 'France', 'England', 'Portugal'], correct: 2 },
  { type: 'mc', question: 'Which nation did Francisco Coronado sail for?', options: ['Spain', 'France', 'England', 'Netherlands'], correct: 0 },
  { type: 'mc', question: 'Robert La Salle and Samuel de Champlain both sailed for which nation?', options: ['Spain', 'France', 'England', 'Portugal'], correct: 1 },
  { type: 'mc', question: 'Which explorer founded Quebec?', options: ['John Cabot', 'Francisco Coronado', 'Robert La Salle', 'Samuel de Champlain'], correct: 3 },
  { type: 'mc', question: 'Which explorer explored the Mississippi River valley?', options: ['Robert La Salle', 'John Cabot', 'Francisco Coronado', 'Samuel de Champlain'], correct: 0 },
  { type: 'mc', question: 'Which explorer searched the Southwest for the Seven Cities of Gold?', options: ['Samuel de Champlain', 'Francisco Coronado', 'Robert La Salle', 'John Cabot'], correct: 1 },
  { type: 'mc', question: 'The Columbian Exchange was an exchange between which two places?', options: ['England and France', 'The Eastern and Western Hemispheres', 'The North and South Poles', 'The colonies and Canada'], correct: 1 },
  { type: 'mc', question: 'Which of these was exchanged in the Columbian Exchange?', options: ['Plants, animals and diseases', 'Only gold', 'Only people', 'Only maps'], correct: 0 },
  { type: 'mc', question: 'Which is a way Native Americans and Europeans CONFLICTED?', options: ['Trading furs', 'Teaching farming', 'Fighting over land', 'Sharing food'], correct: 2 },
  { type: 'mc', question: 'Which is a way Native Americans and Europeans COOPERATED?', options: ['Diseases', 'Trading', 'Different languages', 'Fighting over land'], correct: 1 },
  { type: 'mc', question: 'Which group lived in igloos?', options: ['Inuit', 'Lakota', 'Pueblo', 'Iroquois'], correct: 0 },
  { type: 'mc', question: 'Which group lived in longhouses?', options: ['Kwakiutl', 'Iroquois', 'Pueblo', 'Inuit'], correct: 1 },
  { type: 'mc', question: 'Which group lived in teepees and followed the buffalo?', options: ['Pueblo', 'Iroquois', 'Lakota', 'Kwakiutl'], correct: 2 },
  { type: 'mc', question: 'Which group built houses out of adobe?', options: ['Pueblo', 'Inuit', 'Lakota', 'Kwakiutl'], correct: 0 },
  { type: 'mc', question: 'Which group held potlatches, gift-giving contests?', options: ['Lakota', 'Kwakiutl', 'Iroquois', 'Inuit'], correct: 1 },
  { type: 'mc', question: 'How did the Pueblo get water to their crops in the dry Southwest?', options: ['Irrigation', 'Fishing', 'Whale hunts', 'Following the buffalo'], correct: 0 },
  { type: 'mc', question: 'What does “nomadic” mean?', options: ['Living in one place forever', 'Moving from place to place', 'Farming corn', 'Living by the ocean'], correct: 1 },
  { type: 'mc', question: 'What is archaeology?', options: ['The study of rocks', 'The study of past cultures through artifacts', 'The study of weather', 'The study of maps'], correct: 1 },
  { type: 'mc', question: 'Which of these is an artifact?', options: ['A mountain', 'A river', 'An arrowhead', 'A cloud'], correct: 2 },
  { type: 'mc', question: 'Tools and machines used to make other goods are which type of resource?', options: ['Natural', 'Human', 'Capital', 'Cash'], correct: 2 },
  { type: 'mc', question: 'The people who work to make goods and provide services are which type of resource?', options: ['Natural', 'Human', 'Capital', 'Artifact'], correct: 1 },
  { type: 'mc', question: 'Trees, water and animals are which type of resource?', options: ['Natural', 'Human', 'Capital', 'Cash crop'], correct: 0 },
  { type: 'mc', question: 'Which region is nicknamed “Tornado Alley”?', options: ['Coastal Plain', 'Interior Lowlands', 'Canadian Shield', 'Coastal Range'], correct: 1 },
  { type: 'mc', question: 'Which region wraps around Hudson Bay and has thin, poor soil?', options: ['Canadian Shield', 'Great Plains', 'Appalachian Mountains', 'Basin and Range'], correct: 0 },
  { type: 'mc', question: 'The Continental Divide runs along which region?', options: ['Appalachian Mountains', 'Rocky Mountains', 'Coastal Range', 'Interior Lowlands'], correct: 1 },
  { type: 'mc', question: 'Which region has old, rounded mountains and rolling foothills?', options: ['Rocky Mountains', 'Coastal Range', 'Appalachian Mountains', 'Basin and Range'], correct: 2 },
  { type: 'mc', question: 'Which region is hot and dry, with wide desert basins and little usable water?', options: ['Basin and Range', 'Great Plains', 'Coastal Plain', 'Canadian Shield'], correct: 0 },
  { type: 'mc', question: 'Which region is a prairie with tall grasses, few trees, and lots of wheat?', options: ['Interior Lowlands', 'Great Plains', 'Coastal Plain', 'Basin and Range'], correct: 1 },
  { type: 'mc', question: 'Which region has lots of fog, mist and rain along the Pacific?', options: ['Coastal Plain', 'Coastal Range', 'Canadian Shield', 'Great Plains'], correct: 1 },
  { type: 'mc', question: 'Which region runs along the Atlantic Ocean and Gulf of Mexico and has a fishing industry?', options: ['Coastal Range', 'Interior Lowlands', 'Coastal Plain', 'Appalachian Mountains'], correct: 2 },
  { type: 'mc', question: 'Which river is the longest river in North America?', options: ['Mississippi', 'Missouri', 'Ohio', 'Rio Grande'], correct: 1 },
  { type: 'mc', question: 'Which river was the “Gateway to the West”?', options: ['Ohio', 'Colorado', 'Columbia', 'St. Lawrence'], correct: 0 },
  { type: 'mc', question: 'Which river connects the Great Lakes with the Atlantic Ocean?', options: ['Missouri', 'Rio Grande', 'St. Lawrence', 'Columbia'], correct: 2 },
  { type: 'mc', question: 'Which river forms the border between Texas and Mexico?', options: ['Colorado', 'Rio Grande', 'Mississippi', 'Ohio'], correct: 1 },

  // ---- Fill in the Blank ----
  { type: 'fill', question: 'The first permanent English settlement was ________, founded in 1607.', accept: ['Jamestown'] },
  { type: 'fill', question: 'Jamestown was founded in the year ________.', accept: ['1607'] },
  { type: 'fill', question: 'The Pilgrims sailed to Plymouth on the ________.', accept: ['Mayflower', 'the Mayflower', 'May flower'] },
  { type: 'fill', question: 'The Plymouth colony was founded in the year ________.', accept: ['1620'] },
  { type: 'fill', question: 'Roanoke is also called the ________ Colony.', accept: ['Lost', 'the Lost'] },
  { type: 'fill', question: '________ was the cash crop of Jamestown.', accept: ['tobacco'] },
  { type: 'fill', question: 'A crop grown to sell for money is called a ________ crop.', accept: ['cash'] },
  { type: 'fill', question: 'Georgia was founded by James ________.', accept: ['Oglethorpe'] },
  { type: 'fill', question: 'People who owe money are called ________.', accept: ['debtors', 'debtor'] },
  { type: 'fill', question: 'The Massachusetts Bay Colony was settled by the ________.', accept: ['Puritans', 'Puritan', 'the Puritans'] },
  { type: 'fill', question: 'William Penn founded the colony of ________.', accept: ['Pennsylvania'] },
  { type: 'fill', question: 'The ________ were the religious group who lived in Pennsylvania.', accept: ['Quakers', 'Quaker'] },
  { type: 'fill', question: 'King ________ gave the Virginia Company of London the right to start a colony.', accept: ['James I', 'James', 'James the First', 'James 1', 'James the 1st'] },
  { type: 'fill', question: 'The three G’s are God, Gold and ________.', accept: ['Glory'] },
  { type: 'fill', question: 'The exchange of plants, animals and diseases between the hemispheres is called the ________ Exchange.', accept: ['Columbian'] },
  { type: 'fill', question: '________ is the study of humans and cultures of the past through artifacts.', accept: ['archaeology', 'archeology'] },
  { type: 'fill', question: 'An object made or used by humans, like a pot or an arrowhead, is called an ________.', accept: ['artifact', 'artefact'] },
  { type: 'fill', question: 'The people who work to make goods and provide services are ________ resources.', accept: ['human'] },
  { type: 'fill', question: 'Goods made and used to help make other goods and services are ________ resources.', accept: ['capital'] },
  { type: 'fill', question: 'Things people use from nature, like plants and animals, are ________ resources.', accept: ['natural'] },
  { type: 'fill', question: 'The Lakota lived in ________ and hunted buffalo.', accept: ['teepees', 'teepee', 'tepees', 'tepee', 'tipis', 'tipi'] },
  { type: 'fill', question: 'The Inuit lived in ________.', accept: ['igloos', 'igloo'] },
  { type: 'fill', question: 'The Iroquois lived in ________.', accept: ['longhouses', 'longhouse', 'long houses'] },
  { type: 'fill', question: 'The Pueblo built their houses out of ________.', accept: ['adobe'] },
  { type: 'fill', question: 'The Kwakiutl gift-giving contest is called a ________.', accept: ['potlatch'] },
  { type: 'fill', question: 'The Canadian Shield wraps around ________ Bay.', accept: ['Hudson'] },
  { type: 'fill', question: 'The Continental Divide runs along the ________ Mountains.', accept: ['Rocky', 'Rockies'] },
  { type: 'fill', question: 'The Interior Lowlands are nicknamed Tornado ________.', accept: ['Alley'] },
  { type: 'fill', question: 'Samuel de ________ founded Quebec.', accept: ['Champlain'] },
  { type: 'fill', question: 'John Cabot sailed for ________.', accept: ['England'] },
  { type: 'fill', question: 'Francisco Coronado sailed for ________.', accept: ['Spain'] },
  { type: 'fill', question: 'Robert La Salle explored the ________ River valley.', accept: ['Mississippi'] },
  { type: 'fill', question: 'The Mid-Atlantic colonies were called the “________ colonies” because of all their grain.', accept: ['breadbasket', 'bread basket'] },
  { type: 'fill', question: 'Tobacco, rice and indigo were grown in the ________ colonies.', accept: ['Southern', 'South'] },
  { type: 'fill', question: 'The ________ River is the longest river in North America.', accept: ['Missouri'] },

  // ---- Short Answer ----
  {
    type: 'short',
    question: 'Why did Europeans go exploring? Explain the three G’s.',
    model: 'God: to spread their religion (Christianity). Glory: to gain power and fame for themselves and their country. Gold: to get rich and make money.',
  },
  {
    type: 'short',
    question: 'What are some obstacles to exploring?',
    model: 'Poor maps and navigation tools made it hard to plan journeys. Explorers also faced fear of the unknown, disease and running out of food.',
  },
  {
    type: 'short',
    question: 'What benefits can come from exploring?',
    model: 'Improved ships and navigation, new trade, and new land.',
  },
  {
    type: 'short',
    question: 'Explain the three different types of resources.',
    model: 'Natural resources are things people use from nature, like plants and animals. Human resources are the people who work to make goods and provide services. Capital resources are goods made and used to help make other goods and services, like tools.',
  },
  {
    type: 'short',
    question: 'What is archaeology? What is an artifact? Give two examples of artifacts.',
    model: 'Archaeology is the study of humans and cultures of the past by recovering and analyzing artifacts. An artifact is an object made or used by humans for a purpose, like arrowheads, spears, tools or pots.',
  },
  {
    type: 'short',
    question: 'What is the Columbian Exchange?',
    model: 'The global exchange between the Eastern and Western Hemispheres that began after Columbus. Plants, animals and diseases moved in both directions.',
  },
  {
    type: 'short',
    question: 'What are the ways Native Americans cooperated with the Europeans?',
    model: 'They traded with each other, Native Americans showed settlers how to farm, and they worked together for economic reasons.',
  },
  {
    type: 'short',
    question: 'What are the ways Native Americans conflicted with the Europeans?',
    model: 'They fought over land and trade, had different cultures and different languages, and European diseases killed many Native Americans.',
  },
  {
    type: 'short',
    question: 'Why did the English establish colonies in North America? (Think religious and economic.)',
    model: 'Religious: to have the freedom to practice their own religion. Economic: to make money and own land.',
  },
  {
    type: 'short',
    question: 'Who founded the Plymouth colony? When? What ship did they sail on? What was the Mayflower Compact?',
    model: 'Mostly the Pilgrims (plus others called Strangers), in 1620, on the Mayflower. The Mayflower Compact was their agreement to form a government and make fair laws.',
  },
  {
    type: 'short',
    question: 'What is the other name for the Roanoke colony? What happened to the colonists?',
    model: 'The Lost Colony. The colonists disappeared, and no one knows for sure what happened to them.',
  },
  {
    type: 'short',
    question: 'Compare what the New England, Mid-Atlantic and Southern colonies relied on for their economies.',
    model: 'New England: fishing, shipbuilding, lumber and trade (production and industry). Mid-Atlantic: grains and livestock, the breadbasket. Southern: plantations growing tobacco, rice and indigo.',
  },
  {
    type: 'short',
    question: 'Describe the Inuit: where they lived, their clothes, food and housing.',
    model: 'They lived in the Arctic. They wore parkas made of seal skin and heavy fur, hunted seals, walrus and whales, and lived in igloos.',
  },
  {
    type: 'short',
    question: 'Describe the Lakota: where they lived, their food, housing and lifestyle.',
    model: 'They lived on the Great Plains, hunted buffalo, lived in teepees, and were nomadic, moving to follow the buffalo.',
  },
  {
    type: 'short',
    question: 'Describe the Pueblo: where they lived, their food and housing.',
    model: 'They lived in the dry Southwest in adobe houses. There were not many large animals to hunt, so they farmed corn, beans and squash using irrigation.',
  },
  {
    type: 'short',
    question: 'Describe the Iroquois: where they lived, their food, housing and one more fact.',
    model: 'They lived in the Eastern Woodlands in longhouses. They farmed, hunted, fished and gathered fruits. Five tribes (later six) joined together to form the Iroquois League.',
  },
  {
    type: 'short',
    question: 'Describe the Kwakiutl: where they lived, their food, housing and one more fact.',
    model: 'They lived on the Pacific Northwest coast. They fished and hunted, lived in cedar plank houses, and held potlatches, gift-giving contests.',
  },
  {
    type: 'short',
    question: 'Give two characteristics of the Canadian Shield and two of the Great Plains.',
    model: 'Canadian Shield: rocky and frigid, thin poor soil, lakes and swampy areas, wraps around Hudson Bay. Great Plains: prairies with tall grasses and few trees, low precipitation, farms and ranches, wheat.',
  },
  {
    type: 'short',
    question: 'Give two characteristics of the Rocky Mountains and two of the Appalachian Mountains.',
    model: 'Rocky Mountains: high and rugged, lots of snow in winter, the Continental Divide, gold. Appalachian Mountains: old, rounded mountains with rolling foothills, the oldest in North America, a Native American name.',
  },
];

/* Map questions are generated from the map data so each one shows a real
 * highlighted shape, the way a test map does. */
const MAP_QUESTIONS = [
  ...REGIONS.map((r) => ({
    type: 'map',
    kind: 'region',
    target: r.id,
    question: 'Which geographic region is colored in on this map?',
    answer: r.name,
    choices: REGIONS.map((x) => x.name),
  })),
  ...RIVERS.map((r) => ({
    type: 'map',
    kind: 'river',
    target: r.id,
    question: 'Which river is highlighted in red?',
    answer: r.name,
    choices: RIVERS.map((x) => x.name),
  })),
  ...CONTINENTS.map((c) => ({
    type: 'map',
    kind: 'continent',
    target: c.id,
    question: 'Which continent is colored in?',
    answer: c.name,
    choices: CONTINENTS.map((x) => x.name),
  })),
  ...OCEANS.map((o) => ({
    type: 'map',
    kind: 'ocean',
    target: o.id,
    question: 'Which ocean is marked with the star?',
    answer: `${o.name} Ocean`,
    choices: OCEANS.map((x) => `${x.name} Ocean`),
  })),
];

/* Sectioned like a real test. Three map questions — one region, one river, and
 * one continent or ocean — so every test covers each map on the sheet. */
const QUIZ_BLUEPRINT = [
  { type: 'map', count: 3, heading: 'Part I — Map' },
  { type: 'mc', count: 3, heading: 'Part II — Multiple Choice' },
  { type: 'fill', count: 2, heading: 'Part III — Fill in the Blank' },
  { type: 'short', count: 2, heading: 'Part IV — Short Answer' },
];

// --- HELPERS ---

function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const pickOne = (array) => array[Math.floor(Math.random() * array.length)];

/* Forgiving comparison for fill-in-the-blank: case, spacing, and punctuation
 * shouldn't cost her the point. Spelling still has to be right. */
function normalize(value) {
  return (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function withMapOptions(q) {
  const wrong = shuffle(q.choices.filter((c) => c !== q.answer)).slice(0, 3);
  const options = shuffle([q.answer, ...wrong]);
  return { ...q, options, correct: options.indexOf(q.answer) };
}

function buildQuiz() {
  const byKind = (kinds) => MAP_QUESTIONS.filter((q) => kinds.includes(q.kind));
  const maps = [
    pickOne(byKind(['region'])),
    pickOne(byKind(['river'])),
    pickOne(byKind(['continent', 'ocean'])),
  ].map(withMapOptions);
  const picked = [...maps];
  QUIZ_BLUEPRINT.filter((s) => s.type !== 'map').forEach(({ type, count }) => {
    picked.push(...shuffle(QUIZ_BANK.filter((q) => q.type === type)).slice(0, count));
  });
  return picked;
}

function isAnswerCorrect(question, answer, selfGrade) {
  switch (question.type) {
    case 'map':
    case 'mc':
      return answer === question.correct;
    case 'fill':
      return question.accept.some((a) => normalize(a) === normalize(answer));
    case 'short':
      return selfGrade === true;
    default:
      return false;
  }
}

// --- MAPS ---

function RegionShapes({ fillFor, onPick, strokeFor }) {
  return (
    <>
      {NA_LAND.map((d, i) => (
        <path key={`l${i}`} d={d} fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
      ))}
      {REGIONS.map((r) => (
        <path
          key={r.id}
          d={REGION_PATHS[r.id].join('')}
          fillRule="evenodd"
          fill={fillFor(r)}
          stroke={strokeFor ? strokeFor(r) : '#475569'}
          strokeWidth="1"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          className={onPick ? 'cursor-pointer transition-colors duration-300' : undefined}
          onClick={onPick ? () => onPick(r) : undefined}
        />
      ))}
      {NA_LAKES.map((d, i) => (
        <path key={`k${i}`} d={d} fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.8" vectorEffect="non-scaling-stroke" pointerEvents="none" />
      ))}
      {NA_BORDERS.map((d, i) => (
        <path key={`b${i}`} d={d} fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="4 3" vectorEffect="non-scaling-stroke" pointerEvents="none" />
      ))}
    </>
  );
}

/* Crayon first, then the map — the same order as the Maps & Rivers topic, so
 * tapping is a retrieval attempt and not a way to read labels off the map. */
function RegionMap({ progress, setProgress }) {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [hints, setHints] = useState(false);
  const [wrong, setWrong] = useState(null);
  const [message, setMessage] = useState(null);

  const done = REGIONS.filter((r) => progress[r.id]).length;
  const finished = done === REGIONS.length;

  useEffect(() => {
    if (!message) return undefined;
    const t = setTimeout(() => setMessage(null), 2600);
    return () => clearTimeout(t);
  }, [message]);

  const handleRegion = (region) => {
    if (progress[region.id]) return;
    if (!selected) {
      if (hints) setMessage({ tone: 'good', text: `That is the ${region.name}. Now find its crayon!` });
      else setMessage({ tone: 'bad', text: 'Pick a region name first, then tap it on the map.' });
      return;
    }
    if (selected === region.id) {
      setProgress((p) => ({ ...p, [region.id]: true }));
      setSelected(null);
      setMessage({ tone: 'good', text: `✅ ${region.name}: ${region.fact}` });
    } else {
      const picked = REGIONS.find((r) => r.id === selected);
      setWrong(region.id);
      setTimeout(() => setWrong(null), 600);
      setMessage(
        hints
          ? { tone: 'bad', text: `That's the ${region.name}, not the ${picked.name}. Try again!` }
          : { tone: 'bad', text: 'Not quite — try again!' },
      );
    }
  };

  const shown = (id) => progress[id] || revealed;

  return (
    <div>
      <Toolbar
        done={done}
        total={REGIONS.length}
        revealed={revealed}
        hints={hints}
        onHints={() => setHints((v) => !v)}
        onReveal={() => setRevealed((v) => !v)}
        onReset={() => {
          setProgress({});
          setRevealed(false);
          setSelected(null);
          setMessage(null);
        }}
      />

      <Feedback message={message} />

      {finished && (
        <div className="mb-3 rounded-xl bg-gradient-to-r from-amber-200 to-yellow-100 px-4 py-3 text-center font-bold text-amber-900">
          🎉 All 8 regions labeled! You know this map.
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl bg-sky-100 ring-1 ring-slate-300">
        <svg viewBox={NA_VIEWBOX} className="block w-full" role="img" aria-label="Map of the geographic regions of North America">
          <RegionShapes
            fillFor={(r) => (wrong === r.id ? '#fda4af' : shown(r.id) ? r.color : '#fbfbf9')}
            onPick={handleRegion}
          />
        </svg>

        <div className="pointer-events-none absolute inset-0">
          {REGIONS.filter((r) => shown(r.id)).map((r) => (
            <Pill
              key={r.id}
              x={REGION_LABELS[r.id].x}
              y={REGION_LABELS[r.id].y}
              view={NA_VIEW}
              className="bg-white/95 text-slate-800"
              style={{ color: r.color, boxShadow: `0 0 0 2px ${r.color}` }}
            >
              {r.name}
            </Pill>
          ))}
        </div>
      </div>

      <p className="mt-3 text-center text-sm font-semibold text-slate-600">
        {selected
          ? `Now tap the ${REGIONS.find((r) => r.id === selected).name} on the map 👆`
          : 'Pick a region name, then tap it on the map.'}
      </p>

      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {REGIONS.map((r) => (
          <CrayonChip
            key={r.id}
            item={r}
            state={progress[r.id] ? 'done' : 'todo'}
            selected={selected === r.id}
            onClick={() => setSelected(selected === r.id ? null : r.id)}
          />
        ))}
      </div>
    </div>
  );
}

/* A blank copy of the worksheet's question 3: region outlines with the same
 * numbers 1-8, and an empty key to fill in. */
function RegionPrintSheet() {
  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap items-center gap-3">
        <p className="flex-1 text-sm text-slate-600">
          The same numbered map as question 3 on the study guide, with a blank key. Fill it in
          from memory with a pencil.
        </p>
        <button
          type="button"
          onClick={() => window.print()}
          className="min-h-[44px] rounded-xl bg-amber-700 px-5 py-2 font-bold text-white hover:bg-amber-800"
        >
          🖨️ Print
        </button>
      </div>
      <section className="print-sheet rounded-2xl bg-white p-5 shadow ring-1 ring-slate-200">
        <div className="print-head">
          <span>Name: ______________________</span>
          <span>Date: ______________</span>
        </div>
        <h2 className="print-title">Geographic Regions of North America</h2>
        <svg viewBox={NA_VIEWBOX} className="block w-full">
          {NA_LAND.map((d, i) => (
            <path key={`l${i}`} d={d} fill="#ffffff" stroke="#000000" strokeWidth="0.9" vectorEffect="non-scaling-stroke" />
          ))}
          {REGIONS.map((r) => (
            <path
              key={r.id}
              d={REGION_PATHS[r.id].join('')}
              fillRule="evenodd"
              fill="#ffffff"
              stroke="#000000"
              strokeWidth="1.1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {NA_LAKES.map((d, i) => (
            <path key={`k${i}`} d={d} fill="#ffffff" stroke="#000000" strokeWidth="0.7" vectorEffect="non-scaling-stroke" />
          ))}
          {REGIONS.map((r) => (
            <g key={`n${r.id}`}>
              <circle cx={REGION_LABELS[r.id].x} cy={REGION_LABELS[r.id].y} r="11" fill="#ffffff" stroke="#000000" strokeWidth="1.2" />
              <text
                x={REGION_LABELS[r.id].x}
                y={REGION_LABELS[r.id].y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="14"
                fontWeight="700"
              >
                {r.num}
              </text>
            </g>
          ))}
        </svg>
        <div className="print-key">
          {REGIONS.map((r) => (
            <div key={r.id} className="print-key-row">
              <span className="print-eq">{r.num} =</span>
              <span className="print-line" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const MAP_VIEWS = [
  { id: 'regions', label: '🏔️ Regions' },
  { id: 'rivers', label: '🏞️ Rivers' },
  { id: 'world', label: '🌍 Continents & Oceans' },
  { id: 'print', label: '🖨️ Blank Regions Map' },
];

// --- QUIZ MAPS ---

function QuizMap({ q }) {
  if (q.kind === 'region') {
    return (
      <svg viewBox={NA_VIEWBOX} className="block w-full rounded-xl bg-sky-100" role="img" aria-label="A map of North America with one region colored in">
        <RegionShapes fillFor={(r) => (r.id === q.target ? '#dc2626' : '#fbfbf9')} />
      </svg>
    );
  }
  if (q.kind === 'river') {
    return (
      <svg viewBox={US_VIEWBOX} className="block w-full rounded-xl bg-sky-100" role="img" aria-label="A map of the United States with one river highlighted">
        {US_LAND.map((d, i) => (
          <path key={`l${i}`} d={d} fill="#fbfbf9" stroke="#475569" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        ))}
        {US_LAKES.map((d, i) => (
          <path key={`k${i}`} d={d} fill="#d6ecfb" stroke="#93c5fd" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        ))}
        {RIVERS.map((r) => (
          <path
            key={r.id}
            d={US_RIVER_PATHS[r.id].join('')}
            fill="none"
            stroke={r.id === q.target ? '#dc2626' : '#94a3b8'}
            strokeWidth={r.id === q.target ? 5 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    );
  }
  // continent or ocean
  const star = q.kind === 'ocean' ? OCEAN_LABELS[q.target] : null;
  return (
    <div className="relative">
      <svg viewBox={WORLD_VIEWBOX} className="block w-full rounded-xl bg-sky-100" role="img" aria-label="A world map">
        {CONTINENTS.map((c) => (
          <path
            key={c.id}
            d={CONTINENT_PATHS[c.id].join('')}
            fillRule="evenodd"
            fill={c.id === q.target ? '#dc2626' : '#eef1f5'}
            stroke="#1e293b"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      {star && (
        <Pill x={star.x} y={star.y} view={WORLD_VIEW} className="bg-red-600 text-base text-white sm:text-lg">
          ★
        </Pill>
      )}
    </div>
  );
}

// --- TABS ---

/* Retrieval-first ordering: cards, maps and the drill come before the
 * reference sheets, and the full term/definition list sits on its own tab so it
 * can't be read off the screen while she is trying to recall a card. */
const TABS = [
  { id: 'cards', name: '🃏 Note Cards' },
  { id: 'maps', name: '🗺️ Maps' },
  { id: 'match', name: '🎯 Who Am I?' },
  { id: 'quiz', name: '📝 Practice Test' },
  { id: 'overview', name: '📖 Study Sheet' },
  { id: 'notes', name: '📋 All Notes' },
];

const MATCH_FILTERS = [{ id: 'all', label: '🔀 Everything' }].concat(
  Object.entries(MATCH_GROUPS).map(([id, g]) => ({ id, label: `${g.emoji} ${g.label}` })),
);

export default function SocialStudiesStudyApp() {
  const [activeTab, setActiveTab] = useState('cards');
  useGuidanceTab(activeTab);

  // Maps — held here so switching tabs never throws away map progress.
  const [mapView, setMapView] = useState('regions');
  const [regionProgress, setRegionProgress] = useState({});
  const [riverProgress, setRiverProgress] = useState({});
  const [worldProgress, setWorldProgress] = useState({});

  // Who Am I? drill
  const [matchFilter, setMatchFilter] = useState('all');
  const [matchOrder, setMatchOrder] = useState(() => shuffle(MATCH_CLUES));
  const [matchIndex, setMatchIndex] = useState(0);
  const [matchPick, setMatchPick] = useState(null);
  const [matchScore, setMatchScore] = useState({ right: 0, wrong: 0 });

  // Quiz
  const [currentQuiz, setCurrentQuiz] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [selfGrades, setSelfGrades] = useState({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  const startNewQuiz = useCallback(() => {
    setCurrentQuiz(buildQuiz());
    setQuizAnswers({});
    setSelfGrades({});
    setShowQuizResults(false);
  }, []);

  useEffect(() => {
    startNewQuiz();
  }, [startNewQuiz]);

  const setAnswer = (index, value) => setQuizAnswers((prev) => ({ ...prev, [index]: value }));

  const quizScore = useMemo(() => {
    let correct = 0;
    currentQuiz.forEach((q, i) => {
      if (isAnswerCorrect(q, quizAnswers[i], selfGrades[i])) correct++;
    });
    return { correct, total: currentQuiz.length };
  }, [currentQuiz, quizAnswers, selfGrades]);

  const matchCard = matchOrder[matchIndex];

  const restartMatch = (filter) => {
    setMatchFilter(filter);
    setMatchOrder(shuffle(filter === 'all' ? MATCH_CLUES : MATCH_CLUES.filter((c) => c.group === filter)));
    setMatchIndex(0);
    setMatchPick(null);
    setMatchScore({ right: 0, wrong: 0 });
  };

  const answerMatch = (answer) => {
    if (matchPick || !matchCard) return;
    setMatchPick(answer);
    setMatchScore((prev) =>
      answer === matchCard.answer ? { ...prev, right: prev.right + 1 } : { ...prev, wrong: prev.wrong + 1 },
    );
  };

  const nextMatch = () => {
    setMatchPick(null);
    setMatchIndex((prev) => (prev + 1) % matchOrder.length);
  };

  // --- RENDER: MAPS ---

  const renderMaps = () => (
    <div>
      <div className="no-print mb-4 flex flex-wrap justify-center gap-2">
        {MAP_VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setMapView(v.id)}
            className={`min-h-[44px] rounded-xl px-3 py-2 text-sm font-bold transition sm:px-4 ${
              mapView === v.id
                ? 'bg-amber-800 text-white shadow'
                : 'bg-white text-amber-900 shadow-sm ring-1 ring-amber-200 hover:bg-amber-50'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
      {mapView === 'regions' && <RegionMap progress={regionProgress} setProgress={setRegionProgress} />}
      {mapView === 'rivers' && <RiverMap progress={riverProgress} setProgress={setRiverProgress} />}
      {mapView === 'world' && <WorldMap progress={worldProgress} setProgress={setWorldProgress} />}
      {mapView === 'print' && <RegionPrintSheet />}
    </div>
  );

  // --- RENDER: WHO AM I? ---

  const renderMatch = () => {
    const group = matchCard ? MATCH_GROUPS[matchCard.group] : null;
    const answered = matchPick !== null;
    const gotIt = answered && matchPick === matchCard.answer;
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-800">Who Am I?</h3>
          <p className="text-gray-600">
            Read the clue and pick who or what it describes. Everything is mixed together on
            purpose — telling them apart is the skill.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {MATCH_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => restartMatch(f.id)}
              className={`min-h-[44px] rounded-full px-3 py-2 text-sm font-semibold ${
                matchFilter === f.id
                  ? 'bg-amber-800 text-white shadow'
                  : 'bg-white text-amber-900 ring-1 ring-amber-200 hover:bg-amber-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-sm text-gray-700">
          <div className="rounded bg-green-100 p-2">✅ Right: {matchScore.right}</div>
          <div className="rounded bg-red-100 p-2">❌ Wrong: {matchScore.wrong}</div>
          <div className="rounded bg-amber-100 p-2">
            {matchIndex + 1} / {matchOrder.length}
          </div>
        </div>

        <div className="flex min-h-[9rem] flex-col items-center justify-center rounded-2xl bg-white p-6 text-center shadow sm:min-h-[11rem] sm:p-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-700">
            {group?.emoji} {group?.prompt}
          </p>
          <p className="text-2xl font-medium text-gray-800 sm:text-3xl">“{matchCard?.clue}”</p>
        </div>

        {/* Full class names only: Tailwind can't see ones built from fragments. */}
        <div
          className={`grid gap-2 ${
            group?.answers.length > 5
              ? 'grid-cols-2 sm:grid-cols-4'
              : group?.answers.length === 5
                ? 'grid-cols-2 sm:grid-cols-5'
                : group?.answers.length === 4
                  ? 'grid-cols-2'
                  : 'grid-cols-1 sm:grid-cols-3'
          }`}
        >
          {group?.answers.map((a) => {
            let cls = 'bg-white text-gray-800 ring-1 ring-amber-200 hover:bg-amber-50';
            if (answered) {
              if (a === matchCard.answer) cls = 'bg-green-600 text-white';
              else if (a === matchPick) cls = 'bg-red-500 text-white';
              else cls = 'bg-gray-100 text-gray-400';
            }
            return (
              <button
                key={a}
                type="button"
                onClick={() => answerMatch(a)}
                disabled={answered}
                className={`min-h-[56px] rounded-xl px-3 py-2 font-bold shadow-sm transition ${cls}`}
              >
                {a}
              </button>
            );
          })}
        </div>

        {answered && (
          <div
            className={`rounded-lg p-3 text-center font-bold ${
              gotIt ? 'bg-green-100 text-green-900' : 'bg-orange-100 text-orange-900'
            }`}
          >
            {gotIt ? '✅ Correct!' : `❌ That one is ${matchCard.answer}.`}
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={nextMatch}
            disabled={!answered}
            className="min-h-[56px] rounded-xl bg-amber-700 px-8 py-3 text-lg font-bold text-white shadow hover:bg-amber-800 disabled:bg-gray-400"
          >
            Next Clue →
          </button>
          <button
            type="button"
            onClick={() => restartMatch(matchFilter)}
            className="min-h-[44px] rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          >
            🔄 Start Over
          </button>
        </div>
      </div>
    );
  };

  // --- RENDER: QUIZ ---

  const renderChoices = (q, qIndex) => (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      {q.options.map((option, oIndex) => {
        const isSelected = quizAnswers[qIndex] === oIndex;
        const isRight = oIndex === q.correct;
        let cls = 'w-full min-h-[52px] text-left p-3 rounded-lg border ';
        if (showQuizResults) {
          if (isRight) cls += 'bg-green-200 border-green-400';
          else if (isSelected) cls += 'bg-red-200 border-red-400';
          else cls += 'bg-gray-100 border-gray-300';
        } else {
          cls += isSelected ? 'bg-amber-100 border-amber-400' : 'bg-gray-50 border-gray-200 hover:bg-gray-100';
        }
        return (
          <button
            key={option}
            type="button"
            onClick={() => !showQuizResults && setAnswer(qIndex, oIndex)}
            className={cls}
            disabled={showQuizResults}
          >
            {option}
          </button>
        );
      })}
    </div>
  );

  const renderQuestion = (q, qIndex) => {
    const answer = quizAnswers[qIndex];
    const correct = isAnswerCorrect(q, answer, selfGrades[qIndex]);

    if (q.type === 'map') {
      return (
        <div className="space-y-3">
          <div className="mx-auto max-w-xl">
            <QuizMap q={q} />
          </div>
          {renderChoices(q, qIndex)}
        </div>
      );
    }

    if (q.type === 'mc') return renderChoices(q, qIndex);

    if (q.type === 'fill') {
      return (
        <div>
          <input
            type="text"
            value={answer || ''}
            onChange={(e) => setAnswer(qIndex, e.target.value)}
            disabled={showQuizResults}
            placeholder="Type your answer"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className={`min-h-[52px] w-full rounded-lg border p-3 text-lg ${
              showQuizResults
                ? correct
                  ? 'border-green-400 bg-green-100'
                  : 'border-red-400 bg-red-100'
                : 'border-gray-300 bg-white'
            }`}
          />
          {showQuizResults && !correct && (
            <p className="mt-2 text-sm text-gray-800">
              ✅ Answer: <span className="font-bold">{q.accept[0]}</span>
            </p>
          )}
        </div>
      );
    }

    // short answer
    return (
      <div>
        <textarea
          rows={3}
          value={answer || ''}
          onChange={(e) => setAnswer(qIndex, e.target.value)}
          disabled={showQuizResults}
          placeholder="Write your answer in a sentence or two"
          className="w-full rounded-lg border border-gray-300 bg-white p-3 text-lg"
        />
        {showQuizResults && (
          <div className="mt-3 rounded-lg bg-amber-50 p-3">
            <p className="text-sm">
              <span className="font-bold">Model answer:</span> {q.model}
            </p>
            <p className="mt-2 text-xs text-gray-600">Compare it to yours, then grade yourself:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelfGrades((prev) => ({ ...prev, [qIndex]: true }))}
                className={`min-h-[44px] rounded-lg px-4 py-2 text-sm font-semibold ${
                  selfGrades[qIndex] === true ? 'bg-green-600 text-white' : 'bg-green-100 text-green-900 hover:bg-green-200'
                }`}
              >
                ✅ I got this
              </button>
              <button
                type="button"
                onClick={() => setSelfGrades((prev) => ({ ...prev, [qIndex]: false }))}
                className={`min-h-[44px] rounded-lg px-4 py-2 text-sm font-semibold ${
                  selfGrades[qIndex] === false ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-900 hover:bg-orange-200'
                }`}
              >
                🤔 Missed it
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderQuiz = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-800">Unit 1 Practice Test</h3>
        <p className="text-gray-600">
          10 questions: maps, multiple choice, fill in the blank, and short answer. Every test is
          different.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => setShowQuizResults(true)}
          disabled={showQuizResults}
          className="min-h-[44px] rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          ✓ Check Answers
        </button>
        <button
          type="button"
          onClick={startNewQuiz}
          className="min-h-[44px] rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700"
        >
          🔄 New Test
        </button>
      </div>

      {showQuizResults && (
        <div className="rounded-lg bg-amber-100 p-4 text-center">
          <p className="text-2xl font-bold text-amber-900">
            You scored {quizScore.correct} out of {quizScore.total}!
          </p>
          <p className="mt-1 text-sm text-amber-900">Short answers count once you grade them below.</p>
        </div>
      )}

      <div className="space-y-4">
        {currentQuiz.map((q, qIndex) => {
          const section = QUIZ_BLUEPRINT.find((s) => s.type === q.type);
          const isFirstOfType = currentQuiz.findIndex((item) => item.type === q.type) === qIndex;
          const correct = isAnswerCorrect(q, quizAnswers[qIndex], selfGrades[qIndex]);
          return (
            <div key={`${q.type}-${q.target || ''}-${q.question}`}>
              {isFirstOfType && (
                <h4 className="mb-2 mt-4 border-b-2 border-amber-300 pb-1 text-sm font-bold uppercase tracking-wide text-amber-800">
                  {section?.heading}
                </h4>
              )}
              <div className="rounded-lg bg-white p-4 shadow">
                <p className="mb-3 font-semibold">
                  {showQuizResults && q.type !== 'short' && <span className="mr-1">{correct ? '✅' : '❌'}</span>}
                  {qIndex + 1}. {q.question}
                </p>
                {renderQuestion(q, qIndex)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // --- RENDER: STUDY SHEET ---

  const cell = 'p-3 align-top';
  const renderOverview = () => (
    <div className="space-y-6 text-gray-800">
      <div className="rounded-r-lg border-l-4 border-amber-600 bg-amber-100 p-6">
        <h3 className="mb-2 text-2xl font-bold">🧭 Unit 1 Study Guide, in one place</h3>
        <p>
          Everything from the 31 questions on your study guide, in the same order. Read it once,
          then go practice: the note cards, the maps, Who Am I?, and the practice test are what
          make it stick.
        </p>
      </div>

      <section>
        <h4 className="mb-2 text-xl font-bold text-amber-900">1–2. Maps</h4>
        <p className="text-sm">
          <strong>7 continents:</strong> North America, South America, Europe, Asia, Africa,
          Australia, Antarctica. <strong>Oceans:</strong> Pacific, Atlantic, Indian, Arctic.{' '}
          <strong>7 rivers:</strong> Mississippi, St. Lawrence, Colorado, Missouri, Rio Grande,
          Ohio, Columbia. Practice them on the 🗺️ Maps tab.
        </p>
      </section>

      <section>
        <h4 className="mb-2 text-xl font-bold text-amber-900">3–4. Geographic Regions (west to east)</h4>
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead className="bg-amber-700 text-white">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Region</th>
                <th className="p-3">Characteristics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {DECKS[0].cards.map((c, i) => (
                <tr key={c.term}>
                  <td className={`${cell} font-bold`}>
                    <span
                      className="inline-block h-3 w-3 rounded-sm border border-black/20 align-middle"
                      style={{ background: REGIONS[i].color }}
                    />{' '}
                    {REGIONS[i].num}
                  </td>
                  <td className={`${cell} font-semibold`}>{c.term}</td>
                  <td className={cell}>{c.definition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-stone-100 p-4">
          <h4 className="mb-2 text-lg font-bold">5–6. Archaeology &amp; Artifacts</h4>
          <p className="text-sm">
            <strong>Archaeology</strong> — the study of humans and cultures of the past by
            recovering and analyzing artifacts.
          </p>
          <p className="mt-2 text-sm">
            <strong>Artifact</strong> — an object made or used by humans for a purpose: arrowheads,
            spears, tools, pots.
          </p>
        </div>
        <div className="rounded-lg bg-lime-50 p-4">
          <h4 className="mb-2 text-lg font-bold">7. Three Types of Resources</h4>
          <ul className="space-y-1 text-sm">
            <li><strong>Natural</strong> — things from nature, like plants and animals.</li>
            <li><strong>Human</strong> — people who work to make goods and provide services.</li>
            <li><strong>Capital</strong> — goods made to help make other goods and services (tools).</li>
          </ul>
        </div>
      </section>

      <section>
        <h4 className="mb-2 text-xl font-bold text-amber-900">8. Native American Groups</h4>
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead className="bg-amber-700 text-white">
              <tr>
                <th className="p-3">Group</th>
                <th className="p-3">Where</th>
                <th className="p-3">Food</th>
                <th className="p-3">Housing</th>
                <th className="p-3">Other</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              <tr>
                <td className={`${cell} font-semibold`}>Inuit</td>
                <td className={cell}>Arctic</td>
                <td className={cell}>Seals, walrus, whales</td>
                <td className={cell}>Igloos</td>
                <td className={cell}>Parkas of seal skin and heavy fur; whale hunts</td>
              </tr>
              <tr>
                <td className={`${cell} font-semibold`}>Kwakiutl</td>
                <td className={cell}>Pacific Northwest coast</td>
                <td className={cell}>Fish (salmon) and hunting</td>
                <td className={cell}>Cedar plank houses</td>
                <td className={cell}>Potlatch = gift-giving contest; totem poles</td>
              </tr>
              <tr>
                <td className={`${cell} font-semibold`}>Lakota</td>
                <td className={cell}>Great Plains</td>
                <td className={cell}>Buffalo</td>
                <td className={cell}>Teepees</td>
                <td className={cell}>Nomadic lifestyle — followed the buffalo</td>
              </tr>
              <tr>
                <td className={`${cell} font-semibold`}>Pueblo</td>
                <td className={cell}>Southwest desert</td>
                <td className={cell}>Farmed corn, beans, squash</td>
                <td className={cell}>Adobe</td>
                <td className={cell}>Irrigation carried water to fields; few large animals to hunt</td>
              </tr>
              <tr>
                <td className={`${cell} font-semibold`}>Iroquois</td>
                <td className={cell}>Eastern Woodlands</td>
                <td className={cell}>Farmed, hunted, fished, gathered fruits</td>
                <td className={cell}>Longhouses</td>
                <td className={cell}>Five tribes joined together (later six)</td>
              </tr>
            </tbody>
          </table>
          <p className="p-3 pt-2 text-xs text-gray-700">⭐ From class: all animals are sacred.</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-sky-50 p-4">
          <h4 className="mb-2 text-lg font-bold">9. Why Explore? The 3 G’s</h4>
          <ul className="space-y-1 text-sm">
            <li><strong>God</strong> = spreading religion</li>
            <li><strong>Glory</strong> = power</li>
            <li><strong>Gold</strong> = make money</li>
          </ul>
        </div>
        <div className="rounded-lg bg-rose-50 p-4">
          <h4 className="mb-2 text-lg font-bold">10. Obstacles</h4>
          <p className="text-sm">Poor maps and navigation made journeys hard to plan. Fear of the unknown. Disease.</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-4">
          <h4 className="mb-2 text-lg font-bold">11. Benefits</h4>
          <p className="text-sm">Improved ships, new trade, new land.</p>
        </div>
      </section>

      <section>
        <h4 className="mb-2 text-xl font-bold text-amber-900">12. Explorers</h4>
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead className="bg-amber-700 text-white">
              <tr>
                <th className="p-3">Explorer</th>
                <th className="p-3">Sailed for</th>
                <th className="p-3">Explored</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              <tr>
                <td className={`${cell} font-semibold`}>John Cabot</td>
                <td className={cell}>England</td>
                <td className={cell}>Newfoundland (“new found land”) — eastern Canada</td>
              </tr>
              <tr>
                <td className={`${cell} font-semibold`}>Francisco Coronado</td>
                <td className={cell}>Spain</td>
                <td className={cell}>Mexico, Texas, Oklahoma, Kansas; saw the Grand Canyon; looked for the Seven Cities of Gold</td>
              </tr>
              <tr>
                <td className={`${cell} font-semibold`}>Robert La Salle</td>
                <td className={cell}>France</td>
                <td className={cell}>Mississippi River valley</td>
              </tr>
              <tr>
                <td className={`${cell} font-semibold`}>Samuel de Champlain</td>
                <td className={cell}>France</td>
                <td className={cell}>St. Lawrence River; founded Quebec</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-emerald-50 p-4">
          <h4 className="mb-2 text-lg font-bold">13. Cooperated</h4>
          <p className="text-sm">Trading, farming, and economic reasons.</p>
        </div>
        <div className="rounded-lg bg-rose-50 p-4">
          <h4 className="mb-2 text-lg font-bold">14. Conflicted</h4>
          <p className="text-sm">Land, trade, culture, diseases, and different languages.</p>
        </div>
        <div className="rounded-lg bg-sky-50 p-4">
          <h4 className="mb-2 text-lg font-bold">15. Columbian Exchange</h4>
          <p className="text-sm">
            A global exchange between the Eastern and Western Hemispheres: plants, animals and
            diseases.
          </p>
        </div>
      </section>

      <section>
        <h4 className="mb-2 text-xl font-bold text-amber-900">16–25. The English Colonies</h4>
        <p className="mb-3 text-sm">
          <strong>16. Why colonies?</strong> Religious reasons and economic reasons.
        </p>
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead className="bg-amber-700 text-white">
              <tr>
                <th className="p-3">Colony</th>
                <th className="p-3">What to know</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              <tr>
                <td className={`${cell} font-semibold`}>17. Roanoke</td>
                <td className={cell}>The Lost Colony — the colonists disappeared.</td>
              </tr>
              <tr>
                <td className={`${cell} font-semibold`}>18. Virginia Company of London</td>
                <td className={cell}>King James I gave it the right to start a colony.</td>
              </tr>
              <tr>
                <td className={`${cell} font-semibold`}>19–20. Jamestown</td>
                <td className={cell}>First <em>permanent</em> English settlement, 1607. Cash crop: tobacco.</td>
              </tr>
              <tr>
                <td className={`${cell} font-semibold`}>21. Georgia</td>
                <td className={cell}>Founded by James Oglethorpe for debtors (people who owe money).</td>
              </tr>
              <tr>
                <td className={`${cell} font-semibold`}>22. Massachusetts Bay</td>
                <td className={cell}>Founded to practice religious freedom. Puritans lived there.</td>
              </tr>
              <tr>
                <td className={`${cell} font-semibold`}>23–24. Plymouth</td>
                <td className={cell}>
                  Mostly Pilgrims (and Strangers), 1620, on the Mayflower. The Mayflower Compact was an
                  agreement to form a government.
                </td>
              </tr>
              <tr>
                <td className={`${cell} font-semibold`}>25. Pennsylvania</td>
                <td className={cell}>Founded by William Penn. Quakers lived there.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h4 className="mb-2 text-xl font-bold text-amber-900">26–31. Colonial Regions</h4>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-sky-50 p-4">
            <h5 className="font-bold">New England</h5>
            <p className="text-sm">Massachusetts, Rhode Island, Connecticut, New Hampshire, Maine</p>
            <p className="mt-2 text-sm">
              <strong>Economy:</strong> production &amp; industry — fishing, shipbuilding, lumber, trade
            </p>
          </div>
          <div className="rounded-lg bg-amber-50 p-4">
            <h5 className="font-bold">Mid-Atlantic (Middle)</h5>
            <p className="text-sm">New York, Pennsylvania, New Jersey, Delaware</p>
            <p className="mt-2 text-sm">
              <strong>Economy:</strong> grains and livestock — the “breadbasket”
            </p>
          </div>
          <div className="rounded-lg bg-rose-50 p-4">
            <h5 className="font-bold">Southern</h5>
            <p className="text-sm">Maryland, Virginia, North Carolina, South Carolina, Georgia</p>
            <p className="mt-2 text-sm">
              <strong>Economy:</strong> plantations — tobacco, rice, indigo
            </p>
          </div>
        </div>
      </section>
    </div>
  );

  // --- RENDER: ALL NOTES ---

  /* The full term-and-definition list. It lives behind its own tab on purpose:
   * having it under the note cards turns recall practice into reading. */
  const renderNotes = () => (
    <div className="space-y-6">
      <div className="rounded-r-lg border-l-4 border-amber-500 bg-amber-50 p-4">
        <p className="text-sm text-gray-800">
          📋 Every note card in one place, for reading over before a round or checking something
          you got stuck on. To <em>practice</em>, use the Note Cards tab — trying to remember
          first is what makes it stick.
        </p>
      </div>

      {DECKS.map((deck) => (
        <section key={deck.id}>
          <h3 className="mb-2 text-xl font-bold text-amber-800">
            <span aria-hidden="true">{deck.emoji}</span> {deck.label}
          </h3>
          <ul className="divide-y divide-amber-100 overflow-hidden rounded-xl bg-white shadow">
            {deck.cards.map((entry) => (
              <li key={entry.term} className="p-4 sm:flex sm:gap-4">
                <span className="block font-bold text-amber-900 sm:w-56 sm:shrink-0">{entry.term}</span>
                <span className="text-gray-700">{entry.definition}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );

  return (
    <div className="mx-auto min-h-screen max-w-5xl touch-manipulation bg-amber-50 p-4 font-sans sm:p-6">
      <div className="no-print mb-6 text-center">
        <h1 className="text-4xl font-bold text-amber-900">Social Studies Unit 1</h1>
        <h2 className="text-lg text-gray-600">Regions · First Americans · Explorers · Colonies</h2>
      </div>

      <div className="no-print mb-6 flex flex-wrap justify-center gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`min-h-[48px] rounded-xl px-4 py-2.5 font-semibold transition ${
              activeTab === tab.id
                ? 'bg-amber-900 text-white shadow-lg ring-2 ring-amber-950 ring-offset-2 ring-offset-amber-50'
                : 'bg-amber-700 text-white hover:bg-amber-800'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      <div className="rounded-lg bg-white/80 p-4 shadow-lg backdrop-blur-sm sm:p-6">
        {activeTab === 'cards' && <Flashcards decks={DECKS} storageKey={STORAGE_KEY} theme="amber" />}
        {activeTab === 'maps' && renderMaps()}
        {activeTab === 'match' && renderMatch()}
        {activeTab === 'quiz' && renderQuiz()}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'notes' && renderNotes()}
      </div>
    </div>
  );
}
