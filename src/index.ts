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
    const { teams, usedSeed } = await customFunction(options);
    console.log('Equipos generados:');
    teams.forEach((item: any) => {
      console.log(`player_id: ${item.player_id}, team: ${item.team}`);
    });
    console.log('Seed usado:', usedSeed);
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
