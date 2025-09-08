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
    console.log('============================');
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
