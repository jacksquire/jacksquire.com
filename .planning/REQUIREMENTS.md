# Requirements: jacksquire.com New Features

**Defined:** 2026-03-10
**Core Value:** A memorable, high-craft personal site that tells Jack's story through interactive experiences

## v1 Requirements

### 3D Globe

- [x] **GLOBE-01**: Visitor sees a 3D rotating globe on the travels page showing all 48 visited countries (component built, page integration pending)
- [x] **GLOBE-02**: Visitor can click/drag to rotate the globe and zoom in/out (OrbitControls enabled)
- [x] **GLOBE-03**: Visited countries are visually highlighted with distinct color/style (indigo vs dark gray)
- [x] **GLOBE-04**: Visitor can click a country to see visit details or hover for tooltip
- [x] **GLOBE-05**: Animated flight path arcs connect cities Jack has lived in
- [ ] **GLOBE-06**: Globe and flat map can be toggled (both views preserved)
- [x] **GLOBE-07**: Globe lazy-loads and doesn't block initial page render (dynamic import + client:only)

### Stats Dashboard

- [ ] **STATS-01**: Visitor can access a "Wrapped" / annual stats page
- [ ] **STATS-02**: Dashboard shows books read count with breakdown by tier and category
- [ ] **STATS-03**: Dashboard shows countries/states visited with year-over-year growth
- [ ] **STATS-04**: Dashboard shows media consumption breakdown (books, podcasts, videos, articles, music)
- [ ] **STATS-05**: Stats include animated counters and visual charts
- [ ] **STATS-06**: Dashboard pulls data from existing content collections and travel.json
- [ ] **STATS-07**: Year selector allows viewing stats for different years

### Achievements

- [ ] **ACH-01**: Visitor can view an achievements/milestones page
- [ ] **ACH-02**: Achievements display with unlocked/locked visual states
- [ ] **ACH-03**: Achievement categories cover travel, reading, projects, and personal milestones
- [ ] **ACH-04**: Progress bars show completion toward next milestone (e.g., "48/50 countries")
- [ ] **ACH-05**: Achievements derive from real data (library count, travel.json, projects list)
- [ ] **ACH-06**: Achievement cards have satisfying hover/reveal animations

### DJ Player

- [ ] **PLAYER-01**: Floating audio player appears when a music library item is selected
- [ ] **PLAYER-02**: Player persists across page navigation (doesn't stop on route change)
- [ ] **PLAYER-03**: Player shows track name, artist, and cover art
- [ ] **PLAYER-04**: Player has play/pause, volume, and progress/seek controls
- [ ] **PLAYER-05**: Player has minimized and expanded states
- [ ] **PLAYER-06**: Player integrates with music entries in the library (play button on cards)

## v2 Requirements

### Enhanced Globe

- **GLOBE-V2-01**: Time-lapse animation showing countries visited chronologically
- **GLOBE-V2-02**: Pin markers for specific cities with popup details

### Enhanced Stats

- **STATS-V2-01**: Shareable stats cards (social media images)
- **STATS-V2-02**: Monthly reading goal tracker

### Enhanced Player

- **PLAYER-V2-01**: Waveform visualization on expanded player
- **PLAYER-V2-02**: Queue/playlist functionality

## Out of Scope

| Feature | Reason |
|---------|--------|
| Spotify API integration | Complexity, auth requirements, rate limits |
| Real-time data sync | Static site — rebuild on content change |
| User-generated achievements | Personal site, not social platform |
| Video player | Different UX pattern, audio-only for now |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| GLOBE-01 | Phase 1 | Partial (component built, page integration pending) |
| GLOBE-02 | Phase 1 | Complete (drag-to-rotate, scroll-to-zoom) |
| GLOBE-03 | Phase 1 | Complete (indigo highlighting) |
| GLOBE-04 | Phase 1 | Complete |
| GLOBE-05 | Phase 1 | Complete |
| GLOBE-06 | Phase 1 | Pending |
| GLOBE-07 | Phase 1 | Complete (dynamic import + client:only) |
| STATS-01 | Phase 2 | Pending |
| STATS-02 | Phase 2 | Pending |
| STATS-03 | Phase 2 | Pending |
| STATS-04 | Phase 2 | Pending |
| STATS-05 | Phase 2 | Pending |
| STATS-06 | Phase 2 | Pending |
| STATS-07 | Phase 2 | Pending |
| ACH-01 | Phase 3 | Pending |
| ACH-02 | Phase 3 | Pending |
| ACH-03 | Phase 3 | Pending |
| ACH-04 | Phase 3 | Pending |
| ACH-05 | Phase 3 | Pending |
| ACH-06 | Phase 3 | Pending |
| PLAYER-01 | Phase 4 | Pending |
| PLAYER-02 | Phase 4 | Pending |
| PLAYER-03 | Phase 4 | Pending |
| PLAYER-04 | Phase 4 | Pending |
| PLAYER-05 | Phase 4 | Pending |
| PLAYER-06 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0

---
*Requirements defined: 2026-03-10*
*Last updated: 2026-03-11 after plan 01-01 completion*
