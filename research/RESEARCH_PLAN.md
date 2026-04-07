# Medieval Syria Research: Between the First and Second Crusades (1099–1147)

## Scope

Characterize cities and fortresses in the Crusader-era Levant during the period between the fall of Jerusalem (1099) and the launch of the Second Crusade (1147, triggered by the fall of Edessa in 1144).

## Per-City Research Template

For each city/fortress provided, gather:

### 1. Identity & Status
- **Modern name / location** (coordinates if useful for mapping)
- **Controlling faction(s)** during 1099–1147 (Crusader state, Seljuk emirate, Fatimid, Assassin, Armenian, Byzantine, etc.)
- **Changes of control** — sieges, captures, treaties

### 2. Strategic Importance
- **Military role** — frontier fortress, interior stronghold, garrison town, naval base
- **Political role** — capital, seat of a lordship/emirate, ecclesiastical center
- **Impact rating** (high / medium / low) — how much did control of this place shape the balance of power?

### 3. Geography & Nature
- **Terrain** — mountain, plateau, coastal plain, river valley, desert fringe
- **Nearby natural features** — rivers, passes, valleys, harbors, springs, wadis
- **Climate / agricultural value** — irrigated farmland, orchting, grazing, arid

### 4. Trade & Economy
- **Trade routes passing through** — overland caravan routes, coastal shipping lanes
- **Key commodities** — silk, spices, grain, horses, slaves, metalwork
- **Market / economic significance** — major entrepôt, local market town, or purely military

### 5. Military Conflicts (1099–1147)
- **Sieges and battles** — date, belligerents, outcome
- **Raids and skirmishes** — recurring patterns of frontier violence
- **Role in larger campaigns** — e.g. Crusade of 1101, Field of Blood (1119), sieges of Aleppo/Damascus

### 6. Key Characters
- **Rulers and lords** — who held the city, their dynasty/faction
- **Military commanders** — notable generals, atabegs, constables
- **Other figures** — churchmen, merchants, chroniclers associated with the place

## Working Notes

- **97 cities** in `cities_list.txt`, processed in batches of 10
- The list is roughly **north-to-south, west-to-east** — this geographic ordering helps identify unknown names by looking at neighbors
- Spellings may be approximate or use Frankish/Latin forms — always research **both Frankish and Arabic names** and list both
- If a name isn't found directly, use geographic context from surrounding entries to locate the correct site
- **Always include web links** (academic papers, encyclopedia entries, castle surveys) citing each city when available

### Batch tracker

| Batch | Cities | Status |
|-------|--------|--------|
| 1 | #1–10: Turbessel → Castrum Puellarum | **Complete** |
| 2 | #11–20: Bathemolin → Caston | Pending |
| 3 | #21–30: Toiurdeda → Sarmada | Pending |
| 4 | #31–40: Turmanin → Armanaz | Pending |
| 5 | #41–50: Ma'arrat Misrin → Cavea Belmyr | Pending |
| 6 | #51–60: Hab → Basarfut | Pending |
| 7 | #61–70: Kafarlatha → Rochefort | Pending |
| 8 | #71–80: Qastun → Apamea | Pending |
| 9 | #81–90: Zalin → Shaizar | Pending |
| 10 | #91–97: Hama → Lakena | Pending |

## Research Approach

### Phase 1 — Baseline context
- Build a timeline of major events in the region (1099–1147)
- Map the main factions: County of Edessa, Principality of Antioch, County of Tripoli, Kingdom of Jerusalem, Seljuk emirates (Aleppo, Damascus, Mosul), Fatimids, Assassins, Armenians, Byzantines

### Phase 2 — City-by-city research (in batches of 10)
- For each city on the provided list, fill in the template above
- Use web searches for each city combining terms like: `[city name] crusades`, `[city name] medieval Syria`, `[city name] 12th century`
- Cross-reference between cities to build a picture of trade networks and military corridors
- When a name is unclear, use the north-to-south / west-to-east ordering and neighboring entries to locate the correct site
- Record both Frankish and Arabic names for every city
- Include source URLs (academic, encyclopedic, archaeological) in each city file

### Phase 3 — Synthesis
- Group cities by faction / region
- Identify key corridors and chokepoints (e.g. Orontes valley, Beqaa valley, Euphrates crossing)
- Note which cities changed hands most often (contested frontiers vs. secure interiors)
- Summarize the strategic picture for game design purposes

## Sources to Prioritize
- **Primary chronicles**: Fulcher of Chartres, Albert of Aachen, William of Tyre, Ibn al-Qalanisi, Usama ibn Munqidh, Matthew of Edessa
- **Modern scholarship**: Thomas Asbridge, Jonathan Riley-Smith, Malcolm Barber, Carole Hillenbrand
- **Reference works**: Crusades encyclopedia entries, castle/fortress surveys (e.g. Hugh Kennedy's *Crusader Castles*)
- **Maps**: Crusader-state maps showing territorial boundaries c. 1100, 1120, 1140

## Output Format

Results will be stored in this `research/` folder:
- `RESEARCH_PLAN.md` — this file
- `timeline.md` — major events 1099–1147
- `cities/[city_name].md` — one file per city, following the template above
- `factions.md` — overview of the main powers and their territories
- `trade_routes.md` — trade network summary
