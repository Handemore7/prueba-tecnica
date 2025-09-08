

import { google } from 'googleapis';
import * as fs from 'fs';

// Deterministic pseudo-random generator (mulberry32)
function mulberry32(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export interface User {
  [key: string]: string | number;
}

export interface CustomOptions {
  seed?: number;
  teamsqty?: number;
  propiedad?: string;
  sheetId?: string;
  range?: string;
}


// sheetId: el ID de la hoja de Google Sheets (de la URL)
// range: el rango a leer, por ejemplo 'Sheet1!A1:A100'
// Por defecto, asume que la hoja tiene encabezados en la primera fila y los datos empiezan en la segunda
export async function customFunction(options: CustomOptions = {}) {
  const {
    seed,
    teamsqty = 2,
    propiedad = 'historical_points_earned',
    sheetId = '14ecaqMY5Rq-fVn1eebS6Yq5GUyjfXDuUm-kn-tt4XpM',
    range = 'Sheet1!A2:Z'
  } = options;
  // Autenticación con Google
  const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range });
  const rows = res.data.values || [];
  if (!rows.length) throw new Error('No se encontraron datos en la hoja');
  // Leer encabezados dinámicamente
  const headers = (await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: range.replace(/\d+:.*$/, '1:1') })).data.values?.[0] || [];
  const users: User[] = rows.map(row => {
    const user: User = {};
    headers.forEach((h, i) => {
      // Intenta convertir a número si es posible
      const val = row[i];
      user[h] = val !== undefined && !isNaN(Number(val)) && val !== '' ? Number(val) : val;
    });
    return user;
  });

  // Deterministic shuffle
  const usedSeed = seed !== undefined ? seed : Math.floor(Math.random() * 1e9);
  const rand = mulberry32(usedSeed);
  const shuffled: User[] = users.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const temp = shuffled[i] as User;
    shuffled[i] = shuffled[j] as User;
    shuffled[j] = temp;
  }

  // Algoritmo snake draft con control estricto de cantidad de jugadores por equipo
  // 1. Ordenar por propiedad (mayor a menor)
  const sorted = [...users].sort((a, b) => {
    const aVal = typeof a[propiedad] === 'number' ? (a[propiedad] as number) : 0;
    const bVal = typeof b[propiedad] === 'number' ? (b[propiedad] as number) : 0;
    return bVal - aVal;
  });
  // 2. Calcular la cantidad ideal de jugadores por equipo
  const totalPlayers = sorted.length;
  const basePlayers = Math.floor(totalPlayers / teamsqty);
  const extra = totalPlayers % teamsqty;
  // 3. Asignar a cada equipo su cupo máximo
  const teamLimits = Array.from({ length: teamsqty }, (_, i) => basePlayers + (i < extra ? 1 : 0));
  const groups: User[][] = Array.from({ length: teamsqty }, () => []);
  let direction = 1;
  let idx = 0;
  for (const user of sorted) {
    // Buscar el siguiente equipo con cupo disponible
  while ((groups[idx]?.length ?? 0) >= (teamLimits[idx] ?? 0)) {
      if (direction === 1) {
        idx++;
        if (idx === teamsqty) {
          direction = -1;
          idx = teamsqty - 1;
        }
      } else {
        idx--;
        if (idx < 0) {
          direction = 1;
          idx = 0;
        }
      }
    }
    groups[idx]!.push(user);
    if (direction === 1) {
      idx++;
      if (idx === teamsqty) {
        direction = -1;
        idx = teamsqty - 1;
      }
    } else {
      idx--;
      if (idx < 0) {
        direction = 1;
        idx = 0;
      }
    }
  }

  // Construir resultado: lista de jugadores con su equipo asignado
  const result: { player_id: string | number; team: number }[] = [];
  groups.forEach((group, idx) => {
    group.forEach(user => {
      result.push({
        player_id: user['player_id'] ?? '',
        team: idx + 1
      });
    });
  });

  // Estadísticas generales
  // Calcular suma total de la propiedad
  const totalProp = result.reduce((acc, user) => {
    const found = users.find(u => u['player_id'] === user.player_id);
    return acc + (found && typeof found[propiedad] === 'number' ? (found[propiedad] as number) : 0);
  }, 0);

  const stats = {
    total_teams: groups.length,
    total_players: result.length,
    promedio_general: groups.length > 0 ? Math.round(result.length / groups.length) : 0,
    promedio_general_puntaje: result.length > 0 ? Math.round(totalProp / result.length) : 0,
    teams: groups.map((group, idx) => {
      const propSum = group.reduce((acc, user) => acc + (typeof user[propiedad] === 'number' ? (user[propiedad] as number) : 0), 0);
      const propAvg = group.length > 0 ? Math.round(propSum / group.length) : 0;
      return {
        team: idx + 1,
        players: group.length,
        sum: Math.round(propSum),
        avg: propAvg
      };
    })
  };

  // Devolver equipos en formato agrupado por equipo para mejor legibilidad
  const teamsByGroup = groups.map((group, idx) => ({
    team: idx + 1,
    players: group.map(user => user['player_id'])
  }));

  return { teams: result, teamsByGroup, usedSeed, stats };
}
