# prueba-tecnica

Este proyecto es un ejemplo en Node.js con TypeScript. Suma dos números proporcionados como argumentos al ejecutar el programa.

# CONTEXTO

Gyld runs on seasons. At the start of each season, players can be sorted into new teams. These teams become part of the streamer’s community identity for the season, competing together in events and rituals.
When we reshuffle, we need the outcome to feel balanced and make sense to the community. Teams should be roughly even in size, and the distribution of players should reflect engagement in a way that won’t feel arbitrary if players compared notes.
Your job is to design a simple system to reassign players into T new teams for a new season. The assignment should be deterministic and reproducible (i.e. same input → same output). How you define “balanced” is up to you, but the output should look reasonable if shown to real players.

# GOAL

Reassign players into T teams for a new season so teams are balanced and the outcome feels reasonable to the community.

## Uso

1. Compila el proyecto:
   ```sh
   npx tsc
   ```
2. Ejecuta el programa:
   ```sh
   node dist/index.js 2 3
   ```
   Cambia `2` y `3` por los números que quieras sumar.
