/**
 * objects.js — Core object model and state management.
 *
 * State is a flat dict of objects. No zones. No piece arrays.
 * Every object lives at an absolute (x, y) on the canvas.
 *
 * Object types:
 *   "board"  — background image; can be locked/unlocked/rotated
 *   "card"   — has front/back images; can be flipped, rotated, locked
 *   "deck"   — a stack of cards; cards dropped on it auto-flip face-down
 *   "token"  — small coloured shape (rupee, cylinder, disc, etc.)
 *
 * Common fields on every object:
 *   id       {string}
 *   type     {"board"|"card"|"deck"|"token"}
 *   x, y     {number}  top-left position on the canvas
 *   w, h     {number}  display size in px
 *   rotation {0|90|180|270}
 *   locked   {boolean}
 *   zIndex   {number}
 *
 * Type-specific fields:
 *   board:  image {string}
 *   card:   frontImage {string}, backImage {string}, faceUp {boolean}
 *   deck:   image {string} (card back shown), cards {string[]} (ordered ids,
 *           top of deck last), cardW {number}, cardH {number}
 *   token:  color {string}, label {string}, subtype {string}
 */

/** @type {{ objects: Object.<string, Object> }} */
let state = { objects: {} };

const undoStack = [];
const redoStack = [];
const MAX_UNDO = 100;

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// ── State access ──────────────────────────────────────────────────────────────

export function getState() { return state; }
export function setState(s) { state = s; }

export function getObject(id)   { return state.objects[id] ?? null; }
export function getAllObjects()  { return state.objects; }

// ── Undo / Redo ───────────────────────────────────────────────────────────────

export function pushUndo() {
  undoStack.push(clone(state));
  if (undoStack.length > MAX_UNDO) undoStack.shift();
  redoStack.length = 0;
}

export function undo() {
  if (!undoStack.length) return null;
  redoStack.push(clone(state));
  state = undoStack.pop();
  return state;
}

export function redo() {
  if (!redoStack.length) return null;
  undoStack.push(clone(state));
  state = redoStack.pop();
  return state;
}

export function canUndo() { return undoStack.length > 0; }
export function canRedo() { return redoStack.length > 0; }

// ── CRUD ──────────────────────────────────────────────────────────────────────

export function addObject(obj) {
  // Auto-assign zIndex above all current objects
  if (obj.zIndex == null) {
    const maxZ = Object.values(state.objects).reduce((m, o) => Math.max(m, o.zIndex ?? 0), 0);
    obj.zIndex = maxZ + 1;
  }
  state.objects[obj.id] = obj;
}

export function removeObject(id) {
  delete state.objects[id];
}

export function updateObject(id, fields) {
  const obj = state.objects[id];
  if (!obj) return;
  Object.assign(obj, fields);
}

// ── Object actions ────────────────────────────────────────────────────────────

export function moveObject(id, x, y) {
  const obj = state.objects[id];
  if (!obj || obj.locked) return;
  obj.x = x;
  obj.y = y;
}

export function bringToFront(id) {
  const maxZ = Object.values(state.objects).reduce((m, o) => Math.max(m, o.zIndex ?? 0), 0);
  const obj = state.objects[id];
  if (obj) obj.zIndex = maxZ + 1;
}

export function rotateCW(id) {
  const obj = state.objects[id];
  if (!obj) return;
  obj.rotation = ((obj.rotation ?? 0) + 90) % 360;
}

export function rotateCCW(id) {
  const obj = state.objects[id];
  if (!obj) return;
  obj.rotation = ((obj.rotation ?? 0) + 270) % 360;
}

export function setLocked(id, locked) {
  const obj = state.objects[id];
  if (obj) obj.locked = locked;
}

/** Flip a card between faceUp / faceDown. No-op if locked or not a card. */
export function flipCard(id) {
  const obj = state.objects[id];
  if (!obj || obj.locked || obj.type !== "card") return;
  obj.faceUp = !obj.faceUp;
}

// ── Deck operations ───────────────────────────────────────────────────────────

/**
 * Add a card object to a deck. The card is removed from the flat objects dict
 * and its id is pushed onto deck.cards. Returns false if deck not found.
 */
export function addCardToDeck(deckId, cardId) {
  const deck = state.objects[deckId];
  const card = state.objects[cardId];
  if (!deck || deck.type !== "deck" || !card || card.type !== "card") return false;
  removeObject(cardId);
  deck.cards.push(cardId);
  // Store card data inside the deck so it can be restored on draw
  deck._cardData = deck._cardData || {};
  deck._cardData[cardId] = card;
  return true;
}

/**
 * Draw the top card from a deck. Places it as a free card object next to the
 * deck, face-down. Returns the new card object, or null if deck is empty.
 */
export function drawFromDeck(deckId) {
  const deck = state.objects[deckId];
  if (!deck || deck.type !== "deck" || !deck.cards.length) return null;
  const cardId = deck.cards.pop();
  const cardData = (deck._cardData || {})[cardId] || {};
  const card = {
    ...cardData,
    id: cardId,
    type: "card",
    x: deck.x + (deck.w || 0) + 20,
    y: deck.y,
    w: deck.cardW || 100,
    h: deck.cardH || 140,
    rotation: 0,
    locked: false,
    faceUp: false,
  };
  addObject(card);
  return card;
}

/** Shuffle the cards array inside a deck in place. */
export function shuffleDeck(deckId) {
  const deck = state.objects[deckId];
  if (!deck || deck.type !== "deck") return;
  const arr = deck.cards;
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ── Card categories ───────────────────────────────────────────────────────────

function cardNumber(id) {
  // Matches: c001, c101, card_001, card-001, etc.
  const m = id.match(/^c(?:ard[_-]?)?(\d+)$/i);
  return m ? parseInt(m[1], 10) : null;
}

function categorizeCardIds(cardIds) {
  const normal = [], event = [], dominance = [];
  for (const id of cardIds) {
    const n = cardNumber(id);
    if (n === null) continue;
    if (n <= 100)       normal.push(id);
    else if (n <= 104)  dominance.push(id);
    else                event.push(id);
  }
  return { normal, event, dominance };
}

function shuffleArr(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Sets up the card market for n players (3, 4 or 5).
 * Rebuilds the deck into stacks A–F, then draws 12 cards face-up onto the market.
 * Unused cards are placed in a face-down removed pile to the left of the market.
 * Market board: x=935, y=50, w=1200, h=640. Cards: 138×193.
 */
export function setupCardMarket(deckId, playerCount) {
  const deck = state.objects[deckId];
  if (!deck || deck.type !== "deck") return;

  const allCardIds = [...deck.cards];
  const cardData = { ...(deck._cardData || {}) };

  const { normal, event, dominance } = categorizeCardIds(allCardIds);
  shuffleArr(normal);
  shuffleArr(event);
  shuffleArr(dominance);

  const n = playerCount;

  const stackDefs = [
    { normalCount: 5 + n, eventCount: 0, domCount: 0 }, // A (top)
    { normalCount: 5 + n, eventCount: 2, domCount: 0 }, // B
    { normalCount: 5 + n, eventCount: 1, domCount: 1 }, // C
    { normalCount: 5 + n, eventCount: 1, domCount: 1 }, // D
    { normalCount: 5 + n, eventCount: 1, domCount: 1 }, // E
    { normalCount: 5 + n, eventCount: 1, domCount: 1 }, // F (bottom)
  ];

  const stacks = stackDefs.map(({ normalCount, eventCount, domCount }) => {
    const ids = [
      ...normal.splice(0, normalCount),
      ...event.splice(0, eventCount),
      ...dominance.splice(0, domCount),
    ];
    return shuffleArr(ids);
  });

  // Remaining cards after splicing are unused
  const unusedIds = [...normal, ...event, ...dominance];

  // Assemble final deck: F at bottom (index 0), A on top (last)
  const finalCards = [
    ...stacks[5], ...stacks[4], ...stacks[3],
    ...stacks[2], ...stacks[1], ...stacks[0],
  ];

  deck.cards = finalCards;
  deck._cardData = cardData;

  let maxZ = Object.values(state.objects).reduce((m, o) => Math.max(m, o.zIndex ?? 0), 0);

  // Place unused cards as a face-down pile, rotated 90°, to the left of the market
  if (unusedIds.length) {
    const REMOVED_DECK_ID = "deck-removed";
    // Remove old removed deck if present
    delete state.objects[REMOVED_DECK_ID];

    const removedCardData = {};
    for (const id of unusedIds) {
      removedCardData[id] = cardData[id] || {};
    }

    state.objects[REMOVED_DECK_ID] = {
      id: REMOVED_DECK_ID,
      type: "deck",
      x: 935 - 138 - 30, // left of market
      y: 50,
      w: 138,
      h: 193,
      rotation: 90,
      locked: false,
      image: "assets/cards/card_back.png",
      cards: unusedIds,
      cardW: 138,
      cardH: 193,
      _cardData: removedCardData,
      label: "Removed Cards",
      zIndex: ++maxZ,
    };
  }

  // Draw 12 cards face-up onto the market board in a 2×6 grid
  const MARKET_X = 935, MARKET_Y = 50, MARKET_W = 1200;
  const CARD_W = 138, CARD_H = 193;
  const COLS = 6;
  const CARD_GAP = 10;

  // Center the block of 6 cards horizontally within the market
  const blockW = COLS * CARD_W + (COLS - 1) * CARD_GAP;
  const startX = MARKET_X + (MARKET_W - blockW) / 2;

  // Row Y positions tuned to the market board layout
  const rowY = [MARKET_Y + 210, MARKET_Y + 427];

  for (let i = 0; i < 12; i++) {
    const cardId = deck.cards.pop();
    if (!cardId) break;
    const data = cardData[cardId] || {};
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    state.objects[cardId] = {
      ...data,
      id: cardId,
      type: "card",
      x: startX + col * (CARD_W + CARD_GAP),
      y: rowY[row],
      w: CARD_W,
      h: CARD_H,
      rotation: 0,
      locked: false,
      faceUp: true,
      zIndex: ++maxZ,
    };
  }
}

// ── Save / Load ───────────────────────────────────────────────────────────────

export function saveToFile() {
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `paxsyria-save-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function loadFromFile() {
  return new Promise((resolve) => {
    const input = document.getElementById("file-input");
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const loaded = JSON.parse(ev.target.result);
          undoStack.length = 0;
          redoStack.length = 0;
          state = loaded;
          resolve(state);
        } catch (err) {
          console.error("Failed to load save:", err);
          resolve(null);
        }
      };
      reader.readAsText(file);
      input.value = "";
    };
    input.click();
  });
}

// ── Rupee Bank operations ──────────────────────────────────────────────────────

export function addRupeeToBank(bankId, rupeeId) {
  const bank = state.objects[bankId];
  const rupee = state.objects[rupeeId];
  if (!bank || bank.type !== "rupee-bank" || !rupee || rupee.type !== "token") return false;
  removeObject(rupeeId);
  bank.rupees.push(rupeeId);
  bank._rupeeData = bank._rupeeData || {};
  bank._rupeeData[rupeeId] = rupee;
  return true;
}

export function drawFromBank(bankId) {
  const bank = state.objects[bankId];
  if (!bank || bank.type !== "rupee-bank" || !bank.rupees.length) return null;
  const rupeeId = bank.rupees.pop();
  const rupeeData = (bank._rupeeData || {})[rupeeId] || {};
  const rupee = {
    ...rupeeData,
    id: rupeeId,
    type: "token",
    x: bank.x + (bank.w || 0) + 20,
    y: bank.y,
    w: 48, h: 48,
    rotation: 0,
    locked: false,
    image: "assets/misc/rupee.png",
    subtype: "rupee",
  };
  addObject(rupee);
  return rupee;
}
