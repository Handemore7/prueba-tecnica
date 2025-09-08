

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

  // Balancear los equipos para que la suma de la propiedad indicada sea lo más pareja posible
  const groups: User[][] = Array.from({ length: teamsqty }, () => []);
  const sums: number[] = Array.from({ length: teamsqty }, () => 0);
  for (const user of shuffled) {
    // Buscar el grupo con menor suma
    let minIdx: number = 0;
    for (let i = 1; i < teamsqty; i++) {
      if ((sums[i] ?? Infinity) < (sums[minIdx] ?? Infinity)) minIdx = i;
    }
    (groups[minIdx]!).push(user);
    const val = typeof user[propiedad] === 'number' ? (user[propiedad] as number) : 0;
    sums[minIdx]! += val;
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

  return { teams: result, usedSeed };
}
