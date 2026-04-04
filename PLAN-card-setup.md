# Plan: Deck Setup & Market Layout

## Card Categories
- **Normal cards**: card_001 to card_100 (100 cards)
- **Dominance checks**: card_101 to card_104 (4 cards)
- **Event cards**: card_105 to card_116 (12 cards)

## Setup Algorithm (for n players: 3, 4, or 5)

Build 6 stacks bottom-up:

| Stack | Normal | Event | Dominance | Total |
|-------|--------|-------|-----------|-------|
| A     | 5+n    | 0     | 0         | 5+n   |
| B     | 5+n    | 2     | 0         | 7+n   |
| C     | 5+n    | 1     | 1         | 7+n   |
| D     | 5+n    | 1     | 1         | 7+n   |
| E     | 5+n    | 1     | 1         | 7+n   |
| F     | 5+n    | 1     | 1         | 7+n   |

Each stack is shuffled independently, then assembled: A on top of B on top of C on top of D on top of E on top of F.

Then draw 12 cards from the top and lay them face-up on the market board in a 2×6 grid.

## Implementation Steps

### Step 1: Add card category metadata to objects.js
- Export a helper `categorizeCards(cards)` that splits a deck's card IDs into `{ normal, event, dominance }` based on the ID numbering (card_001–card_100, card_101–card_104, card_105–card_116).

### Step 2: Add `setupCardMarket(deckId, playerCount)` to objects.js
- Pulls all cards from the deck.
- Categorizes them.
- Shuffles each category.
- Deals them into stacks A–F per the table above, drawing from the shuffled category pools.
- Shuffles each stack independently.
- Reassembles the deck: F at bottom, then E, D, C, B, A on top.
- Draws 12 cards from the top of the deck.
- Places them face-up on the market board in a 2×6 grid.
- Market grid coordinates: compute from the market board position (935, 50) and size (1200×640), with card size ~138×193. Two rows of 6, evenly spaced.

### Step 3: Add context menu options to the deck
- In `context-menu.js`, add a submenu under deck type: "Setup Market (3P)", "Setup Market (4P)", "Setup Market (5P)".
- Each calls the corresponding `onSetupMarket(deckId, playerCount)` callback.

### Step 4: Wire callback in main.js
- Add `onSetupMarket(id, n)` to the context menu callbacks.
- Wraps `setupCardMarket(id, n)` inside `action()` so it's undoable.

### Step 5: Compute market grid positions
- Market board: x=935, y=50, w=1200, h=640.
- 2 rows × 6 columns of cards (138×193 each).
- Calculate positions with even spacing within the market area.
- Cards should be placed face-up.
