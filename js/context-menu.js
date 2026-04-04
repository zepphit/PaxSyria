/**
 * context-menu.js — Unified right-click menu for all object types.
 *
 * Menu items by type:
 *   All:   Lock / Unlock, Rotate CW, Rotate CCW
 *   card:  Flip, Remove
 *   deck:  Shuffle, Draw Top Card
 *   token: Remove
 *
 * Usage:
 *   initContextMenu(getObject, {
 *     onLock, onUnlock, onRotateCW, onRotateCCW,
 *     onFlip, onShuffle, onDraw, onRemove
 *   });
 */

const menuEl = document.getElementById("context-menu");
let getObject = null;
let cb = {};

export function initContextMenu(getObjectFn, callbacks) {
  getObject = getObjectFn;
  cb = callbacks;

  // Right-click on any object element
  document.addEventListener("contextmenu", (e) => {
    const objEl = e.target.closest(".obj");
    if (objEl) {
      e.preventDefault();
      show(e.clientX, e.clientY, objEl.dataset.objId);
    } else {
      hide();
    }
  });

  // Click outside closes the menu
  document.addEventListener("pointerdown", (e) => {
    if (!menuEl.contains(e.target)) hide();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hide();
  });
}

export function hide() {
  menuEl.style.display = "none";
}

// ── Build & show ──────────────────────────────────────────────────────────────

function show(clientX, clientY, objId) {
  const obj = getObject(objId);
  if (!obj) return;

  menuEl.innerHTML = "";
  menuEl.style.display = "block";

  const items = buildItems(obj, objId);

  for (const item of items) {
    if (item.sep) {
      const sep = document.createElement("div");
      sep.className = "context-menu-sep";
      menuEl.appendChild(sep);
      continue;
    }

    const div = document.createElement("div");
    div.className = "context-menu-item";
    div.textContent = item.label;

    if (item.header) {
      div.style.cssText = "color:var(--text-muted);cursor:default;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.5px";
    } else {
      div.addEventListener("click", () => { hide(); item.action(); });
    }

    menuEl.appendChild(div);
  }

  // Reposition if it would overflow the viewport
  menuEl.style.left = clientX + "px";
  menuEl.style.top  = clientY + "px";
  const rect = menuEl.getBoundingClientRect();
  if (rect.right  > window.innerWidth)  menuEl.style.left = (clientX - rect.width)  + "px";
  if (rect.bottom > window.innerHeight) menuEl.style.top  = (clientY - rect.height) + "px";
}

// ── Item definitions per type ─────────────────────────────────────────────────

function buildItems(obj, id) {
  const type  = obj.type;
  const label = obj.label || (type.charAt(0).toUpperCase() + type.slice(1));
  const items = [
    { label, header: true },
    { sep: true },
  ];

  // Lock / Unlock
  if (obj.locked) {
    items.push({ label: "Unlock", action: () => cb.onUnlock?.(id) });
  } else {
    items.push({ label: "Lock",   action: () => cb.onLock?.(id) });
  }

  // Rotation — only offer if not a token (tokens are round, rotation doesn't matter)
  if (type !== "token") {
    items.push(
      { label: "Rotate CW",  action: () => cb.onRotateCW?.(id)  },
      { label: "Rotate CCW", action: () => cb.onRotateCCW?.(id) },
    );
  }

  // Type-specific
  if (type === "card") {
    items.push({ sep: true });
    items.push({ label: obj.faceUp ? "Flip face down" : "Flip face up", action: () => cb.onFlip?.(id) });
    items.push({ sep: true });
    items.push({ label: "Remove", action: () => cb.onRemove?.(id) });
  }

  if (type === "deck") {
    const count = (obj.cards || []).length;
    items.push({ sep: true });
    items.push({ label: `Shuffle (${count} cards)`, action: () => cb.onShuffle?.(id) });
    items.push({ label: "Draw top card",             action: () => cb.onDraw?.(id)    });
  }

  if (type === "dial") {
    items.push({ sep: true });
    items.push({ label: "Allegiance", header: true });
    items.push(
      { label: "Afghan",  action: () => cb.onChangeAllegiance?.(id, "afghan")  },
      { label: "British", action: () => cb.onChangeAllegiance?.(id, "british") },
      { label: "Russian", action: () => cb.onChangeAllegiance?.(id, "russian") }
    );
  }

  if (type === "cylinder" || type === "rectangle") {
    items.push({ sep: true });
    items.push({ label: "Clone", action: () => cb.onClone?.(id) });
  }

  if (type === "token") {
    items.push({ sep: true });
    items.push({ label: "Remove", action: () => cb.onRemove?.(id) });
  }

  return items;
}
