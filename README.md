# Pokémon: Crystal Legend

A fan-made 2D Pokémon game with HGSS-style graphics, built with vanilla HTML5 Canvas.

## How to Play

Open `index.html` in any modern web browser — no build step or server needed.

## Controls

| Key | Action |
|-----|--------|
| **W A S D** | Move character (up/left/down/right) |
| **Z / Enter** | Interact / Confirm |
| **X / Escape** | Cancel / Open pause menu |
| **1 – 4** | Quick-select battle moves |
| **R** (in battle) | Run from wild Pokémon |

## Features

- **HGSS-style 2D graphics** — Layered tile rendering with animated water, swaying tall grass, and detailed pixel-art sprites drawn entirely in Canvas 2D.
- **WASD movement** — Smooth pixel-level movement with collision detection against trees, walls, water, fences and map boundaries.
- **Animated tiles** — Water ripples and tall grass sway in real time.
- **Day / night cycle** — The sky gradually darkens as the in-game clock advances.
- **Wild Pokémon encounters** — Walk through tall grass to trigger random battles (7% chance per step).
- **Turn-based battles** — Full damage formula with type effectiveness (2×, 0.5×, immune), STAB, random variance, and status effects.
- **HP & XP bars** — Smooth animated HP bars that change color (green → yellow → red). XP bar fills on victory; level-up recalculates all stats.
- **Your starter**: Cyndaquil Lv.5 (moves: Tackle, Leer, Ember, Smokescreen).
- **Wild Pokémon**: Rattata, Pidgey, Caterpie, Sentret, Hoothoot (levels 2–5).
- **HGSS-style dialog boxes** with rounded borders and typewriter text effect.
- **Pause menu** — resume, view party stats, or return to title.
- **Web Audio API** sound effects and a synthesized battle music theme.

## Technical Notes

- Pure vanilla JavaScript, no dependencies, no build step.
- All graphics are procedurally drawn using Canvas 2D API.
- Compatible with Chrome, Firefox, Safari, Edge.
