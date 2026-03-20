// ============================================================
// src/map.js  —  World map data (50×50 tile grid)
// Tile IDs: 0=grass 1=tall_grass 2=path 3=tree 4=water
//           5=flower_p 6=stone 7=sand 8=wall 9=roof
//           10=door 11=cliff 12=fence 13=sign 14=flower_y 15=pc_floor
// ============================================================
'use strict';

const MAP_W = 50;
const MAP_H = 50;

// Encode the map as rows of characters, then flatten.
// Legend (same as TILE IDs but char-based for readability):
//   # = 3  tree        t = 1  tall grass    ' ' = 0  grass
//   . = 2  path        w = 4  water         f = 5  pink flower
//   s = 6  stone path  d = 7  sand          W = 8  wall
//   R = 9  roof        D = 10 door          c = 11 cliff
//   F = 12 fence       S = 13 sign          y = 14 yellow flower
//   P = 15 PC floor

const RAW_MAP = [
/* 00 */ "##################################################",
/* 01 */ "#tttttttttttttttttttttttttttttttttttttttttttttt#tt",
/* 02 */ "#tttttttttttttttttttttttttttttttttttttttttttttt#tt",
/* 03 */ "#ttttt########ttttttttttttttttt#########ttttttt#tt",
/* 04 */ "#tttttt#     #tttttttttttttttt#        #tttttttttt",
/* 05 */ "#ttttt##     #tttttttttttttttt#        ##ttttttftt",
/* 06 */ "#ttttf#  S   #tttttttttttttttt#   S    ##ttttttftt",
/* 07 */ "#ttttt#      #tttttttttttttttt#        ##ttttftttt",
/* 08 */ "#ttttt########ttttttttttttttttt#########tttttttttt",
/* 09 */ "#ttttttt  tttttttttttttttttttttttttttttttttttttftt",
/* 10 */ "#ttttttttttttttttttttttttttttttttttttttttttttttftt",
/* 11 */ "#ttttttttttttttttttttttttttttttttttttttttttttttttt",
/* 12 */ "#ttttttttttttttttttttttttttttttttttttttttttttttyyy",
/* 13 */ "#ttttt......tttttttttttttttttttttttttttttttttttttt",
/* 14 */ "#ttttt......tttttttttttttttttttttttttttttttttttttt",
/* 15 */ "###############.############################.#####",
/* 16 */ "...............s.............................s.....",
/* 17 */ "...............s..............s..............s.....",
/* 18 */ "###############.#############.##############.#####",
/* 19 */ "#    RRRRRRR   .   RRRRRRR   .   RRRRRRR   .    #",
/* 20 */ "#    WWWWWWW   .   WWWWWWW   .   WWWWWWW   .    #",
/* 21 */ "#    W     W   .   W     W   .   W     W   .    #",
/* 22 */ "#    W  S  W   .   W  S  W   .   W  S  W   .    #",
/* 23 */ "#    W     W   .   W     W   .   W     W   .    #",
/* 24 */ "#    WWDWWWW   .   WWDWWWW   .   WWDWWWW   .    #",
/* 25 */ "#             .             .             .     #",
/* 26 */ "#  F  F  F  F . F  F  F  F . F  F  F  F .  F  #",
/* 27 */ "#ssssssssssssssssssssssssssssssssssssssssssssssss#",
/* 28 */ "#ssssssssssssssssssssssssssssssssssssssssssssssss#",
/* 29 */ "#ss  RRRRRRR  ss  PPPPPPPP  ss  RRRRRRR  ssssss#",
/* 30 */ "#ss  WWWWWWW  ss  PPPPPPPP  ss  WWWWWWW  ssssss#",
/* 31 */ "#ss  W  S  W  ss  PP  S PP  ss  W  S  W  ssssss#",
/* 32 */ "#ss  W     W  ss  PP    PP  ss  W     W  ssssss#",
/* 33 */ "#ss  WWDWWWW  ss  PPPPPPPP  ss  WWDWWWW  ssssss#",
/* 34 */ "#ssssssssssssssssssssssssssssssssssssssssssssssss#",
/* 35 */ "#sssssss S ssssssssssS sssssssssS ssssssssssssss#",
/* 36 */ "#ssssssssssssssssssssssssssssssssssssssssssssssss#",
/* 37 */ "# ddddddddddddddddddddddddddddddddddddddddddddd #",
/* 38 */ "# ddddddddddddddddddddddddddddddddddddddddddddd #",
/* 39 */ "# ddddddddddwwwwwwwwwwwwwwwwwwwwwwddddddddddddd #",
/* 40 */ "# ddddddddddwwwwwwwwwwwwwwwwwwwwwwddddddddddddd #",
/* 41 */ "# ddddddddddwwwwwwwwwwwwwwwwwwwwwwddddddddddddd #",
/* 42 */ "# ddddddddddwwwwwwwwwwwwwwwwwwwwwwddddddddddddd #",
/* 43 */ "# ddddddddddwwwwwwwwwwwwwwwwwwwwwwddddddddddddd #",
/* 44 */ "# ddddddddddddddddddddddddddddddddddddddddddddd #",
/* 45 */ "# ddddddddddddddddddddddddddddddddddddddddddddd #",
/* 46 */ "#                                               #",
/* 47 */ "#  f f f f f f f f f f f y y y y y y y y y y  #",
/* 48 */ "#  f f f f f f f f f f f y y y y y y y y y y  #",
/* 49 */ "##################################################",
];

// Build the flat tile array
const TILE_CHAR_MAP = {
  '#':3,'t':1,' ':0,'.':2,'w':4,'f':5,'s':6,
  'd':7,'W':8,'R':9,'D':10,'c':11,'F':12,'S':13,'y':14,'P':15,
};

const MAP_TILES = new Uint8Array(MAP_W * MAP_H);

(function buildMap() {
  for (let row = 0; row < MAP_H; row++) {
    const line = RAW_MAP[row] || '';
    for (let col = 0; col < MAP_W; col++) {
      const ch = line[col] || ' ';
      MAP_TILES[row * MAP_W + col] = TILE_CHAR_MAP[ch] !== undefined ? TILE_CHAR_MAP[ch] : 0;
    }
  }
})();

// Tile property lookup
const TILE_SOLID     = new Uint8Array(16); // 1 = solid (cannot walk through)
const TILE_ENCOUNTER = new Uint8Array(16); // 1 = can trigger wild encounter
const TILE_WATER     = new Uint8Array(16); // 1 = water tile

TILE_SOLID[3]=1;  // tree
TILE_SOLID[4]=1;  // water
TILE_SOLID[8]=1;  // wall
// Tile 9 (roof) is overhead, NOT solid — player walks under it
TILE_SOLID[11]=1; // cliff
TILE_SOLID[12]=1; // fence

TILE_ENCOUNTER[1]=1; // tall grass

TILE_WATER[4]=1;

// Roof (9) and Door (10) are walkable; no action needed since Uint8Array defaults to 0

function getMapTile(col, row) {
  if (col < 0 || col >= MAP_W || row < 0 || row >= MAP_H) return 3; // out of bounds = tree (solid)
  return MAP_TILES[row * MAP_W + col];
}

function isSolid(col, row) {
  return TILE_SOLID[getMapTile(col, row)] === 1;
}

function isEncounterTile(col, row) {
  return TILE_ENCOUNTER[getMapTile(col, row)] === 1;
}
