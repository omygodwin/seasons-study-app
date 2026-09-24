/* Map features shared by the Maps & Rivers topic and Rose's Social Studies
 * Unit 1, which reuses the same rivers and world maps.
 *
 * Colors match the crayon key on Rose's own worksheets so the app and the
 * paper study guide look like the same thing.
 */
export const RIVERS = [
  {
    id: 'missouri',
    name: 'Missouri',
    color: '#dc2626',
    fact: 'The LONGEST river in North America.',
  },
  {
    id: 'mississippi',
    name: 'Mississippi',
    color: '#38bdf8',
    fact: 'The most famous river — and the largest watershed.',
  },
  {
    id: 'ohio',
    name: 'Ohio',
    color: '#a16207',
    fact: 'The Gateway to the West.',
  },
  {
    id: 'stlawrence',
    name: 'St. Lawrence',
    color: '#1d4ed8',
    fact: 'Connects the Great Lakes with the Atlantic Ocean.',
  },
  {
    id: 'columbia',
    name: 'Columbia',
    color: '#f97316',
    fact: 'Flows across the Northwest into the Pacific Ocean.',
  },
  {
    id: 'colorado',
    name: 'Colorado',
    color: '#16a34a',
    fact: 'The river that carved the Grand Canyon.',
  },
  {
    id: 'riogrande',
    name: 'Rio Grande',
    color: '#ec4899',
    fact: 'Forms the border between Texas and Mexico.',
  },
];

/* All 11 swatches on this tab have to be told apart at a glance, so each one
 * owns a distinct hue. Rose's worksheet key colored North America, Australia
 * and Antarctica in three shades of blue, which read as the same color on a
 * phone — only the continents keep a color close to her crayons. */
export const CONTINENTS = [
  { id: 'northamerica', name: 'North America', color: '#2563eb', fact: 'The continent we live on.' },
  { id: 'southamerica', name: 'South America', color: '#16a34a', fact: 'Home of the Amazon rainforest.' },
  { id: 'europe', name: 'Europe', color: '#92400e', fact: 'Joined to Asia — together they are Eurasia.' },
  { id: 'asia', name: 'Asia', color: '#dc2626', fact: 'The largest continent.' },
  { id: 'africa', name: 'Africa', color: '#ec4899', fact: 'Home of the Nile, the longest river on Earth.' },
  { id: 'australia', name: 'Australia', color: '#f59e0b', fact: 'The smallest continent.' },
  { id: 'antarctica', name: 'Antarctica', color: '#94a3b8', fact: 'The frozen continent at the South Pole.' },
];

export const OCEANS = [
  { id: 'pacific', name: 'Pacific', color: '#1e3a8a', fact: 'The biggest ocean — west of the United States.' },
  { id: 'atlantic', name: 'Atlantic', color: '#0d9488', fact: 'Between the Americas and Europe/Africa.' },
  { id: 'indian', name: 'Indian', color: '#7c3aed', fact: 'South of Asia, east of Africa.' },
  { id: 'arctic', name: 'Arctic', color: '#22d3ee', fact: 'The frozen ocean at the North Pole.' },
];
