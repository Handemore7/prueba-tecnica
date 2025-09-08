
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
... (more statistics)
```



## Notes
A team balancing algorithm was implemented using Google Sheets files as the database, with all player properties. The algorithm groups users into a chosen number of teams, preserving balance across key metrics to avoid possible user frustration with team assignments.

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

## Possible improvement features:
- A learning model that, based on user history, can continuously improve team balancing
- One key modeling choice was to use a deterministic "snake draft" algorithm for team assignment, combined with a configurable seed. This ensures that teams are as balanced as possible by the chosen property (e.g., points or engagement), and that the same input always produces the same output—making the process fair, reproducible, and transparent for the community.
- A graphical way to view the information, making it easier for users to trust the balancing system
- Some features were left out, such as modifying Google Sheets directly from here, a system to constantly watch for changes in Google Sheets and update information, and a testing system to measure the effectiveness of the team balancing

## Time-Spent
# 02:30
