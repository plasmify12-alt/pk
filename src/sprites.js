// ============================================================
// src/sprites.js  —  All drawing functions for Pokemon Crystal Legend
// Tile pre-rendering, player sprite, Pokemon sprites, backgrounds
// ============================================================
'use strict';

// ---- PALETTE ----
const PAL = {
  // Grass
  G_DARK:  '#3a7a28', G_MID:   '#4a8f35', G_LIGHT: '#5eaa45', G_BRITE: '#72c458',
  TG_DARK: '#1e5c14', TG_MID:  '#286a1c', TG_LT:   '#337825', TG_HI:   '#3a9028',
  // Water
  W_DEEP:  '#1a4e8a', W_MID:   '#2070c8', W_LT:    '#2890e8', W_FOAM:  '#88ccff', W_HI:    '#a8e0ff',
  // Path / Sand
  P_DARK:  '#9a7840', P_MID:   '#b89050', P_LIGHT: '#d0a860', P_BRITE: '#e8c078',
  S_DARK:  '#c8b850', S_MID:   '#e0d068', S_LT:    '#f0e080',
  // Trees
  T_DARK:  '#1a5c10', T_MID:   '#236818', T_LT:    '#2d7820', T_HI:    '#3a8c2c',
  TR_DARK: '#4a2810', TR_MID:  '#5c3818', TR_LT:   '#704820',
  // Buildings
  WL_DARK: '#c0a888', WL_MID:  '#d4bca0', WL_LT:   '#e8d0b8',
  RF_DARK: '#a82020', RF_MID:  '#cc2828', RF_LT:   '#e04040',
  // Skin / Character
  SK_DARK: '#d8956a', SK_MID:  '#f0aa6a', SK_LT:   '#ffc080',
};

// ---- TILE CACHES ----
const TileCache     = {};  // key -> HTMLCanvasElement
const TileAnimCache = {};  // key -> [HTMLCanvasElement, ...]

const TILE_SIZE = 32;

function mkCanvas(w, h, drawFn) {
  const c = document.createElement('canvas');
  c.width  = w || TILE_SIZE;
  c.height = h || TILE_SIZE;
  drawFn(c.getContext('2d'));
  return c;
}

// ============================================================
// TILE DRAWING FUNCTIONS  (all draw into a 32×32 canvas ctx)
// ============================================================

function tileGrass(ctx) {
  const S = 32;
  ctx.fillStyle = PAL.G_MID;  ctx.fillRect(0, 0, S, S);
  ctx.fillStyle = PAL.G_DARK;
  ctx.fillRect(0, 14, 13, S-14);  ctx.fillRect(20, 22, S-20, S-22);
  ctx.fillStyle = PAL.G_LIGHT;
  [[2,4,6,2],[14,2,4,2],[24,10,6,2],[6,20,8,2],[20,26,6,2]].forEach(([x,y,w,h])=>ctx.fillRect(x,y,w,h));
  ctx.fillStyle = PAL.G_BRITE;
  [[4,4,2,1],[16,2,2,1],[26,10,2,1],[8,20,2,1],[22,26,2,1]].forEach(([x,y,w,h])=>ctx.fillRect(x,y,w,h));
  ctx.fillStyle = PAL.G_DARK;
  [[3,8],[10,14],[18,6],[26,18],[6,28],[22,10],[14,24]].forEach(([bx,by])=>{
    ctx.fillRect(bx,by,1,3); ctx.fillRect(bx+2,by+1,1,3);
  });
}

function tileTallGrass(ctx, frame) {
  const S = 32;
  ctx.fillStyle = PAL.TG_DARK;  ctx.fillRect(0,0,S,S);
  ctx.fillStyle = PAL.TG_MID;
  ctx.fillRect(0,S/2,S,S/2); ctx.fillRect(4,S/4,6,S/2);
  ctx.fillRect(16,S/4,6,S/2); ctx.fillRect(10,0,4,S/2); ctx.fillRect(24,0,6,S/2);
  const blades = [2,6,10,14,18,22,26,30];
  blades.forEach((bx,i) => {
    const sw = Math.sin(frame*0.3 + i*0.7)*2;
    ctx.fillStyle = PAL.TG_LT;
    ctx.fillRect(bx+sw, 16, 2, 16);
    ctx.fillRect(bx+sw*0.6, 8,  2, 10);
    ctx.fillRect(bx+sw*0.3, 4,  2, 6);
    ctx.fillRect(bx+sw*0.15,0,  2, 6);
    ctx.fillStyle = PAL.TG_HI;
    ctx.fillRect(bx+sw*0.15,0,1,3);
  });
}

function tilePath(ctx) {
  const S = 32;
  ctx.fillStyle = PAL.P_MID;  ctx.fillRect(0,0,S,S);
  ctx.fillStyle = PAL.P_DARK;
  [[3,4,3,2],[10,8,2,2],[18,3,4,2],[26,10,3,2],[7,18,2,3],[20,20,4,2],[14,26,3,2],[28,26,2,2],[2,28,3,2],[24,6,2,2]]
    .forEach(([x,y,w,h])=>ctx.fillRect(x,y,w,h));
  ctx.fillStyle = PAL.P_LIGHT;
  [[4,4,2,1],[11,8,1,1],[19,3,2,1],[27,10,1,1],[8,18,1,1],[21,20,2,1]].forEach(([x,y,w,h])=>ctx.fillRect(x,y,w,h));
  ctx.fillStyle = PAL.P_BRITE;
  [[5,4,1,1],[20,3,1,1]].forEach(([x,y,w,h])=>ctx.fillRect(x,y,w,h));
}

function tileTree(ctx) {
  const S = 32;
  ctx.fillStyle = '#0a3008';  ctx.fillRect(0,0,S,S);
  // Shadow
  ctx.fillStyle = '#122010'; ctx.beginPath(); ctx.ellipse(S/2+3,S/2+4,13,11,0,0,Math.PI*2); ctx.fill();
  // Canopy layers
  [[PAL.T_DARK,S/2,S/2-4,14,12],[PAL.T_MID,S/2,S/2-5,11,10],[PAL.T_LT,S/2-3,S/2-8,7,7],[PAL.T_LT,S/2+4,S/2-6,6,6],[PAL.T_HI,S/2-2,S/2-10,4,4]]
    .forEach(([c,cx,cy,rx,ry])=>{ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);ctx.fill();});
  // Trunk
  ctx.fillStyle = PAL.TR_MID;  ctx.fillRect(S/2-3,S-12,6,12);
  ctx.fillStyle = PAL.TR_LT;   ctx.fillRect(S/2-2,S-12,2,12);
  ctx.fillStyle = PAL.TR_DARK; ctx.fillRect(S/2+2,S-12,1,12);
  // Grass at base
  ctx.fillStyle = PAL.G_DARK;  ctx.fillRect(0,S-6,S,6);
  ctx.fillStyle = PAL.G_MID;   ctx.fillRect(0,S-4,S,4);
}

function tileWater(ctx, frame) {
  const S = 32;
  ctx.fillStyle = PAL.W_DEEP;   ctx.fillRect(0,0,S,S);
  ctx.fillStyle = PAL.W_MID;    ctx.fillRect(0,0,S,S/2);
  const wo = (frame*2) % S;
  ctx.fillStyle = PAL.W_LT;
  for (let i=-S; i<S*2; i+=8) {
    const wx=(i+wo)%(S+8); ctx.fillRect(wx,8,6,2); ctx.fillRect(wx-4,18,8,2); ctx.fillRect(wx+2,28,5,2);
  }
  ctx.fillStyle = PAL.W_FOAM;
  for (let i=-S; i<S*2; i+=12) {
    const wx=((i+wo*1.5))%(S+12); ctx.fillRect(wx,4,4,1); ctx.fillRect(wx-6,14,5,1); ctx.fillRect(wx+3,24,4,1);
  }
  ctx.fillStyle = PAL.W_HI;
  [[0,3],[10,7],[20,14]].forEach(([di,dj])=>{
    ctx.fillRect((frame*3+di*10)%S,(frame*2+dj*7)%S,2,2);
  });
}

function tileFlower(ctx, yellow) {
  tileGrass(ctx);
  const fc = yellow ? '#f8e040' : '#ff80b0';
  const cc = yellow ? '#f84000' : '#ffff80';
  [[4,6],[14,4],[24,14],[8,22],[20,20],[28,6],[4,28],[16,28]].forEach(([fx,fy])=>{
    ctx.fillStyle='#2d6422'; ctx.fillRect(fx+1,fy+4,1,4);
    ctx.fillStyle=fc;
    ctx.fillRect(fx,fy,1,1); ctx.fillRect(fx+2,fy,1,1); ctx.fillRect(fx+1,fy+2,1,1);
    ctx.fillRect(fx-1,fy+1,1,1); ctx.fillRect(fx+3,fy+1,1,1);
    ctx.fillStyle=cc; ctx.fillRect(fx+1,fy+1,1,1);
  });
}

function tileStone(ctx) {
  const S = 32;
  ctx.fillStyle = '#909090'; ctx.fillRect(0,0,S,S);
  for (let row=0;row<2;row++) for (let col=0;col<2;col++) {
    const bx=col*16, by=row*16;
    ctx.fillStyle='#a8a8a8'; ctx.fillRect(bx+1,by+1,14,14);
    ctx.fillStyle='#c8c8c8'; ctx.fillRect(bx+1,by+1,14,2); ctx.fillRect(bx+1,by+1,2,14);
    ctx.fillStyle='#707070'; ctx.fillRect(bx+1,by+13,14,2); ctx.fillRect(bx+13,by+1,2,14);
    ctx.fillStyle='#606060';
    if(col===0) ctx.fillRect(15,by,2,16);
    if(row===0) ctx.fillRect(bx,15,16,2);
  }
}

function tileSand(ctx) {
  const S = 32;
  ctx.fillStyle=PAL.S_MID; ctx.fillRect(0,0,S,S);
  ctx.fillStyle=PAL.S_DARK;
  [[2,6,12,1],[14,12,14,1],[4,20,10,1],[18,24,10,1]].forEach(([x,y,w,h])=>ctx.fillRect(x,y,w,h));
  ctx.fillStyle=PAL.S_LT;
  [[2,5,12,1],[14,11,14,1],[4,19,10,1],[18,23,10,1]].forEach(([x,y,w,h])=>ctx.fillRect(x,y,w,h));
  ctx.fillStyle='#f8f0a0';
  [[10,8,2,2],[22,16,2,2],[6,26,2,2]].forEach(([x,y,w,h])=>ctx.fillRect(x,y,w,h));
}

function tileWall(ctx) {
  const S = 32;
  ctx.fillStyle=PAL.WL_MID; ctx.fillRect(0,0,S,S);
  for (let row=0;row<4;row++) {
    const by=row*8, off=(row%2===0)?0:8;
    for (let col=-1;col<3;col++) {
      const bx=col*16+off;
      ctx.fillStyle=PAL.WL_LT; ctx.fillRect(bx+1,by+1,14,6);
      ctx.fillStyle=PAL.WL_DARK; ctx.fillRect(bx+1,by+6,14,1); ctx.fillRect(bx+14,by+1,1,6);
      ctx.fillStyle='#9a8060'; ctx.fillRect(bx,by,1,8); ctx.fillRect(bx,by+7,16,1);
    }
  }
}

function tileRoof(ctx) {
  const S = 32;
  ctx.fillStyle=PAL.RF_MID; ctx.fillRect(0,0,S,S);
  for (let row=0;row<4;row++) {
    const ry=row*8;
    ctx.fillStyle=PAL.RF_DARK; ctx.fillRect(0,ry+7,S,1);
    ctx.fillStyle=PAL.RF_LT;   ctx.fillRect(0,ry,S,2);
    ctx.fillStyle=PAL.RF_MID;  ctx.fillRect(0,ry+2,S,5);
  }
  ctx.fillStyle='#ff6060'; ctx.fillRect(0,0,S,1);
}

function tileDoor(ctx) {
  tileWall(ctx);
  ctx.fillStyle='#4a2a10'; ctx.fillRect(6,2,20,30);
  ctx.fillStyle='#7a5030'; ctx.fillRect(7,3,18,28);
  ctx.fillStyle='#8a6040';
  [[8,5,8,10],[8,18,8,11],[17,5,7,10],[17,18,7,11]].forEach(([x,y,w,h])=>ctx.fillRect(x,y,w,h));
  ctx.fillStyle='#a07848'; ctx.fillRect(8,5,8,2); ctx.fillRect(8,5,2,10);
  ctx.fillStyle='#f0d060'; ctx.fillRect(21,14,3,4);
}

function tileCliff(ctx) {
  const S = 32;
  ctx.fillStyle='#8a7060'; ctx.fillRect(0,0,S,S);
  ctx.fillStyle='#786050'; ctx.fillRect(0,8,S,2); ctx.fillRect(0,20,S,2);
  ctx.fillStyle='#9a8070'; ctx.fillRect(0,2,S,6); ctx.fillRect(0,10,S,10); ctx.fillRect(0,22,S,S-22);
  ctx.fillStyle='#aaa090';
  [[4,4,8,3],[18,12,10,4],[8,22,12,4]].forEach(([x,y,w,h])=>ctx.fillRect(x,y,w,h));
  ctx.fillStyle='#504840'; ctx.fillRect(0,0,S,4);
  ctx.fillStyle='#c0b090'; ctx.fillRect(0,0,S,2);
}

function tileFence(ctx) {
  tileGrass(ctx);
  ctx.fillStyle='#8a5020';
  [[0,4,4,20],[14,4,4,20],[28,4,4,20]].forEach(([x,y,w,h])=>ctx.fillRect(x,y,w,h));
  ctx.fillStyle='#a06030'; ctx.fillRect(0,6,32,4); ctx.fillRect(0,16,32,4);
  ctx.fillStyle='#c08040'; ctx.fillRect(0,6,32,1); ctx.fillRect(0,16,32,1);
}

function tileSign(ctx) {
  tileGrass(ctx);
  ctx.fillStyle='#6a3a10'; ctx.fillRect(14,16,4,16);
  ctx.fillStyle='#8a5020'; ctx.fillRect(4,4,24,16);
  ctx.fillStyle='#d4a870'; ctx.fillRect(5,5,22,14);
  ctx.fillStyle='#7a4010'; ctx.fillRect(7,9,18,2); ctx.fillRect(7,13,12,2);
  ctx.fillStyle='#5a2808';
  ctx.fillRect(4,4,24,1); ctx.fillRect(4,19,24,1); ctx.fillRect(4,4,1,16); ctx.fillRect(27,4,1,16);
}

function tilePCfloor(ctx) {
  const S = 32;
  ctx.fillStyle='#c0c0d8'; ctx.fillRect(0,0,S,S);
  // Checkerboard highlight
  ctx.fillStyle='#d0d0e8';
  for (let r=0;r<2;r++) for (let c=0;c<2;c++) if((r+c)%2===0) ctx.fillRect(c*16,r*16,16,16);
  ctx.fillStyle='#a0a0c0';
  ctx.fillRect(0,0,S,1); ctx.fillRect(0,S-1,S,1);
  ctx.fillRect(0,0,1,S); ctx.fillRect(S-1,0,1,S);
  ctx.fillRect(15,0,2,S); ctx.fillRect(0,15,S,2);
}

// ---- INIT ALL TILES ----
const TILE_KEY = ['grass','tall_grass','path','tree','water','flower_p','stone','sand','wall','roof','door','cliff','fence','sign','flower_y','pc_floor'];

function initTiles() {
  TileCache['grass']   = mkCanvas(0,0, tileGrass);
  TileCache['path']    = mkCanvas(0,0, tilePath);
  TileCache['tree']    = mkCanvas(0,0, tileTree);
  TileCache['stone']   = mkCanvas(0,0, tileStone);
  TileCache['sand']    = mkCanvas(0,0, tileSand);
  TileCache['wall']    = mkCanvas(0,0, tileWall);
  TileCache['roof']    = mkCanvas(0,0, tileRoof);
  TileCache['door']    = mkCanvas(0,0, tileDoor);
  TileCache['cliff']   = mkCanvas(0,0, tileCliff);
  TileCache['fence']   = mkCanvas(0,0, tileFence);
  TileCache['sign']    = mkCanvas(0,0, tileSign);
  TileCache['pc_floor']= mkCanvas(0,0, tilePCfloor);
  TileCache['flower_p']= mkCanvas(0,0, ctx=>tileFlower(ctx,false));
  TileCache['flower_y']= mkCanvas(0,0, ctx=>tileFlower(ctx,true));

  // Animated: water (32 frames) and tall_grass (24 frames)
  TileAnimCache['water']      = Array.from({length:32},(_,f)=>mkCanvas(0,0,ctx=>tileWater(ctx,f)));
  TileAnimCache['tall_grass'] = Array.from({length:24},(_,f)=>mkCanvas(0,0,ctx=>tileTallGrass(ctx,f)));
}

// Map tile ID → canvas key
const TILE_CANVAS_KEY = {
  0:'grass', 1:'tall_grass', 2:'path', 3:'tree',
  4:'water', 5:'flower_p',   6:'stone', 7:'sand',
  8:'wall',  9:'roof',       10:'door', 11:'cliff',
  12:'fence',13:'sign',      14:'flower_y', 15:'pc_floor',
};

function getTileCanvas(id, animFrame) {
  const key = TILE_CANVAS_KEY[id] || 'grass';
  if (TileAnimCache[key]) return TileAnimCache[key][animFrame % TileAnimCache[key].length];
  return TileCache[key] || TileCache['grass'];
}

// ============================================================
// PLAYER SPRITE  (drawn procedurally, 32×48 area)
// ============================================================
function drawPlayer(ctx, x, y, dir, frame) {
  x = Math.round(x); y = Math.round(y);
  // Walk sway
  const ls = frame===0?0:(frame===1?-3:3);
  const rs = -ls;

  // Shadow
  ctx.fillStyle='rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(x+16,y+46,10,3.5,0,0,Math.PI*2); ctx.fill();

  // Legs (below body)
  const legY = y+28;
  ctx.fillStyle='#1a2050';
  if (dir===0||dir===2||dir===3) {
    ctx.fillRect(x+9+ls, legY, 6, 14);
    ctx.fillRect(x+17+rs,legY, 6, 14);
  } else {
    ctx.fillRect(x+9, legY, 6, 14);
    ctx.fillRect(x+17,legY, 6, 14);
  }
  // Shoes
  ctx.fillStyle='#cc2222';
  if (dir===0||dir===2||dir===3) {
    ctx.fillRect(x+8+ls,  y+40, 8, 4);
    ctx.fillRect(x+16+rs, y+40, 8, 4);
  } else {
    ctx.fillRect(x+8,  y+40, 8, 4);
    ctx.fillRect(x+16, y+40, 8, 4);
  }

  // Body/jacket
  if (dir===1) { // back
    ctx.fillStyle='#cc2222'; ctx.fillRect(x+7,y+15,18,15);
    // Backpack
    ctx.fillStyle='#8B4513'; ctx.fillRect(x+21,y+13,9,13);
    ctx.fillStyle='#A0522D'; ctx.fillRect(x+22,y+14,7,11);
    ctx.fillStyle='#6B3310'; ctx.fillRect(x+22,y+17,7,2);
  } else if (dir===0) {
    ctx.fillStyle='#cc2222'; ctx.fillRect(x+7,y+15,18,15);
    ctx.fillStyle='#f0f0f0'; ctx.fillRect(x+11,y+15,10,13);
    ctx.fillStyle='#f0c020'; ctx.fillRect(x+12,y+21,8,7);
    // Arms
    ctx.fillStyle='#cc2222'; ctx.fillRect(x+4,y+16,5,10); ctx.fillRect(x+23,y+16,5,10);
  } else {
    const flip=(dir===2);
    ctx.fillStyle='#cc2222'; ctx.fillRect(x+7,y+15,18,15);
    ctx.fillStyle='#f0f0f0'; ctx.fillRect(flip?x+7:x+15,y+15,10,13);
    // Arm (animated)
    const armSway=frame===0?0:(frame===1?-3:3);
    ctx.fillStyle='#cc2222';
    ctx.fillRect(flip?x+22:x+5, y+15+Math.abs(armSway)*0.5, 5, 10);
  }
  // Belt
  ctx.fillStyle='#333'; ctx.fillRect(x+7,y+28,18,2);

  // Neck
  ctx.fillStyle=PAL.SK_MID; ctx.fillRect(x+13,y+11,6,6);

  // Head
  ctx.fillStyle=PAL.SK_MID; ctx.fillRect(x+9,y+4,14,12);
  // Cheek shading
  ctx.fillStyle=PAL.SK_DARK; ctx.fillRect(x+9,y+11,2,4); ctx.fillRect(x+21,y+11,2,4);

  // Hair
  ctx.fillStyle='#1a1a1a';
  if (dir===0) {
    ctx.fillRect(x+9,y+10,14,5); ctx.fillRect(x+9,y+4,4,7); ctx.fillRect(x+19,y+4,4,7);
  } else if (dir===1) {
    ctx.fillRect(x+9,y+4,14,10);
  } else {
    ctx.fillRect(x+9,y+4,14,6);
    ctx.fillRect(dir===2?x+19:x+9, y+4, 4,12);
  }

  // Hat
  ctx.fillStyle='#cc2222'; ctx.fillRect(x+7,y+1,18,7);
  ctx.fillStyle='#f0f0f0'; ctx.fillRect(x+7,y+6,18,3);
  ctx.fillStyle='#888';    ctx.fillRect(x+5,y+7,22,2); // brim

  // Eyes
  if (dir===0) {
    ctx.fillStyle='#1a1a1a'; ctx.fillRect(x+12,y+11,2,2); ctx.fillRect(x+18,y+11,2,2);
    ctx.fillStyle='#fff';    ctx.fillRect(x+13,y+11,1,1); ctx.fillRect(x+19,y+11,1,1);
  } else if (dir===2) {
    ctx.fillStyle='#1a1a1a'; ctx.fillRect(x+10,y+11,2,2);
    ctx.fillStyle='#fff';    ctx.fillRect(x+11,y+11,1,1);
  } else if (dir===3) {
    ctx.fillStyle='#1a1a1a'; ctx.fillRect(x+20,y+11,2,2);
    ctx.fillStyle='#fff';    ctx.fillRect(x+20,y+11,1,1);
  }

  // Hat logo (star)
  if (dir!==1) {
    ctx.fillStyle='#fff';    ctx.fillRect(x+15,y+2,4,1); ctx.fillRect(x+16,y+3,2,4); ctx.fillRect(x+15,y+7,4,1);
    ctx.fillStyle='#f0c020'; ctx.fillRect(x+16,y+3,2,4);
  }
}

// ============================================================
// POKEMON SPRITE DRAWING (battle scene)
// All drawn into a ~64x64 area; x,y = top-left of sprite box
// ============================================================

function drawPokemonSprite(ctx, name, x, y, isBack) {
  const fn = PK_DRAW[name];
  if (fn) { fn(ctx,x,y,isBack); return; }
  // Fallback silhouette
  ctx.fillStyle='#cc88ff';
  ctx.beginPath(); ctx.ellipse(x+32,y+34,24,20,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#fff'; ctx.font='9px monospace'; ctx.textAlign='center';
  ctx.fillText(name,x+32,y+38); ctx.textAlign='left';
}

const PK_DRAW = {};

// ---- Cyndaquil ----
PK_DRAW['Cyndaquil'] = function(ctx,x,y,isBack) {
  const ft = Math.floor(Date.now()/120)%3;
  // Flames
  [[x+8,y+18-ft,'#f84000',5,8,-0.3],[x+18,y+12-ft,'#f84000',4,10,0],[x+18,y+14-ft,'#f8a000',3,8,0],[x+10,y+20-ft,'#f8a000',3,5,-0.3],[x+18,y+16-ft,'#f8f040',2,6,0]]
    .forEach(([cx,cy,c,rx,ry,a])=>{ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,a,0,Math.PI*2);ctx.fill();});
  // Body
  ctx.fillStyle='#182870'; ctx.beginPath(); ctx.ellipse(x+32,y+36,20,16,0,0,Math.PI*2); ctx.fill();
  // Belly
  ctx.fillStyle='#f8e888'; ctx.beginPath(); ctx.ellipse(x+33,y+40,12,10,0.1,0,Math.PI*2); ctx.fill();
  // Head
  ctx.fillStyle='#182870'; ctx.beginPath(); ctx.ellipse(x+40,y+22,16,14,0,0,Math.PI*2); ctx.fill();
  // Snout
  ctx.fillStyle='#f8e888'; ctx.beginPath(); ctx.ellipse(x+50,y+26,8,6,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#1a1a1a'; ctx.beginPath(); ctx.arc(x+56,y+24,2,0,Math.PI*2); ctx.fill();
  // Eye
  ctx.fillStyle='#e82020'; ctx.beginPath(); ctx.arc(x+44,y+19,4,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#1a1a1a'; ctx.beginPath(); ctx.arc(x+44,y+19,2.5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#fff';    ctx.fillRect(x+43,y+18,1,1);
  // Feet
  ctx.fillStyle='#f8e888';
  ctx.beginPath(); ctx.ellipse(x+26,y+50,7,5,-0.2,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x+40,y+52,7,5,0.2,0,Math.PI*2); ctx.fill();
  // Toes
  ctx.fillStyle='#182870';
  for(let t=0;t<3;t++){ctx.fillRect(x+22+t*3,y+53,2,3);ctx.fillRect(x+36+t*3,y+55,2,3);}
};

// ---- Rattata ----
PK_DRAW['Rattata'] = function(ctx,x,y,isBack) {
  // Tail
  ctx.strokeStyle='#804080'; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(x+52,y+36); ctx.quadraticCurveTo(x+62,y+20,x+56,y+10); ctx.stroke();
  ctx.lineWidth=1;
  // Body
  ctx.fillStyle='#7040a0'; ctx.beginPath(); ctx.ellipse(x+34,y+38,22,15,0.1,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#f0f0f0'; ctx.beginPath(); ctx.ellipse(x+36,y+42,14,10,0.1,0,Math.PI*2); ctx.fill();
  // Head
  ctx.fillStyle='#7040a0'; ctx.beginPath(); ctx.ellipse(x+18,y+28,18,14,-0.1,0,Math.PI*2); ctx.fill();
  // Ears
  ctx.fillStyle='#7040a0';
  ctx.beginPath(); ctx.ellipse(x+10,y+16,6,8,-0.3,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x+22,y+14,6,8,0.2,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#f080b0';
  ctx.beginPath(); ctx.ellipse(x+10,y+17,3,5,-0.3,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x+22,y+15,3,5,0.2,0,Math.PI*2); ctx.fill();
  // Snout
  ctx.fillStyle='#f0d0c0'; ctx.beginPath(); ctx.ellipse(x+8,y+30,8,6,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#e85880'; ctx.fillRect(x+5,y+27,6,4);
  // Teeth
  ctx.fillStyle='#fff'; ctx.fillRect(x+6,y+31,3,5); ctx.fillRect(x+10,y+31,3,5);
  // Eyes
  ctx.fillStyle='#e82020'; ctx.beginPath(); ctx.arc(x+14,y+24,4,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#1a1a1a'; ctx.beginPath(); ctx.arc(x+14,y+24,2.5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#fff';    ctx.fillRect(x+13,y+23,1,1);
  // Whiskers
  ctx.strokeStyle='#f0f0f0'; ctx.lineWidth=1;
  [[x+4,y+28,x+16,y+29],[x+4,y+30,x+16,y+31],[x+4,y+32,x+16,y+32]].forEach(([x1,y1,x2,y2])=>{
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  });
  // Feet
  ctx.fillStyle='#7040a0';
  ctx.beginPath(); ctx.ellipse(x+20,y+50,8,6,-0.2,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x+36,y+52,8,6,0.2,0,Math.PI*2); ctx.fill();
};

// ---- Pidgey ----
PK_DRAW['Pidgey'] = function(ctx,x,y,isBack) {
  // Wings
  ctx.fillStyle='#8B6914';
  ctx.beginPath(); ctx.ellipse(x+18,y+32,20,10,-0.4,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x+46,y+32,18,9,0.4,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#7A5810'; ctx.fillRect(x+8,y+30,20,2); ctx.fillRect(x+36,y+30,20,2);
  // Body
  ctx.fillStyle='#c8a030'; ctx.beginPath(); ctx.ellipse(x+32,y+36,18,16,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#f0e8c0'; ctx.beginPath(); ctx.ellipse(x+30,y+40,12,13,0,0,Math.PI*2); ctx.fill();
  // Head
  ctx.fillStyle='#c8a030'; ctx.beginPath(); ctx.ellipse(x+28,y+22,16,13,0,0,Math.PI*2); ctx.fill();
  // Crest
  ctx.fillStyle='#8B6914';
  ctx.beginPath();ctx.moveTo(x+26,y+10);ctx.lineTo(x+22,y+4);ctx.lineTo(x+28,y+8);ctx.lineTo(x+30,y+2);ctx.lineTo(x+34,y+8);ctx.lineTo(x+30,y+12);ctx.closePath();ctx.fill();
  // Eye
  ctx.fillStyle='#1a1a1a'; ctx.beginPath(); ctx.arc(x+24,y+20,5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#fff';    ctx.beginPath(); ctx.arc(x+24,y+20,3,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#1a1a1a'; ctx.beginPath(); ctx.arc(x+24,y+20,2,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#fff';    ctx.fillRect(x+23,y+19,1,1);
  // Beak
  ctx.fillStyle='#d48000';
  ctx.beginPath();ctx.moveTo(x+14,y+22);ctx.lineTo(x+6,y+28);ctx.lineTo(x+14,y+28);ctx.closePath();ctx.fill();
  // Feet
  ctx.strokeStyle='#d48000'; ctx.lineWidth=2;
  [[x+26,y+50,x+20,y+58],[x+26,y+50,x+26,y+58],[x+26,y+50,x+32,y+58],[x+34,y+50,x+28,y+58],[x+34,y+50,x+34,y+58],[x+34,y+50,x+40,y+58]]
    .forEach(([x1,y1,x2,y2])=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();});
  ctx.lineWidth=1;
};

// ---- Caterpie ----
PK_DRAW['Caterpie'] = function(ctx,x,y,isBack) {
  // Body segments
  ['#38a830','#30961c','#38a830','#30961c','#38a830'].forEach((c,i)=>{
    ctx.fillStyle=c; ctx.beginPath(); ctx.ellipse(x+14+i*10,y+38,9,8,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#28781a'; ctx.fillRect(x+13+i*10,y+32,2,12);
  });
  // Antennae
  ctx.strokeStyle='#f04020'; ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(x+14,y+28);ctx.quadraticCurveTo(x+6,y+14,x+10,y+8);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+18,y+26);ctx.quadraticCurveTo(x+18,y+10,x+24,y+6);ctx.stroke();
  ctx.lineWidth=1;
  ctx.fillStyle='#f04020';
  ctx.beginPath(); ctx.arc(x+10,y+8,4,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+24,y+6,4,0,Math.PI*2); ctx.fill();
  // Head
  ctx.fillStyle='#38a830'; ctx.beginPath(); ctx.ellipse(x+16,y+30,13,12,0,0,Math.PI*2); ctx.fill();
  // Eyes
  ctx.fillStyle='#fff';
  ctx.beginPath(); ctx.arc(x+12,y+26,5,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+22,y+26,5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#1a4020';
  ctx.beginPath(); ctx.arc(x+12,y+26,3,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+22,y+26,3,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#fff'; ctx.fillRect(x+11,y+25,1,1); ctx.fillRect(x+21,y+25,1,1);
  // Legs
  ctx.strokeStyle='#28781a'; ctx.lineWidth=2;
  for(let i=0;i<3;i++){
    ctx.beginPath();ctx.moveTo(x+20+i*10,y+44);ctx.lineTo(x+18+i*10,y+54);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x+22+i*10,y+44);ctx.lineTo(x+24+i*10,y+54);ctx.stroke();
  }
  ctx.lineWidth=1;
};

// ---- Sentret ----
PK_DRAW['Sentret'] = function(ctx,x,y,isBack) {
  // Tail
  ctx.fillStyle='#c8882c';
  ctx.beginPath();ctx.moveTo(x+42,y+40);ctx.quadraticCurveTo(x+58,y+28,x+54,y+14);ctx.quadraticCurveTo(x+52,y+6,x+46,y+10);ctx.quadraticCurveTo(x+40,y+14,x+42,y+24);ctx.quadraticCurveTo(x+44,y+30,x+40,y+36);ctx.closePath();ctx.fill();
  ctx.fillStyle='#f0c878';
  ctx.beginPath();ctx.moveTo(x+44,y+38);ctx.quadraticCurveTo(x+52,y+28,x+50,y+16);ctx.quadraticCurveTo(x+48,y+10,x+46,y+12);ctx.quadraticCurveTo(x+42,y+16,x+44,y+26);ctx.quadraticCurveTo(x+46,y+32,x+42,y+36);ctx.closePath();ctx.fill();
  // Body
  ctx.fillStyle='#c8882c'; ctx.beginPath(); ctx.ellipse(x+28,y+38,18,16,0,0,Math.PI*2); ctx.fill();
  // Stripe belly
  ctx.fillStyle='#f0c878'; ctx.beginPath(); ctx.ellipse(x+26,y+40,10,12,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#c8882c'; ctx.beginPath(); ctx.ellipse(x+26,y+40,6,8,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#f0c878'; ctx.beginPath(); ctx.ellipse(x+26,y+40,3,5,0,0,Math.PI*2); ctx.fill();
  // Head
  ctx.fillStyle='#c8882c'; ctx.beginPath(); ctx.ellipse(x+24,y+22,16,14,0,0,Math.PI*2); ctx.fill();
  // Ears
  ctx.fillStyle='#c8882c';
  ctx.beginPath(); ctx.ellipse(x+16,y+11,5,7,-0.3,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x+28,y+10,5,7,0.3,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#f080a0';
  ctx.beginPath(); ctx.ellipse(x+16,y+12,2,4,-0.3,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x+28,y+11,2,4,0.3,0,Math.PI*2); ctx.fill();
  // Face
  ctx.fillStyle='#f0c878'; ctx.beginPath(); ctx.ellipse(x+22,y+26,8,6,0,0,Math.PI*2); ctx.fill();
  // Eyes
  ctx.fillStyle='#1a1a1a';
  ctx.beginPath(); ctx.arc(x+18,y+20,3,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+28,y+20,3,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#fff'; ctx.fillRect(x+17,y+19,1,1); ctx.fillRect(x+27,y+19,1,1);
  ctx.fillStyle='#1a1a1a'; ctx.fillRect(x+20,y+25,5,3);
  // Feet
  ctx.fillStyle='#c8882c';
  ctx.beginPath(); ctx.ellipse(x+18,y+52,8,6,-0.2,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x+34,y+52,8,6,0.2,0,Math.PI*2); ctx.fill();
};

// ---- Hoothoot ----
PK_DRAW['Hoothoot'] = function(ctx,x,y,isBack) {
  // Body
  ctx.fillStyle='#a85820'; ctx.beginPath(); ctx.ellipse(x+32,y+36,20,22,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#f0e0c0'; ctx.beginPath(); ctx.ellipse(x+32,y+42,12,16,0,0,Math.PI*2); ctx.fill();
  // Chest spots
  ctx.fillStyle='#a85820';
  for(let r=0;r<3;r++) for(let c=0;c<2;c++){ctx.beginPath();ctx.arc(x+26+c*10,y+36+r*8,3,0,Math.PI*2);ctx.fill();}
  // Wings
  ctx.fillStyle='#805018';
  ctx.beginPath(); ctx.ellipse(x+12,y+34,12,20,-0.3,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x+52,y+34,12,20,0.3,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#c07830';
  for(let i=0;i<4;i++){ctx.fillRect(x+5,y+28+i*6,8,2);ctx.fillRect(x+51,y+28+i*6,8,2);}
  // Head
  ctx.fillStyle='#a85820'; ctx.beginPath(); ctx.ellipse(x+32,y+18,18,16,0,0,Math.PI*2); ctx.fill();
  // Ear tufts
  ctx.beginPath();ctx.moveTo(x+20,y+6);ctx.lineTo(x+16,y-2);ctx.lineTo(x+24,y+6);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(x+42,y+6);ctx.lineTo(x+46,y-2);ctx.lineTo(x+40,y+6);ctx.closePath();ctx.fill();
  // Giant eyes
  ctx.fillStyle='#e8e000';
  ctx.beginPath(); ctx.arc(x+24,y+18,8,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+40,y+18,8,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#1a1a1a';
  ctx.beginPath(); ctx.arc(x+24,y+18,5,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+40,y+18,5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#fff'; ctx.fillRect(x+22,y+16,2,2); ctx.fillRect(x+38,y+16,2,2);
  // Beak
  ctx.fillStyle='#e8b000';
  ctx.beginPath();ctx.moveTo(x+28,y+24);ctx.lineTo(x+36,y+24);ctx.lineTo(x+32,y+30);ctx.closePath();ctx.fill();
  // Single leg
  ctx.strokeStyle='#e8b000'; ctx.lineWidth=4;
  ctx.beginPath();ctx.moveTo(x+32,y+56);ctx.lineTo(x+32,y+64);ctx.stroke();
  ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(x+24,y+64);ctx.lineTo(x+40,y+64);ctx.stroke();
  ctx.lineWidth=1;
};

// ============================================================
// BATTLE BACKGROUND
// ============================================================
function drawBattleBG(ctx) {
  const W=640,H=448;
  // Sky
  const sky=ctx.createLinearGradient(0,0,0,H*0.6);
  sky.addColorStop(0,'#3080e8'); sky.addColorStop(1,'#90c8ff');
  ctx.fillStyle=sky; ctx.fillRect(0,0,W,H*0.58);
  // Clouds
  ctx.fillStyle='#fff';
  _cloud(ctx,80,40,60,20); _cloud(ctx,300,55,90,28); _cloud(ctx,530,35,70,22);
  // Mountain
  ctx.fillStyle='#5878b8';
  ctx.beginPath();ctx.moveTo(0,H*0.58);ctx.lineTo(100,H*0.32);ctx.lineTo(200,H*0.46);ctx.lineTo(290,H*0.28);ctx.lineTo(370,H*0.42);ctx.lineTo(470,H*0.25);ctx.lineTo(570,H*0.38);ctx.lineTo(W,H*0.30);ctx.lineTo(W,H*0.58);ctx.closePath();ctx.fill();
  // Hills
  ctx.fillStyle='#3a8028';
  ctx.beginPath();ctx.moveTo(0,H*0.58);ctx.quadraticCurveTo(120,H*0.40,250,H*0.58);ctx.quadraticCurveTo(380,H*0.38,540,H*0.58);ctx.quadraticCurveTo(600,H*0.46,W,H*0.58);ctx.lineTo(W,H*0.58);ctx.closePath();ctx.fill();
  // Ground
  const grd=ctx.createLinearGradient(0,H*0.58,0,H);
  grd.addColorStop(0,'#50a028'); grd.addColorStop(0.4,'#388018'); grd.addColorStop(1,'#286010');
  ctx.fillStyle=grd; ctx.fillRect(0,H*0.58,W,H*0.42);
  // Ground texture
  ctx.fillStyle='#30780e';
  for(let i=0;i<24;i++){const gx=(i*41+12)%W,gy=H*0.58+(i*17+6)%(H*0.22);ctx.fillRect(gx,gy,14,4);}
  // Platforms
  ctx.fillStyle='#c0e060'; ctx.beginPath(); ctx.ellipse(150,H*0.84,105,22,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#98c040'; ctx.beginPath(); ctx.ellipse(150,H*0.84,105,22,0,Math.PI,Math.PI*2); ctx.fill();
  ctx.fillStyle='#a8d850'; ctx.beginPath(); ctx.ellipse(492,H*0.44,94,19,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#88b838'; ctx.beginPath(); ctx.ellipse(492,H*0.44,94,19,0,Math.PI,Math.PI*2); ctx.fill();
}

function _cloud(ctx,x,y,w,h) {
  [0,[-w*0.4,h*0.2,w*0.6,h*0.8],[w*0.4,h*0.2,w*0.7,h*0.9]].forEach((v,i)=>{
    if(i===0){ctx.beginPath();ctx.ellipse(x,y,w,h,0,0,Math.PI*2);ctx.fill();}
    else{ctx.beginPath();ctx.ellipse(x+v[0],y+v[1],v[2],v[3],0,0,Math.PI*2);ctx.fill();}
  });
}

// ============================================================
// TITLE SCREEN
// ============================================================
function drawTitleScreen(ctx) {
  const W=640,H=448;
  const sky=ctx.createLinearGradient(0,0,0,H*0.7);
  sky.addColorStop(0,'#0020a0'); sky.addColorStop(0.5,'#0050e0'); sky.addColorStop(1,'#40a0ff');
  ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);

  // Stars
  ctx.fillStyle='#fff';
  [[50,30],[120,20],[200,50],[280,15],[350,40],[430,25],[510,55],[580,20],[620,45],[80,70],[160,80],[320,65],[480,75],[560,35],[30,90]]
    .forEach(([sx,sy])=>ctx.fillRect(sx,sy,2,2));

  // Moon
  ctx.fillStyle='#ffffc0'; ctx.beginPath(); ctx.arc(560,68,36,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#0040c0'; ctx.beginPath(); ctx.arc(548,60,31,0,Math.PI*2); ctx.fill();

  // Mountain silhouette
  ctx.fillStyle='#102060';
  ctx.beginPath();ctx.moveTo(0,H);ctx.lineTo(0,H*0.60);ctx.lineTo(80,H*0.34);ctx.lineTo(160,H*0.54);ctx.lineTo(220,H*0.30);ctx.lineTo(310,H*0.50);ctx.lineTo(390,H*0.27);ctx.lineTo(470,H*0.44);ctx.lineTo(550,H*0.31);ctx.lineTo(630,H*0.50);ctx.lineTo(W,H*0.38);ctx.lineTo(W,H);ctx.closePath();ctx.fill();

  // Ground
  const gnd=ctx.createLinearGradient(0,H*0.64,0,H);
  gnd.addColorStop(0,'#183808'); gnd.addColorStop(1,'#0c2004');
  ctx.fillStyle=gnd; ctx.fillRect(0,H*0.64,W,H*0.36);

  // Trees silhouette
  ctx.fillStyle='#0a2005';
  for(let i=0;i<18;i++){
    const tx=i*42-20, ty=H*0.60-Math.abs(Math.sin(i*1.5))*30;
    ctx.beginPath();ctx.moveTo(tx,H*0.85);ctx.lineTo(tx-14,ty+42);ctx.lineTo(tx+14,ty+42);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(tx,ty+12);ctx.lineTo(tx-20,ty+50);ctx.lineTo(tx+20,ty+50);ctx.closePath();ctx.fill();
  }

  // Water reflection
  ctx.fillStyle='#0030a8'; ctx.fillRect(190,H*0.70,260,28);
  ctx.fillStyle='#0848c8'; ctx.fillRect(210,H*0.70,220,10);
  ctx.fillStyle='rgba(255,255,200,0.3)';
  for(let i=0;i<6;i++) ctx.fillRect(200+i*38,H*0.73,22,2);

  // Title box glow
  ctx.fillStyle='rgba(0,10,60,0.65)';
  ctx.fillRect(55,72,530,130);
  ctx.strokeStyle='#4488ff'; ctx.lineWidth=2;
  ctx.strokeRect(55,72,530,130);
  ctx.lineWidth=1;

  // POKÉMON text
  ctx.save();
  ctx.shadowBlur=22; ctx.shadowColor='#f0c000';
  ctx.fillStyle='#f8d000'; ctx.font='bold 56px Georgia,serif';
  ctx.textAlign='center'; ctx.fillText('POKÉMON',W/2,136);
  ctx.shadowColor='#88e8ff'; ctx.fillStyle='#a8f0ff';
  ctx.font='bold 38px Georgia,serif'; ctx.fillText('Crystal Legend',W/2,188);
  ctx.shadowBlur=0; ctx.restore();

  // Sparkles
  ctx.fillStyle='#fff';
  [[72,96],[572,96],[88,184],[556,178],[320,78]].forEach(([sx,sy])=>_sparkle(ctx,sx,sy));

  // Press start
  ctx.textAlign='center'; ctx.fillStyle='#f0f0f0'; ctx.font='19px monospace';
  ctx.fillText('Press ENTER or Z to start',W/2,278);
  ctx.fillStyle='#90b0ff'; ctx.font='13px monospace';
  ctx.fillText('WASD to move  ·  Z/Enter: interact  ·  X/Esc: cancel',W/2,310);
  ctx.fillStyle='#445566'; ctx.font='11px monospace';
  ctx.fillText('Fan-made tribute — not affiliated with Nintendo or Game Freak',W/2,H-16);
  ctx.textAlign='left';
}

function _sparkle(ctx,x,y) {
  ctx.fillRect(x-1,y-5,2,10); ctx.fillRect(x-5,y-1,10,2);
  ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.fillRect(x-2,y-2,4,4);
  ctx.fillStyle='#fff';
}
