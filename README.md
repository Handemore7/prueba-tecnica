
# Team Balancer CLI

This project is a Node.js + TypeScript CLI tool to assign players into balanced teams for a new season, using data from multiple Google Sheets.

## Context

Gyld runs on seasons. At the start of each season, players are sorted into new teams. Teams should be balanced in size and engagement, and the assignment should be deterministic (same input → same output).

## Goal

Reassign players into T teams for a new season so teams are balanced and the outcome feels fair and reasonable to the community.

## Usage

1. Build the project:
   ```sh
   npx tsc
   ```
2. Run the CLI:
   ```sh
   npm start seed=123 teamsqty=3 property=historical_points_earned
   ```
   - `seed`: Any number for reproducible results
   - `teamsqty`: Number of teams
   - `propiedad`: Property to use for balancing (e.g. `historical_points_earned`)

## Features

- Reads player data from multiple Google Sheets (see `src/customFunction.ts` for configuration)
- Merges player info by `player_id`
- Balances teams using a deterministic algorithm
- Outputs detailed statistics (global and per team)
- Handles missing or empty data gracefully

## Requirements

- Node.js
- Google service account credentials (see Google Sheets API docs)

## Example Output

```
Generated teams (readable format):

Key statistics:
Number of teams: 3
Total number of players: 200
Average team size: 67%
Average team score: 2,872 points
Sheets successfully read: 4
--- Historical points ---
Mean: 2,800, Median: 2,850, Min: 1,000, Max: 4,000, Stddev: 500
Top 5 points: [4000, 3900, 3800, 3700, 3600]
Bottom 5 points: [1000, 1100, 1200, 1300, 1400]
... (more stats)
```
