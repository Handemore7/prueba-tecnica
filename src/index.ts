import { customFunction } from './customFunction';

function parseArgs(args: string[]) {
  const options: any = {};
  args.forEach(arg => {
    const [key, value] = arg.split('=');
    if (key && value !== undefined) {
      if (!isNaN(Number(value))) {
        options[key] = Number(value);
      } else {
        options[key] = value;
      }
    }
  });
  return options;
}

async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);
  try {
    const { teams, teamsByGroup, usedSeed, stats } = await customFunction(options);
    const nf = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 0 });
    // --- Output in requested format ---
    console.log('=== TEAM BALANCER SUMMARY ===');
    console.log(`Number of teams: ${nf(stats.total_teams)}`);
    console.log(`Total number of players: ${nf(stats.total_players)}`);
    console.log(`Average team size: ${nf(stats.average_team_size)}%`);
    console.log(`Average team score: ${nf(stats.average_team_score)} points`);
    console.log(`Sheets successfully read: ${stats.sheets_read}`);
    console.log('--- Historical points ---');
    console.log(`Mean: ${nf(stats.points.mean)}, Median: ${nf(stats.points.median)}, Min: ${nf(stats.points.min)}, Max: ${nf(stats.points.max)}, Stddev: ${nf(stats.points.stddev)}`);
    console.log(`Top 5 points: [${stats.points.top5.join(', ')}]`);
    console.log(`Bottom 5 points: [${stats.points.bottom5.join(', ')}]`);
    // Add global averages for other metrics
    console.log('--- Global Averages ---');
    console.log(`Points: mean=${nf(stats.points.mean)}, median=${nf(stats.points.median)}, min=${nf(stats.points.min)}, max=${nf(stats.points.max)}, stddev=${nf(stats.points.stddev)}`);
    console.log(`Activity (30d): mean=${nf(stats.actives.mean)}, min=${nf(stats.actives.min)}, max=${nf(stats.actives.max)}`);
    console.log(`Streaks: mean=${nf(stats.streaks.mean)}, min=${nf(stats.streaks.min)}, max=${nf(stats.streaks.max)}`);
    console.log(`Events: mean=${nf(stats.events.mean)}, min=${nf(stats.events.min)}, max=${nf(stats.events.max)}`);
    // Add per-team comparison
    console.log('--- Per-Team Comparison ---');
    stats.team_stats.forEach((team: any) => {
      console.log(`Team ${team.team}: Players=${nf(team.players)}, Points avg=${nf(team.points.mean)}, Activity avg=${nf(team.actives.mean)}, Streak avg=${nf(team.streaks.mean)}, Events avg=${nf(team.events.mean)}`);
    });
    // --- Insights Section ---
    console.log('--- Insights ---');
    // 1. Team Activity Parity
    if (stats.team_stats && stats.team_stats.length > 0) {
      const activityMeans = stats.team_stats.map((t: any) => t.actives.mean);
      const minActivity = Math.min(...activityMeans);
      const maxActivity = Math.max(...activityMeans);
      const activityDiff = maxActivity - minActivity;
      console.log(`Team activity parity: All teams have average days active in last 30 days between ${nf(minActivity)} and ${nf(maxActivity)} (diff: ${nf(activityDiff)}).`);

      // 2. Message Volume Balance
      const messageMeans = stats.team_stats.map((t: any) => t.messages && t.messages.mean ? t.messages.mean : 0);
      if (messageMeans.some(m => m > 0)) {
        const minMsg = Math.min(...messageMeans);
        const maxMsg = Math.max(...messageMeans);
        const msgDiff = maxMsg - minMsg;
        console.log(`Message volume balance: Team averages range from ${nf(minMsg)} to ${nf(maxMsg)} messages sent (diff: ${nf(msgDiff)}).`);
      }

      // 4. Event Participation Spread
      const eventMeans = stats.team_stats.map((t: any) => t.events.mean);
      const minEvent = Math.min(...eventMeans);
      const maxEvent = Math.max(...eventMeans);
      const eventDiff = maxEvent - minEvent;
      console.log(`Event participation spread: Team averages range from ${nf(minEvent)} to ${nf(maxEvent)} unique events joined (diff: ${nf(eventDiff)}).`);

      // 5. Engagement Kind Diversity (if available)
      // This requires user data, so we check if 'engagement_kind' exists
      // Use the original user data for engagement_kind
      if (teams && teamsByGroup && teamsByGroup.length > 0 && typeof options === 'object') {
        // Try to get the original user data from customFunction if available
        let users: any[] = [];
        if ('_users' in options && Array.isArray((options as any)._users)) {
          users = (options as any)._users;
  }
  // fallback: try to get from teams if possible (if teams have more fields)
  if (!users.length && teams.length && teams[0] && Object.keys(teams[0]).length > 2) users = teams;
        stats.team_stats.forEach((team: any, idx: number) => {
          const group = teamsByGroup[idx];
          if (!group) return;
          const engagementKinds: Record<string, number> = {};
          for (const pid of group.players) {
            // Find the full user object (not just the assignment)
            const user = users.find((t: any) => t.player_id === pid);
            if (user && typeof user.engagement_kind === 'string') {
              engagementKinds[user.engagement_kind] = (engagementKinds[user.engagement_kind] || 0) + 1;
            }
          }
          const kindCount = Object.keys(engagementKinds).length;
          if (kindCount > 0) {
            console.log(`Team ${team.team} has ${kindCount} unique engagement kinds.`);
          }
        });
      }

      // 10. Variance/Standard Deviation of Key Metrics
      function stddev(arr: number[]) {
        const m = arr.reduce((a, b) => a + b, 0) / arr.length;
        return Math.sqrt(arr.map(x => Math.pow(x - m, 2)).reduce((a, b) => a + b, 0) / arr.length);
      }
      const pointsStd = stddev(stats.team_stats.map((t: any) => t.points.mean));
      const activityStd = stddev(activityMeans);
      const eventStd = stddev(eventMeans);
      console.log(`Standard deviation between teams: points=${nf(pointsStd)}, activity=${nf(activityStd)}, events=${nf(eventStd)}.`);
    // --- MVP Users Section ---
    console.log('--- MVP Users (Top 3) ---');
    if (teams && teams.length > 0) {
      // Score: sum of normalized (0-1) for points, activity, streak, events
      function normalize(arr: number[]) {
        const min = Math.min(...arr);
        const max = Math.max(...arr);
        return arr.map(v => max > min ? (v - min) / (max - min) : 0);
      }
      const pointsArr = teams.map((u: any) => typeof u.historical_points_earned === 'number' ? u.historical_points_earned : 0);
      const activityArr = teams.map((u: any) => typeof u.days_active_last_30 === 'number' ? u.days_active_last_30 : 0);
      const streakArr = teams.map((u: any) => typeof u.current_streak_value === 'number' ? u.current_streak_value : 0);
      const eventsArr = teams.map((u: any) => typeof u.historical_events_participated === 'number' ? u.historical_events_participated : 0);
      const normPoints = pointsArr.length ? normalize(pointsArr) : [];
      const normActivity = activityArr.length ? normalize(activityArr) : [];
      const normStreak = streakArr.length ? normalize(streakArr) : [];
      const normEvents = eventsArr.length ? normalize(eventsArr) : [];
      const mvpScores = teams.map((u: any, i: number) => ({
        player_id: u.player_id,
        team: u.team,
        score: (normPoints[i] || 0) + (normActivity[i] || 0) + (normStreak[i] || 0) + (normEvents[i] || 0),
        points: pointsArr[i],
        activity: activityArr[i],
        streak: streakArr[i],
        events: eventsArr[i],
      }));
      // Sort by score descending
      const topMVPs = mvpScores.sort((a, b) => b.score - a.score).slice(0, 10);
      // Try to pick top 3 in different teams
      const pickedTeams = new Set();
      const top3 = [];
      for (const mvp of topMVPs) {
        if (!pickedTeams.has(mvp.team)) {
          top3.push(mvp);
          pickedTeams.add(mvp.team);
        }
        if (top3.length === 3) break;
      }
      top3.forEach((mvp, idx) => {
        console.log(`#${idx + 1} MVP: User ${mvp.player_id} (Team ${mvp.team}) | Points: ${nf(mvp.points)}, Activity: ${nf(mvp.activity)}, Streak: ${nf(mvp.streak)}, Events: ${nf(mvp.events)}`);
      });
    }
      // 1. Team with highest average points
      let maxPointsTeam = undefined;
      if (stats.team_stats.length > 0) {
        maxPointsTeam = stats.team_stats.reduce((max, t) => (max && t.points.mean > max.points.mean) ? t : max);
        if (maxPointsTeam && typeof maxPointsTeam.team !== 'undefined' && maxPointsTeam.points) {
          console.log(`Team ${maxPointsTeam.team} has the highest average points (${nf(maxPointsTeam.points.mean)}).`);
        }
      }

      // 2. Team with most players from a single current_team_name (if available)
      if (teams && teamsByGroup && teamsByGroup.length > 0) {
        // Map player_id to user
        const playerIdToUser = new Map();
        for (const group of teamsByGroup) {
          for (const pid of group.players) {
            const user = teams.find((t: any) => t.player_id === pid);
            if (user) playerIdToUser.set(pid, user);
          }
        }
        stats.team_stats.forEach((team: any, idx: number) => {
          const group = teamsByGroup[idx];
          if (!group) return;
          const teamNames: Record<string, number> = {};
          for (const pid of group.players) {
            const user = playerIdToUser.get(pid);
            if (user && user.current_team_name) {
              teamNames[user.current_team_name] = (teamNames[user.current_team_name] || 0) + 1;
            }
          }
          const entries = Object.entries(teamNames);
          if (entries.length > 0) {
            const [mostName, mostCount] = entries.reduce((a, b) => a[1] > b[1] ? a : b);
            const percent = Math.round((mostCount / team.players) * 100);
            if (percent >= 50) {
              console.log(`Team ${team.team}: ${percent}% of users come from previous team \"${mostName}\".`);
            }
          }
        });
      }

      // 3. User with most historical points and their team
      if (teams && teams.length > 0) {
        const userWithMostPoints = teams.reduce((max: any, t: any) => (t.historical_points_earned || 0) > (max.historical_points_earned || 0) ? t : max, teams[0]);
        if (userWithMostPoints && userWithMostPoints.player_id) {
          console.log(`User with most historical points: ${userWithMostPoints.player_id} (${nf(userWithMostPoints.historical_points_earned || 0)}) in team ${userWithMostPoints.team}.`);
        }
      }

      // 4. Team with highest average activity
      let maxActivityTeam = undefined;
      if (stats.team_stats.length > 0) {
        maxActivityTeam = stats.team_stats.reduce((max, t) => (max && t.actives.mean > max.actives.mean) ? t : max);
        if (maxActivityTeam && typeof maxActivityTeam.team !== 'undefined' && maxActivityTeam.actives) {
          console.log(`Team ${maxActivityTeam.team} has the highest average activity in the last 30 days (${nf(maxActivityTeam.actives.mean)}).`);
        }
      }

      // 5. Team with highest average streak
      let maxStreakTeam = undefined;
      if (stats.team_stats.length > 0) {
        maxStreakTeam = stats.team_stats.reduce((max, t) => (max && t.streaks.mean > max.streaks.mean) ? t : max);
        if (maxStreakTeam && typeof maxStreakTeam.team !== 'undefined' && maxStreakTeam.streaks) {
          console.log(`Team ${maxStreakTeam.team} has the highest average streak (${nf(maxStreakTeam.streaks.mean)}).`);
        }
      }

      // 6. Team with highest average events participated
      let maxEventsTeam = undefined;
      if (stats.team_stats.length > 0) {
        maxEventsTeam = stats.team_stats.reduce((max, t) => (max && t.events.mean > max.events.mean) ? t : max);
        if (maxEventsTeam && typeof maxEventsTeam.team !== 'undefined' && maxEventsTeam.events) {
          console.log(`Team ${maxEventsTeam.team} has the highest average events participated (${nf(maxEventsTeam.events.mean)}).`);
        }
      }
    }
    console.log('============================');
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
