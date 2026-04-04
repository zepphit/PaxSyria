/**
 * renderer.js — Syncs DOM to the flat object state.
 *
 * Each object in state.objects gets exactly one DOM element.
 * Elements are created on first appearance, updated on changes,
 * and removed when the object is deleted.
 *
 * This module knows nothing about drag or context menus.
 * Call setOnCreate(cb) so drag.js can attach its listeners.
 */

const CARD_BACK = "assets/cards/card_back.png";

let boardEl = null;

/** @type {Map<string, HTMLElement>} id -> DOM element */
const elements = new Map();

/** Called with (el, obj) whenever a new element is created. */
let onCreateCallback = null;

export function initRenderer(board) {
  boardEl = board;
}

/** Register a callback fired when a new object element is first created. */
export function setOnCreate(cb) {
  onCreateCallback = cb;
}

export function getElement(id) {
  return elements.get(id) ?? null;
}

export function clearAll() {
  for (const el of elements.values()) el.remove();
  elements.clear();
}

// ── Main render ───────────────────────────────────────────────────────────────

export function render(state) {
  const objects = state.objects;
  const currentIds = new Set(Object.keys(objects));

  // Remove elements for deleted objects
  for (const [id, el] of elements) {
    if (!currentIds.has(id)) {
      el.remove();
      elements.delete(id);
    }
  }

  // Create or update each object
  for (const obj of Object.values(objects)) {
    let el = elements.get(obj.id);
    if (!el) {
      el = createElement(obj);
      boardEl.appendChild(el);
      elements.set(obj.id, el);
      if (onCreateCallback) onCreateCallback(el, obj);
    } else {
      syncElement(el, obj);
    }
    positionElement(el, obj);
  }
}

// ── Element creation ──────────────────────────────────────────────────────────

function createElement(obj) {
  const el = document.createElement("div");
  el.className = `obj obj-${obj.type}`;
  el.dataset.objId = obj.id;
  el.dataset.objType = obj.type;

  switch (obj.type) {
    case "board":       buildBoard(el, obj);       break;
    case "card":        buildCard(el, obj);        break;
    case "deck":        buildDeck(el, obj);        break;
    case "rupee-bank":  buildRupeeBank(el, obj);   break;
    case "dial":        buildDial(el, obj);        break;
    case "cylinder":    buildCylinder(el, obj);    break;
    case "rectangle":   buildRectangle(el, obj);   break;
    case "token":       buildToken(el, obj);       break;
  }

  return el;
}

function buildBoard(el, obj) {
  const img = document.createElement("img");
  img.src = obj.image || "";
  img.alt = obj.label || "";
  img.draggable = false;
  el.appendChild(img);
}

function buildCard(el, obj) {
  el.dataset.faceUp = obj.faceUp ? "true" : "false";
  const img = document.createElement("img");
  img.src = obj.faceUp ? (obj.frontImage || CARD_BACK) : (obj.backImage || CARD_BACK);
  img.alt = "";
  img.draggable = false;
  el.appendChild(img);
}

function buildDeck(el, obj) {
  const img = document.createElement("img");
  img.src = obj.image || CARD_BACK;
  img.alt = "Deck";
  img.draggable = false;
  el.appendChild(img);

  const badge = document.createElement("div");
  badge.className = "deck-badge";
  badge.textContent = (obj.cards || []).length;
  el.appendChild(badge);
}

function buildRupeeBank(el, obj) {
  const img = document.createElement("img");
  img.src = obj.image || "";
  img.alt = "Rupee Bank";
  img.draggable = false;
  el.appendChild(img);

  const badge = document.createElement("div");
  badge.className = "rupee-bank-badge";
  badge.textContent = (obj.rupees || []).length;
  el.appendChild(badge);
}

function buildDial(el, obj) {
  const img = document.createElement("img");
  img.src = obj.image || "";
  img.alt = obj.label || "Dial";
  img.draggable = false;
  el.appendChild(img);
}

function buildCylinder(el, obj) {
  const img = document.createElement("img");
  img.src = obj.image || "";
  img.alt = obj.label || "Cylinder";
  img.draggable = false;
  el.appendChild(img);
}

function buildRectangle(el, obj) {
  const img = document.createElement("img");
  img.src = obj.image || "";
  img.alt = obj.label || "Rectangle";
  img.draggable = false;
  el.appendChild(img);
}

function buildToken(el, obj) {
  el.style.backgroundColor = obj.color || "#888";
  if (obj.label) el.textContent = obj.label;
}

// ── Element sync (update existing element) ────────────────────────────────────

function syncElement(el, obj) {
  el.dataset.locked = obj.locked ? "true" : "false";

  switch (obj.type) {
    case "card":
      syncCard(el, obj);
      break;
    case "deck":
      syncDeck(el, obj);
      break;
    case "rupee-bank":
      syncRupeeBank(el, obj);
      break;
    case "dial":
      syncDial(el, obj);
      break;
    case "cylinder":
      syncCylinder(el, obj);
      break;
    case "rectangle":
      syncRectangle(el, obj);
      break;
    case "token":
      syncToken(el, obj);
      break;
  }
}

function syncCard(el, obj) {
  const wasFaceUp = el.dataset.faceUp === "true";
  if (wasFaceUp !== !!obj.faceUp) {
    el.dataset.faceUp = obj.faceUp ? "true" : "false";
    const img = el.querySelector("img");
    if (img) img.src = obj.faceUp ? (obj.frontImage || CARD_BACK) : (obj.backImage || CARD_BACK);
  }
}

function syncDeck(el, obj) {
  const badge = el.querySelector(".deck-badge");
  if (badge) badge.textContent = (obj.cards || []).length;
  // Update image if it changed
  const img = el.querySelector("img");
  if (img && obj.image && img.src !== obj.image) img.src = obj.image;
}

function syncRupeeBank(el, obj) {
  const badge = el.querySelector(".rupee-bank-badge");
  if (badge) badge.textContent = (obj.rupees || []).length;
}

function syncDial(el, obj) {
  const img = el.querySelector("img");
  if (img && obj.image && img.src !== obj.image) img.src = obj.image;
}

function syncCylinder(el, obj) {
  const img = el.querySelector("img");
  if (img && obj.image && img.src !== obj.image) img.src = obj.image;
}

function syncRectangle(el, obj) {
  const img = el.querySelector("img");
  if (img && obj.image && img.src !== obj.image) img.src = obj.image;
}

function syncToken(el, obj) {
  el.style.backgroundColor = obj.color || "#888";
  if (obj.label !== undefined) el.textContent = obj.label;
}

// ── Positioning ───────────────────────────────────────────────────────────────

function positionElement(el, obj) {
  el.style.left     = (obj.x ?? 0) + "px";
  el.style.top      = (obj.y ?? 0) + "px";
  el.style.width    = (obj.w ?? 0) + "px";
  el.style.height   = (obj.h ?? 0) + "px";
  el.style.zIndex   = obj.zIndex ?? 1;
  el.style.transform = `rotate(${obj.rotation ?? 0}deg)`;
  el.dataset.locked  = obj.locked ? "true" : "false";
}
