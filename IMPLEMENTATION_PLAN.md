# PaxSyria Digital Tabletop Engine — Implementation Plan

## Vision

A localhost-run, Vassal-like digital tabletop simulator with no rules enforcement. Players freely drag, drop, rotate, flip, and stack game objects on a canvas. The first target game is **Pax Pamir 2nd Edition**; swapping in **Pax Syria** means replacing JSON + image assets.

---

## Architecture (v2 — Free-Flow)

The engine was overhauled from a zone/piece tracking system to a free-flow canvas. All game elements are **objects** with absolute positions — no zones, no layout modes, no snapping.

### Object types

| Type | Description | Interactions |
|------|-------------|-------------|
| **board** | Background image (map, market, player mats) | Lock/unlock, rotate, drag |
| **card** | Two-sided image (front/back) | Flip (F key), lock/unlock, rotate, drag |
| **deck** | Container holding card IDs, shows card back + count | Shuffle, draw, drop cards onto it |
| **token** | Small colored shape (rupees, markers) | Lock/unlock, drag, remove |

### Module structure

```
js/
├── main.js          Entry point, wires everything, pan/zoom, toolbar
├── objects.js       State model, undo/redo, save/load, CRUD, deck ops
├── renderer.js      DOM sync from state — create/update/remove elements
├── drag.js          Pointer Events drag, deck drop detection
├── context-menu.js  Right-click menus, type-driven item lists
├── keyboard.js      Hover tracking + F/Delete shortcuts
└── setup.js         Initial Pax Pamir scene builder
```

### Data

```
data/
└── cards.json       Card IDs + image paths (116 cards)
```

### Assets

```
assets/
├── map.png              Cloth board (1200×793 displayed)
├── market.png           Market board (1200×640 displayed)
├── Cards/               116 card PNGs + card_back.png
├── players/             board_p1.png … board_p5.png (735×184 displayed)
└── Icons/               (unused currently)
```

---

## Completed Steps

### ~~Step 1 — Project Scaffold & Dev Server~~ ✅
Static Node.js server, HTML shell, CSS reset, ES modules.

### ~~Step 2 — Drag & Drop Engine~~ ✅
Pointer Events drag, pan/zoom (CSS transform), Space+drag panning.

### ~~Step 3 — State Management & Save/Load~~ ✅
JSON-serializable state, snapshot undo/redo (100 deep), save/load to file.

### ~~Step 4 — Map & Market~~ ✅
Board images placed as objects. Cards extracted from PnP PDF.

### ~~Step 5 — Player Boards~~ ✅
5 player boards: 1 left, 1 right, 3 bottom (180° rotated). 735×184 each.

### ~~Step 6 — Free-Flow Overhaul~~ ✅
Replaced zone/piece system with flat object model. All objects freely positioned. Context menus, keyboard shortcuts, deck operations.

---

## Next Steps

### Step 7 — Token Variety & Supply Pieces

**Goal:** Populate the canvas with all the game tokens Pax Pamir needs.

**Deliverables:**
- Extend `setup.js` with coalition pieces (armies, roads) as tokens or small colored shapes
- Player-owned pieces: tribes (cylinders), spies (cylinders) in player colors
- Place starting pieces on the map per Pax Pamir setup rules
- Rupee bank already exists (8 tokens); expand as needed

**Done when:** Opening the app shows a fully populated starting position for 5-player Pax Pamir.

---

### Step 8 — Discard Pile & Multiple Decks

**Goal:** Support a discard pile and potentially a separate event deck.

**Deliverables:**
- Add a discard deck object in `setup.js` (empty at start, positioned near draw deck)
- Context menu on cards: "Move to discard" → adds card to discard deck
- Context menu on discard deck: "Browse" → fans out cards face-up (or draws them all out)
- Optional: separate event card deck

**Done when:** Cards can flow: deck → canvas → discard, with full round-trip.

---

### Step 9 — Visual Polish

**Goal:** Improve look and feel without changing the architecture.

**Deliverables:**
- Hover effect on cards/tokens (subtle lift shadow)
- Smooth drag start/end transitions
- Better lock indicator (current emoji is functional but crude)
- Board labels (small text near each player board showing player name/color)
- Canvas background texture or subtle grid

**Done when:** The app looks intentional and polished, not prototypey.

---

### Step 10 — Game Setup Presets

**Goal:** One-click setup for different player counts.

**Deliverables:**
- "New Game" menu in toolbar with 1–5 player options
- Each preset places the correct starting pieces, shuffles the deck, and positions boards
- "Reset" button to reload the current preset

**Done when:** Click "New Game → 3 players" and the board is ready to play.

---

### Step 11 — Quality-of-Life

**Goal:** Productivity features for play sessions.

**Deliverables:**
- **Box select:** Shift+drag to select multiple objects, move as group
- **Snap-to-grid toggle:** Optional 10px alignment grid
- **Bring to Front / Send to Back:** Explicit z-order control in context menu
- **Turn counter** in toolbar (manual increment)
- **Notes panel** (text area for tracking game state)
- **Dice roller** (for Pax Syria — Pax Pamir doesn't use dice)

**Done when:** Extended play sessions feel smooth and efficient.

---

### Step 12 — Pax Syria Adaptation

**Goal:** Swap in Pax Syria game assets and configurations.

**Deliverables:**
- New card images and `cards.json` for Pax Syria
- New map image for Syria region board
- New/modified player boards
- Adjusted `setup.js` (or a separate setup) for Pax Syria starting state
- Any new token types specific to Pax Syria

**Done when:** The engine runs Pax Syria with its own assets, using the same underlying code.

---

## Architecture Principles

1. **Free-flow, not zone-based.** Objects have x/y positions on the canvas. No zones, no snapping, no layout constraints. Players arrange everything by hand.

2. **No rules enforcement.** The engine provides manipulation primitives (drag, flip, rotate, shuffle). Players enforce the rules.

3. **Flat state.** `state.objects` is a single dict keyed by ID. Save it = save the game. Undo = restore a previous snapshot.

4. **Data-driven.** Game-specific details (card images, board layout, starting positions) live in `data/` and `assets/`. The engine reads config and renders accordingly.

5. **No build step.** ES modules, plain CSS, plain HTML. Edit → refresh.

6. **Objects, not pieces.** Everything on the canvas — boards, cards, tokens, decks — is an object with the same base properties (position, rotation, lock state). Type-specific behavior is minimal.
