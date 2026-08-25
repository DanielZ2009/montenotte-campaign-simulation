# Montenotte Prototype Architecture

The browser entry point remains `outputs/montenotte-prototype.html`. GitHub Pages and existing bookmarks can continue to use the same URL.

## Source layout

```text
outputs/
  montenotte-prototype.html  Page structure and accessible controls
  css/
    map.css                  Map viewport, overlays, repair panel, markers, and routes
    ui.css                   Decision panel, briefing, dispatches, and responsive layout
  data/
    map-data.js              Locked locations, roads, route catalog, and terrain
    units.js                 French, Austrian, and Sardinian formations
    scenarios.js             Opening decision tree and campaign branches
    content.js               Briefing text, officer voices, events, and Allied doctrine
  js/
    state.js                 Mutable campaign state and DOM references
    core.js                  Clock, state updates, and shared helpers
    storage.js               Persistent repair data
    map.js                   Map geometry, zoom, panning, and overlays
    intelligence.js          Fog of war and enemy reports
    units.js                 Formation movement, fatigue, strength, and losses
    repair.js                Instructor-only route, location, report, and movement tools
    narrative.js             Dispatches, officer comments, and narrative events
    combat.js                Engagement reports, outcomes, and historical debrief
    briefing.js              Interactive opening briefing
    ai.js                    Allied reactions and operational intentions
    orders.js                Player choices and order sheets
    campaign.js              Turn progression and campaign clock
    ui.js                    Screen rendering
    main.js                  Event wiring and startup only
```

## Editing rules

- Treat `data/map-data.js` as the canonical base geometry. Its percentage coordinates are the user-corrected locations and routes.
- Put historical facts and editable scenario content in `data/`, not in rendering functions.
- Put calculations and state changes in the relevant system under `js/`; keep `ui.js` concerned with presentation.
- Add startup listeners only in `main.js`.
- Normal players do not see repair tools. Open the page with `?repair=1` to edit map data or `?dev=1` to edit map data and expose instructor meters.
- Browser repair data is stored under `montenottePrototypeMapRepairsV1`. Empty saved routes never replace the canonical routes.

The files are loaded as ordered classic scripts for compatibility with direct local-file use and the existing prototype. This preserves current behavior while providing clear ownership boundaries. A later build-system migration can convert these boundaries to ES modules one file at a time.

## Verification

Run the static check after changing source files:

```sh
node scripts/check-static.js
```

The check compiles the scripts in browser load order and verifies that every local stylesheet, script, image, and redirect target exists.
