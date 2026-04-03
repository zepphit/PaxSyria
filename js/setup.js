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

let _uid = 0;
function uid(prefix) { return `${prefix}-${++_uid}`; }

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
  const players = [
    { id: "p1", x: 0,    y: 1015, rotation: 0   },  // left
    { id: "p2", x: 2335, y: 1015, rotation: 0   },  // right
    { id: "p3", x: 343,  y: 1723, rotation: 180 },  // bottom-left
    { id: "p4", x: 1138, y: 1723, rotation: 180 },  // bottom-centre
    { id: "p5", x: 1933, y: 1723, rotation: 180 },  // bottom-right
  ];

  for (const p of players) {
    addObject({
      id: `board-${p.id}`, type: "board",
      x: p.x, y: p.y, w: BOARD_W, h: BOARD_H,
      rotation: p.rotation, locked: true,
      image: `assets/players/board_${p.id}.png`,
      label: `Player ${p.id.slice(1)} Board`,
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

  // ── Rupee bank (tokens) ─────────────────────────────────────────────────
  for (let i = 0; i < 8; i++) {
    addObject({
      id: uid("rupee"), type: "token",
      x: 2155, y: 340 + i * 38,
      w: 32, h: 32,
      rotation: 0, locked: false,
      color: "#d4a017",
      label: "₹",
      subtype: "rupee",
    });
  }
}
