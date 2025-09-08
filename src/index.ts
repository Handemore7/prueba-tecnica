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
    console.log('Generated teams (readable format):');
    /* console.log(JSON.stringify(teamsByGroup, null, 2)); */
    console.log('\nKey statistics:');
    const nf = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 0 });
    console.log(`Number of teams: ${nf(stats.total_teams)}`);
    console.log(`Total number of players: ${nf(stats.total_players)}`);
  console.log(`Average team size: ${nf(stats.average_team_size)}%`);
  console.log(`Average team score: ${nf(stats.average_team_score)} points`);
  console.log(`Sheets successfully read: ${stats.sheets_read}`);
    // Global stats
    console.log('--- Historical points ---');
    console.log(`Mean: ${nf(stats.points.mean)}, Median: ${nf(stats.points.median)}, Min: ${nf(stats.points.min)}, Max: ${nf(stats.points.max)}, Stddev: ${nf(stats.points.stddev)}`);
    console.log('Top 5 points:', stats.points.top5);
    console.log('Bottom 5 points:', stats.points.bottom5);
    console.log('--- Activity last 30 days ---');
    console.log(`Mean: ${nf(stats.actives.mean)}, Min: ${nf(stats.actives.min)}, Max: ${nf(stats.actives.max)}`);
    console.log('--- Current streaks ---');
    console.log(`Mean: ${nf(stats.streaks.mean)}, Min: ${nf(stats.streaks.min)}, Max: ${nf(stats.streaks.max)}`);
    console.log('--- Events participated ---');
    console.log(`Mean: ${nf(stats.events.mean)}, Min: ${nf(stats.events.min)}, Max: ${nf(stats.events.max)}`);
    console.log('--- Event engagement ---');
    console.log(`Mean: ${nf(stats.engagement.mean)}, Min: ${nf(stats.engagement.min)}, Max: ${nf(stats.engagement.max)}`);
    console.log('--- Points spent ---');
    console.log(`Mean: ${nf(stats.spent.mean)}, Min: ${nf(stats.spent.min)}, Max: ${nf(stats.spent.max)}`);
    console.log('--- Messages sent ---');
    console.log(`Mean: ${nf(stats.messages.mean)}, Min: ${nf(stats.messages.min)}, Max: ${nf(stats.messages.max)}`);
    console.log('--- Last activity (unix timestamp) ---');
    console.log(`Mean: ${nf(stats.last_active.mean)}, Min: ${nf(stats.last_active.min)}, Max: ${nf(stats.last_active.max)}`);
    // By team
    console.log('\nTeam statistics:');
    stats.team_stats.forEach((team: any) => {
      console.log(`Team ${team.team}: players=${nf(team.players)}`);
      console.log(`  Points: sum=${nf(team.points.sum)}, mean=${nf(team.points.mean)}, median=${nf(team.points.median)}, min=${nf(team.points.min)}, max=${nf(team.points.max)}, stddev=${nf(team.points.stddev)}`);
      console.log(`  Activity last 30 days: mean=${nf(team.actives.mean)}, min=${nf(team.actives.min)}, max=${nf(team.actives.max)}`);
      console.log(`  Streaks: mean=${nf(team.streaks.mean)}, min=${nf(team.streaks.min)}, max=${nf(team.streaks.max)}`);
      console.log(`  Events participated: mean=${nf(team.events.mean)}, min=${nf(team.events.min)}, max=${nf(team.events.max)}`);
      console.log(`  Engagement: mean=${nf(team.engagement.mean)}, min=${nf(team.engagement.min)}, max=${nf(team.engagement.max)}`);
    });
    console.log('Seed used:', usedSeed);
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
