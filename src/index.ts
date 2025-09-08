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
    // --- Clean summary output ---
    console.log('==============================');
    console.log(' TEAM BALANCER REPORT');
    console.log('==============================\n');
    // Summary
    console.log('Summary:');
    console.log(`• Teams: ${nf(stats.total_teams)}`);
    console.log(`• Players: ${nf(stats.total_players)}`);
    console.log(`• Avg. team size: ${nf(stats.average_team_size)}`);
    console.log(`• Avg. team score: ${nf(stats.average_team_score)} points`);
    console.log(`• Sheets read: ${stats.sheets_read}`);
    console.log(`• Seed used: ${usedSeed}`);
    console.log('\nKey Balance Metrics:');
    // Key property (historical points)
    console.log(`• Historical points: mean=${nf(stats.points.mean)}, median=${nf(stats.points.median)}, min=${nf(stats.points.min)}, max=${nf(stats.points.max)}, stddev=${nf(stats.points.stddev)}`);
    console.log(`  Top 5: ${stats.points.top5.join(', ')}`);
    console.log(`  Bottom 5: ${stats.points.bottom5.join(', ')}`);
    // Other global stats (compact)
    console.log(`• Activity (last 30d): mean=${nf(stats.actives.mean)}, min=${nf(stats.actives.min)}, max=${nf(stats.actives.max)}`);
    console.log(`• Streaks: mean=${nf(stats.streaks.mean)}, min=${nf(stats.streaks.min)}, max=${nf(stats.streaks.max)}`);
    console.log(`• Events participated: mean=${nf(stats.events.mean)}, min=${nf(stats.events.min)}, max=${nf(stats.events.max)}`);
    console.log(`• Engagement: mean=${nf(stats.engagement.mean)}, min=${nf(stats.engagement.min)}, max=${nf(stats.engagement.max)}`);
    // Per-team stats (compact)
    console.log('\nPer-Team Breakdown:');
    stats.team_stats.forEach((team: any) => {
      console.log(`- Team ${team.team} (Players: ${nf(team.players)})`);
      console.log(`    • Points: sum=${nf(team.points.sum)}, mean=${nf(team.points.mean)}, median=${nf(team.points.median)}, min=${nf(team.points.min)}, max=${nf(team.points.max)}, stddev=${nf(team.points.stddev)}`);
      console.log(`    • Activity: mean=${nf(team.actives.mean)}, min=${nf(team.actives.min)}, max=${nf(team.actives.max)}`);
      console.log(`    • Streaks: mean=${nf(team.streaks.mean)}, min=${nf(team.streaks.min)}, max=${nf(team.streaks.max)}`);
      console.log(`    • Events: mean=${nf(team.events.mean)}, min=${nf(team.events.min)}, max=${nf(team.events.max)}`);
      console.log(`    • Engagement: mean=${nf(team.engagement.mean)}, min=${nf(team.engagement.min)}, max=${nf(team.engagement.max)}`);
    });
    // Teams composition (optional, uncomment if needed)
    // console.log('\nTeams composition:');
    // teamsByGroup.forEach((group: any) => {
    //   console.log(`Team ${group.team}: ${group.players.join(', ')}`);
    // });
    console.log('\n==============================');
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
