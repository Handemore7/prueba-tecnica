# Team Balancer CLI

This project is a CLI tool developed in Node.js and TypeScript to assign players to balanced teams at the start of a new season, using data from multiple Google Sheets.

## Context

Gyld works in seasons. At the start of each season, players are redistributed into new teams. The goal is for teams to be balanced in both size and engagement, and for the assignment to be deterministic (the same input produces the same output).

## Objective

Reassign players into T teams for a new season, ensuring teams are balanced and the result is fair and reasonable for the community.

## How to run the program

Follow these steps to use the tool—no technical knowledge required:

1. Make sure you have Node.js installed on your computer. If not, download it from https://nodejs.org/

2. Download or clone this repository to your computer.

3. Open a terminal or command prompt in the project folder.

4. Type the following command to install the necessary dependencies:
   ```sh
   npm install
   ```

5. Compile the project with this command:
   ```sh
   npx tsc
   ```

6. Run the program with the following command (you can change the values as needed):
   ```sh
   npm start seed=123 teamsqty=3 property=historical_points_earned
   ```
   or just (to generate with full random parameters)
   ```sh
   npm start
   ```
   - `seed`: Enter any number so the results are always the same if you repeat that number.
   - `teamsqty`: Enter how many teams you want to create.
   - `property`: Enter the name of the property you want to use to balance the teams (for example, `historical_points_earned`).

That's it! The program will display the generated teams and useful statistics to analyze the balance.


## Features

- Reads player data from multiple Google Sheets (see configuration in `src/customFunction.ts`)
- Merges player information using `player_id`
- Balances teams using a deterministic algorithm
- Shows detailed statistics (global and per team)
- Handles empty or missing data robustly

## Requirements

- Node.js
- Google service account credentials (see Google Sheets API documentation)

## Example output

```
=== TEAM BALANCER SUMMARY ===
Seed: 150273311
Property: historical_points_earned
Number of teams: 2
Total number of players: 200
Average team size: 100%
Average team score: 2,872 points
Sheets successfully read: 4

--- Historical points ---
Mean: 2,872, Median: 418, Min: 0, Max: 19,141, Stddev: 5,216
Top 5 points: [19141, 19091, 18912, 18675, 18340]
Bottom 5 points: [0, 0, 0, 0, 14]

--- Global Averages ---
Points: mean=2,872, median=418, min=0, max=19,141, stddev=5,216
Activity (30d): mean=14, min=0, max=30
Streaks: mean=7, min=0, max=29
Events: mean=12, min=0, max=29

--- Per-Team Comparison ---
Team 1: Players=100, Points avg=2,882, Activity avg=15, Streak avg=8, Events avg=12
Team 2: Players=100, Points avg=2,862, Activity avg=14, Streak avg=6, Events avg=12

--- TOP 2 MVPs (one per team, best in key stats) ---
Team 1 MVP: User 18 — Most Points Earned: 19,141
Team 2 MVP: User 25 — Most Points Earned: 19,091

... (more statistics)
```

# Time-Spent
## 02:30

# Notes
A team balancing algorithm was implemented using Google Sheets files as the database, with all player properties. The algorithm groups users into a chosen number of teams, preserving balance across key metrics to avoid possible user frustration with team assignments.

# Databases (Google sheets)
## Messages: 
- https://docs.google.com/spreadsheets/d/1STJbjsaIyxypxbZ41mk55W9KP6eh0qX8/edit?usp=sharing&ouid=106152636381112682726&rtpof=true&sd=true
## Messages: 
- https://docs.google.com/spreadsheets/d/1Joasxcrn2AoGZRLJKe7Ub1beSQUSUE885hS_y9sy9aU/edit?usp=sharing
## Spend: 
- https://docs.google.com/spreadsheets/d/1r8Hct_xwX6MbAw-trUpIZp0e5DgDEiCDfMlZtinpF90/edit?usp=sharing
## Events: 
- https://docs.google.com/spreadsheets/d/19LcNa3r46-y_d0q4hWgytBJTenPKEj-yODY_wARAz2A/edit?usp=sharing

# Google Service Account Credentials Setup

To use this project, you need a Google Cloud service account with access to the Google Sheets API. The `credentials.json` file must contain the credentials for this service account.

**How to set up your credentials:**

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (or select an existing one).
3. Enable the **Google Sheets API** for your project.
4. Go to **APIs & Services > Credentials**.
5. Click **Create Credentials > Service account**.
6. Follow the prompts to create a service account. Download the JSON key file.
7. Rename this file to `credentials.json` and place it in the root of this project (replace the placeholder file).
8. Share your Google Sheets documents with the service account email (found in the `client_email` field of your credentials file) so it can access them.

**Note:** Never commit your real `credentials.json` to version control. The file is in `.gitignore` by default.

## Maintenance & Updates

- Keep your dependencies up to date (`npm update`).
- Regularly review your Google Sheets for data consistency.
- If you change the structure of your sheets, update the code and documentation accordingly.

## Possible improvement features:
- A learning model that, based on user history, can continuously improve team balancing
- One key modeling choice was to use a deterministic "snake draft" algorithm for team assignment, combined with a configurable seed. This ensures that teams are as balanced as possible by the chosen property (e.g., points or engagement), and that the same input always produces the same output—making the process fair, reproducible, and transparent for the community.
- A graphical way to view the information, making it easier for users to trust the balancing system
- Some features were left out, such as modifying Google Sheets directly from here, a system to constantly watch for changes in Google Sheets and update information, and a testing system to measure the effectiveness of the team balancing

## Testing

For production or critical use, consider adding automated tests (e.g., with Jest) for the team balancing and validation logic.

-## Assumptions

The following assumptions are made in the team balancing and aggregation process:

- Each player is uniquely identified by `player_id` across all sheets.
- All Google Sheets have a header row and consistent property names.
- The property used for balancing (e.g., `historical_points_earned`) is numeric and present for all players.
- Missing or empty values are treated as `0` or `null` where appropriate.
- Only players present in the sheets and with a valid `player_id` are included in the balancing.
- The number of teams and the balancing property are provided by the user at runtime.
- The seed value ensures deterministic (repeatable) team assignment.
- No direct modification is made to the Google Sheets; all processing is read-only.
- The algorithm aims for balance by the chosen property, but does not guarantee perfect equality due to data distribution.

# Security

- Never commit or share your `credentials.json` file. Treat it as a secret.
- Restrict your Google service account to only the necessary Google Sheets.
- Do not share your seed or sensitive data in public outputs.
- If you use this tool in a shared environment, validate all input arguments to avoid command injection.

## Properties Reference

| Property                        | Description                                 |
|----------------------------------|---------------------------------------------|
| player_id                       | Unique user identifier                      |
| historical_points_earned        | Points earned by the user                   |
| historical_points_spent         | Points spent by the user                    |
| historical_events_participated  | Number of events participated               |
| historical_event_engagements    | Number of event engagements                 |
| historical_messages_sent        | Number of messages sent                     |
| days_active_last_30             | Days active in the last 30 days             |
| current_streak_value            | Current activity streak                     |

## Example Data Warnings

If the program detects missing or invalid data, it will show warnings like:

```
--- DATA WARNINGS ---
Sheet 1Joasxcrn2AoGZRLJKe7Ub1beSQUSUE885hS_y9sy9aU row 5: Missing value for 'player_id'.
Sheet 1r8Hct_xwX6MbAw-trUpIZp0e5DgDEiCDfMlZtinpF90 row 12: Invalid (non-numeric) value for 'historical_points_earned': 'abc'.
...and 3 more warnings.
```

## How to add new properties or sheets

- To add a new property, ensure it is present in all Google Sheets and update the `keyStats` array in `src/index.ts` if you want it to appear in MVPs or stats.
- To add a new sheet, add its `sheetId` and range to the `sheets` array in `src/customFunction.ts`.


## Troubleshooting

Here are some common issues and how to solve them:

- **'npx' or 'npm' command not found:**
   - Solution: Make sure Node.js is installed. Download it from https://nodejs.org/ and restart your terminal.

- **Error: Cannot read Google credentials file:**
   - Solution: Check that the `credentials.json` file is in the project root and that your service account has access to the Google Sheets.

- **Error: This operation is not supported for this document:**
   - Solution: Make sure the Google Sheets file is shared with your service account and that the sheet has data and headers in the first row.

- **No teams or players appear in the result:**
   - Solution: Check that your Google Sheets files have valid data and that the `player_id` property is present in all rows.

- **The program shows nothing or closes unexpectedly:**
   - Solution: Try running the command again and make sure you followed all installation and execution steps correctly.

If you have another problem, check the error messages in the terminal or consult the official Node.js and Google Sheets API documentation.