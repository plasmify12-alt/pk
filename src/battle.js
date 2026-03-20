// ============================================================
// src/battle.js  —  Turn-based battle system
// ============================================================
'use strict';

const BSTATE = {
  APPEAR:   'appear',   // Wild pokemon slide in
  SELECT:   'select',   // Player chooses action
  ANIMATE:  'animate',  // Attack animation
  MSG:      'msg',      // Displaying a message
  CATCH:    'catch',    // Pokeball throw
  FAINT:    'faint',    // Pokemon fainting
  END_WIN:  'end_win',
  END_LOSE: 'end_lose',
  END_RUN:  'end_run',
};

const Battle = {
  active:    false,
  player:    null,  // player's Pokemon instance
  enemy:     null,  // enemy Pokemon instance
  state:     BSTATE.APPEAR,
  message:   '',
  msgQueue:  [],
  msgTimer:  0,
  MSG_HOLD:  90,    // frames to hold a message

  // HP animation
  playerHPAnim: 1,
  enemyHPAnim:  1,
  playerHPTarget: 1,
  enemyHPTarget:  1,

  // Appear animation
  appearT: 0,

  // Attack animation
  shakeX:  0,
  shakeY:  0,
  flashAlpha: 0,
  flashColor: '#fff',
  animTarget: null,  // 'player' | 'enemy'

  // Selected move for current turn
  selectedMove: null,

  // Callback when battle ends
  onEnd: null,

  start(playerPoke, enemyPoke, onEnd) {
    this.active    = true;
    this.player    = playerPoke;
    this.enemy     = enemyPoke;
    this.state     = BSTATE.APPEAR;
    this.appearT   = 0;
    this.onEnd     = onEnd || null;
    this.msgQueue  = [];
    this.message   = '';
    this.msgTimer  = 0;
    this.playerHPAnim   = playerPoke.hp / playerPoke.maxHP;
    this.enemyHPAnim    = enemyPoke.hp  / enemyPoke.maxHP;
    this.playerHPTarget = playerPoke.hp / playerPoke.maxHP;
    this.enemyHPTarget  = enemyPoke.hp  / enemyPoke.maxHP;
    this.shakeX = 0; this.shakeY = 0; this.flashAlpha = 0;

    Audio.playBattleMusic();
    this._queueMsg('A wild ' + enemyPoke.name + ' appeared!');
  },

  update(keys) {
    if (!this.active) return;

    // HP bar animation
    this.playerHPAnim += (this.playerHPTarget - this.playerHPAnim) * 0.08;
    this.enemyHPAnim  += (this.enemyHPTarget  - this.enemyHPAnim)  * 0.08;
    this.flashAlpha   *= 0.82;
    this.shakeX *= 0.7; this.shakeY *= 0.7;

    if (this.state === BSTATE.APPEAR) {
      this.appearT += 2.5;
      if (this.appearT >= 100) {
        this.appearT = 100;
        this._nextMsg();
      }
    }

    if (this.state === BSTATE.MSG) {
      this.msgTimer++;
      const advance = keys['Enter'] || keys['KeyZ'] || keys['Space'];
      if (this.msgTimer >= this.MSG_HOLD || (advance && this.msgTimer > 20)) {
        this._nextMsg();
      }
    }

    if (this.state === BSTATE.ANIMATE) {
      this.msgTimer++;
      if (this.msgTimer > 50) {
        this.msgTimer = 0;
        this._doEnemyTurn();
      }
    }

    if (this.state === BSTATE.FAINT) {
      this.msgTimer++;
      if (this.msgTimer > 80) {
        this._nextMsg();
      }
    }
  },

  // Called when player picks a move (index 0-3)
  selectMove(idx) {
    if (this.state !== BSTATE.SELECT) return;
    if (idx < 0 || idx >= this.player.moves.length) return;
    const move = this.player.moves[idx];
    if (move.pp <= 0) { this._queueMsg('No PP left!'); return; }

    this.selectedMove = move.name;
    move.pp--;
    this._doPlayerTurn();
  },

  tryRun() {
    if (this.state !== BSTATE.SELECT) return;
    // 100% flee for now (simplification)
    this._end(BSTATE.END_RUN);
  },

  _doPlayerTurn() {
    const moveName = this.selectedMove;
    const move     = MOVES[moveName];

    this._queueMsg(this.player.name + ' used ' + moveName + '!');

    if (move.power > 0) {
      const result = calcDamage(this.player, this.enemy, moveName);
      this.enemy.hp = Math.max(0, this.enemy.hp - result.damage);
      this.enemyHPTarget = this.enemy.hp / this.enemy.maxHP;

      const effStr = result.effectiveness > 1 ? "It's super effective!" : (result.effectiveness < 1 && result.effectiveness > 0 ? "It's not very effective..." : result.effectiveness === 0 ? "It had no effect!" : '');
      if (effStr) this._queueMsg(effStr);
      this.state     = BSTATE.ANIMATE;
      this.msgTimer  = 0;
      this.animTarget = 'enemy';
      this.shakeX = 8; this.flashAlpha = 0.7; this.flashColor = '#fff';

      if (this.enemy.hp <= 0) {
        this._queueMsg('The wild ' + this.enemy.name + ' fainted!');
        this.state = BSTATE.FAINT;
        this.msgTimer = 0;
        this._giveExp();
        return;
      }
    } else {
      const msg = applyStatusEffect(moveName, this.enemy);
      this._queueMsg(msg ? this.enemy.name + "'s " + msg : 'But it failed!');
    }
    // After player attack messages, enemy attacks
    this._nextMsg();
  },

  _doEnemyTurn() {
    // AI: pick a random move
    const validMoves = this.enemy.moves.filter(m => m.pp > 0);
    if (validMoves.length === 0) { this._nextMsg(); return; }
    const moveName = validMoves[Math.floor(Math.random() * validMoves.length)].name;
    const move = MOVES[moveName];
    validMoves.find(m=>m.name===moveName).pp--;

    this._queueMsg('Wild ' + this.enemy.name + ' used ' + moveName + '!');

    if (move.power > 0) {
      const result = calcDamage(this.enemy, this.player, moveName);
      this.player.hp = Math.max(0, this.player.hp - result.damage);
      this.playerHPTarget = this.player.hp / this.player.maxHP;

      this.animTarget = 'player';
      this.shakeX = -8; this.flashAlpha = 0.6; this.flashColor = '#f88';

      if (this.player.hp <= 0) {
        this._queueMsg(this.player.name + ' fainted!');
        this._queueMsg('You blacked out!');
        this.state = BSTATE.FAINT;
        this.msgTimer = 0;
        setTimeout(() => this._end(BSTATE.END_LOSE), 2000);
        return;
      }
    } else {
      const msg = applyStatusEffect(moveName, this.player);
      if (msg) this._queueMsg('Your ' + msg);
    }

    this._queueMsg('');
    this._nextMsg();
  },

  _giveExp() {
    const xpGained = Math.floor(this.enemy.species.expYield * this.enemy.level / 7);
    this.player.xp += xpGained;
    this._queueMsg(this.player.name + ' gained ' + xpGained + ' Exp. Pts!');
    if (this.player.xp >= this.player.xpToNext) {
      this.player.level++;
      this.player.xp -= this.player.xpToNext;
      this.player.xpToNext = Math.floor(Math.pow(this.player.level + 1, 3));
      this._queueMsg(this.player.name + ' grew to level ' + this.player.level + '!');
      // Recalculate stats
      const sp = this.player.species;
      const lv = this.player.level;
      const oldMax = this.player.maxHP;
      this.player.maxHP = Math.floor(((sp.hp * 2 + 31) * lv) / 100) + lv + 10;
      this.player.hp   += (this.player.maxHP - oldMax);
      this.player.atk   = Math.floor(((sp.atk * 2 + 31) * lv) / 100) + 5;
      this.player.def   = Math.floor(((sp.def * 2 + 31) * lv) / 100) + 5;
      this.player.spa   = Math.floor(((sp.spa * 2 + 31) * lv) / 100) + 5;
      this.player.spd   = Math.floor(((sp.spd * 2 + 31) * lv) / 100) + 5;
      this.player.spe   = Math.floor(((sp.spe * 2 + 31) * lv) / 100) + 5;
      this.playerHPTarget = this.player.hp / this.player.maxHP;
      this.playerHPAnim   = this.playerHPTarget;
    }
    setTimeout(() => this._end(BSTATE.END_WIN), 2200);
  },

  _queueMsg(msg) {
    if (msg) this.msgQueue.push(msg);
  },

  _nextMsg() {
    if (this.msgQueue.length > 0) {
      this.message  = this.msgQueue.shift();
      this.state    = BSTATE.MSG;
      this.msgTimer = 0;
      Audio.playSFX('blip');
    } else {
      if (this.state !== BSTATE.FAINT && this.state !== BSTATE.END_WIN && this.state !== BSTATE.END_LOSE) {
        this.state = BSTATE.SELECT;
      }
    }
  },

  _end(result) {
    this.active = false;
    Audio.stopBattleMusic();
    if (this.onEnd) this.onEnd(result);
  },

  // ---- DRAWING ----
  draw(ctx) {
    if (!this.active) return;

    // Background
    drawBattleBG(ctx);

    const W = 640, H = 448;

    // Appear animation: enemy slides in from right, player from left
    const eSlide = Math.max(0, (100 - this.appearT) / 100);
    const pSlide = Math.max(0, (100 - this.appearT) / 100);

    // Shake offset for attacked pokemon
    const shakeEx = this.animTarget === 'enemy'  ? this.shakeX : 0;
    const shakePx = this.animTarget === 'player' ? this.shakeX : 0;

    // Enemy Pokemon (top right, front sprite)
    const ePosX = 380 + eSlide * 300 + shakeEx;
    const ePosY = H * 0.15;
    ctx.save();
    // Flash effect
    if (this.animTarget === 'enemy' && this.flashAlpha > 0.05) {
      ctx.globalAlpha = 1 - this.flashAlpha * 0.7;
    }
    if (this.enemy.hp > 0 || this.state !== BSTATE.FAINT) {
      drawPokemonSprite(ctx, this.enemy.name, ePosX, ePosY, false);
    }
    ctx.restore();

    // Player Pokemon (bottom left, back sprite, larger)
    const pPosX = 50  - pSlide * 300 + shakePx;
    const pPosY = H * 0.52;
    ctx.save();
    if (this.animTarget === 'player' && this.flashAlpha > 0.05) {
      ctx.globalAlpha = 1 - this.flashAlpha * 0.7;
    }
    if (this.player.hp > 0 || this.state !== BSTATE.FAINT) {
      ctx.scale(1.4, 1.4);
      drawPokemonSprite(ctx, this.player.name, pPosX / 1.4, pPosY / 1.4, true);
      ctx.setTransform(1,0,0,1,0,0);
    }
    ctx.restore();

    // Flash overlay
    if (this.flashAlpha > 0.02) {
      ctx.fillStyle = this.flashColor;
      ctx.globalAlpha = this.flashAlpha * 0.3;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }

    // ---- Enemy HP Box (top-left) ----
    this._drawHPBox(ctx, 12, 16, this.enemy, this.enemyHPAnim, false);

    // ---- Player HP Box (bottom-right) ----
    this._drawHPBox(ctx, W - 220, H * 0.68, this.player, this.playerHPAnim, true);

    // ---- Message Box / Action Menu ----
    if (this.state === BSTATE.SELECT) {
      this._drawActionMenu(ctx);
    } else {
      this._drawMessageBox(ctx, this.message);
    }
  },

  _drawHPBox(ctx, x, y, poke, hpRatio, showXP) {
    const W = 196, H = 54;
    // Box
    UI.drawBox(ctx, x, y, W, H);

    // Name + level
    ctx.fillStyle = '#1a1a2e';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(poke.name, x + 10, y + 18);
    ctx.font = '11px monospace';
    ctx.fillText('Lv' + poke.level, x + W - 38, y + 18);

    // HP bar background
    const barX = x + 10, barY = y + 28, barW = W - 20, barH = 8;
    ctx.fillStyle = '#333355';
    ctx.fillRect(barX, barY, barW, barH);

    // HP bar fill
    const ratio = Math.max(0, Math.min(1, hpRatio));
    const color = ratio > 0.5 ? '#38c840' : (ratio > 0.2 ? '#f8c808' : '#f82020');
    ctx.fillStyle = color;
    ctx.fillRect(barX, barY, Math.floor(barW * ratio), barH);
    // HP shine
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(barX, barY, Math.floor(barW * ratio), 3);

    // HP label
    ctx.fillStyle = '#1a1a2e';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('HP', barX, barY - 2);

    // HP numbers (only for player's pokemon)
    if (showXP) {
      ctx.font = '10px monospace';
      ctx.fillText(Math.ceil(poke.hp) + ' / ' + poke.maxHP, barX, barY + barH + 12);

      // XP bar
      const xpRatio = poke.xp / poke.xpToNext;
      ctx.fillStyle = '#222244';
      ctx.fillRect(barX, barY + barH + 16, barW, 4);
      ctx.fillStyle = '#4888f8';
      ctx.fillRect(barX, barY + barH + 16, Math.floor(barW * xpRatio), 4);
    }

    // Status condition badge
    if (poke.status) {
      const statusColors = { burn:'#f84000', poison:'#c040e0', sleep:'#8888cc', freeze:'#40c8e8', paralyze:'#f8e800' };
      ctx.fillStyle = statusColors[poke.status] || '#888';
      ctx.fillRect(x + W - 60, y + 6, 48, 14);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(poke.status.toUpperCase().slice(0,3), x + W - 54, y + 17);
    }
  },

  _drawActionMenu(ctx) {
    const W = 640, H = 448;
    const boxY = H - 110;

    // Main message area
    UI.drawBox(ctx, 0, boxY, W - 210, 110);
    ctx.fillStyle = '#1a1a2e';
    ctx.font = '13px monospace';
    ctx.fillText('What will', 16, boxY + 24);
    ctx.font = 'bold 13px monospace';
    ctx.fillText(this.player.name + ' do?', 16, boxY + 44);

    // Action buttons panel
    UI.drawBox(ctx, W - 210, boxY, 210, 110);

    const actions = ['FIGHT', 'BAG', 'POKEMON', 'RUN'];
    const cols = 2, rows = 2;
    for (let i = 0; i < 4; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      const bx  = W - 200 + col * 100;
      const by  = boxY + 14 + row * 44;
      ctx.fillStyle = '#4488ff';
      ctx.fillRect(bx, by, 90, 32);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(actions[i], bx + 45, by + 21);
      ctx.textAlign = 'left';
    }

    // Move list panel (above the action box)
    if (false) {} // placeholder

    // Keyboard hints
    ctx.fillStyle = '#5577aa';
    ctx.font = '10px monospace';
    ctx.fillText('1-4: move  R: run', W - 200, H - 8);
  },

  _drawMoveMenu(ctx) {
    const W = 640, H = 448;
    UI.drawBox(ctx, 0, H - 140, W, 140);

    ctx.fillStyle = '#1a1a2e';
    ctx.font = '13px monospace';
    ctx.fillText('Choose a move:', 16, H - 116);

    for (let i = 0; i < this.player.moves.length; i++) {
      const mv  = this.player.moves[i];
      const mvd = MOVES[mv.name];
      const col = i % 2, row = Math.floor(i / 2);
      const bx  = 12 + col * 310;
      const by  = H - 100 + row * 44;

      ctx.fillStyle = TYPE_COLORS[mvd ? mvd.type : 'Normal'] || '#888';
      ctx.fillRect(bx, by, 300, 36);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px monospace';
      ctx.fillText((i+1) + '. ' + mv.name, bx + 10, by + 15);
      ctx.font = '10px monospace';
      ctx.fillText('PP: ' + mv.pp + '/' + mv.maxPP + '  ' + (mvd ? mvd.type : ''), bx + 10, by + 30);
    }
  },

  _drawMessageBox(ctx, msg) {
    const W = 640, H = 448;
    UI.drawBox(ctx, 0, H - 90, W, 90);

    if (this.state === BSTATE.SELECT || !msg) return;

    // Typewriter effect
    const charsToShow = Math.min(msg.length, Math.floor(this.msgTimer * 0.8));
    ctx.fillStyle = '#1a1a2e';
    ctx.font = '14px monospace';
    ctx.fillText(msg.slice(0, charsToShow), 16, H - 56);

    if (msg.length > 0 && this.msgTimer > 30) {
      ctx.fillStyle = '#4488ff';
      ctx.font = '16px monospace';
      ctx.fillText('▼', W / 2 - 8, H - 16);
    }
  },
};
