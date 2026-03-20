// ============================================================
// src/pokemon.js  —  Pokemon data, moves, type chart
// ============================================================
'use strict';

// ---- TYPE CHART ----
// effectiveness[atk][def] → multiplier (0=0x, 0.5=half, 1=normal, 2=super)
const TYPES = ['Normal','Fire','Water','Grass','Electric','Ice','Fighting',
               'Poison','Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon'];
const TYPE_IDX = {};
TYPES.forEach((t,i) => TYPE_IDX[t]=i);

function getTypeEffectiveness(atk, def) {
  // Simple hardcoded key matchups (pairs that matter for our Pokemon)
  const key = atk + '->' + def;
  const chart = {
    'Fire->Grass':2, 'Fire->Water':0.5, 'Fire->Fire':0.5, 'Fire->Ice':2, 'Fire->Bug':2,
    'Water->Fire':2, 'Water->Ground':2, 'Water->Water':0.5, 'Water->Grass':0.5,
    'Grass->Water':2, 'Grass->Ground':2, 'Grass->Rock':2, 'Grass->Fire':0.5, 'Grass->Grass':0.5, 'Grass->Flying':0.5,
    'Electric->Water':2, 'Electric->Flying':2, 'Electric->Ground':0, 'Electric->Electric':0.5, 'Electric->Grass':0.5,
    'Flying->Grass':2, 'Flying->Fighting':2, 'Flying->Bug':2, 'Flying->Electric':0.5, 'Flying->Rock':0.5,
    'Normal->Ghost':0,
    'Ghost->Normal':0, 'Ghost->Psychic':2,
    'Bug->Grass':2, 'Bug->Psychic':2, 'Bug->Fire':0.5, 'Bug->Fighting':0.5, 'Bug->Flying':0.5,
    'Poison->Grass':2, 'Poison->Poison':0.5, 'Poison->Ground':0.5,
    'Rock->Fire':2, 'Rock->Flying':2, 'Rock->Bug':2, 'Rock->Ice':2, 'Rock->Fighting':0.5,
    'Ground->Fire':2, 'Ground->Electric':2, 'Ground->Rock':2, 'Ground->Flying':0, 'Ground->Grass':0.5,
  };
  return chart[key] !== undefined ? chart[key] : 1;
}

// ---- MOVE DATA ----
const MOVES = {
  Tackle:      { power: 40,  type:'Normal',   cat:'physical', pp:35, acc:100, desc:'A normal physical attack.' },
  Scratch:     { power: 40,  type:'Normal',   cat:'physical', pp:35, acc:100, desc:'Scratches with sharp claws.' },
  Ember:       { power: 40,  type:'Fire',     cat:'special',  pp:25, acc:100, desc:'Shoots small flames.' },
  Smokescreen: { power: 0,   type:'Normal',   cat:'status',   pp:20, acc:100, desc:'Lowers foe accuracy.' },
  Leer:        { power: 0,   type:'Normal',   cat:'status',   pp:30, acc:100, desc:'Lowers foe defense.' },
  QuickAttack: { power: 40,  type:'Normal',   cat:'physical', pp:30, acc:100, desc:'Always strikes first.' },
  TailWhip:    { power: 0,   type:'Normal',   cat:'status',   pp:30, acc:100, desc:'Lowers foe defense.' },
  StringShot:  { power: 0,   type:'Bug',      cat:'status',   pp:40, acc:95,  desc:'Lowers foe speed.' },
  Growl:       { power: 0,   type:'Normal',   cat:'status',   pp:40, acc:100, desc:'Lowers foe attack.' },
  SandAttack:  { power: 0,   type:'Ground',   cat:'status',   pp:15, acc:100, desc:'Lowers foe accuracy.' },
  Gust:        { power: 40,  type:'Flying',   cat:'special',  pp:35, acc:100, desc:'Whips up a gust of wind.' },
  Foresight:   { power: 0,   type:'Normal',   cat:'status',   pp:40, acc:100, desc:'Ensures future attacks hit.' },
  Fury:        { power: 18,  type:'Normal',   cat:'physical', pp:20, acc:80,  desc:'Attacks 2-5 times in a row.' },
  Hypnosis:    { power: 0,   type:'Psychic',  cat:'status',   pp:20, acc:60,  desc:'Puts foe to sleep.' },
  Confusion:   { power: 50,  type:'Psychic',  cat:'special',  pp:25, acc:100, desc:'Psychic attack; may confuse.' },
  PoisonPowder:{ power: 0,   type:'Poison',   cat:'status',   pp:35, acc:75,  desc:'Poisons the target.' },
  Wrap:        { power: 15,  type:'Normal',   cat:'physical', pp:20, acc:90,  desc:'Wraps and squeezes for 2-5 turns.' },
  BiteAttack:  { power: 60,  type:'Dark',     cat:'physical', pp:25, acc:100, desc:'Bites with vicious fangs.' },
  WingAttack:  { power: 60,  type:'Flying',   cat:'physical', pp:35, acc:100, desc:'Strikes with wings.' },
  Peck:        { power: 35,  type:'Flying',   cat:'physical', pp:35, acc:100, desc:'Pecks sharply.' },
};

// ---- POKEMON DATA ----
// species: { name, types, baseHP, baseAtk, baseDef, baseSpdAtk, baseSpdDef, baseSpd, moves, catchRate, expYield }
const SPECIES = {
  Cyndaquil: {
    name:'Cyndaquil', types:['Fire'], color:'#4060e8',
    hp:39, atk:52, def:43, spa:60, spd:50, spe:65,
    moves:['Tackle','Leer','Ember','Smokescreen'],
    catchRate:45, expYield:65,
  },
  Rattata: {
    name:'Rattata', types:['Normal'], color:'#a040b8',
    hp:30, atk:56, def:35, spa:25, spd:35, spe:72,
    moves:['Tackle','TailWhip','QuickAttack','BiteAttack'],
    catchRate:255, expYield:57,
  },
  Pidgey: {
    name:'Pidgey', types:['Normal','Flying'], color:'#c89828',
    hp:40, atk:45, def:40, spa:35, spd:35, spe:56,
    moves:['Tackle','SandAttack','Gust','Peck'],
    catchRate:255, expYield:55,
  },
  Caterpie: {
    name:'Caterpie', types:['Bug'], color:'#38a828',
    hp:45, atk:30, def:35, spa:20, spd:20, spe:45,
    moves:['Tackle','StringShot'],
    catchRate:255, expYield:53,
  },
  Sentret: {
    name:'Sentret', types:['Normal'], color:'#c88828',
    hp:35, atk:46, def:34, spa:35, spd:45, spe:20,
    moves:['Scratch','Foresight','Fury','Growl'],
    catchRate:255, expYield:57,
  },
  Hoothoot: {
    name:'Hoothoot', types:['Normal','Flying'], color:'#a85820',
    hp:60, atk:30, def:30, spa:36, spd:56, spe:50,
    moves:['Tackle','Growl','Hypnosis','Confusion'],
    catchRate:255, expYield:52,
  },
};

// Shared type → color mapping used by UI and battle
const TYPE_COLORS = {
  Normal:'#a8a878',   Fire:'#f08030',    Water:'#6890f0',  Grass:'#78c850',
  Electric:'#f8d030', Ice:'#98d8d8',     Bug:'#a8b820',    Flying:'#a890f0',
  Poison:'#a040a0',   Ground:'#e0c068',  Psychic:'#f85888',Ghost:'#705898',
  Rock:'#b8a038',     Dark:'#705848',    Dragon:'#7038f8',  Fighting:'#c03028',
};
const WILD_TABLE = [
  { name:'Rattata',  weight:30, minLv:3, maxLv:5 },
  { name:'Pidgey',   weight:25, minLv:3, maxLv:5 },
  { name:'Caterpie', weight:20, minLv:2, maxLv:4 },
  { name:'Sentret',  weight:15, minLv:3, maxLv:5 },
  { name:'Hoothoot', weight:10, minLv:3, maxLv:5 },
];
const WILD_TOTAL = WILD_TABLE.reduce((s,e)=>s+e.weight,0);

function pickWildPokemon() {
  let roll = Math.random() * WILD_TOTAL;
  for (const entry of WILD_TABLE) {
    roll -= entry.weight;
    if (roll <= 0) {
      const lv = entry.minLv + Math.floor(Math.random() * (entry.maxLv - entry.minLv + 1));
      return createPokemon(entry.name, lv);
    }
  }
  return createPokemon('Rattata', 3);
}

// ---- POKEMON INSTANCE ----
function createPokemon(speciesName, level) {
  const sp = SPECIES[speciesName];
  if (!sp) throw new Error('Unknown species: ' + speciesName);

  // Stat calculation (simplified Gen2 formula)
  const hpStat = Math.floor(((sp.hp * 2 + 31) * level) / 100) + level + 10;
  const calcStat = (base) => Math.floor(((base * 2 + 31) * level) / 100) + 5;

  const poke = {
    name:    sp.name,
    species: sp,
    level:   level,
    types:   sp.types,
    maxHP:   hpStat,
    hp:      hpStat,
    atk:     calcStat(sp.atk),
    def:     calcStat(sp.def),
    spa:     calcStat(sp.spa),
    spd:     calcStat(sp.spd),
    spe:     calcStat(sp.spe),
    // Give moves available at this level (first 4)
    moves:   sp.moves.slice(0, 4).map(m => ({ name: m, pp: MOVES[m].pp, maxPP: MOVES[m].pp })),
    status:  null, // null | 'burn' | 'poison' | 'sleep' | 'freeze' | 'paralyze'
    // Temp battle stats
    atkStage: 0, defStage: 0, spaStage: 0, spdStage: 0, speStage: 0, accStage: 0,
    xp:       0,
    xpToNext: Math.floor(Math.pow(level + 1, 3)),
  };
  return poke;
}

function calcDamage(attacker, defender, moveName) {
  const move = MOVES[moveName];
  if (!move || move.power === 0) return 0;

  const atk    = move.cat === 'special' ? attacker.spa : attacker.atk;
  const def    = move.cat === 'special' ? defender.spd : defender.def;
  const power  = move.power;
  const level  = attacker.level;

  // Gen2-like damage
  let dmg = Math.floor((((2 * level / 5 + 2) * power * atk / def) / 50) + 2);

  // Type effectiveness
  const effMult = defender.types.reduce((acc, dt) => acc * getTypeEffectiveness(move.type, dt), 1);
  dmg = Math.floor(dmg * effMult);

  // STAB
  if (attacker.types.includes(move.type)) dmg = Math.floor(dmg * 1.5);

  // Random factor
  const rand = 0.85 + Math.random() * 0.15;
  dmg = Math.max(1, Math.floor(dmg * rand));

  return { damage: dmg, effectiveness: effMult };
}

function applyStatusEffect(moveName, target) {
  if (moveName === 'Smokescreen' || moveName === 'SandAttack') {
    target.accStage = Math.max(-6, target.accStage - 1);
    return 'accuracy fell!';
  }
  if (moveName === 'Leer' || moveName === 'TailWhip') {
    target.defStage = Math.max(-6, target.defStage - 1);
    return 'defense fell!';
  }
  if (moveName === 'Growl') {
    target.atkStage = Math.max(-6, target.atkStage - 1);
    return 'attack fell!';
  }
  if (moveName === 'Foresight') {
    return 'was identified!';
  }
  if (moveName === 'StringShot') {
    target.speStage = Math.max(-6, target.speStage - 1);
    return 'speed fell!';
  }
  if (moveName === 'PoisonPowder') {
    if (!target.status) { target.status = 'poison'; return 'was poisoned!'; }
    return 'but it failed!';
  }
  if (moveName === 'Hypnosis') {
    if (!target.status) { target.status = 'sleep'; target.sleepTurns = 2; return 'fell asleep!'; }
    return 'but it failed!';
  }
  return null;
}
