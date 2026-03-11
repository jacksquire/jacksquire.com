# Roadmap: jacksquire.com New Features

## Overview

Four high-impact interactive features that transform jacksquire.com from a polished portfolio into a memorable, explorable experience. Each phase is independent and delivers a complete, standalone feature.

## Phases

- [x] **Phase 1: 3D Interactive Globe** - Replace flat travel map with a rotatable 3D globe showing visited countries and flight paths (completed 2026-03-11)
- [ ] **Phase 2: Annual Stats Dashboard** - "Wrapped"-style page visualizing annual reading, travel, and media stats
- [ ] **Phase 3: Achievement System** - Gamified milestones page with unlocked/locked states and progress bars
- [ ] **Phase 4: DJ Set Player** - Floating persistent audio player for music library items

## Phase Details

### Phase 1: 3D Interactive Globe
**Goal**: Visitors can explore Jack's travel history on an interactive 3D globe with highlighted countries and animated flight paths between cities lived
**Depends on**: Nothing (first phase)
**Requirements**: [GLOBE-01, GLOBE-02, GLOBE-03, GLOBE-04, GLOBE-05, GLOBE-06, GLOBE-07]
**Success Criteria** (what must be TRUE):
  1. 3D globe renders on travels page showing all 48 visited countries highlighted
  2. Globe is interactive — drag to rotate, scroll to zoom, click countries for details
  3. Animated arcs connect the 10+ cities Jack has lived in
  4. Toggle exists to switch between globe and flat map views
  5. Globe lazy-loads without blocking page render (Lighthouse perf score stays above 90)
**Plans:** 3/3 plans complete
Plans:
- [x] 01-01-PLAN.md — Install React integration, dependencies, build core Globe3D component with country highlighting (2 tasks, 3m)
- [x] 01-02-PLAN.md — Add hover/click interactivity and animated flight path arcs (2 tasks, 2m)
- [x] 01-03-PLAN.md — Create globe/map toggle wrapper and integrate into travels page (2 tasks, 2m)

### Phase 2: Annual Stats Dashboard
**Goal**: Visitors can view a beautiful "Wrapped"-style stats page showing annual reading, travel, media consumption data with animated counters and charts
**Depends on**: Nothing (independent)
**Requirements**: [STATS-01, STATS-02, STATS-03, STATS-04, STATS-05, STATS-06, STATS-07]
**Success Criteria** (what must be TRUE):
  1. /stats or /wrapped page exists and is accessible from navigation
  2. Shows book count, tier distribution, and category breakdown for selected year
  3. Shows travel stats (countries, states) with year-over-year context
  4. Media type breakdown visualized with charts
  5. Animated number counters and chart transitions on scroll/load
  6. Year selector works to filter data by year
**Plans**: TBD

### Phase 3: Achievement System
**Goal**: Visitors can view a gamified achievements page showing life milestones with unlocked/locked states, progress bars, and satisfying animations — all derived from real data
**Depends on**: Nothing (independent)
**Requirements**: [ACH-01, ACH-02, ACH-03, ACH-04, ACH-05, ACH-06]
**Success Criteria** (what must be TRUE):
  1. /achievements page exists and is accessible from navigation
  2. Achievement cards show distinct unlocked vs locked visual states
  3. Categories cover travel, reading, projects, and personal milestones
  4. Progress bars accurately reflect real data (e.g., 48/50 countries)
  5. Hover and reveal animations feel polished and satisfying
  6. All achievement data derives from existing content (no hardcoded fake data)
**Plans**: TBD

### Phase 4: DJ Set Player
**Goal**: Visitors can listen to DJ sets and music from the library via a floating audio player that persists across page navigation
**Depends on**: Nothing (independent)
**Requirements**: [PLAYER-01, PLAYER-02, PLAYER-03, PLAYER-04, PLAYER-05, PLAYER-06]
**Success Criteria** (what must be TRUE):
  1. Clicking play on a music library item launches a floating audio player
  2. Player persists across page navigation without interrupting playback
  3. Player shows track info (name, artist, cover art) and has play/pause, volume, seek controls
  4. Player can be minimized and expanded
  5. Player integrates cleanly with site design (dark mode, fonts, colors)
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. 3D Interactive Globe | 3/3 | Complete   | 2026-03-11 |
| 2. Annual Stats Dashboard | 0/? | Not started | - |
| 3. Achievement System | 0/? | Not started | - |
| 4. DJ Set Player | 0/? | Not started | - |
