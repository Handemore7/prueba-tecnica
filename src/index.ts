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
    console.log('Equipos generados (formato legible):');
    /* console.log(JSON.stringify(teamsByGroup, null, 2)); */
    console.log('\nEstadísticas generales:');
    const nf = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 0 });
    console.log(`Cantidad de equipos: ${nf(stats.total_teams)}`);
    console.log(`Cantidad total de jugadores: ${nf(stats.total_players)}`);
    console.log(`Promedio general (jugadores por equipo): ${nf(stats.promedio_general)}%`);
    console.log(`Promedio general (puntaje por equipo): ${nf(stats.promedio_general_puntaje)} puntos`);
    const propiedad = options.propiedad || 'historical_points_earned';
    stats.teams.forEach((team: any) => {
      console.log(`Equipo ${team.team}: jugadores = ${nf(team.players)} - suma ${propiedad} = ${nf(team.sum)} - promedio ${propiedad} = ${nf(team.avg)}`);
    });
    console.log('Seed usado:', usedSeed);
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
