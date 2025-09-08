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
    console.log(`Documentos leídos: ${stats.documentos_leidos}`);
    // Estadísticas globales
    console.log('--- Puntos históricos ---');
    console.log(`Promedio: ${nf(stats.points.mean)}, Mediana: ${nf(stats.points.median)}, Min: ${nf(stats.points.min)}, Max: ${nf(stats.points.max)}, Desv. estándar: ${nf(stats.points.stddev)}`);
    console.log('Top 5 puntos:', stats.points.top5);
    console.log('Bottom 5 puntos:', stats.points.bottom5);
    console.log('--- Actividad últimos 30 días ---');
    console.log(`Promedio: ${nf(stats.actives.mean)}, Min: ${nf(stats.actives.min)}, Max: ${nf(stats.actives.max)}`);
    console.log('--- Rachas actuales ---');
    console.log(`Promedio: ${nf(stats.streaks.mean)}, Min: ${nf(stats.streaks.min)}, Max: ${nf(stats.streaks.max)}`);
    console.log('--- Eventos participados ---');
    console.log(`Promedio: ${nf(stats.events.mean)}, Min: ${nf(stats.events.min)}, Max: ${nf(stats.events.max)}`);
    console.log('--- Engagement en eventos ---');
    console.log(`Promedio: ${nf(stats.engagement.mean)}, Min: ${nf(stats.engagement.min)}, Max: ${nf(stats.engagement.max)}`);
    console.log('--- Puntos gastados ---');
    console.log(`Promedio: ${nf(stats.spent.mean)}, Min: ${nf(stats.spent.min)}, Max: ${nf(stats.spent.max)}`);
    console.log('--- Mensajes enviados ---');
    console.log(`Promedio: ${nf(stats.messages.mean)}, Min: ${nf(stats.messages.min)}, Max: ${nf(stats.messages.max)}`);
    console.log('--- Última actividad (timestamp unix) ---');
    console.log(`Promedio: ${nf(stats.last_active.mean)}, Min: ${nf(stats.last_active.min)}, Max: ${nf(stats.last_active.max)}`);
    // Por equipo
    console.log('\nEstadísticas por equipo:');
    stats.team_stats.forEach((team: any) => {
      console.log(`Equipo ${team.team}: jugadores=${nf(team.players)}`);
      console.log(`  Puntos: suma=${nf(team.points.sum)}, promedio=${nf(team.points.mean)}, mediana=${nf(team.points.median)}, min=${nf(team.points.min)}, max=${nf(team.points.max)}, stddev=${nf(team.points.stddev)}`);
      console.log(`  Actividad últimos 30 días: promedio=${nf(team.actives.mean)}, min=${nf(team.actives.min)}, max=${nf(team.actives.max)}`);
      console.log(`  Rachas: promedio=${nf(team.streaks.mean)}, min=${nf(team.streaks.min)}, max=${nf(team.streaks.max)}`);
      console.log(`  Eventos participados: promedio=${nf(team.events.mean)}, min=${nf(team.events.min)}, max=${nf(team.events.max)}`);
      console.log(`  Engagement: promedio=${nf(team.engagement.mean)}, min=${nf(team.engagement.min)}, max=${nf(team.engagement.max)}`);
    });
    console.log('Seed usado:', usedSeed);
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
