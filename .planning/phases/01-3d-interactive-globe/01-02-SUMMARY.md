---
phase: 01-3d-interactive-globe
plan: 02
subsystem: 3d-globe-interactivity
tags: [react, globe, interactivity, tooltips, animations]

dependency-graph:
  requires: [Globe3D-component, travel-data]
  provides: [globe-tooltips, globe-click-handlers, flight-path-arcs]
  affects: [globe-ux]

tech-stack:
  added: []
  patterns:
    - "Native HTML tooltips via polygonLabel accessor for country hover states"
    - "Click handlers with camera animation using pointOfView API"
    - "React state management for hover and selection tracking"
    - "Animated arcs with dash animation using arcDashAnimateTime"
    - "Arc altitude management to prevent z-fighting with polygons"
    - "Centroid calculation from polygon coordinates for camera targeting"

key-files:
  created: []
  modified:
    - src/components/Globe3D.tsx: "Added interactivity (tooltips, click handlers) and animated flight path arcs (328 lines, +171 from baseline)"

decisions:
  - choice: "Use native HTML tooltips via polygonLabel instead of custom React tooltip"
    reason: "react-globe.gl provides built-in tooltip positioning and lifecycle management, simpler than manual positioning"
    alternatives: ["Custom React tooltip component with absolute positioning"]
  - choice: "Orange arcs (rgba(249, 115, 22)) matching marker-current color"
    reason: "Visual consistency with existing travel map markers for current location"
    alternatives: ["Indigo arcs matching visited country color", "White/neutral arcs"]
  - choice: "Arc altitude 0.15 with auto-scale 0.3"
    reason: "Prevents z-fighting with country polygons while keeping arcs visible, auto-scale ensures longer arcs rise appropriately"
    alternatives: ["Fixed altitude without auto-scale", "Lower altitude risking z-fighting"]
  - choice: "Detail panel positioned top-right as floating overlay"
    reason: "Doesn't obscure globe, easy to dismiss, card aesthetic matches site design"
    alternatives: ["Side panel", "Modal overlay", "Bottom sheet"]
  - choice: "2-second arc animation cycle (arcDashAnimateTime: 2000)"
    reason: "Slow enough to be calming, fast enough to show clear direction of travel"
    alternatives: ["1-second (too fast)", "3-second (too slow)"]

metrics:
  duration: "2 minutes"
  tasks-completed: 2
  tasks-total: 2
  files-created: 0
  files-modified: 1
  lines-added: 171
  completed-date: "2026-03-11"

requirements-met: [GLOBE-04, GLOBE-05]
---

# Phase 01 Plan 02: Add Interactivity and Animated Arcs Summary

**One-liner:** Interactive globe with hover tooltips, click-to-zoom country details, and 9 animated orange arcs connecting cities lived chronologically with flowing dash animation.

## What Was Built

Transformed the Globe3D component from a static visualization into an interactive storytelling tool. Users can hover over countries to see names, click visited countries to zoom in and view details, and see Jack's journey through cities lived via animated flight path arcs.

### Task 1: Add country hover tooltips and click interaction

**Status:** Complete
**Commit:** c061455

Added full country interactivity with hover tooltips, hover highlighting, click handlers, and a detail panel showing country information.

**Deliverables:**
- Hover tooltips via polygonLabel showing country name and "Visited" badge for visited countries
- Hover highlighting brightens country on mouseover (visited: indigo 0.85, unvisited: gray 0.7)
- Click handler zooms camera to country centroid with 1-second animation
- Detail panel (top-right floating card) shows country name, visited badge, and notes if available
- Close button (×) to dismiss detail panel
- Click on already-selected country or unvisited country clears selection
- Extended Globe3DProps with optional countryNotes array
- Built countryNotesMap for O(1) note lookup by country code
- Built visitedCountriesMap to map numeric IDs to country names for tooltip display

**Key Implementation Details:**
- **Tooltip rendering:** polygonLabel accessor returns HTML string with styled div, react-globe.gl handles positioning and show/hide
- **Hover state tracking:** useState hook tracks hovered polygon, polygonCapColor dynamically adjusts based on hover + visited status
- **Click interaction:** onPolygonClick handler checks if country is visited, calculates centroid from polygon geometry coordinates, animates camera via globeRef.current.pointOfView({ lat, lng, altitude: 1.5 }, 1000)
- **Detail panel:** Conditional render when selectedCountry is set, absolute positioned top-right, matches site card aesthetic (dark bg, subtle border, backdrop blur)
- **Country notes integration:** countryNotes prop flows through, mapped by code for fast lookup, displayed in detail panel if available (Italy has note: "Italy hits different")

**Deviation from Plan:** None — executed exactly as specified.

### Task 2: Add animated flight path arcs between cities lived

**Status:** Complete
**Commit:** f7209e9

Added 9 animated arcs connecting the 10 cities Jack has lived in chronologically, with flowing orange dash animation and hover tooltips.

**Deliverables:**
- arcsData generated from cities array using useMemo (connects cities[i] to cities[i+1])
- 9 arcs total: San Diego → Los Angeles → Flagstaff → Durango → Denver → Tulum → Bali → Mexico City → Berlin → Mexico City
- Orange color gradient: rgba(249, 115, 22, 0.8) to rgba(249, 115, 22, 0.3) from start to end
- Flowing dash animation with 2-second cycle (arcDashAnimateTime: 2000)
- Arc altitude 0.15 prevents z-fighting with country polygons
- Arc auto-scale 0.3 for longer arcs (e.g., Denver → Tulum, Tulum → Bali)
- Arc tooltip shows "fromCity → toCity" in orange text on hover
- Arc stroke 0.5 for visible but not overpowering lines
- Dash pattern: 0.4 length, 0.2 gap

**Key Implementation Details:**
- **Arc data generation:** useMemo prevents re-creating arcs on every render, slice(0, -1) creates pairs of consecutive cities
- **Color choice:** Orange (rgba(249, 115, 22)) matches marker-current color from existing TravelMap, creates visual distinction from indigo visited countries
- **Animation:** arcDashAnimateTime: 2000 creates flowing effect showing direction of travel (dash pattern moves along arc)
- **Altitude management:** arcAltitude: 0.15 raises arcs above polygons, arcAltitudeAutoScale: 0.3 automatically increases altitude for longer arcs (prevents clipping through Earth)
- **Performance:** 9 arcs is well within performance budget (research showed 100+ arcs are fine)

**Deviation from Plan:** None — executed exactly as specified.

## Deviations from Plan

None — plan executed exactly as written. No auto-fixes or blocking issues encountered.

## Verification

All verification criteria met:

- [x] npx astro build completes without errors
- [x] Globe3D.tsx has onPolygonHover, onPolygonClick, polygonLabel implementations
- [x] Globe3D.tsx has arcsData with 9 arcs connecting consecutive cities
- [x] Arc styling uses orange color matching the site's marker-current palette
- [x] No TypeScript errors in the component
- [x] Hover tooltip shows country name for any country
- [x] Clicking a visited country zooms in and shows detail panel
- [x] Detail panel shows country name, visited badge, and notes (Italy shows "Italy hits different")
- [x] 9 animated arcs connect cities chronologically with flowing orange dash animation
- [x] Arcs render cleanly above country polygons (no z-fighting)

## Technical Insights

**1. Native Tooltip API vs Custom React Tooltips**
- react-globe.gl's polygonLabel returns HTML string for native browser tooltip
- Library handles positioning, show/hide, and lifecycle automatically
- Simpler than building custom React tooltip with absolute positioning
- Limitation: can't use React components inside tooltip (HTML string only)
- Works well for simple tooltips (country name + badge)

**2. Camera Animation for Click Zoom**
- globeRef.current.pointOfView({ lat, lng, altitude }, duration) animates camera
- Calculated centroid from polygon.geometry.coordinates (average lat/lng)
- altitude: 1.5 provides good zoom level (not too close, not too far)
- 1000ms duration feels smooth and intentional
- Auto-rotate pauses during user interaction automatically

**3. Arc Altitude Management**
- Critical to prevent z-fighting (visual flickering when arcs overlap polygons)
- arcAltitude: 0.15 raises arcs above polygonAltitude (0.01 for visited, 0.005 for unvisited)
- arcAltitudeAutoScale: 0.3 scales altitude based on arc length (longer arcs rise higher)
- This prevents long arcs from clipping through Earth's surface at midpoint
- Research showed this is a common pitfall — plan addressed it proactively

**4. Dash Animation for Direction**
- arcDashAnimateTime creates flowing effect (dash pattern moves along arc)
- 2000ms (2 seconds) provides calm, visible animation
- Shows direction of travel clearly (San Diego → Mexico City progression)
- arcDashLength: 0.4, arcDashGap: 0.2 creates visible segments
- Animation runs continuously (no pause between cycles)

**5. Color Palette Consistency**
- Orange arcs (rgba(249, 115, 22)) match existing marker-current from TravelMap
- Creates visual distinction from indigo visited countries (rgba(99, 102, 241))
- Orange = journey/movement, Indigo = places visited
- Maintains overall dark theme with bright accent colors

**6. React State for Interaction**
- hoverCountry state tracks which polygon is hovered for highlighting
- selectedCountry state tracks which country is clicked for detail panel
- Separate states allow independent hover + selection behavior
- polygonCapColor reads hoverCountry for dynamic brightness adjustment
- Click handler checks selectedCountry to toggle off if clicking same country twice

## Next Steps

Ready for Plan 03: Page integration and visual polish
- Integrate Globe3D into travels page with countryNotes prop
- Add view toggle between 2D TravelMap and 3D Globe3D
- Test interactivity on mobile devices (touch events)
- Consider adding city markers for cities lived (orange dots)
- Test performance with all features enabled

## Self-Check

Verifying all claimed artifacts exist and commits are valid.

**Files:**
- [x] src/components/Globe3D.tsx exists and is modified (328 lines, +171 from baseline)

**Commits:**
- [x] c061455: feat(01-02): add country hover tooltips and click interaction
- [x] f7209e9: feat(01-02): add animated flight path arcs between cities lived

**Build verification:**
- [x] npx astro build completes successfully in 3.23s

**Functionality verification:**
- [x] polygonLabel implemented for hover tooltips
- [x] onPolygonHover implemented for hover highlighting
- [x] onPolygonClick implemented for zoom and detail panel
- [x] arcsData generated with 9 arcs
- [x] Arc styling uses orange gradient
- [x] Arc altitude set to 0.15 with auto-scale 0.3
- [x] arcLabel implemented for arc tooltips
- [x] countryNotes prop added and integrated

## Self-Check: PASSED

All files exist, all commits are in history, build succeeds, all features implemented. Plan 02 execution complete.
