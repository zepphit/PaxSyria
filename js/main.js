/**
 * main.js — Entry point for the free-flow tabletop engine.
 *
 * Wires together: objects (state), renderer, drag, context-menu,
 * keyboard shortcuts, setup, pan/zoom, toolbar.
 */

import {
  getState, getObject, pushUndo, undo, redo,
  moveObject, bringToFront, rotateCW, rotateCCW,
  setLocked, flipCard, removeObject,
  addCardToDeck, drawFromDeck, shuffleDeck,
  saveToFile, loadFromFile,
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
let zoom = 1;
const ZOOM_MIN  = 0.25;
const ZOOM_MAX  = 3;
const ZOOM_STEP = 0.1;
let isPanning = false;
let panStart  = { x: 0, y: 0 };
let spaceHeld = false;

function applyTransform() {
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
  pan.y -= e.deltaY;
  pan.x -= e.deltaX;
  applyTransform();
}, { passive: false });

// ── Global keyboard shortcuts ─────────────────────────────────────────────────
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") { spaceHeld = true; viewport.style.cursor = "grab"; e.preventDefault(); }
  if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); doUndo(); }
  if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); doRedo(); }
  if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); saveToFile(); }
  if (e.key === "=" || e.key === "+") { zoom = Math.min(ZOOM_MAX, zoom + ZOOM_STEP); applyTransform(); }
  if (e.key === "-")                  { zoom = Math.max(ZOOM_MIN, zoom - ZOOM_STEP); applyTransform(); }
});
document.addEventListener("keyup", (e) => {
  if (e.code === "Space") { spaceHeld = false; viewport.style.cursor = ""; }
});

// ── Toolbar ───────────────────────────────────────────────────────────────────
document.getElementById("btn-undo").addEventListener("click", doUndo);
document.getElementById("btn-redo").addEventListener("click", doRedo);
document.getElementById("btn-save").addEventListener("click", saveToFile);
document.getElementById("btn-load").addEventListener("click", async () => {
  const loaded = await loadFromFile();
  if (loaded) fullRender();
});
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
      render(getState());
    },
    onDropOnDeck(cardId, deckId) {
      addCardToDeck(deckId, cardId);
      fullRender();
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
    onRemove(id)    { action(() => removeObject(id)); },
  });

  // Keyboard shortcuts (F to flip, Delete to remove)
  initKeyboard(getObject, {
    onFlip(id)   { action(() => flipCard(id));    },
    onRemove(id) { action(() => removeObject(id)); },
  });

  // Build the initial scene
  await setupInitialScene();

  applyTransform();
  fullRender();
}

init();
