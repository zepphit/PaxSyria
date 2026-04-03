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
