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
    const { teams, usedSeed, stats } = await customFunction(options);
    console.log('Equipos generados:');
    teams.forEach((item: any) => {
      console.log(`player_id: ${item.player_id}, team: ${item.team}`);
    });
    console.log('\nEstadísticas generales:');
    console.log(`Cantidad de equipos: ${stats.total_teams}`);
    console.log(`Cantidad total de jugadores: ${stats.total_players}`);
    stats.teams.forEach((team: any) => {
      console.log(`Equipo ${team.team}: jugadores=${team.players}, suma propiedad=${team.sum}, promedio propiedad=${team.avg}`);
    });
    console.log('Seed usado:', usedSeed);
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
