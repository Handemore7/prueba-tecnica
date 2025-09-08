

import { google } from 'googleapis';
import * as fs from 'fs';

// Deterministic pseudo-random generator (mulberry32)
function mulberry32(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export interface User {
  [key: string]: string | number | null;
}

export interface SheetSource {
  sheetId: string;
  range: string;
}

export interface CustomOptions {
  seed?: number;
  teamsqty?: number;
  propiedad?: string;
  sheets?: SheetSource[];
}


// sheetId: Google Sheets document ID (from the URL)
// range: range to read, e.g. 'Sheet1!A1:A100'
// By default, assumes the sheet has headers in the first row and data starts in the second
export async function customFunction(options: CustomOptions = {}) {
  const {
    seed,
    teamsqty = 2,
    propiedad = 'historical_points_earned',
    sheets = [
      { sheetId: '1Joasxcrn2AoGZRLJKe7Ub1beSQUSUE885hS_y9sy9aU', range: 'Sheet1!A2:Z' },
      { sheetId: '1r8Hct_xwX6MbAw-trUpIZp0e5DgDEiCDfMlZtinpF90', range: 'Sheet1!A2:Z' },
      { sheetId: '19LcNa3r46-y_d0q4hWgytBJTenPKEj-yODY_wARAz2A', range: 'Sheet1!A2:Z' },
      { sheetId: '14ecaqMY5Rq-fVn1eebS6Yq5GUyjfXDuUm-kn-tt4XpM', range: 'Sheet1!A2:Z' }
    ]
  } = options;
  // Google authentication
  const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheetsApi = google.sheets({ version: 'v4', auth });

  // Read and merge users from all sheets by player_id
  const userMap: { [playerId: string]: User } = {};
  let sheetsRead = 0;
  for (const src of sheets) {
    try {
      // Get the real name of the first sheet
      const meta = await sheetsApi.spreadsheets.get({ spreadsheetId: src.sheetId });
      const sheetName = meta.data.sheets?.[0]?.properties?.title;
      if (!sheetName) throw new Error('Could not get sheet name');
      // Read the whole range including header
      const res = await sheetsApi.spreadsheets.values.get({ spreadsheetId: src.sheetId, range: `${sheetName}!A1:Z` });
      const allRows = res.data.values || [];
      if (allRows.length < 2) continue; // Must have at least header and one data row
      const headers = allRows[0];
      const rows = allRows.slice(1);
      sheetsRead++;
      if (headers) {
        rows.forEach(row => {
          const user: User = {};
          headers.forEach((h, i) => {
            let val = row[i];
            // If cell is empty or undefined, assign null
            if (val === undefined || val === '') {
              user[h] = null;
            } else if (!isNaN(Number(val))) {
              // If it's a valid number, convert
              user[h] = Number(val);
            } else {
              user[h] = val;
            }
          });
          const playerId = user['player_id'];
          if (playerId !== undefined && playerId !== '') {
            const key = String(playerId);
            userMap[key] = { ...userMap[key], ...user };
          }
        });
      }
    } catch (err) {
      const msg = (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err);
      console.error(`Error reading sheetId=${src.sheetId}:`, msg);
      continue;
    }
  }
  const users: User[] = Object.values(userMap);

  // Deterministic shuffle
  const usedSeed = seed !== undefined ? seed : Math.floor(Math.random() * 1e9);
  const rand = mulberry32(usedSeed);
  const shuffled: User[] = users.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const temp = shuffled[i] as User;
    shuffled[i] = shuffled[j] as User;
    shuffled[j] = temp;
  }

  // Snake draft algorithm with strict team size control
  // 1. Sort by property (descending)
  const sorted = [...users].sort((a, b) => {
    const aVal = typeof a[propiedad] === 'number' ? (a[propiedad] as number) : 0;
    const bVal = typeof b[propiedad] === 'number' ? (b[propiedad] as number) : 0;
    return bVal - aVal;
  });
  // 2. Calculate ideal number of players per team
  const totalPlayers = sorted.length;
  const basePlayers = Math.floor(totalPlayers / teamsqty);
  const extra = totalPlayers % teamsqty;
  // 3. Assign each team its max slots
  const teamLimits = Array.from({ length: teamsqty }, (_, i) => basePlayers + (i < extra ? 1 : 0));
  const groups: User[][] = Array.from({ length: teamsqty }, () => []);
  let direction = 1;
  let idx = 0;
  for (const user of sorted) {
    // Buscar el siguiente equipo con cupo disponible
  while ((groups[idx]?.length ?? 0) >= (teamLimits[idx] ?? 0)) {
      if (direction === 1) {
        idx++;
        if (idx === teamsqty) {
          direction = -1;
          idx = teamsqty - 1;
        }
      } else {
        idx--;
        if (idx < 0) {
          direction = 1;
          idx = 0;
        }
      }
    }
    groups[idx]!.push(user);
    if (direction === 1) {
      idx++;
      if (idx === teamsqty) {
        direction = -1;
        idx = teamsqty - 1;
      }
    } else {
      idx--;
      if (idx < 0) {
        direction = 1;
        idx = 0;
      }
    }
  }

  // Build result: list of players with assigned team
  const result: { player_id: string | number; team: number }[] = [];
  groups.forEach((group, idx) => {
    group.forEach(user => {
      result.push({
        player_id: user['player_id'] ?? '',
        team: idx + 1
      });
    });
  });

  // General statistics
  // Calculate total sum of the property
  const totalProp = result.reduce((acc, user) => {
    const found = users.find(u => u['player_id'] === user.player_id);
    return acc + (found && typeof found[propiedad] === 'number' ? (found[propiedad] as number) : 0);
  }, 0);

  // List of unique properties (excluding player_id)
  const allProps = new Set<string>();
  users.forEach(u => Object.keys(u).forEach(k => allProps.add(k)));
  allProps.delete('player_id');

  // Statistics utilities
  function mean(arr: number[]) {
    return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  }
  function median(arr: number[]) {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 !== 0) {
      return sorted[mid] ?? 0;
    } else {
      return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
    }
  }
  function stddev(arr: number[]) {
    const m = mean(arr);
    return Math.sqrt(mean(arr.map(x => Math.pow(x - m, 2))));
  }
  function min(arr: number[]) {
    return arr.length ? Math.min(...arr) : 0;
  }
  function max(arr: number[]) {
    return arr.length ? Math.max(...arr) : 0;
  }

  // Global statistics
  const pointsArr = users.map(u => typeof u['historical_points_earned'] === 'number' ? u['historical_points_earned'] as number : 0);
  const activesArr = users.map(u => typeof u['days_active_last_30'] === 'number' ? u['days_active_last_30'] as number : 0);
  const streakArr = users.map(u => typeof u['current_streak_value'] === 'number' ? u['current_streak_value'] as number : 0);
  const eventsArr = users.map(u => typeof u['historical_events_participated'] === 'number' ? u['historical_events_participated'] as number : 0);
  const engagementArr = users.map(u => typeof u['historical_event_engagements'] === 'number' ? u['historical_event_engagements'] as number : 0);
  const spentArr = users.map(u => typeof u['historical_points_spent'] === 'number' ? u['historical_points_spent'] as number : 0);
  const messagesArr = users.map(u => typeof u['historical_messages_sent'] === 'number' ? u['historical_messages_sent'] as number : 0);
  const lastActiveArr = users.map(u => typeof u['last_active_ts'] === 'number' ? u['last_active_ts'] as number : 0);

  // Outliers
  function topN(arr: number[], n = 5) {
    return [...arr].sort((a, b) => b - a).slice(0, n);
  }
  function bottomN(arr: number[], n = 5) {
    return [...arr].sort((a, b) => a - b).slice(0, n);
  }

  // Per team
  const teamStats = groups.map((group, idx) => {
    const points = group.map(u => typeof u['historical_points_earned'] === 'number' ? u['historical_points_earned'] as number : 0);
    const actives = group.map(u => typeof u['days_active_last_30'] === 'number' ? u['days_active_last_30'] as number : 0);
    const streaks = group.map(u => typeof u['current_streak_value'] === 'number' ? u['current_streak_value'] as number : 0);
    const events = group.map(u => typeof u['historical_events_participated'] === 'number' ? u['historical_events_participated'] as number : 0);
    const engagement = group.map(u => typeof u['historical_event_engagements'] === 'number' ? u['historical_event_engagements'] as number : 0);
    return {
      team: idx + 1,
      players: group.length,
      points: {
        sum: Math.round(points.reduce((a, b) => a + b, 0)),
        mean: Math.round(mean(points)),
        median: Math.round(median(points)),
        min: min(points),
        max: max(points),
        stddev: Math.round(stddev(points)),
      },
      actives: {
        mean: Math.round(mean(actives)),
        min: min(actives),
        max: max(actives),
      },
      streaks: {
        mean: Math.round(mean(streaks)),
        min: min(streaks),
        max: max(streaks),
      },
      events: {
        mean: Math.round(mean(events)),
        min: min(events),
        max: max(events),
      },
      engagement: {
        mean: Math.round(mean(engagement)),
        min: min(engagement),
        max: max(engagement),
      },
    };
  });

  const stats = {
    total_teams: groups.length,
    total_players: result.length,
    average_team_size: groups.length > 0 ? Math.round(result.length / groups.length) : 0,
    average_team_score: result.length > 0 ? Math.round(totalProp / result.length) : 0,
    sheets_read: sheetsRead,
    // Global
    points: {
      mean: Math.round(mean(pointsArr)),
      median: Math.round(median(pointsArr)),
      min: min(pointsArr),
      max: max(pointsArr),
      stddev: Math.round(stddev(pointsArr)),
      top5: topN(pointsArr),
      bottom5: bottomN(pointsArr)
    },
    actives: {
      mean: Math.round(mean(activesArr)),
      min: min(activesArr),
      max: max(activesArr),
    },
    streaks: {
      mean: Math.round(mean(streakArr)),
      min: min(streakArr),
      max: max(streakArr),
    },
    events: {
      mean: Math.round(mean(eventsArr)),
      min: min(eventsArr),
      max: max(eventsArr),
    },
    engagement: {
      mean: Math.round(mean(engagementArr)),
      min: min(engagementArr),
      max: max(engagementArr),
    },
    spent: {
      mean: Math.round(mean(spentArr)),
      min: min(spentArr),
      max: max(spentArr),
    },
    messages: {
      mean: Math.round(mean(messagesArr)),
      min: min(messagesArr),
      max: max(messagesArr),
    },
    last_active: {
      mean: Math.round(mean(lastActiveArr)),
      min: min(lastActiveArr),
      max: max(lastActiveArr),
    },
    team_stats: teamStats,
    // Outliers
    top5_points: topN(pointsArr),
    bottom5_points: bottomN(pointsArr),
    // Add more outliers if needed
  };

  // Devolver equipos en formato agrupado por equipo para mejor legibilidad
  const teamsByGroup = groups.map((group, idx) => ({
    team: idx + 1,
    players: group.map(user => user['player_id'])
  }));

  return { teams: result, teamsByGroup, usedSeed, stats };
}
