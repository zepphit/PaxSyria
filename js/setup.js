/**
 * setup.js — Build the initial Pax Pamir scene.
 *
 * Places boards (map, market, 5 players), a draw deck with all 116 cards
 * shuffled face-down, and a few token examples. Everything is just objects.
 *
 * All boards start locked.
 */

import { addObject } from "./objects.js";

const CARD_BACK = "assets/cards/card_back.png";

// ── Helpers ───────────────────────────────────────────────────────────────────

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Main setup ────────────────────────────────────────────────────────────────

export async function setupInitialScene() {
  const cards = await fetch("/data/cards.json").then(r => r.json());

  // ── Map board ───────────────────────────────────────────────────────────
  addObject({
    id: "board-map", type: "board",
    x: 935, y: 710, w: 1200, h: 793,
    rotation: 0, locked: true,
    image: "assets/map.png",
    label: "Map",
  });

  // ── Market board ────────────────────────────────────────────────────────
  addObject({
    id: "board-market", type: "board",
    x: 935, y: 50, w: 1200, h: 640,
    rotation: 0, locked: true,
    image: "assets/market.png",
    label: "Market",
  });

  // ── Player boards ───────────────────────────────────────────────────────
  // 1 left, 1 right (centred on map), 3 bottom (flipped 180°, 60px gaps)
  const BOARD_W = 735, BOARD_H = 184;
  const playerColors = ["black", "blue", "gray", "red", "yellow"];
  const players = [
    { id: "p1", color: playerColors[0], x: 0,    y: 1015, rotation: 0   },  // left
    { id: "p2", color: playerColors[1], x: 2335, y: 1015, rotation: 0   },  // right
    { id: "p3", color: playerColors[2], x: 343,  y: 1723, rotation: 180 },  // bottom-left
    { id: "p4", color: playerColors[3], x: 1138, y: 1723, rotation: 180 },  // bottom-centre
    { id: "p5", color: playerColors[4], x: 1933, y: 1723, rotation: 180 },  // bottom-right
  ];

  for (const p of players) {
    addObject({
      id: `board-${p.id}`, type: "board",
      x: p.x, y: p.y, w: BOARD_W, h: BOARD_H,
      rotation: p.rotation, locked: true,
      image: `assets/players/${p.color}_board.png`,
      label: `Player ${p.id.slice(1)} Board`,
    });
  }

  // ── Allegiance dials — one per player ──────────────────────────────────────
  for (const p of players) {
    const pNum = parseInt(p.id.slice(1));
    addObject({
      id: `dial-${p.id}`, type: "dial",
      x: p.x + 40, y: p.y - 180, w: 180, h: 180,
      rotation: 0, locked: false,
      image: `assets/players/${p.color}_afghan.png`,
      color: p.color,
      allegiance: "afghan",
      label: `Player ${pNum} Dial`,
    });
  }

  // ── Player cylinders — one per player (clonable) ────────────────────────────
  const cylinderPositions = [
    { x: 900, y: 900 },
    { x: 1100, y: 900 },
    { x: 1300, y: 900 },
    { x: 1500, y: 900 },
    { x: 1700, y: 900 },
  ];

  for (const p of players) {
    const pNum = parseInt(p.id.slice(1));
    const pos = cylinderPositions[pNum - 1];
    addObject({
      id: `cylinder-${p.id}`, type: "cylinder",
      x: pos.x, y: pos.y, w: 60, h: 60,
      rotation: 0, locked: false,
      image: `assets/players/${p.color}_cylinder.png`,
      color: p.color,
      label: `Player ${pNum} Cylinder`,
    });
  }

  // ── Faction rectangles (clonable) ──────────────────────────────────────────
  const rectangles = [
    { faction: "afghan", x: 1350, y: 1100 },
    { faction: "british", x: 1550, y: 1100 },
    { faction: "russian", x: 1750, y: 1100 },
  ];

  for (const rect of rectangles) {
    addObject({
      id: `rectangle-${rect.faction}`, type: "rectangle",
      x: rect.x, y: rect.y, w: 55, h: 80,
      rotation: 0, locked: false,
      image: `assets/misc/${rect.faction}_rectangle.png`,
      faction: rect.faction,
      label: `${rect.faction.charAt(0).toUpperCase() + rect.faction.slice(1)} Rectangle`,
    });
  }

  // ── Draw deck ───────────────────────────────────────────────────────────
  const shuffled = shuffle([...cards]);
  const cardDataMap = {};
  for (const c of shuffled) {
    cardDataMap[c.id] = {
      frontImage: c.image,
      backImage: CARD_BACK,
    };
  }

  addObject({
    id: "deck-draw", type: "deck",
    x: 2155, y: 80, w: 138, h: 193,
    rotation: 0, locked: true,
    image: CARD_BACK,
    cards: shuffled.map(c => c.id),
    cardW: 138, cardH: 193,
    _cardData: cardDataMap,
    label: "Draw Deck",
  });

  // ── Rupee bank (stack of 20 rupees) ──────────────────────────────────────
  const rupeeIds = [];
  const rupeeDataMap = {};
  for (let i = 0; i < 20; i++) {
    const rid = `rupee-${i}`;
    rupeeIds.push(rid);
    rupeeDataMap[rid] = {
      id: rid,
      type: "token",
      w: 48, h: 48,
      rotation: 0,
      locked: false,
      image: "assets/misc/rupee.png",
      subtype: "rupee",
    };
  }

  addObject({
    id: "rupee-bank", type: "rupee-bank",
    x: 2155, y: 290, w: 70, h: 70,
    rotation: 0, locked: false,
    image: "assets/misc/rupee.png",
    rupees: rupeeIds,
    _rupeeData: rupeeDataMap,
    label: "Rupee Bank",
  });
}
