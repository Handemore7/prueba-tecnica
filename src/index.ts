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
    // --- Concise but informative summary output ---
    console.log('=== TEAM BALANCER SUMMARY ===');
    console.log(`Teams: ${nf(stats.total_teams)} | Players: ${nf(stats.total_players)} | Avg. team size: ${nf(stats.average_team_size)}`);
    console.log(`Avg. team score: ${nf(stats.average_team_score)} | Sheets: ${stats.sheets_read} | Seed: ${usedSeed}`);
    console.log('--- Global Averages ---');
    console.log(`Points: mean=${nf(stats.points.mean)}, median=${nf(stats.points.median)}, min=${nf(stats.points.min)}, max=${nf(stats.points.max)}, stddev=${nf(stats.points.stddev)}`);
    console.log(`Activity (30d): mean=${nf(stats.actives.mean)}, min=${nf(stats.actives.min)}, max=${nf(stats.actives.max)}`);
    console.log(`Streaks: mean=${nf(stats.streaks.mean)}, min=${nf(stats.streaks.min)}, max=${nf(stats.streaks.max)}`);
    console.log(`Events: mean=${nf(stats.events.mean)}, min=${nf(stats.events.min)}, max=${nf(stats.events.max)}`);
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
