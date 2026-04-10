# WC2026 Simulator

A full stack FIFA World Cup 2026 simulator built from scratch as a study project, featuring a realistic match simulation engine, complete squad data for all 48 nations, and a REST API serving a vanilla JS frontend.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express |
| Database | MySQL |
| Dev Tools | MySQL Workbench, Git |

---

## Project Structure

```
wc2026-simulator/
├── backend/
│   ├── seed/
│   │   ├── selections.json   # 48 nations × 26 players
│   │   ├── validate.js       # validates squad size and starters
│   │   └── seed.js           # populates the database
│   └── src/
│       ├── config/           # database connection
│       ├── controllers/      # route logic
│       ├── models/           # SQL queries
│       └── routes/           # API endpoints
└── frontend/
    ├── index.html
    ├── css/
    └── js/
```

---

## Tournament Format

- **48 teams** across 12 groups (A–L), 4 teams each
- **Group stage**: every team plays 3 matches
- **Qualification**: top 2 from each group + 8 best third-placed teams = 32 teams
- **Knockout rounds**: Round of 16 → Quarter-finals → Semi-finals → 3rd place → Final

---

## Database Schema

### Tables

**groups**
Stores the 12 tournament groups (A through L).

**selections**
Stores all 48 national teams with their FIFA ranking and tactical formation.

**players**
Stores 26 players per team with position (GK, DEF, MID, FWD), rating, age, and starter status.

**matches**
Stores all tournament matches across all stages (group, r16, qf, sf, 3rd, final), including scores and expected goals (xG) for each side.

**group_standings**
Tracks points, wins, draws, losses, goals for/against and goal difference per team per group, linked to each match that generated the update.

**player_match_stats**
Stores individual player performance per match: goals, assists, and match rating.

**knockouts**
Stores the winner of each knockout match, linked to the match record.

### Entity Relationships

```
groups ──< selections ──< players
  │              │
  └──< matches >─┘
         │
         ├──< group_standings
         ├──< player_match_stats >── players
         └──< knockouts
```

### Full SQL

```sql
CREATE DATABASE wc2026;
USE wc2026;

CREATE TABLE groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name CHAR(1) NOT NULL
);

CREATE TABLE selections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    ranking INT NOT NULL,
    formation VARCHAR(10) NOT NULL,
    FOREIGN KEY (group_id) REFERENCES groups(id)
);

CREATE TABLE players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    selection_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    position ENUM('GK', 'DEF', 'MID', 'FWD') NOT NULL,
    rating INT NOT NULL,
    is_starter BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (selection_id) REFERENCES selections(id)
);

CREATE TABLE matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NULL,
    home_id INT NOT NULL,
    away_id INT NOT NULL,
    stage ENUM('group', 'r16', 'qf', 'sf', '3rd', 'final') NOT NULL,
    home_score INT DEFAULT 0,
    away_score INT DEFAULT 0,
    home_xg FLOAT DEFAULT 0,
    away_xg FLOAT DEFAULT 0,
    FOREIGN KEY (group_id) REFERENCES groups(id),
    FOREIGN KEY (home_id) REFERENCES selections(id),
    FOREIGN KEY (away_id) REFERENCES selections(id)
);

CREATE TABLE group_standings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    selection_id INT NOT NULL,
    matches_id INT NOT NULL,
    points INT DEFAULT 0,
    wins INT DEFAULT 0,
    draws INT DEFAULT 0,
    losses INT DEFAULT 0,
    goals_for INT DEFAULT 0,
    goals_against INT DEFAULT 0,
    goal_difference INT DEFAULT 0,
    FOREIGN KEY (group_id) REFERENCES groups(id),
    FOREIGN KEY (selection_id) REFERENCES selections(id),
    FOREIGN KEY (matches_id) REFERENCES matches(id)
);

CREATE TABLE player_match_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player_id INT NOT NULL,
    match_id INT NOT NULL,
    goals INT DEFAULT 0,
    assists INT DEFAULT 0,
    rating FLOAT DEFAULT 0,
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (match_id) REFERENCES matches(id)
);

CREATE TABLE knockouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL,
    winner_id INT NOT NULL,
    FOREIGN KEY (match_id) REFERENCES matches(id),
    FOREIGN KEY (winner_id) REFERENCES selections(id)
);
```

---

## Simulation Engine

### Team Strength Calculation

Each team's strength is calculated from two sources:

```
strength = (avg_starter_rating × 0.7) + (ranking_points × 0.3)
```

Where `ranking_points` maps FIFA ranking position to a 0–90 scale (1st place = 90, 2nd = 89, etc.).

### Win Probability

```
prob_A = strength_A / (strength_A + strength_B)
prob_B = strength_B / (strength_A + strength_B)
```

A random number between 0 and 1 is generated. If it falls below `prob_A`, team A wins.

### Goal Simulation (xG + Poisson)

Goals are modeled using Expected Goals (xG) derived from attack vs defense ratings:

```
attack  = avg_rating(FWD + MID starters)
defense = avg_rating(DEF + GK starters)

potential = (attack_A - defense_B) / 100
xG_A = 1.5 + (potential × 1.2)
```

Goals are then sampled from a Poisson distribution:

```js
function poisson(lambda) {
  let L = Math.exp(-lambda), k = 0, p = 1;
  do { k++; p *= Math.random(); } while (p > L);
  return k - 1;
}

const goalsA = poisson(xG_A);
const goalsB = poisson(xG_B);
```

### Goalscorer & Assist Attribution

Each goal is attributed to a player using weighted probability by position and rating:

```js
const weights = { FWD: 0.6, MID: 0.3, DEF: 0.08, GK: 0.02 }
const prob = weights[player.position] * (player.rating / 100)
```

Assists follow the same logic with different weights (MID higher than FWD).

### Player Match Rating

```
base = 6.0
+ goal scored       → +1.5
+ assist            → +1.0
+ team won          → +0.5
+ clean sheet (DEF/GK) → +0.8
- team lost         → -0.5
- goal conceded (GK) → -0.8
```

Final rating clamped between 1.0 and 10.0.

---

## Seed Data

All 48 squads are stored in `selections.json` with real player names, ages, positions, ratings, and starter status. Validation is run before seeding:

```bash
node seed/validate.js  # checks 26 players and 11 starters per team
node seed/seed.js      # populates the database
```

---

## Frontend

- Black background with centered World Cup 2026 logo
- Single "Simulações" button leading to the simulation interface
- PT/EN language toggle using vanilla JS
- No external frameworks or libraries

---

## Author

Lucas Nicolau — Software Engineering student at UFAM (5th semester)  
Intern at RedMaxx | Pursuing internship at SIDIA (Samsung R&D)