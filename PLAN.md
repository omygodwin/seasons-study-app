# School Basketball Tournament App - Implementation Plan

## Overview
Add a basketball tournament hub to the existing React/Vite/Tailwind app. The tournament feature will be accessible from the main App.jsx navigation alongside the existing study guides. All tournament data will be embedded in a centralized data file (no backend needed for GitHub Pages).

---

## Phase 1: Data Layer & Routing Setup

### 1.1 Create tournament data file (`src/data/tournamentData.js`)
Single source of truth containing:
- **Teams**: name, grade, gender (boys/girls), seed, roster (player names)
- **Brackets**: organized by division (3rd Boys, 3rd Girls, 4th Boys, 4th Girls, 5th Boys, 5th Girls)
  - Each bracket has rounds (Quarter-Final, Semi-Final, Final)
  - Each game: team1, team2, score1, score2, winner, gameId
- **Schedule**: all games with court, time slot order, round info, division
- **Courts**: court number, name, location description
- **Player lookup map**: player name → team name (for search)

All data extracted from the uploaded images:
- 6 divisions, 8 teams each = 48 teams total
- Full rosters for 5th grade boys (7 teams listed) and 5th grade girls (8 teams listed)
- Court assignments for rounds 1, semi-finals, and finals across 5 courts
- Seedings from bracket images

### 1.2 No router needed
Keep the existing state-based navigation pattern in App.jsx. Add "Basketball Tournament" as a new nav option that renders `<TournamentApp />`.

---

## Phase 2: Main Entry - Player Search Page (`src/tournament/TournamentApp.jsx`)

This is the tournament landing page.

**Layout:**
- Tournament title/banner at top
- **Search box** (prominent, centered): "Search for your child's name"
  - As user types, show filtered dropdown of matching player names
  - Each result shows: Player Name — Team Name (Grade Division)
  - On select: save to localStorage (`selectedPlayer` + `selectedTeam` + `selectedDivision`), navigate to that team's page
- **"Tournament Central" button** — large, styled button below search
- **"Admin" link** — small, subtle link at bottom for score entry

**State management:**
- Use localStorage to persist the selected child/team across sessions
- If a child was previously selected, show a "Welcome back! Viewing as [Child Name] — [Team]" banner with option to change

---

## Phase 3: Team Detail Page (`src/tournament/TeamPage.jsx`)

Shown when a player is selected from search.

**Sections:**
- **Team header**: Team name, division (e.g., "5th Grade Girls"), seed number
- **Roster**: List of all players on the team, highlight the selected child's name
- **Schedule**: Only this team's games (extracted from full schedule), showing:
  - Round, opponent, court + location, time slot
  - Game result if scores entered (W/L with score)
- **Bracket preview**: Mini bracket for this team's division, with this team highlighted
- **"View Full Tournament Central" button**

---

## Phase 4: Tournament Central (`src/tournament/TournamentCentral.jsx`)

Main hub with 3 tabs: **Brackets | Schedule | Teams**

### 4.1 Brackets Tab (`src/tournament/BracketsView.jsx`)
- **Sub-tabs/filters**: 3rd Boys | 3rd Girls | 4th Boys | 4th Girls | 5th Boys | 5th Girls
- If child was selected, default to that child's division bracket; otherwise default to first division
- **Bracket display**: Standard tournament bracket visualization
  - Show matchups with team names and seeds
  - If game has a result: show scores, highlight/bold the winner, visually advance winner to next round
  - Gray out/fade eliminated teams
- Build bracket component that handles 8-team single elimination (4 QF → 2 SF → 1 Final)

### 4.2 Schedule Tab (`src/tournament/ScheduleView.jsx`)
- If child is selected, show **"[Child Name]'s Schedule"** section at top with just their team's games
- Below that: **Full Tournament Schedule**
  - Organized by time slot/round
  - Each game row: Court, Team 1 vs Team 2, Division, Result (if played)
  - **Filter dropdown**: filter by team name
- **Court Key** at bottom:
  - Court 1: Indoor hoop near the gym lobby
  - Court 2: Indoor hoop near the Stage
  - Court 3: Black Top Court next to the Turf Field
  - Court 4: Black Top Court near to the fence line
  - Court 5: Portable Hoop on the Turf Field

### 4.3 Teams Tab (`src/tournament/TeamsView.jsx`)
- List all teams grouped by division
- Each team card: team name, seed, roster
- If child was selected, auto-scroll to and highlight their team
- Expandable/collapsible team cards (default: selected team expanded, others collapsed)

---

## Phase 5: Admin Panel (`src/tournament/AdminPanel.jsx`)

Simple score entry for tournament volunteers.

- **PIN protection**: basic PIN entry (stored in data file, e.g., "1234") to prevent accidental edits
- **Game selector**: dropdown or list of all games
- **Score entry form**: Team 1 score, Team 2 score, Submit
- **State**: scores stored in localStorage (since no backend)
  - On submit, update localStorage with game results
  - All other components read from localStorage for live results
- Show game status: Upcoming / In Progress / Final
- **Auto-advance**: when a game result is entered, automatically populate the next round's bracket matchup

---

## Phase 6: Component Architecture

```
src/
├── tournament/
│   ├── TournamentApp.jsx        # Landing page with search
│   ├── TeamPage.jsx             # Individual team view
│   ├── TournamentCentral.jsx    # Hub with tab navigation
│   ├── BracketsView.jsx         # Bracket tab content
│   ├── BracketDisplay.jsx       # Single bracket renderer (8-team)
│   ├── ScheduleView.jsx         # Schedule tab content
│   ├── TeamsView.jsx            # Teams tab content
│   ├── AdminPanel.jsx           # Score entry admin
│   └── components/
│       ├── PlayerSearch.jsx     # Search input with autocomplete
│       ├── GameCard.jsx         # Single game display (teams, score, court)
│       ├── CourtKey.jsx         # Court locations reference
│       └── ChildBanner.jsx     # "Viewing as [child]" persistent banner
├── data/
│   └── tournamentData.js        # All tournament data
```

---

## Phase 7: Navigation Flow

```
App.jsx nav → "Basketball Tournament" button
    ↓
TournamentApp.jsx (Landing)
    ├── Search child → TeamPage.jsx → "Tournament Central" button → TournamentCentral.jsx
    ├── "Tournament Central" button → TournamentCentral.jsx (Brackets | Schedule | Teams)
    └── "Admin" link → AdminPanel.jsx
```

All navigation via React state (consistent with existing app pattern). Top-level tournament state managed in TournamentApp.jsx and passed down.

---

## Phase 8: Styling & UX

- Match existing app's Tailwind patterns
- Color scheme: basketball-themed (orange accents, dark backgrounds for brackets)
- Mobile-first responsive design (parents will use phones at the tournament)
- Bracket lines drawn with CSS borders/connectors (no canvas/SVG needed for 8-team brackets)
- Smooth transitions between views
- Selected child's team highlighted with a distinct color throughout all views

---

## Implementation Order

1. **Data file** — transcribe all tournament data from images
2. **TournamentApp.jsx** — landing page with search + navigation
3. **PlayerSearch component** — autocomplete search
4. **App.jsx update** — add tournament to main nav
5. **TournamentCentral.jsx** — tab container
6. **BracketsView + BracketDisplay** — bracket rendering with game results
7. **ScheduleView** — full schedule with filtering and court key
8. **TeamsView** — team roster cards
9. **TeamPage.jsx** — individual team detail page
10. **AdminPanel** — score entry with localStorage persistence
11. **Polish** — responsive design, transitions, edge cases

---

## Key Technical Decisions

- **No new dependencies**: pure React + Tailwind, no router or state library needed
- **localStorage for scores**: allows admin to enter results that persist and display across all views without a backend
- **localStorage for child selection**: persists across sessions so parents don't re-search every time
- **Embedded data**: all team/bracket/schedule data in JS file for GitHub Pages compatibility
- **8-team bracket component**: reusable across all 6 divisions
