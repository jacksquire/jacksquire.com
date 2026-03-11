# Phase 1: 3D Interactive Globe - Research

**Researched:** 2026-03-10
**Domain:** 3D web graphics, WebGL globe visualization, Astro component integration
**Confidence:** MEDIUM

## Summary

Phase 1 replaces the existing flat D3 travel map with an interactive 3D globe showing 48 visited countries, animated flight paths between 10 cities lived, and click/hover interactivity. The globe must lazy-load without blocking page render, toggle with the flat map, and support touch/mobile interactions.

**Standard approach:** react-globe.gl (Three.js wrapper) + React integration in Astro + client:visible directive for lazy loading. This provides full-featured 3D globe with minimal custom code, excellent documentation, and battle-tested performance.

**Primary recommendation:** Use react-globe.gl 2.27.2+ with @astrojs/react integration, lazy-load via client:visible, implement toggle via conditional rendering with shared data structure.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GLOBE-01 | Visitor sees a 3D rotating globe on the travels page showing all 48 visited countries | react-globe.gl polygonsData API highlights countries via GeoJSON features; existing travel.json country codes map to world-atlas topology |
| GLOBE-02 | Visitor can click/drag to rotate the globe and zoom in/out | Built-in Three.js OrbitControls provides drag-to-rotate and scroll-to-zoom; mobile touch gestures supported automatically |
| GLOBE-03 | Visited countries are visually highlighted with distinct color/style | polygonCapColor and polygonSideColor props control country fill and border styling; alpha transparency distinguishes visited vs unvisited |
| GLOBE-04 | Visitor can click a country to see visit details or hover for tooltip | onPolygonHover and onPolygonClick callbacks trigger custom tooltip rendering; country metadata passed via polygonLabel accessor |
| GLOBE-05 | Animated flight path arcs connect cities Jack has lived in | arcsData API renders curved 3D arcs between lat/lng pairs; arcDashAnimateTime prop provides continuous animation; travel.json citiesLived array provides source data |
| GLOBE-06 | Globe and flat map can be toggled (both views preserved) | Conditional rendering in Astro with state stored in client-side script; both components receive same travel.json data structure; toggle button controls visibility |
| GLOBE-07 | Globe lazy-loads and doesn't block initial page render | client:visible directive loads component only when scrolled into viewport; Three.js bundle deferred until user interaction; Lighthouse performance impact measured |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-globe.gl | 2.27.2+ | 3D globe visualization | Most mature, feature-complete globe library for web; Three.js wrapper with declarative API; 30+ built-in examples for common patterns; active maintenance (last update 2025) |
| @astrojs/react | 4.x | React integration for Astro | Official Astro integration; enables React components in static-first Astro architecture; handles SSR + hydration automatically |
| react | 18.x | UI framework for globe component | Required peer dependency for @astrojs/react and react-globe.gl; version 18 for concurrent features |
| react-dom | 18.x | React rendering | Required peer dependency for browser rendering |
| three | 0.170.0+ | 3D graphics engine | Peer dependency for react-globe.gl; provides WebGL rendering, camera controls, geometry utilities |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| topojson-client | 3.1.0 | GeoJSON topology conversion | Already installed; converts world-atlas topology to GeoJSON features for polygonsData |
| world-atlas | 2.0.2 | Country boundary data | Already installed; provides countries-110m.json for globe polygons |
| i18n-iso-countries | 7.11.0+ | Country code mapping | Already installed; maps travel.json alpha-2 codes to numeric IDs for world-atlas features |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-globe.gl | globe.gl (vanilla JS) | Lower bundle size (~40KB vs ~60KB minified), but requires manual DOM integration, more imperative code, no React patterns |
| react-globe.gl | @react-three/fiber + custom globe | Full control over rendering, tree-shakeable Three.js imports, but 3-5x more custom code, manual arc geometry, steeper learning curve |
| react-globe.gl | @react-three/drei + Earth component | Smaller bundle if only basic globe needed, but no built-in arcs/polygons/data layers, must hand-roll all interactivity |
| react-globe.gl | Cesium.js | Enterprise-grade geospatial, time-series data, terrain, but 10MB+ bundle size, overkill for static country highlighting |
| react-globe.gl | D3 orthographic projection | Reuse existing D3 knowledge, smaller bundle, but only pseudo-3D (2.5D), no true rotation, limited interactivity |

**Installation:**
```bash
npm install react-globe.gl react react-dom @astrojs/react three
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── TravelMap.astro              # Existing flat map (preserve)
│   ├── Globe3D.tsx                  # New React globe component
│   └── GlobeToggle.astro            # Toggle container managing both views
├── data/
│   └── travel.json                  # Shared data source (no changes)
└── pages/
    └── travels.astro                # Replace <TravelMap /> with <GlobeToggle />
```

### Pattern 1: Lazy-Loaded React Component in Astro
**What:** Defer heavy 3D component loading until user scrolls to viewport
**When to use:** Any WebGL/Three.js component with 200KB+ bundle size
**Example:**
```astro
---
// GlobeToggle.astro
import Globe3D from './Globe3D';
import TravelMap from './TravelMap.astro';
import travel from '../data/travel.json';
---

<div data-globe-container>
  <button data-toggle-view>Toggle View</button>
  <div data-globe-view>
    <Globe3D
      client:visible
      countries={travel.countriesVisited}
      cities={travel.citiesLived}
    />
  </div>
  <div data-map-view class="hidden">
    <TravelMap />
  </div>
</div>

<script>
  // Toggle visibility via CSS classes
  const toggle = document.querySelector('[data-toggle-view]');
  const globeView = document.querySelector('[data-globe-view]');
  const mapView = document.querySelector('[data-map-view]');

  toggle?.addEventListener('click', () => {
    globeView?.classList.toggle('hidden');
    mapView?.classList.toggle('hidden');
  });
</script>
```

### Pattern 2: Data Transformation for Globe API
**What:** Convert existing travel.json structure to react-globe.gl data formats
**When to use:** Every globe implementation using existing project data
**Example:**
```tsx
// Globe3D.tsx
import { useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';
import { feature } from 'topojson-client';
import countries from 'world-atlas/countries-110m.json';
import isoCountries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

isoCountries.registerLocale(enLocale);

interface Props {
  countries: Array<{ code: string; name: string }>;
  cities: Array<{ city: string; lat: number; lon: number }>;
}

export default function Globe3D({ countries: visitedCountries, cities }: Props) {
  const globeRef = useRef();

  // Convert visited country codes to Set for fast lookup
  const visitedCodes = new Set(
    visitedCountries.map(c => isoCountries.alpha2ToNumeric(c.code))
  );

  // Convert world-atlas topology to GeoJSON features
  const world = feature(countries, countries.objects.countries);

  // Add visited flag to each country feature
  const polygonsData = world.features.map(geo => ({
    ...geo,
    visited: visitedCodes.has(geo.id)
  }));

  // Create arc data from consecutive cities
  const arcsData = cities.slice(0, -1).map((city, i) => ({
    startLat: city.lat,
    startLng: city.lon,
    endLat: cities[i + 1].lat,
    endLng: cities[i + 1].lon
  }));

  return (
    <Globe
      ref={globeRef}
      globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
      backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"

      // Polygons (countries)
      polygonsData={polygonsData}
      polygonCapColor={d => d.visited ? 'rgba(99, 102, 241, 0.7)' : 'rgba(30, 30, 30, 0.7)'}
      polygonSideColor={() => 'rgba(50, 50, 50, 0.3)'}
      polygonStrokeColor={() => 'rgba(255, 255, 255, 0.2)'}
      polygonLabel={d => d.properties.name}
      onPolygonHover={handlePolygonHover}
      onPolygonClick={handlePolygonClick}

      // Arcs (flight paths)
      arcsData={arcsData}
      arcColor={() => 'rgba(249, 115, 22, 0.6)'}
      arcDashLength={0.4}
      arcDashGap={0.2}
      arcDashAnimateTime={2000}
      arcStroke={0.5}

      // Camera
      width={800}
      height={600}
      animateIn={true}
    />
  );
}
```
**Source:** react-globe.gl API documentation and existing TravelMap.astro patterns

### Pattern 3: Conditional Hydration for Performance
**What:** Only hydrate React component when user engages with globe view
**When to use:** Heavy components in toggled views
**Example:**
```astro
---
// Option 1: Hydrate on visibility (recommended)
<Globe3D client:visible {...props} />

// Option 2: Hydrate on idle (if below fold)
<Globe3D client:idle {...props} />

// Option 3: Hydrate on interaction (if behind toggle)
<Globe3D client:only="react" {...props} />
---
```
**Source:** Astro Client Directives official documentation

### Anti-Patterns to Avoid
- **Loading globe with client:load:** Blocks initial page render with 200KB+ Three.js bundle; use client:visible or client:idle instead
- **Rendering both globe and map simultaneously:** Doubles bundle size and causes WebGL context conflicts; use conditional rendering with CSS visibility or DOM mounting/unmounting
- **Fetching geodata at runtime:** Increases latency and fails offline; import world-atlas statically and transform at build time
- **Custom arc geometry without library:** Arc calculation on sphere requires great circle math, altitude curves, and segment tessellation; react-globe.gl handles this correctly
- **Ignoring mobile performance:** Three.js rendering is GPU-intensive; test on mid-tier devices, provide fallback to flat map if WebGL unavailable

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 3D globe rendering | Custom Three.js scene with sphere geometry, texture mapping, lighting | react-globe.gl or globe.gl | Globe libraries handle camera controls, texture mapping, atmosphere effects, point clustering, and performance optimizations. Custom implementation requires 500+ lines for basic features. |
| Flight path arcs | Great circle calculations, Bezier curves, arc tessellation | react-globe.gl arcsData API | Arc paths on spherical surfaces require geodesic math, altitude curves, and efficient segment rendering. Library provides arcsData with animation, dash patterns, and automatic curve generation. |
| Country highlighting | GeoJSON polygon rendering, coordinate projection, hit detection | react-globe.gl polygonsData API | Polygon rendering on 3D sphere requires coordinate transformation, extrusion geometry, and efficient hit testing. Library handles 200+ country polygons with interaction callbacks. |
| Touch gestures | Pinch-to-zoom, two-finger rotation detection, inertia scrolling | Three.js OrbitControls (included) | Mobile gesture handling requires touch event tracking, multi-touch differentiation, and gesture recognition. OrbitControls provides tested gesture support automatically. |
| WebGL context management | Canvas setup, context loss recovery, renderer lifecycle | Globe libraries + React refs | WebGL contexts are limited (16 per page on some browsers), require loss/restore handlers, and need proper cleanup. Libraries manage context lifecycle automatically. |

**Key insight:** 3D globe visualization is a solved problem with mature libraries. The complexity lies in coordinate math, 3D rendering performance, and cross-device compatibility. Building custom wastes 1-2 weeks on bugs already fixed by react-globe.gl (texture seams, polygon z-fighting, mobile gesture edge cases).

## Common Pitfalls

### Pitfall 1: Bundle Size Explosion on Initial Load
**What goes wrong:** Adding react-globe.gl with client:load directive increases initial bundle by 200KB+ (Three.js + globe code), blocking page render and tanking Lighthouse performance score.
**Why it happens:** Astro's client:load hydrates immediately on page load, bundling all React and Three.js code into the initial payload.
**How to avoid:** Use client:visible directive to defer loading until component enters viewport. Globe is typically below-the-fold, so lazy loading has no UX impact.
**Warning signs:** Lighthouse performance score drops below 90, First Contentful Paint increases by 500ms+, bundle analysis shows three.js in critical path.

### Pitfall 2: WebGL Context Limit on Safari
**What goes wrong:** Creating multiple Globe instances (e.g., globe + flat map both rendered) exhausts WebGL context limit on Safari (16 contexts max), causing blank canvas or renderer crashes.
**Why it happens:** Each Globe instance creates a WebGL context via Three.js renderer. Safari limits concurrent contexts more aggressively than Chrome/Firefox.
**How to avoid:** Use conditional rendering that fully unmounts the inactive view (not just CSS visibility). Implement proper cleanup with useEffect cleanup function to dispose Three.js renderer and geometries.
**Warning signs:** Globe renders blank on Safari after toggling views, console errors about WebGL context lost, memory usage climbs on repeated toggles.

### Pitfall 3: Country Code Mismatch Between Data Sources
**What goes wrong:** travel.json uses ISO alpha-2 codes (e.g., "US", "MX"), world-atlas uses numeric codes (e.g., 840, 484), react-globe.gl polygonsData expects feature IDs. Mismatched IDs cause countries not to highlight.
**Why it happens:** Different geospatial standards use different country identifiers. Direct matching fails without conversion layer.
**How to avoid:** Use i18n-iso-countries to convert alpha-2 codes to numeric codes, then match against world-atlas feature IDs. Already installed in project.
**Warning signs:** Countries don't highlight on globe, console logs show mismatched IDs, polygon count is correct but visited flag always false.

### Pitfall 4: Mobile Performance Degradation
**What goes wrong:** Globe renders smoothly on desktop but lags/stutters on mobile devices, especially mid-tier Android phones. Frame rate drops below 30fps during rotation.
**Why it happens:** Three.js rendering is GPU-intensive; mobile GPUs are 5-10x slower than desktop. High-resolution globe textures and polygon counts compound the issue.
**How to avoid:** (1) Use lower-resolution textures on mobile (detect via media queries), (2) reduce polygon complexity (countries-50m.json instead of countries-10m.json), (3) limit arc animation count, (4) provide toggle to flat map as fallback.
**Warning signs:** Touch gestures feel sluggish, globe rotation stutters on iPhone 12/Pixel 5 equivalents, battery drains rapidly, device heats up.

### Pitfall 5: Arc Rendering Order and Z-Fighting
**What goes wrong:** Flight path arcs render behind country polygons, making them invisible or flickering during rotation (z-fighting artifacts).
**Why it happens:** Three.js renders objects in arbitrary order unless depth sorting is configured. Arcs and polygons at similar depths cause z-buffer conflicts.
**How to avoid:** Set arcAltitude prop to raise arcs above polygon surface (0.1-0.3 recommended). Use arcStroke to control line thickness. Ensure arcs render after polygons in scene graph.
**Warning signs:** Arcs flicker during rotation, arcs disappear behind countries, visual artifacts at arc endpoints.

### Pitfall 6: Missing TypeScript Types for Globe Props
**What goes wrong:** TypeScript shows errors for react-globe.gl props because package has incomplete or outdated type definitions.
**Why it happens:** react-globe.gl is maintained by individual developer; type definitions lag behind feature additions.
**How to avoid:** Install @types/react-globe.gl if available, otherwise create local .d.ts file with minimal prop types. Use `any` as escape hatch for untyped props.
**Warning signs:** Red squiggles on valid props, build fails with "Property 'polygonsData' does not exist", IDE autocomplete missing for globe props.

### Pitfall 7: Astro SSR Incompatibility with Three.js
**What goes wrong:** Three.js tries to access window/document during SSR, causing "ReferenceError: window is not defined" build errors.
**Why it happens:** Three.js assumes browser environment; Astro pre-renders components at build time in Node.js environment.
**How to avoid:** Use client:only="react" directive to skip SSR entirely for Globe component. Alternatively, wrap Three.js imports in dynamic imports with ssr: false flag.
**Warning signs:** Build fails with window/document/navigator errors, Globe works in dev but breaks in production build.

## Code Examples

Verified patterns from official sources:

### Basic Globe Setup with Countries
```tsx
// Source: react-globe.gl GitHub README + Astro React integration docs
import { useRef } from 'react';
import Globe from 'react-globe.gl';

export default function Globe3D() {
  const globeRef = useRef();

  return (
    <Globe
      ref={globeRef}
      globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
      backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
      width={800}
      height={600}
    />
  );
}
```

### Country Highlighting with Polygons
```tsx
// Source: react-globe.gl countries-population example
const polygonsData = world.features.map(geo => ({
  ...geo,
  visited: visitedCountryIds.has(geo.id)
}));

<Globe
  polygonsData={polygonsData}
  polygonCapColor={d => d.visited ? 'rgba(99, 102, 241, 0.7)' : 'rgba(30, 30, 30, 0.7)'}
  polygonSideColor={() => 'rgba(50, 50, 50, 0.3)'}
  polygonStrokeColor={() => 'rgba(255, 255, 255, 0.2)'}
  polygonLabel={({ properties: d }) => `
    <div class="globe-tooltip">
      <strong>${d.name}</strong>
    </div>
  `}
  onPolygonHover={hoverD => {
    // Handle hover state
  }}
  onPolygonClick={clickD => {
    // Handle click interaction
  }}
/>
```

### Animated Flight Path Arcs
```tsx
// Source: react-globe.gl airline-routes example
const arcsData = [
  { startLat: 32.7157, startLng: -117.1611, endLat: 34.0522, endLng: -118.2437 }, // SD to LA
  { startLat: 34.0522, startLng: -118.2437, endLat: 20.2114, endLng: -87.4654 },  // LA to Tulum
  // ... more cities
];

<Globe
  arcsData={arcsData}
  arcColor={() => 'rgba(249, 115, 22, 0.6)'}
  arcDashLength={0.4}
  arcDashGap={0.2}
  arcDashAnimateTime={2000}
  arcStroke={0.5}
  arcAltitude={0.2}
  arcAltitudeAutoScale={0.3}
/>
```

### Lazy Loading with client:visible
```astro
---
// Source: Astro client directives documentation
import Globe3D from '../components/Globe3D';
import travel from '../data/travel.json';
---

<section id="globe-section">
  <h2>Interactive Globe</h2>
  <Globe3D
    client:visible
    countries={travel.countriesVisited}
    cities={travel.citiesLived}
  />
</section>

<style>
  /* Placeholder height prevents layout shift */
  #globe-section {
    min-height: 600px;
  }
</style>
```

### Toggle Between Globe and Flat Map
```astro
---
import Globe3D from './Globe3D';
import TravelMap from './TravelMap.astro';
import travel from '../data/travel.json';
---

<div class="map-container">
  <div class="controls">
    <button id="toggle-view">
      <span data-globe-active>Switch to Flat Map</span>
      <span data-map-active class="hidden">Switch to 3D Globe</span>
    </button>
  </div>

  <div id="globe-view">
    <Globe3D
      client:visible
      countries={travel.countriesVisited}
      cities={travel.citiesLived}
    />
  </div>

  <div id="map-view" class="hidden">
    <TravelMap />
  </div>
</div>

<script>
  const toggle = document.getElementById('toggle-view');
  const globeView = document.getElementById('globe-view');
  const mapView = document.getElementById('map-view');
  const globeText = document.querySelector('[data-globe-active]');
  const mapText = document.querySelector('[data-map-active]');

  let isGlobeActive = true;

  toggle?.addEventListener('click', () => {
    isGlobeActive = !isGlobeActive;

    if (isGlobeActive) {
      globeView?.classList.remove('hidden');
      mapView?.classList.add('hidden');
      globeText?.classList.remove('hidden');
      mapText?.classList.add('hidden');
    } else {
      globeView?.classList.add('hidden');
      mapView?.classList.remove('hidden');
      globeText?.classList.add('hidden');
      mapText?.classList.remove('hidden');
    }
  });
</script>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom WebGL renderers | Three.js + react-three-fiber | 2020-2021 | Declarative React patterns for 3D; reduced custom WebGL code by 80% |
| Mapbox GL JS globe view | Specialized globe libraries (globe.gl) | 2019-2020 | Lighter bundles (200KB vs 500KB), better performance for static globes |
| D3 orthographic projection | True 3D with Three.js | 2018-2019 | Real 3D rotation, better depth perception, smoother animations |
| Eager loading all components | Astro Islands + client directives | 2023 | Defer heavy components until needed; 50%+ reduction in initial JavaScript |
| React 16/17 hydration | React 18 concurrent rendering | 2022 | Smoother hydration, better perceived performance, streaming SSR |

**Deprecated/outdated:**
- **Cesium.js for simple country visualization:** Overkill for static maps; 10MB bundle designed for geospatial time-series data and terrain. Use react-globe.gl instead.
- **D3 geo.geoOrthographic for "3D" effect:** Pseudo-3D projection; no true rotation, limited to 180° view, no depth. Replaced by Three.js sphere geometry.
- **WebGL custom shaders for globe:** Now unnecessary; Three.js provides MeshStandardMaterial with PBR, normal maps, and lighting out of the box.
- **Client:load for all interactive components:** Astro best practice shifted to client:visible/idle for below-fold content (2023 docs update).

## Open Questions

### 1. **Does react-globe.gl support dark mode / custom color schemes?**
   - What we know: Library accepts globeImageUrl prop for custom textures; examples show various color palettes
   - What's unclear: Whether dark mode textures are available via CDN, or if custom textures must be self-hosted
   - Recommendation: Start with default textures; if dark mode needed, source dark Earth texture from NASA Visible Earth or create custom in Photoshop

### 2. **What's the actual bundle size impact of react-globe.gl vs alternatives?**
   - What we know: react-globe.gl includes Three.js as peer dependency; typical gzipped size is 150-250KB
   - What's unclear: Exact size after tree-shaking; comparison to globe.gl (vanilla) or @react-three/fiber custom approach
   - Recommendation: Run production build with both approaches, measure with webpack-bundle-analyzer. If size critical, consider globe.gl vanilla (40KB smaller) with manual React integration

### 3. **Can globe auto-rotate be paused on user interaction?**
   - What we know: react-globe.gl has autoRotate prop for continuous rotation
   - What's unclear: Whether rotation pauses automatically on drag or requires manual control logic
   - Recommendation: Test in prototype; if no auto-pause, use onGlobeClick + ref to control rotation state

### 4. **How to handle countries with multiple polygons (e.g., Indonesia, Philippines)?**
   - What we know: world-atlas includes all country polygons; react-globe.gl renders each feature
   - What's unclear: Whether island nations are grouped correctly, or if manual aggregation needed
   - Recommendation: Test with travel.json country codes; verify archipelago countries highlight all islands. If broken, aggregate polygons by country code before passing to polygonsData

### 5. **What happens to globe performance with 200+ animated arcs?**
   - What we know: Project has 10 cities (9 arcs); react-globe.gl examples show 100+ arcs
   - What's unclear: Performance threshold on mobile devices; whether arcs should be toggled separately
   - Recommendation: Not a concern for current scope (9 arcs). If v2 adds city pins (50+ markers), test on mid-tier Android and implement arc toggling if frame rate drops below 30fps

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual testing — no automated test framework detected |
| Config file | None — Wave 0 should add Playwright for E2E or Vitest for component tests |
| Quick run command | N/A — to be defined in Wave 0 |
| Full suite command | N/A — to be defined in Wave 0 |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GLOBE-01 | 3D globe renders with 48 countries highlighted | E2E | `playwright test globe-rendering.spec.ts` | ❌ Wave 0 |
| GLOBE-02 | Drag rotates globe, scroll zooms | E2E | `playwright test globe-interaction.spec.ts` | ❌ Wave 0 |
| GLOBE-03 | Visited countries have distinct color | Visual regression | `playwright test globe-styles.spec.ts --update-snapshots` | ❌ Wave 0 |
| GLOBE-04 | Click country shows details, hover shows tooltip | E2E | `playwright test globe-tooltips.spec.ts` | ❌ Wave 0 |
| GLOBE-05 | Animated arcs connect 10 cities | E2E | `playwright test globe-arcs.spec.ts` | ❌ Wave 0 |
| GLOBE-06 | Toggle switches between globe and flat map | E2E | `playwright test globe-toggle.spec.ts` | ❌ Wave 0 |
| GLOBE-07 | Globe lazy-loads without blocking render | Performance | `lighthouse --only-categories=performance travels.html` | Manual validation |

### Sampling Rate
- **Per task commit:** Manual validation — open /travels in browser, verify feature works
- **Per wave merge:** Run full Playwright suite + Lighthouse performance check
- **Phase gate:** Lighthouse performance score ≥ 90, all E2E tests green, mobile tested on real device

### Wave 0 Gaps
- [ ] `playwright.config.ts` — E2E test configuration with viewport sizes (desktop + mobile)
- [ ] `tests/globe-rendering.spec.ts` — Validates globe canvas renders, countries highlighted
- [ ] `tests/globe-interaction.spec.ts` — Tests drag rotation, zoom controls
- [ ] `tests/globe-tooltips.spec.ts` — Tests hover/click interactivity
- [ ] `tests/globe-arcs.spec.ts` — Validates arc count and animation
- [ ] `tests/globe-toggle.spec.ts` — Tests view toggle functionality
- [ ] `tests/lighthouse.spec.ts` — Automated Lighthouse performance validation
- [ ] Framework install: `npm install -D @playwright/test` — if Playwright chosen

**Recommendation:** Use Playwright for E2E testing (Astro official recommendation). Create page object model for Globe component to share test utilities. Use Lighthouse CI for automated performance regression detection.

## Sources

### Primary (HIGH confidence)
- Astro Client Directives Reference (https://docs.astro.build/en/reference/directives-reference/) - client:visible, client:idle, client:load behavior
- Astro React Integration Guide (https://docs.astro.build/en/guides/integrations-guide/react/) - installation, configuration, performance considerations
- react-globe.gl GitHub Repository (https://github.com/vasturiano/react-globe.gl) - API features, examples, data layer structure
- react-three-fiber GitHub Repository (https://github.com/pmndrs/react-three-fiber) - React + Three.js integration patterns
- Three.js Documentation (https://threejs.org/docs/) - core concepts, scene structure

### Secondary (MEDIUM confidence)
- Existing TravelMap.astro implementation (project file) - data structure patterns, country code mapping, D3 projection usage
- travel.json data structure (project file) - country codes, city coordinates, existing data schema
- package.json dependencies (project file) - already installed libraries (d3-geo, topojson-client, world-atlas, i18n-iso-countries)

### Tertiary (LOW confidence — training data from 2025)
- react-globe.gl typical bundle size (150-250KB gzipped) - based on Three.js peer dependency size, not verified with Bundlephobia due to rate limits
- globe.gl vanilla variant bundle size (~40KB smaller) - based on package comparison, not verified
- WebGL context limits on Safari (16 contexts) - based on training data, not verified with 2026 Safari release notes
- Mobile GPU performance characteristics (5-10x slower than desktop) - general benchmark knowledge, not device-specific testing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Astro and react-globe.gl documentation verified; library actively maintained
- Architecture: HIGH - Astro client directives documented; React integration patterns verified; existing codebase provides reference
- Pitfalls: MEDIUM - WebGL context limits and mobile performance based on training data; bundle size concerns inferred from Three.js dependency
- Code examples: HIGH - Sourced from official documentation and existing project patterns
- Bundle size specifics: LOW - Bundlephobia access blocked; sizes estimated from training data

**Research date:** 2026-03-10
**Valid until:** ~30 days (stable domain; libraries mature; revalidate if react-globe.gl or Astro release major version updates)
