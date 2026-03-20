// ============================================================
// src/audio.js  —  Web Audio API sound effects and music
// ============================================================
'use strict';

const Audio = (function() {
  let ctx = null;
  let battleOsc = null;
  let battleNodes = [];

  function getCtx() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    return ctx;
  }

  // Play a simple synthesized tone / chord
  function tone(freq, duration, type, vol, time) {
    const ac = getCtx(); if (!ac) return;
    const t  = time || ac.currentTime;
    const o  = ac.createOscillator();
    const g  = ac.createGain();
    o.type       = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol || 0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    o.connect(g); g.connect(ac.destination);
    o.start(t); o.stop(t + duration + 0.05);
  }

  function chord(freqs, duration, type, vol, time) {
    freqs.forEach(f => tone(f, duration, type, (vol || 0.12) / freqs.length, time));
  }

  return {
    playSFX(name) {
      const ac = getCtx(); if (!ac) return;
      const t  = ac.currentTime;
      if (name === 'step') {
        tone(80, 0.04, 'sine', 0.05, t);
      } else if (name === 'blip') {
        tone(440, 0.05, 'square', 0.08, t);
        tone(660, 0.05, 'square', 0.06, t + 0.05);
      } else if (name === 'encounter') {
        // Wild encounter jingle
        tone(400, 0.08, 'square', 0.15, t);
        tone(500, 0.08, 'square', 0.12, t + 0.08);
        tone(600, 0.08, 'square', 0.12, t + 0.16);
        tone(800, 0.16, 'square', 0.15, t + 0.24);
        chord([200,400,600,800], 0.3, 'square', 0.18, t + 0.4);
      } else if (name === 'attack_normal') {
        tone(220, 0.06, 'sawtooth', 0.12, t);
        tone(180, 0.06, 'sawtooth', 0.10, t + 0.04);
        tone(160, 0.08, 'sawtooth', 0.08, t + 0.08);
      } else if (name === 'attack_fire') {
        tone(600, 0.04, 'sawtooth', 0.10, t);
        tone(500, 0.04, 'sawtooth', 0.10, t + 0.04);
        tone(700, 0.04, 'sawtooth', 0.12, t + 0.08);
        tone(800, 0.06, 'sawtooth', 0.10, t + 0.12);
      } else if (name === 'faint') {
        tone(400, 0.10, 'square', 0.12, t);
        tone(350, 0.10, 'square', 0.10, t + 0.10);
        tone(280, 0.12, 'square', 0.12, t + 0.20);
        tone(200, 0.20, 'square', 0.14, t + 0.32);
        tone(150, 0.30, 'square', 0.12, t + 0.52);
      } else if (name === 'menu_select') {
        tone(660, 0.04, 'square', 0.07, t);
      } else if (name === 'menu_back') {
        tone(440, 0.04, 'square', 0.06, t);
        tone(330, 0.04, 'square', 0.05, t + 0.04);
      } else if (name === 'levelup') {
        const notes = [261,330,392,523,659,784,1046];
        notes.forEach((n, i) => tone(n, 0.12, 'square', 0.10, t + i * 0.07));
      } else if (name === 'grass_rustle') {
        // Subtle rustle
        const buf = ac.createBuffer(1, ac.sampleRate * 0.1, ac.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.08;
        const src = ac.createBufferSource();
        const filt = ac.createBiquadFilter();
        filt.type = 'bandpass'; filt.frequency.value = 800;
        const g2 = ac.createGain();
        g2.gain.setValueAtTime(0.3, t);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        src.buffer = buf;
        src.connect(filt); filt.connect(g2); g2.connect(ac.destination);
        src.start(t);
      }
    },

    playBattleMusic() {
      this.stopBattleMusic();
      const ac = getCtx(); if (!ac) return;
      // Simple looping battle theme using oscillators
      let t = ac.currentTime + 0.1;
      const BPM = 160;
      const beat = 60 / BPM;

      // HGSS-inspired wild battle theme (simplified)
      const melody = [
        [523,1],[659,1],[784,1],[1046,2],[784,1],[659,1],
        [523,1],[440,1],[392,1],[523,2],[440,1],[392,1],
        [659,1],[784,1],[880,1],[1046,2],[880,1],[784,1],
        [659,2],[523,2],[440,4],
      ];
      const bass = [
        [131,2],[165,2],[196,2],[131,2],
        [110,2],[138,2],[165,2],[110,2],
        [147,2],[185,2],[220,2],[147,2],
        [131,4],[110,4],
      ];

      battleNodes = [];
      let mt = t;
      melody.forEach(([freq, dur]) => {
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = 'square'; o.frequency.value = freq;
        g.gain.setValueAtTime(0, mt);
        g.gain.linearRampToValueAtTime(0.08, mt + 0.01);
        g.gain.setValueAtTime(0.08, mt + dur * beat - 0.02);
        g.gain.linearRampToValueAtTime(0, mt + dur * beat);
        o.connect(g); g.connect(ac.destination);
        o.start(mt); o.stop(mt + dur * beat + 0.05);
        battleNodes.push(o, g);
        mt += dur * beat;
      });

      let bt = t;
      bass.forEach(([freq, dur]) => {
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = 'triangle'; o.frequency.value = freq;
        g.gain.setValueAtTime(0.06, bt);
        g.gain.setValueAtTime(0.06, bt + dur * beat - 0.02);
        g.gain.linearRampToValueAtTime(0, bt + dur * beat);
        o.connect(g); g.connect(ac.destination);
        o.start(bt); o.stop(bt + dur * beat + 0.05);
        battleNodes.push(o, g);
        bt += dur * beat;
      });
    },

    stopBattleMusic() {
      const ac = getCtx(); if (!ac) return;
      battleNodes.forEach(n => { try { if (n.stop) n.stop(ac.currentTime + 0.05); n.disconnect(); } catch(e){} });
      battleNodes = [];
    },

    // Resume AudioContext on first user interaction
    resume() {
      const ac = getCtx();
      if (ac && ac.state === 'suspended') ac.resume();
    },
  };
})();
