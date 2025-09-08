# prueba-tecnica

Este proyecto es un ejemplo en Node.js con TypeScript. Suma dos números proporcionados como argumentos al ejecutar el programa.

# CONTEXTO

Gyld runs on seasons. At the start of each season, players can be sorted into new teams. These teams become part of the streamer’s community identity for the season, competing together in events and rituals.
When we reshuffle, we need the outcome to feel balanced and make sense to the community. Teams should be roughly even in size, and the distribution of players should reflect engagement in a way that won’t feel arbitrary if players compared notes.
Your job is to design a simple system to reassign players into T new teams for a new season. The assignment should be deterministic and reproducible (i.e. same input → same output). How you define “balanced” is up to you, but the output should look reasonable if shown to real players.

# GOALD

Reassign players into T teams for a new season so teams are balanced and the outcome feels reasonable to the community.

## Uso

1. Compila el proyecto:
   ```sh
   npx tsc
   ```
2. Ejecuta el programa:
   ```sh
   npm start seed=123 teamsqty=3 propiedad=historical_points_earned
   ```
   Cambia las propiedades por los valores que quieras usar:
   - seed: Pon un valor aleatorio, si lo vuelves a usar poodrás ver la misma información de la simulación
   - teamsqty: Cantidad de equipos
   - propiedad: Nombre de la propiedad que se va a usar como referencia para la comparación y organización de usuarios
