import { customFunction } from './customFunction';

interface CLIOptions {
  seed?: number;
  teamsqty?: number;
  property?: string;
  [key: string]: string | number | undefined;
}

function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = {};
  for (const arg of args) {
    const [key, value] = arg.split('=');
    if (!key || value === undefined) continue;
    if (key === 'seed' || key === 'teamsqty') {
      const num = Number(value);
      if (!isNaN(num)) options[key] = num;
    } else {
      options[key] = value;
    }
  }
  return options;
}


function printTeamBalancerSummary(stats: any, usedSeed: number, allUsers?: any[], teamsByGroup?: any[], warnings?: string[]) {
  const nf = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  console.log('=== TEAM BALANCER SUMMARY ===');
  console.log(`Seed: ${usedSeed}`);
  console.log(`Property: ${stats.property || 'historical_points_earned'}`);
  console.log(`Number of teams: ${nf(stats.total_teams)}`);
  console.log(`Total number of players: ${nf(stats.total_players)}`);
  console.log(`Average team size: ${nf(stats.average_team_size)}%`);
  console.log(`Average team score: ${nf(stats.average_team_score)} points`);
  console.log(`Sheets successfully read: ${stats.sheets_read}`);

  // Only print historical points and global averages once
  console.log('\n--- Historical points ---');
  console.log(`Mean: ${nf(stats.points.mean)}, Median: ${nf(stats.points.median)}, Min: ${nf(stats.points.min)}, Max: ${nf(stats.points.max)}, Stddev: ${nf(stats.points.stddev)}`);
  console.log(`Top 5 points: [${stats.points.top5.join(', ')}]`);
  console.log(`Bottom 5 points: [${stats.points.bottom5.join(', ')}]`);

  console.log('\n--- Global Averages ---');
  console.log(`Points: mean=${nf(stats.points.mean)}, median=${nf(stats.points.median)}, min=${nf(stats.points.min)}, max=${nf(stats.points.max)}, stddev=${nf(stats.points.stddev)}`);
  console.log(`Activity (30d): mean=${nf(stats.actives.mean)}, min=${nf(stats.actives.min)}, max=${nf(stats.actives.max)}`);
  console.log(`Streaks: mean=${nf(stats.streaks.mean)}, min=${nf(stats.streaks.min)}, max=${nf(stats.streaks.max)}`);
  console.log(`Events: mean=${nf(stats.events.mean)}, min=${nf(stats.events.min)}, max=${nf(stats.events.max)}`);

  // Add per-team comparison
  console.log('\n--- Per-Team Comparison ---');
  stats.team_stats.forEach((team: any) => {
    console.log(`Team ${team.team}: Players=${nf(team.players)}, Points avg=${nf(team.points.mean)}, Activity avg=${nf(team.actives.mean)}, Streak avg=${nf(team.streaks.mean)}, Events avg=${nf(team.events.mean)}`);
  });

  // --- MVPs Section ---
  // Define key stats for MVPs (UX-focused)
  const keyStats = [
    { prop: 'historical_points_earned', label: 'Most Points Earned' },
    { prop: 'historical_points_spent', label: 'Most Points Spent' },
    { prop: 'historical_events_participated', label: 'Most Events Participated' },
    { prop: 'historical_event_engagements', label: 'Most Event Engagements' },
    { prop: 'historical_messages_sent', label: 'Most Messages Sent' },
    { prop: 'days_active_last_30', label: 'Most Active (30d)' },
    { prop: 'current_streak_value', label: 'Longest Streak' }
  ];
  const groups = teamsByGroup || stats.teamsByGroup || [];
  if (Array.isArray(groups) && groups.length > 0 && Array.isArray(allUsers) && allUsers.length > 0) {
    type MVP = { team: number; name: string; stat: string; value: string | number; prop: string };
    const mvpList: MVP[] = [];
    groups.forEach((group: any, teamIdx: number) => {
      let users: any[] = [];
      if (Array.isArray(group.playersDetailed) && group.playersDetailed.length > 0) {
        users = group.playersDetailed;
      } else if (Array.isArray(group.players) && group.players.length > 0) {
        users = group.players.map((pid: any) => {
          return allUsers.find((u: any) => String(u.player_id) === String(pid));
        }).filter(Boolean);
      }
      if (!users.length) {
        console.log(`[DEBUG] No users found for team ${teamIdx+1}. group.players:`, JSON.stringify(group.players), 'allUsers sample:', JSON.stringify(allUsers.slice(0,3)));
        return;
      }
      keyStats.forEach(stat => {
        const sorted = users.slice().sort((a: any, b: any) => (typeof b[stat.prop] === 'number' ? b[stat.prop] : 0) - (typeof a[stat.prop] === 'number' ? a[stat.prop] : 0));
        const topUser = sorted[0];
        if (topUser) {
          mvpList.push({
            team: teamIdx + 1,
            name: topUser.name || topUser.player_id || `Player ${teamIdx+1}`,
            stat: stat.label,
            value: typeof topUser[stat.prop] === 'number' ? nf(topUser[stat.prop]) : topUser[stat.prop],
            prop: stat.prop
          });
        }
      });
    });
    // Filter to only one MVP per team, prioritizing the first stat in keyStats
    const uniqueMVPs: { [team: number]: MVP } = {};
    mvpList.forEach((mvp: MVP) => {
      if (!uniqueMVPs[mvp.team]) uniqueMVPs[mvp.team] = mvp;
    });
    const finalMVPs: MVP[] = Object.values(uniqueMVPs);
    console.log(`\n--- TOP ${finalMVPs.length} MVPs (one per team, best in key stats) ---`);
    if (finalMVPs.length > 0) {
      finalMVPs.forEach((mvp: MVP) => {
        console.log(`Team ${mvp.team} MVP: User ${mvp.name} — ${mvp.stat}: ${mvp.value}`);
      });
    } else {
      // Show a summary of the first 5 users and their key stats for debugging
      const debugUsers = (allUsers || []).slice(0, 5).map(u => ({
        player_id: u.player_id,
        name: u.name,
        historical_points_earned: u.historical_points_earned,
        historical_points_spent: u.historical_points_spent,
        historical_events_participated: u.historical_events_participated,
        historical_event_engagements: u.historical_event_engagements,
        historical_messages_sent: u.historical_messages_sent,
        days_active_last_30: u.days_active_last_30,
        current_streak_value: u.current_streak_value
      }));
      console.log('No MVPs found for any team. [DEBUG] teamsByGroup.length:', groups.length, 'allUsers.length:', (allUsers || []).length);
      console.log('[DEBUG] Sample allUsers:', JSON.stringify(debugUsers, null, 2));
    }
  } else {
    // Show a summary of the first 5 users and their key stats for debugging
    const debugUsers = (allUsers || []).slice(0, 5).map(u => ({
      player_id: u.player_id,
      name: u.name,
      historical_points_earned: u.historical_points_earned,
      historical_points_spent: u.historical_points_spent,
      historical_events_participated: u.historical_events_participated,
      historical_event_engagements: u.historical_event_engagements,
      historical_messages_sent: u.historical_messages_sent,
      days_active_last_30: u.days_active_last_30,
      current_streak_value: u.current_streak_value
    }));
    console.log('No MVPs found for any team. [DEBUG] teamsByGroup.length:', (teamsByGroup || []).length, 'allUsers.length:', (allUsers || []).length);
    console.log('[DEBUG] Sample allUsers:', JSON.stringify(debugUsers, null, 2));
  }
  if (warnings && warnings.length > 0) {
    console.log('\n--- DATA WARNINGS ---');
    warnings.slice(0, 10).forEach(w => console.log(w));
    if (warnings.length > 10) {
      console.log(`...and ${warnings.length - 10} more warnings.`);
    }
  }
  console.log('\n============================');
}

async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);
  let loadingInterval: NodeJS.Timeout | undefined;
  let dots = 0;
  process.stdout.write('Generating team balance report');
  loadingInterval = setInterval(() => {
    dots = (dots + 1) % 4;
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write('Generating team balance report' + '.'.repeat(dots));
  }, 400);
  try {
    const { usedSeed, stats, allUsers, teamsByGroup, warnings } = await customFunction(options);
    if (loadingInterval) {
      clearInterval(loadingInterval);
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
    }
    printTeamBalancerSummary(stats, usedSeed, allUsers, teamsByGroup, warnings);
  } catch (err) {
    if (loadingInterval) {
      clearInterval(loadingInterval);
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
    }
    console.error('\n[ERROR] Something went wrong while generating the report.');
    if (err && typeof err === 'object' && 'message' in err) {
      console.error('Details:', (err as any).message);
    } else {
      console.error('Details:', err);
    }
    console.error('Please check your Google Sheets, credentials, and input arguments.');
  }
}

main();
