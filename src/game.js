// ============================================================
// src/game.js  —  Main game loop, state machine, initialization
// ============================================================
'use strict';

// ---- GAME STATES ----
const GS = {
  TITLE:      'title',
  OVERWORLD:  'overworld',
  BATTLE:     'battle',
  DIALOG:     'dialog',
  MOVE_SELECT:'move_select',
  PAUSE:      'pause',
  TRANSITION: 'transition',
};

// ---- INPUT ----
const Keys = {};
const JustPressed = {};
const _prevKeys   = {};

window.addEventListener('keydown', e => {
  if (!Keys[e.code]) { JustPressed[e.code] = true; }
  Keys[e.code] = true;
  Audio.resume();
  e.preventDefault();
});
window.addEventListener('keyup', e => {
  Keys[e.code] = false;
});

function clearJustPressed() {
  for (const k in JustPressed) JustPressed[k] = false;
}

// ---- MAIN GAME ----
const Game = {
  canvas: null,
  ctx:    null,
  state:  GS.TITLE,
  frame:  0,

  // Player's team
  party: [],

  // Current dialog
  dialogLines: [],
  dialogIdx:   0,
  dialogTick:  0,

  // Move select
  moveSelectIdx: 0,

  // Pause menu
  pauseIdx: 0,

  // Screen transition
  transAlpha:  0,
  transDir:    1,   // 1=fade in, -1=fade out
  transSpeed:  0.06,
  transNext:   null, // callback when fade is done

  // Notification toast
  toastMsg:   '',
  toastAlpha: 0,

  // Title blink
  titleBlink: 0,

  init() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx    = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    // Init tile canvases
    initTiles();

    // Create player's starter
    this.party.push(createPokemon('Cyndaquil', 5));

    // Set player starting position (town center)
    Player.x = 24 * TILE_SIZE;
    Player.y = 28 * TILE_SIZE;
    Player.dir = 0;

    // Init world camera
    World.init(Player.centerX, Player.centerY);

    // Start game loop
    requestAnimationFrame(loop => this._loop());
  },

  _loop() {
    this.frame++;
    this.update();
    this.draw();
    clearJustPressed();
    requestAnimationFrame(() => this._loop());
  },

  update() {
    // Toast fade
    if (this.toastAlpha > 0) this.toastAlpha -= 0.008;

    // Transition
    if (this.state === GS.TRANSITION) {
      this.transAlpha += this.transDir * this.transSpeed;
      if (this.transDir > 0 && this.transAlpha >= 1) {
        this.transAlpha = 1;
        if (this.transNext) { this.transNext(); this.transNext = null; }
      } else if (this.transDir < 0 && this.transAlpha <= 0) {
        this.transAlpha = 0;
        this.state = this._transitionDest || GS.OVERWORLD;
      }
      return;
    }

    if (this.state === GS.TITLE) {
      this.titleBlink++;
      if (JustPressed['Enter'] || JustPressed['KeyZ'] || JustPressed['Space']) {
        Audio.resume();
        this._fadeToState(GS.OVERWORLD);
        Audio.playSFX('menu_select');
      }
    } else if (this.state === GS.OVERWORLD) {
      this._updateOverworld();
    } else if (this.state === GS.BATTLE) {
      Battle.update(Keys);
      // Move shortcut keys during SELECT
      if (Battle.state === BSTATE.SELECT) {
        if (JustPressed['Digit1'] || JustPressed['Numpad1']) Battle.selectMove(0);
        if (JustPressed['Digit2'] || JustPressed['Numpad2']) Battle.selectMove(1);
        if (JustPressed['Digit3'] || JustPressed['Numpad3']) Battle.selectMove(2);
        if (JustPressed['Digit4'] || JustPressed['Numpad4']) Battle.selectMove(3);
        if (JustPressed['KeyZ']   || JustPressed['Enter'])   this._openMoveSelect();
        if (JustPressed['KeyX']   || JustPressed['Escape'])  Battle.tryRun();
        if (JustPressed['KeyR'])                             Battle.tryRun();
      }
    } else if (this.state === GS.MOVE_SELECT) {
      const maxMoves = this.party[0].moves.length;
      if (JustPressed['ArrowUp']   || JustPressed['KeyW']) this.moveSelectIdx = (this.moveSelectIdx - 2 + maxMoves) % maxMoves;
      if (JustPressed['ArrowDown'] || JustPressed['KeyS']) this.moveSelectIdx = (this.moveSelectIdx + 2) % maxMoves;
      if (JustPressed['ArrowLeft'] || JustPressed['KeyA']) this.moveSelectIdx = Math.max(0, this.moveSelectIdx - 1);
      if (JustPressed['ArrowRight']|| JustPressed['KeyD']) this.moveSelectIdx = Math.min(maxMoves - 1, this.moveSelectIdx + 1);
      if (JustPressed['KeyZ'] || JustPressed['Enter']) {
        Battle.selectMove(this.moveSelectIdx);
        this.state = GS.BATTLE;
      }
      if (JustPressed['KeyX'] || JustPressed['Escape']) {
        this.state = GS.BATTLE;
      }
    } else if (this.state === GS.DIALOG) {
      this.dialogTick++;
      if ((JustPressed['KeyZ'] || JustPressed['Enter']) && this.dialogTick > 15) {
        this.dialogIdx++;
        this.dialogTick = 0;
        if (this.dialogIdx >= this.dialogLines.length) {
          this.state = GS.OVERWORLD;
          this.dialogLines = [];
          this.dialogIdx = 0;
        }
        Audio.playSFX('blip');
      }
    } else if (this.state === GS.PAUSE) {
      const menuItems = ['Resume', 'Pokemon', 'Options', 'Quit Title'];
      if (JustPressed['ArrowUp']   || JustPressed['KeyW']) { this.pauseIdx = (this.pauseIdx - 1 + menuItems.length) % menuItems.length; Audio.playSFX('menu_select'); }
      if (JustPressed['ArrowDown'] || JustPressed['KeyS']) { this.pauseIdx = (this.pauseIdx + 1) % menuItems.length; Audio.playSFX('menu_select'); }
      if (JustPressed['KeyZ'] || JustPressed['Enter']) {
        const sel = menuItems[this.pauseIdx];
        if (sel === 'Resume') { this.state = GS.OVERWORLD; Audio.playSFX('menu_back'); }
        else if (sel === 'Quit Title') { this._fadeToState(GS.TITLE); }
        else if (sel === 'Pokemon') {
          this._showPartyInfo();
        }
        Audio.playSFX('menu_select');
      }
      if (JustPressed['KeyX'] || JustPressed['Escape']) {
        this.state = GS.OVERWORLD;
        Audio.playSFX('menu_back');
      }
    }
  },

  _updateOverworld() {
    const result = Player.update(Keys);
    World.update(Player.centerX, Player.centerY);

    // Open pause menu
    if (JustPressed['KeyX'] || JustPressed['Escape']) {
      this.state = GS.PAUSE;
      this.pauseIdx = 0;
      Audio.playSFX('menu_select');
      return;
    }

    // Interact (check sign / door facing)
    if (JustPressed['KeyZ'] || JustPressed['Enter']) {
      this._tryInteract(result.tileX, result.tileY);
    }

    // Wild encounter check
    if (Player.moving) {
      const tid = getMapTile(result.tileX, result.tileY);
      if (TILE_ENCOUNTER[tid] === 1 && Math.random() < ENCOUNTER_RATE) {
        this._startWildBattle();
      }
    }
  },

  _tryInteract(tileX, tileY) {
    // Determine tile in front of player
    const dx = [0, 0, -1, 1][Player.dir];
    const dy = [1, -1, 0, 0][Player.dir];
    const ftx = tileX + dx;
    const fty = tileY + dy;
    const tid = getMapTile(ftx, fty);
    if (tid === 13) { // sign
      this._showDialog([
        'Route 29',
        'Littleroot Town →',
        'Tall grass ahead!',
        'Watch out for wild Pokémon!',
      ]);
    }
  },

  _showDialog(lines) {
    this.state       = GS.DIALOG;
    this.dialogLines = lines;
    this.dialogIdx   = 0;
    this.dialogTick  = 0;
    Audio.playSFX('blip');
  },

  _startWildBattle() {
    if (this.party.length === 0) return;
    const wild = pickWildPokemon();
    Audio.playSFX('encounter');
    Audio.playSFX('grass_rustle');

    // Restore fainted player pokemon (simple respawn for demo)
    if (this.party[0].hp <= 0) {
      this.party[0].hp = this.party[0].maxHP;
    }

    this._fadeToState(null, () => {
      this.state = GS.BATTLE;
      Battle.start(this.party[0], wild, (result) => {
        this._afterBattle(result);
      });
      this._fadeIn();
    });
  },

  _afterBattle(result) {
    if (result === BSTATE.END_WIN) {
      this._showToast('You won!');
    } else if (result === BSTATE.END_LOSE) {
      this._showToast('You lost! Restoring HP...');
      this.party[0].hp = this.party[0].maxHP;
    } else {
      this._showToast('Got away safely!');
    }
    this._fadeToState(GS.OVERWORLD, null, true);
  },

  _openMoveSelect() {
    this.state         = GS.MOVE_SELECT;
    this.moveSelectIdx = 0;
    Audio.playSFX('menu_select');
  },

  _showPartyInfo() {
    const p = this.party[0];
    this._showDialog([
      p.name + '  Lv.' + p.level,
      'HP: ' + p.hp + '/' + p.maxHP,
      'Type: ' + p.types.join('/'),
      'Moves: ' + p.moves.map(m => m.name).join(', '),
    ]);
  },

  _showToast(msg) {
    this.toastMsg   = msg;
    this.toastAlpha = 2.5; // will fade to 0
  },

  _fadeToState(targetState, midCallback, fromBattle) {
    if (this.state === GS.TRANSITION) return;
    const prevState = this.state;
    this.state        = GS.TRANSITION;
    this.transAlpha   = 0;
    this.transDir     = 1;
    this.transSpeed   = fromBattle ? 0.04 : 0.07;
    this._transitionDest = targetState || GS.OVERWORLD;

    this.transNext = () => {
      if (midCallback) midCallback();
      else if (targetState) {
        this.state = GS.TRANSITION;
        this.transDir  = -1;
        this._transitionDest = targetState;
      }
    };
  },

  _fadeIn() {
    this.state       = GS.TRANSITION;
    this.transAlpha  = 1;
    this.transDir    = -1;
    this.transSpeed  = 0.05;
    this._transitionDest = GS.BATTLE;
  },

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 640, 448);

    if (this.state === GS.TITLE) {
      this._drawTitle(ctx);
    } else if (this.state === GS.OVERWORLD || this.state === GS.DIALOG || this.state === GS.PAUSE) {
      this._drawOverworld(ctx);
      if (this.state === GS.DIALOG) this._drawDialog(ctx);
      if (this.state === GS.PAUSE)  this._drawPause(ctx);
    } else if (this.state === GS.BATTLE || this.state === GS.MOVE_SELECT) {
      Battle.draw(ctx);
      if (this.state === GS.MOVE_SELECT) {
        UI.drawMoveSelect(ctx, this.party[0].moves, this.moveSelectIdx);
      } else if (Battle.state === BSTATE.SELECT) {
        // Move shortcut reminder below the action menu
        ctx.fillStyle = '#5577aa';
        ctx.font = '10px monospace';
        ctx.fillText('Z/Enter: pick move  1-4: quick move  X: run', 8, 440);
      }
    } else if (this.state === GS.TRANSITION) {
      // Draw appropriate screen under the fade
      if (this._transitionDest === GS.BATTLE || this._transitionDest === null) {
        if (Battle.active) Battle.draw(ctx); else this._drawOverworld(ctx);
      } else {
        this._drawOverworld(ctx);
      }
      UI.drawTransition(ctx, this.transAlpha);
    }

    // Toast notification (always on top)
    UI.drawToast(ctx, this.toastMsg, Math.min(1, this.toastAlpha));
  },

  _drawTitle(ctx) {
    drawTitleScreen(ctx);
    // Blinking "press start" handled by re-drawing every frame
    // Add blink to the press-start text
    this.titleBlink++;
    if (Math.floor(this.titleBlink / 30) % 2 === 0) {
      ctx.fillStyle = 'rgba(0,0,20,0.6)';
      ctx.fillRect(174, 261, 292, 26);
    }
  },

  _drawOverworld(ctx) {
    World.draw(ctx, 0, 0);
    Player.draw(ctx);
    World.drawOverhead(ctx);
    UI.drawHUD(ctx, this.party[0]);
  },

  _drawDialog(ctx) {
    const lines = this.dialogLines;
    if (!lines.length) return;
    const current = lines[this.dialogIdx] || '';
    const W = 640, H = 448;
    const chars = Math.min(current.length, Math.floor(this.dialogTick * 1.2));
    UI.drawBox(ctx, 4, H - 86, W - 8, 82);
    ctx.fillStyle = '#1a1a2e';
    ctx.font = '14px monospace';
    ctx.fillText(current.slice(0, chars), 18, H - 58);
    if (this.dialogIdx < lines.length - 1 && this.dialogTick > 20) {
      ctx.fillStyle = '#4488ff'; ctx.font = '16px monospace';
      ctx.fillText('▼', W / 2 - 8, H - 16);
    }
    // Page counter
    ctx.fillStyle = '#7090b0'; ctx.font = '10px monospace';
    ctx.fillText((this.dialogIdx + 1) + '/' + lines.length, W - 36, H - 12);
  },

  _drawPause(ctx) {
    UI.drawPauseMenu(ctx, ['Resume', 'Pokemon', 'Options', 'Quit Title'], this.pauseIdx);
  },
};

// ---- START ----
window.addEventListener('DOMContentLoaded', () => {
  Game.init();
});
