// ============================================================
// src/world.js  —  World renderer with camera, layers, animations
// ============================================================
'use strict';

// TILE_SIZE is declared in sprites.js (loaded first)
const CANVAS_W = 640;
const CANVAS_H = 448;

const World = {
  // Camera position in pixels (top-left of viewport)
  camX: 0,
  camY: 0,
  // Smooth camera target
  targetCamX: 0,
  targetCamY: 0,

  animFrame: 0,
  animTick: 0,
  ANIM_SPEED: 6, // ticks per animation frame

  // Day/night: 0.0 (day) … 1.0 (night)
  dayTime: 0.0,
  dayTick: 0,

  init(playerX, playerY) {
    this.snapCamera(playerX, playerY);
  },

  snapCamera(px, py) {
    this.camX = px - CANVAS_W / 2 + TILE_SIZE / 2;
    this.camY = py - CANVAS_H / 2 + TILE_SIZE;
    this.targetCamX = this.camX;
    this.targetCamY = this.camY;
  },

  update(playerX, playerY) {
    // Advance animation frame
    this.animTick++;
    if (this.animTick >= this.ANIM_SPEED) {
      this.animTick = 0;
      this.animFrame++;
    }

    // Smooth camera follow (lerp toward player center)
    this.targetCamX = playerX - CANVAS_W / 2 + TILE_SIZE / 2;
    this.targetCamY = playerY - CANVAS_H / 2 + TILE_SIZE;
    const LERP = 0.14;
    this.camX += (this.targetCamX - this.camX) * LERP;
    this.camY += (this.targetCamY - this.camY) * LERP;

    // Clamp camera to map bounds
    const maxCamX = MAP_W * TILE_SIZE - CANVAS_W;
    const maxCamY = MAP_H * TILE_SIZE - CANVAS_H;
    this.camX = Math.max(0, Math.min(maxCamX, this.camX));
    this.camY = Math.max(0, Math.min(maxCamY, this.camY));

    // Day/night cycle (slow)
    this.dayTick++;
    if (this.dayTick > 18000) this.dayTick = 0;
    // Smooth sine-based day-night: 0=day, 1=night
    this.dayTime = Math.max(0, Math.sin(this.dayTick / 18000 * Math.PI * 2) * -0.5 + 0.5) * 0.6;
  },

  // Draw all tiles (base layer + overhead layer handled separately)
  draw(ctx, playerTileX, playerTileY) {
    const startCol = Math.floor(this.camX / TILE_SIZE) - 1;
    const startRow = Math.floor(this.camY / TILE_SIZE) - 1;
    const endCol   = startCol + Math.ceil(640 / TILE_SIZE) + 3;
    const endRow   = startRow + Math.ceil(448 / TILE_SIZE) + 3;

    // --- Ground layer ---
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const tid  = getMapTile(col, row);
        const sx   = Math.round(col * TILE_SIZE - this.camX);
        const sy   = Math.round(row * TILE_SIZE - this.camY);

        // Skip overhead tiles in ground pass (roof drawn on top)
        const tc = getTileCanvas(tid, this.animFrame);
        if (tc) ctx.drawImage(tc, sx, sy);
      }
    }

    // Day/night overlay
    if (this.dayTime > 0.01) {
      ctx.fillStyle = `rgba(0,10,40,${this.dayTime * 0.55})`;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      // Subtle star effect at night
      if (this.dayTime > 0.4) {
        ctx.fillStyle = `rgba(255,255,220,${(this.dayTime - 0.4) * 0.8})`;
        [[80,30],[200,20],[360,14],[490,28],[580,10],[140,50],[450,40]]
          .forEach(([sx,sy]) => ctx.fillRect(sx, sy, 2, 2));
      }
    }
  },

  // Draw roof tiles ABOVE the player (overhead layer)
  drawOverhead(ctx) {
    const startCol = Math.floor(this.camX / TILE_SIZE) - 1;
    const startRow = Math.floor(this.camY / TILE_SIZE) - 1;
    const endCol   = startCol + Math.ceil(640 / TILE_SIZE) + 3;
    const endRow   = startRow + Math.ceil(448 / TILE_SIZE) + 3;

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const tid = getMapTile(col, row);
        if (tid !== 9) continue; // only roof tiles
        const sx = Math.round(col * TILE_SIZE - this.camX);
        const sy = Math.round(row * TILE_SIZE - this.camY);
        const tc = getTileCanvas(tid, this.animFrame);
        if (tc) ctx.drawImage(tc, sx, sy);
      }
    }
  },

  // Convert world pixel coords to screen coords
  worldToScreen(wx, wy) {
    return {
      x: Math.round(wx - this.camX),
      y: Math.round(wy - this.camY),
    };
  },
};
