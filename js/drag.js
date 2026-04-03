/**
 * drag.js — Free-flow drag for the new object system.
 *
 * No zones, no snapping. Objects land wherever you drop them.
 * Exception: cards dropped onto a deck trigger onDropOnDeck.
 *
 * Usage:
 *   initDrag(boardEl, { onPickup, onDrop, onDropOnDeck });
 *   // Then register attachDrag as the renderer's onCreate callback:
 *   setOnCreate((el, obj) => attachDrag(el));
 */

let boardEl   = null;
let boardTx   = { x: 0, y: 0, scale: 1 };

// Drag state
let dragEl    = null;
let dragId    = null;
let dragType  = null;
let offsetX   = 0;
let offsetY   = 0;

// Callbacks (set by initDrag)
let onPickup      = null;  // (id) => void
let onDrop        = null;  // (id, x, y) => void
let onDropOnDeck  = null;  // (cardId, deckId) => void

export function initDrag(board, callbacks = {}) {
  boardEl       = board;
  onPickup      = callbacks.onPickup     ?? null;
  onDrop        = callbacks.onDrop       ?? null;
  onDropOnDeck  = callbacks.onDropOnDeck ?? null;

  document.addEventListener("pointermove", onPointerMove);
  document.addEventListener("pointerup",   onPointerUp);
}

export function setBoardTransform(tx, ty, scale) {
  boardTx = { x: tx, y: ty, scale };
}

/**
 * Attach drag behaviour to a single object element.
 * Called by renderer's setOnCreate callback for every new element.
 */
export function attachDrag(el) {
  el.addEventListener("pointerdown", onPointerDown);
}

// ── Coordinate helpers ────────────────────────────────────────────────────────

function viewportToBoard(clientX, clientY) {
  const vp   = boardEl.parentElement;
  const rect = vp.getBoundingClientRect();
  return {
    bx: (clientX - rect.left - boardTx.x) / boardTx.scale,
    by: (clientY - rect.top  - boardTx.y) / boardTx.scale,
  };
}

// ── Event handlers ────────────────────────────────────────────────────────────

function onPointerDown(e) {
  if (e.button !== 0) return;

  const el = e.currentTarget;
  // Respect locked objects
  if (el.dataset.locked === "true") return;
  // Ignore right-click targets (context menu handles those)
  if (e.target.closest(".context-menu")) return;

  dragEl   = el;
  dragId   = el.dataset.objId;
  dragType = el.dataset.objType;

  const { bx, by } = viewportToBoard(e.clientX, e.clientY);
  offsetX = bx - (parseFloat(el.style.left) || 0);
  offsetY = by - (parseFloat(el.style.top)  || 0);

  el.classList.add("obj--dragging");
  el.setPointerCapture(e.pointerId);

  if (onPickup) onPickup(dragId);

  e.preventDefault();
  e.stopPropagation();
}

function onPointerMove(e) {
  if (!dragEl) return;

  const { bx, by } = viewportToBoard(e.clientX, e.clientY);
  const newX = bx - offsetX;
  const newY = by - offsetY;

  // Move visually immediately (optimistic)
  dragEl.style.left = newX + "px";
  dragEl.style.top  = newY + "px";
}

function onPointerUp(e) {
  if (!dragEl) return;

  dragEl.classList.remove("obj--dragging");

  const x = parseFloat(dragEl.style.left) || 0;
  const y = parseFloat(dragEl.style.top)  || 0;

  // Check if a card was dropped onto a deck
  if (dragType === "card") {
    const deckId = hitTestDecks(dragEl);
    if (deckId && onDropOnDeck) {
      onDropOnDeck(dragId, deckId);
      dragEl = null; dragId = null; dragType = null;
      return;
    }
  }

  if (onDrop) onDrop(dragId, x, y);

  dragEl = null; dragId = null; dragType = null;
}

// ── Deck hit-test ─────────────────────────────────────────────────────────────

/**
 * Returns the id of the first deck element whose rect overlaps the center
 * of the dragged element, or null if none.
 */
function hitTestDecks(draggedEl) {
  const dEl  = draggedEl;
  const dRect = dEl.getBoundingClientRect();
  const cx   = dRect.left + dRect.width  / 2;
  const cy   = dRect.top  + dRect.height / 2;

  for (const deckEl of boardEl.querySelectorAll(".obj-deck")) {
    if (deckEl === dEl) continue;
    const r = deckEl.getBoundingClientRect();
    if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) {
      return deckEl.dataset.objId;
    }
  }
  return null;
}
