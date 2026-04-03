# PaxSyria Engine

A free-flow digital tabletop simulator. No rules enforcement — just drag, drop, flip, rotate.

## Tech

- **Vanilla JS ES modules** — no framework, no build step, no TypeScript
- **Node.js static server** — `node server.js` → `localhost:3000`
- **Pointer Events API** for drag-and-drop
- **CSS transforms** for pan/zoom (`translate + scale` on `#board`)

## Architecture

All game elements are **objects** in a flat `state.objects` dict. No zones, no piece arrays, no layout modes.

4 object types: `board`, `card`, `deck`, `token`. All share: `id, type, x, y, w, h, rotation, locked, zIndex`.

### Module map

| File | Role |
|------|------|
| `js/objects.js` | State model, undo/redo, CRUD, deck operations, save/load |
| `js/renderer.js` | DOM sync — one element per object, diff-based updates |
| `js/drag.js` | Pointer Events drag, deck-drop detection |
| `js/context-menu.js` | Right-click menus, type-driven |
| `js/keyboard.js` | Hover tracking + F to flip, Delete to remove |
| `js/setup.js` | Initial Pax Pamir scene (boards, deck, tokens) |
| `js/main.js` | Entry point — wires modules, pan/zoom, toolbar |

### Data flow

`setup.js` → populates `objects.js` state → `renderer.js` syncs DOM → `drag.js` / `context-menu.js` / `keyboard.js` call back into `main.js` → `main.js` mutates state via `objects.js` → re-renders.

`renderer.js` calls `setOnCreate(cb)` so `drag.js` and `keyboard.js` can attach their listeners to new elements without circular imports.

## Conventions

- Keep it simple. No abstractions for one-time operations.
- No build step. No npm dependencies beyond serving static files.
- All coordinates are absolute board-space pixels.
- Boards are locked by default. Cards and tokens are unlocked.
- `pushUndo()` before any state mutation that should be undoable.
- `fullRender()` = `clearAll()` + `render()` — used after undo/redo/load. For incremental changes, just call `render(getState())`.

## Assets

- `assets/map.png` — cloth board (displayed 1200×793)
- `assets/market.png` — market board (displayed 1200×640)
- `assets/Cards/` — 116 card PNGs + `card_back.png` (note: capital C directory, but JSON refs use lowercase `assets/cards/` — works on macOS case-insensitive FS)
- `assets/players/board_p1.png` … `board_p5.png` — player boards (displayed 735×184)

## Canvas layout

- Total canvas: 3100×1950px
- Market: (935, 50)
- Map: (935, 710)
- Draw deck: (2155, 80)
- P1 left: (0, 1015), P2 right: (2335, 1015)
- P3/P4/P5 bottom: x starts at 343, y=1723, 60px gaps, rotated 180°

## Running

```sh
node server.js
# → http://localhost:3000
```
