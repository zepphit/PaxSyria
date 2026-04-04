/**
 * main.js — Entry point for the free-flow tabletop engine.
 *
 * Wires together: objects (state), renderer, drag, context-menu,
 * keyboard shortcuts, setup, pan/zoom, toolbar.
 */

import {
  getState, getObject, pushUndo, undo, redo,
  moveObject, bringToFront, rotateCW, rotateCCW,
  setLocked, flipCard, removeObject, addObject,
  addCardToDeck, drawFromDeck, shuffleDeck,
  addRupeeToBank, drawFromBank,
  setupCardMarket, resetDeck,
} from "./objects.js";
import { initRenderer, setOnCreate, render, clearAll } from "./renderer.js";
import { initDrag, setBoardTransform, attachDrag } from "./drag.js";
import { initContextMenu } from "./context-menu.js";
import { initKeyboard, attachHover } from "./keyboard.js";
import { setupInitialScene } from "./setup.js";

// ── DOM refs ──────────────────────────────────────────────────────────────────
const viewport = document.getElementById("viewport");
const board    = document.getElementById("board");

// ── Pan & Zoom ────────────────────────────────────────────────────────────────
let pan  = { x: 40, y: 30 };
let zoom = 0.4;
const ZOOM_MIN  = 0.25;
const ZOOM_MAX  = 3;
const ZOOM_STEP = 0.1;
let isPanning = false;
let panStart  = { x: 0, y: 0 };
let spaceHeld = false;

function clampPan() {
  const BOARD_W = 3100;
  const BOARD_H = 1950;
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  const scaledW = BOARD_W * zoom;
  const scaledH = BOARD_H * zoom;

  // When board is smaller than viewport, center it; otherwise clamp to edges
  pan.x = scaledW <= vw
    ? (vw - scaledW) / 2
    : Math.max(vw - scaledW, Math.min(0, pan.x));
  pan.y = scaledH <= vh
    ? (vh - scaledH) / 2
    : Math.max(vh - scaledH, Math.min(0, pan.y));
}

function applyTransform() {
  clampPan();
  board.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
  setBoardTransform(pan.x, pan.y, zoom);
  document.getElementById("zoom-level").textContent = Math.round(zoom * 100) + "%";
}

// Pan via middle-click or Space+left-click
viewport.addEventListener("pointerdown", (e) => {
  if (e.button === 1 || (e.button === 0 && spaceHeld)) {
    isPanning = true;
    panStart  = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    viewport.classList.add("panning");
    viewport.setPointerCapture(e.pointerId);
    e.preventDefault();
  }
});
viewport.addEventListener("pointermove", (e) => {
  if (!isPanning) return;
  pan.x = e.clientX - panStart.x;
  pan.y = e.clientY - panStart.y;
  applyTransform();
});
viewport.addEventListener("pointerup", () => {
  if (isPanning) { isPanning = false; viewport.classList.remove("panning"); }
});
viewport.addEventListener("wheel", (e) => {
  e.preventDefault();

  // Option + Scroll = Zoom
  if (e.altKey) {
    const zoomDelta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom + zoomDelta));
    applyTransform();
  } else {
    // Normal scroll = Pan
    pan.y -= e.deltaY;
    pan.x -= e.deltaX;
    applyTransform();
  }
}, { passive: false });

// ── Global keyboard shortcuts ─────────────────────────────────────────────────
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") { spaceHeld = true; viewport.style.cursor = "grab"; e.preventDefault(); }
  if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); doUndo(); }
  if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); doRedo(); }
  if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); saveTemplate(); }
  if (e.key === "=" || e.key === "+") { zoom = Math.min(ZOOM_MAX, zoom + ZOOM_STEP); applyTransform(); }
  if (e.key === "-")                  { zoom = Math.max(ZOOM_MIN, zoom - ZOOM_STEP); applyTransform(); }
});
document.addEventListener("keyup", (e) => {
  if (e.code === "Space") { spaceHeld = false; viewport.style.cursor = ""; }
});

// ── Toolbar ───────────────────────────────────────────────────────────────────

function cleanStateForSave(state) {
  const cleaned = JSON.parse(JSON.stringify(state));
  // Normalize zIndex and strip internal flags
  const objects = Object.values(cleaned.objects);
  objects.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  objects.forEach((obj, i) => {
    obj.zIndex = i + 1;
    delete obj._justDrawn;
  });
  return cleaned;
}

async function saveTemplate() {
  if (!confirm("Overwrite setup.js with current board state?")) return;
  try {
    const res = await fetch("/save-setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cleanStateForSave(getState())),
    });
    if (res.ok) {
      alert("Saved! setup.js has been updated.");
    } else {
      const text = await res.text();
      alert("Save failed: " + text);
    }
  } catch (err) {
    alert("Save failed: " + err.message);
  }
}

function resetToTemplate() {
  if (!confirm("Reset to saved template? Unsaved changes will be lost.")) return;
  location.reload();
}

document.getElementById("btn-reload-setup").addEventListener("click", () => { location.reload(); });
document.getElementById("btn-undo").addEventListener("click", doUndo);
document.getElementById("btn-redo").addEventListener("click", doRedo);
document.getElementById("btn-save").addEventListener("click", saveTemplate);
document.getElementById("btn-reset").addEventListener("click", resetToTemplate);

document.getElementById("btn-zoom-in").addEventListener("click",  () => { zoom = Math.min(ZOOM_MAX, zoom + ZOOM_STEP); applyTransform(); });
document.getElementById("btn-zoom-out").addEventListener("click", () => { zoom = Math.max(ZOOM_MIN, zoom - ZOOM_STEP); applyTransform(); });
document.getElementById("btn-zoom-fit").addEventListener("click", () => {
  zoom = viewport.clientHeight / 1950;
  pan  = { x: Math.max(0, (viewport.clientWidth - 3100 * zoom) / 2), y: 0 };
  applyTransform();
});

// ── Undo / Redo ───────────────────────────────────────────────────────────────
function doUndo() { if (undo()) fullRender(); }
function doRedo() { if (redo()) fullRender(); }

// ── Full render ───────────────────────────────────────────────────────────────
function fullRender() {
  clearAll();
  render(getState());
}

// ── Action helpers (pushUndo + action + render) ───────────────────────────────
function action(fn) {
  pushUndo();
  fn();
  fullRender();
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  board.style.width  = "3100px";
  board.style.height = "1950px";

  // Renderer
  initRenderer(board);
  setOnCreate((el) => {
    attachDrag(el);
    attachHover(el);
  });

  // Drag system
  initDrag(board, {
    onPickup(id) {
      bringToFront(id);
      render(getState());
    },
    onDrop(id, x, y) {
      pushUndo();
      moveObject(id, x, y);
      // Flip cards that were just drawn
      const obj = getObject(id);
      if (obj && obj.type === "card" && obj._justDrawn) {
        obj.faceUp = true;
        delete obj._justDrawn;
      }
      render(getState());
    },
    onDropOnDeck(cardId, deckId) {
      addCardToDeck(deckId, cardId);
      fullRender();
    },
    onDropOnBank(rupeeId, bankId) {
      addRupeeToBank(bankId, rupeeId);
      fullRender();
    },
    onDrawCard(deckId, clientX, clientY) {
      pushUndo();
      const card = drawFromDeck(deckId);
      if (card) {
        card._justDrawn = true;  // Mark as drawn so it flips on drop
        fullRender();
        setTimeout(() => {
          const cardEl = document.querySelector(`[data-obj-id="${card.id}"]`);
          if (cardEl) {
            cardEl.dispatchEvent(new PointerEvent("pointerdown", {
              button: 0, bubbles: true, cancelable: true,
              clientX, clientY,
              pointerId: 1,
            }));
          }
        }, 0);
      }
    },
    onDrawFromBank(bankId, clientX, clientY) {
      pushUndo();
      const rupee = drawFromBank(bankId);
      if (rupee) {
        fullRender();
        setTimeout(() => {
          const rupeeEl = document.querySelector(`[data-obj-id="${rupee.id}"]`);
          if (rupeeEl) {
            rupeeEl.dispatchEvent(new PointerEvent("pointerdown", {
              button: 0, bubbles: true, cancelable: true,
              clientX, clientY,
              pointerId: 1,
            }));
          }
        }, 0);
      }
    },
  });

  // Context menu
  initContextMenu(getObject, {
    onLock(id)      { action(() => setLocked(id, true));  },
    onUnlock(id)    { action(() => setLocked(id, false)); },
    onRotateCW(id)  { action(() => rotateCW(id));  },
    onRotateCCW(id) { action(() => rotateCCW(id)); },
    onFlip(id)      { action(() => flipCard(id));  },
    onShuffle(id)   { action(() => shuffleDeck(id)); },
    onDraw(id)      { action(() => drawFromDeck(id)); },
    onSetupMarket(id, n) { action(() => setupCardMarket(id, n)); },
    onResetDeck(id)      { action(() => resetDeck(id)); },
    onRemove(id)    { action(() => removeObject(id)); },
    onChangeAllegiance(id, allegiance) {
      action(() => {
        const dial = getObject(id);
        if (dial && dial.type === "dial") {
          dial.allegiance = allegiance;
          dial.image = `assets/players/${dial.color}_${allegiance}.png`;
        }
      });
    },
    onClone(id) {
      action(() => {
        const original = getObject(id);
        if (!original) return;
        const cloneId = `${original.type}-clone-${Date.now()}`;
        const cloned = JSON.parse(JSON.stringify(original));
        cloned.id = cloneId;
        cloned.x += 30;
        cloned.y += 30;
        addObject(cloned);
      });
    },
  });

  // Keyboard shortcuts (F to flip, Delete to remove)
  initKeyboard(getObject, {
    onFlip(id)   { action(() => flipCard(id));    },
    onRemove(id) { action(() => removeObject(id)); },
  });

  // Always build from setup.js — Save overwrites it directly
  try {
    await setupInitialScene();
    console.log("setupInitialScene completed, objects:", Object.keys(getState().objects).length);
  } catch (err) {
    console.error("setupInitialScene failed:", err);
    throw err;
  }

  console.log("About to applyTransform...");
  console.log("Pan:", pan, "Zoom:", zoom);

  // Center the board on page load
  pan = {
    x: Math.max(0, (viewport.clientWidth - 3100 * zoom) / 2),
    y: Math.max(0, (viewport.clientHeight - 1950 * zoom) / 2),
  };

  applyTransform();
  console.log("Board transform:", board.style.transform);
  console.log("About to fullRender...");
  fullRender();
  console.log("Init complete!, board has", board.children.length, "children");
}

init();
