// ============================================================
// src/player.js  —  Player entity with WASD movement & animation
// ============================================================
'use strict';

const DIR = { DOWN: 0, UP: 1, LEFT: 2, RIGHT: 3 };
const WALK_SPEED   = 2.2; // pixels per frame
const DIAGONAL_SPEED_MULTIPLIER = Math.SQRT1_2; // ≈ 0.707 for equal diagonal speed
const ANIM_WALK_FRAMES = 3; // 0=stand, 1=step_a, 2=step_b
const ENCOUNTER_RATE = 0.07; // 7% chance per step in tall grass

const Player = {
  // World-pixel position (top-left of 32×48 sprite box)
  x: 24 * 32,
  y: 27 * 32,
  dir:   DIR.DOWN,
  walkFrame: 0,
  walkTick:  0,
  WALK_FRAME_RATE: 10, // ticks per walk frame

  // Used for encounter triggering
  stepCount: 0,
  lastStepTile: null,

  moving: false,

  // Pixel-perfect movement: we allow sub-tile movement but clamp on solid tiles
  update(keys) {
    const prevX = this.x;
    const prevY = this.y;

    let dx = 0, dy = 0;
    if (keys['KeyW'] || keys['ArrowUp'])    { dy -= 1; this.dir = DIR.UP; }
    if (keys['KeyS'] || keys['ArrowDown'])  { dy += 1; this.dir = DIR.DOWN; }
    if (keys['KeyA'] || keys['ArrowLeft'])  { dx -= 1; this.dir = DIR.LEFT; }
    if (keys['KeyD'] || keys['ArrowRight']) { dx += 1; this.dir = DIR.RIGHT; }

    // Normalize diagonal
    if (dx !== 0 && dy !== 0) { dx *= DIAGONAL_SPEED_MULTIPLIER; dy *= DIAGONAL_SPEED_MULTIPLIER; }

    this.moving = (dx !== 0 || dy !== 0);

    if (this.moving) {
      const nx = this.x + dx * WALK_SPEED;
      const ny = this.y + dy * WALK_SPEED;

      // Collision detection using bounding box (20×16 at feet)
      const box = { x: 6, y: 36, w: 20, h: 10 };

      // Try X movement
      if (!this._collides(nx, this.y, box)) this.x = nx;
      // Try Y movement
      if (!this._collides(this.x, ny, box)) this.y = ny;

      // Clamp to map bounds
      this.x = Math.max(0, Math.min((MAP_W - 1) * TILE_SIZE, this.x));
      this.y = Math.max(0, Math.min((MAP_H - 2) * TILE_SIZE, this.y));
    }

    // Walk animation
    if (this.moving) {
      this.walkTick++;
      if (this.walkTick >= this.WALK_FRAME_RATE) {
        this.walkTick = 0;
        this.walkFrame = (this.walkFrame % 2) + 1; // toggle 1 <-> 2
      }
    } else {
      this.walkFrame = 0;
      this.walkTick  = 0;
    }

    // Step detection for encounters
    const tileX = Math.floor((this.x + 16) / TILE_SIZE);
    const tileY = Math.floor((this.y + 40) / TILE_SIZE);
    const tileKey = tileX + ',' + tileY;
    if (tileKey !== this.lastStepTile && (this.x !== prevX || this.y !== prevY)) {
      this.lastStepTile = tileKey;
      this.stepCount++;
    }

    return { tileX, tileY };
  },

  _collides(wx, wy, box) {
    // Check four corners of the bounding box
    const left   = wx + box.x;
    const right  = wx + box.x + box.w - 1;
    const top    = wy + box.y;
    const bottom = wy + box.y + box.h - 1;

    const corners = [
      [left,  top],
      [right, top],
      [left,  bottom],
      [right, bottom],
    ];

    for (const [px, py] of corners) {
      const col = Math.floor(px / TILE_SIZE);
      const row = Math.floor(py / TILE_SIZE);
      if (isSolid(col, row)) return true;
    }
    return false;
  },

  // Check whether to trigger wild encounter (call after step)
  checkEncounter(tileX, tileY) {
    if (!isEncounterTile(tileX, tileY)) return false;
    return Math.random() < ENCOUNTER_RATE;
  },

  draw(ctx) {
    const sc = World.worldToScreen(this.x, this.y);
    drawPlayer(ctx, sc.x, sc.y, this.dir, this.walkFrame);
  },

  // Center of sprite in world coords (for camera follow)
  get centerX() { return this.x + 16; },
  get centerY() { return this.y + 36; },
};
