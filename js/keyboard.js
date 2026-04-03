/**
 * keyboard.js — Object-specific keyboard shortcuts.
 *
 *   F            — flip the hovered card (ignored if locked or not a card)
 *   Delete / ⌫  — remove the hovered object (boards are protected)
 *
 * Global shortcuts (undo/redo, zoom, save) stay in main.js.
 *
 * Usage:
 *   initKeyboard(getObject, { onFlip, onRemove });
 *   // Then in your setOnCreate callback, also call attachHover(el).
 */

let hoveredId = null;

/**
 * Attach hover tracking to an object element.
 * Call this for every new element (e.g. inside setOnCreate).
 */
export function attachHover(el) {
  el.addEventListener("pointerenter", () => {
    hoveredId = el.dataset.objId;
  });
  el.addEventListener("pointerleave", () => {
    if (hoveredId === el.dataset.objId) hoveredId = null;
  });
}

/**
 * Wire up keyboard listeners.
 * @param {(id: string) => object|null} getObjectFn
 * @param {{ onFlip?: Function, onRemove?: Function }} callbacks
 */
export function initKeyboard(getObjectFn, { onFlip, onRemove } = {}) {
  document.addEventListener("keydown", (e) => {
    // Don't intercept when focus is in a text input
    if (e.target.matches("input, textarea, select")) return;
    // Don't intercept modifier combos (those belong to main.js)
    if (e.ctrlKey || e.metaKey) return;

    if (!hoveredId) return;
    const obj = getObjectFn(hoveredId);
    if (!obj) return;

    switch (e.key) {
      case "f":
      case "F":
        if (obj.type === "card" && !obj.locked) {
          e.preventDefault();
          onFlip?.(hoveredId);
        }
        break;

      case "Delete":
      case "Backspace":
        // Boards are intentionally protected from accidental deletion
        if (obj.type !== "board" && !obj.locked) {
          e.preventDefault();
          onRemove?.(hoveredId);
        }
        break;
    }
  });
}
