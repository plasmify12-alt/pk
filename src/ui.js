// ============================================================
// src/ui.js  —  HGSS-style UI components (dialog, menus, HUD)
// ============================================================
'use strict';

const UI = {
  // ---- Rounded box (HGSS dialog style) ----
  drawBox(ctx, x, y, w, h, opts) {
    opts = opts || {};
    const radius = opts.radius || 8;
    const bg     = opts.bg     || '#f8f8e8';
    const border = opts.border || '#3860b8';
    const shadow = opts.shadow !== false;

    // Drop shadow
    if (shadow) {
      ctx.fillStyle = 'rgba(0,0,10,0.35)';
      ctx.beginPath();
      this._roundRect(ctx, x + 3, y + 3, w, h, radius);
      ctx.fill();
    }

    // Background
    ctx.fillStyle = bg;
    ctx.beginPath();
    this._roundRect(ctx, x, y, w, h, radius);
    ctx.fill();

    // Outer border (dark)
    ctx.strokeStyle = '#1a2a6e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    this._roundRect(ctx, x, y, w, h, radius);
    ctx.stroke();

    // Inner border (accent blue)
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    this._roundRect(ctx, x + 3, y + 3, w - 6, h - 6, Math.max(2, radius - 2));
    ctx.stroke();
    ctx.lineWidth = 1;
  },

  _roundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  },

  // ---- Dialog box with text ----
  drawDialog(ctx, lines, x, y, w) {
    const lineH = 22;
    const h = lines.length * lineH + 24;
    this.drawBox(ctx, x, y, w, h);
    ctx.fillStyle = '#1a1a2e';
    ctx.font = '13px monospace';
    lines.forEach((line, i) => {
      ctx.fillText(line, x + 14, y + 20 + i * lineH);
    });
  },

  // ---- Overworld HUD (party, steps) ----
  drawHUD(ctx, playerPoke) {
    if (!playerPoke) return;
    const W = 640;

    // Mini HP display (top-right corner)
    const bx = W - 160, by = 6;
    this.drawBox(ctx, bx, by, 152, 44, { radius: 6 });

    ctx.fillStyle = '#1a1a2e';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(playerPoke.name + ' Lv' + playerPoke.level, bx + 8, by + 16);

    const ratio  = playerPoke.hp / playerPoke.maxHP;
    const color  = ratio > 0.5 ? '#38c840' : (ratio > 0.2 ? '#f8c808' : '#f82020');
    const barW   = 134;
    ctx.fillStyle = '#333355';
    ctx.fillRect(bx + 8, by + 24, barW, 8);
    ctx.fillStyle = color;
    ctx.fillRect(bx + 8, by + 24, Math.floor(barW * ratio), 8);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(bx + 8, by + 24, Math.floor(barW * ratio), 3);
  },

  // ---- Move selection overlay (shown in battle, triggered by pressing Z in SELECT) ----
  drawMoveSelect(ctx, moves, selectedIdx) {
    const W = 640, H = 448;
    const panelW = 320, panelH = 160;
    const px = W / 2 - panelW / 2;
    const py = H / 2 - panelH / 2;
    this.drawBox(ctx, px, py, panelW, panelH, { bg: '#e8e8d8' });

    ctx.fillStyle = '#1a1a2e';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('Choose Move:', px + 12, py + 22);

    for (let i = 0; i < moves.length; i++) {
      const mv  = moves[i];
      const mvd = MOVES[mv.name];
      const col = i % 2, row = Math.floor(i / 2);
      const bx  = px + 8 + col * 150;
      const by  = py + 32 + row * 56;
      const sel = (i === selectedIdx);

      ctx.fillStyle = sel ? '#c8e0ff' : (TYPE_COLORS[mvd ? mvd.type : 'Normal'] || '#aaa');
      ctx.fillRect(bx, by, 138, 48);
      if (sel) {
        ctx.strokeStyle = '#4488ff'; ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, 138, 48); ctx.lineWidth = 1;
      }

      ctx.fillStyle = '#1a1a2e';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(mv.name, bx + 6, by + 18);
      ctx.font = '10px monospace';
      ctx.fillText((mvd ? mvd.type : '??'), bx + 6, by + 30);
      ctx.fillText('PP ' + mv.pp + '/' + mv.maxPP, bx + 6, by + 42);
    }
  },

  // ---- Pause / Main menu ----
  drawPauseMenu(ctx, items, selectedIdx) {
    const W = 640, H = 448;
    const menuW = 200, menuH = items.length * 36 + 20;
    const mx = W / 2 - menuW / 2;
    const my = H / 2 - menuH / 2;

    // Darken background
    ctx.fillStyle = 'rgba(0,0,20,0.6)';
    ctx.fillRect(0, 0, W, H);

    this.drawBox(ctx, mx, my, menuW, menuH, { bg: '#e8e8d8' });

    items.forEach((item, i) => {
      const iy = my + 14 + i * 36;
      if (i === selectedIdx) {
        ctx.fillStyle = '#4488ff';
        ctx.fillRect(mx + 6, iy - 2, menuW - 12, 30);
      }
      ctx.fillStyle = i === selectedIdx ? '#fff' : '#1a1a2e';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(item, mx + menuW / 2, iy + 16);
      ctx.textAlign = 'left';
    });
  },

  // ---- Level up notification ----
  drawLevelUp(ctx, pokeName, newLevel) {
    const W = 640, H = 448;
    this.drawBox(ctx, W / 2 - 160, H / 2 - 40, 320, 80, { bg: '#fff8d0' });
    ctx.fillStyle = '#1a1a2e';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(pokeName + ' grew to', W / 2, H / 2 - 10);
    ctx.fillStyle = '#f8c000';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('Level ' + newLevel + '!', W / 2, H / 2 + 20);
    ctx.textAlign = 'left';
  },

  // ---- Transition wipe ----
  drawTransition(ctx, alpha) {
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.fillRect(0, 0, 640, 448);
  },

  // ---- Notification toast ----
  drawToast(ctx, msg, alpha) {
    if (alpha <= 0) return;
    const W = 640;
    ctx.save();
    ctx.globalAlpha = alpha;
    this.drawBox(ctx, W / 2 - 160, 8, 320, 36, { bg: '#f0f8d0', shadow: false });
    ctx.fillStyle = '#1a1a2e';
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(msg, W / 2, 31);
    ctx.textAlign = 'left';
    ctx.restore();
  },
};
