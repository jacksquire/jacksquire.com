# Phase 4: DJ Set Player - Research

**Researched:** 2026-03-10
**Domain:** Persistent audio player in Astro MPA with YouTube embeds
**Confidence:** HIGH

## Summary

Building a floating, persistent audio player in Astro requires navigating the MPA (multi-page app) architecture where page navigations cause full reloads. The solution centers on **Astro View Transitions API** with the `transition:persist` directive, which maintains DOM elements (including audio/video players) across navigation without interrupting playback. Music entries currently link to YouTube, requiring either YouTube IFrame Player API integration or a library like Plyr that wraps YouTube embeds with consistent controls.

The technical stack is straightforward: vanilla JavaScript with HTML5 Audio API or Plyr for YouTube embeds, View Transitions for persistence, localStorage for state management, and CSS position: fixed with will-change for the floating UI. The primary challenges are handling YouTube's autoplay restrictions (requiring user gesture), maintaining player state across navigation, and building accessible minimize/expand behavior.

**Primary recommendation:** Use Astro View Transitions with `transition:persist` on a fixed-position player component containing Plyr (for YouTube embed control). Store player state in localStorage to restore on refresh, use Intersection Observer for auto-minimize on scroll, and implement keyboard shortcuts for accessibility.

## <phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PLAYER-01 | Floating audio player appears when a music library item is selected | Fixed positioning patterns, floating UI research, click handlers for music cards |
| PLAYER-02 | Player persists across page navigation (doesn't stop on route change) | Astro View Transitions `transition:persist` directive maintains element state across navigation |
| PLAYER-03 | Player shows track name, artist, and cover art | Music content schema already includes all fields; simple data binding to player UI |
| PLAYER-04 | Player has play/pause, volume, and progress/seek controls | HTML5 Audio API or Plyr provides all control methods; YouTube IFrame API documented |
| PLAYER-05 | Player has minimized and expanded states | CSS transforms for state transitions, Intersection Observer for scroll-based auto-minimize |
| PLAYER-06 | Player integrates with music entries in the library (play button on cards) | Event delegation on music cards, data attributes to pass track metadata to player |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro View Transitions | 5.x (built-in) | Persist player across navigation | Official Astro solution for SPA-like behavior in MPA; `transition:persist` maintains DOM elements and their state |
| Plyr | 3.8.4 | YouTube embed wrapper with consistent controls | Lightweight (no jQuery), accessible, provides unified API for YouTube/HTML5 audio, supports VTT captions |
| HTML5 Audio API | Native | Direct audio playback for hosted files | Zero dependencies, universal browser support, full control over playback |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Howler.js | 2.x | Advanced audio features (sprites, 3D spatial audio) | Only if needing audio sprites, multiple simultaneous sounds, or Web Audio API features; overkill for single-track player |
| localStorage | Native | Persist player state (track, position, volume) | Restore player on page refresh, remember last played track |
| Intersection Observer API | Native | Auto-minimize on scroll | Efficient visibility detection for minimize/expand behavior |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plyr | Howler.js | Howler better for audio-only, but Plyr handles YouTube embeds which matches current music data structure (all entries have youtubeId) |
| View Transitions | iframe approach | iframe would isolate player but complicate data passing, styling, and accessibility; View Transitions are the official Astro solution |
| Plyr | Custom YouTube IFrame API integration | More control but significant complexity; Plyr provides accessible controls out-of-box |

**Installation:**
```bash
npm install plyr
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   └── player/
│       ├── FloatingPlayer.astro     # Main player component with transition:persist
│       ├── PlayerControls.astro     # Play/pause/volume/seek UI
│       └── MiniPlayer.astro         # Minimized state UI
├── scripts/
│   └── player.ts                    # Client-side player logic (Plyr init, state management)
└── layouts/
    └── BaseLayout.astro             # Add ClientRouter for View Transitions
```

### Pattern 1: View Transitions for Player Persistence
**What:** Use `transition:persist` directive to maintain player element across navigation
**When to use:** Any element that should survive page transitions (audio/video players, chat widgets)
**Example:**
```astro
---
// src/layouts/BaseLayout.astro
import { ClientRouter } from 'astro:transitions';
import FloatingPlayer from '../components/player/FloatingPlayer.astro';
---
<html>
  <head>
    <ClientRouter />
  </head>
  <body>
    <slot />
    <FloatingPlayer transition:persist transition:name="audio-player" />
  </body>
</html>
```
**Source:** https://docs.astro.build/en/guides/view-transitions/

### Pattern 2: State Restoration with localStorage
**What:** Store player state (current track, position, volume) to survive browser refresh
**When to use:** Any player state that should persist beyond page navigation
**Example:**
```typescript
// src/scripts/player.ts
interface PlayerState {
  currentTrack: string | null;
  youtubeId: string | null;
  position: number;
  volume: number;
  isPlaying: boolean;
}

function savePlayerState(state: PlayerState) {
  localStorage.setItem('djPlayerState', JSON.stringify(state));
}

function restorePlayerState(): PlayerState | null {
  const saved = localStorage.getItem('djPlayerState');
  return saved ? JSON.parse(saved) : null;
}

// Save state on timeupdate
player.on('timeupdate', () => {
  savePlayerState({
    currentTrack: currentTrack.title,
    youtubeId: currentTrack.youtubeId,
    position: player.currentTime,
    volume: player.volume,
    isPlaying: !player.paused
  });
});
```
**Source:** https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage

### Pattern 3: Fixed Position Floating Player
**What:** Use CSS position: fixed with will-change for performance
**When to use:** Persistent overlays that should remain visible during scroll
**Example:**
```css
.floating-player {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 400px;
  height: 120px;
  z-index: 1000;
  will-change: transform; /* Performance optimization */
  transition: transform 0.3s ease;
}

.floating-player.minimized {
  transform: translateY(calc(100% - 60px)); /* Show only header */
}

.floating-player.expanded {
  transform: translateY(0);
}
```
**Source:** https://developer.mozilla.org/en-US/docs/Web/CSS/position

### Pattern 4: Music Card Play Button Integration
**What:** Add play buttons to library music cards with data attributes
**When to use:** Triggering player from list/grid of media items
**Example:**
```astro
---
// src/components/library/MediaCard.astro
const { item } = Astro.props;
const { type, youtubeId, title, artist, coverImage } = item.data;
---
{type === 'music' && (
  <button
    class="play-btn"
    data-youtube-id={youtubeId}
    data-title={title}
    data-artist={artist}
    data-cover={coverImage}
  >
    Play
  </button>
)}

<script>
// Event delegation for play buttons
document.addEventListener('click', (e) => {
  const playBtn = e.target.closest('.play-btn');
  if (!playBtn) return;

  const { youtubeId, title, artist, cover } = playBtn.dataset;
  window.dispatchEvent(new CustomEvent('loadTrack', {
    detail: { youtubeId, title, artist, cover }
  }));
});
</script>
```

### Pattern 5: Plyr YouTube Integration
**What:** Wrap YouTube embeds with Plyr for consistent controls
**When to use:** Need custom controls for YouTube videos/audio
**Example:**
```typescript
// src/scripts/player.ts
import Plyr from 'plyr';

const playerContainer = document.getElementById('player-container');

function loadYouTubeTrack(youtubeId: string) {
  playerContainer.innerHTML = `
    <div class="plyr__video-embed">
      <iframe
        src="https://www.youtube.com/embed/${youtubeId}?origin=https://jacksquire.com&iv_load_policy=3&modestbranding=1&playsinline=1&showinfo=0&rel=0&enablejsapi=1"
        allowfullscreen
        allowtransparency
        allow="autoplay"
      ></iframe>
    </div>
  `;

  const player = new Plyr(playerContainer.querySelector('.plyr__video-embed'), {
    controls: ['play', 'progress', 'current-time', 'duration', 'mute', 'volume'],
    youtube: { noCookie: true }
  });

  player.on('ready', () => {
    player.play(); // Requires user gesture
  });

  return player;
}
```
**Source:** https://github.com/sampotts/plyr

### Anti-Patterns to Avoid
- **Don't skip `transition:name`:** Without unique names, Astro may match wrong elements across pages
- **Don't rely on autoplay without user gesture:** Mobile browsers block autoplay; always require click/tap to start playback
- **Don't use getBoundingClientRect() on scroll:** Causes jank; use Intersection Observer instead
- **Don't store large data in localStorage:** Limit to state objects; YouTube videos stream from API
- **Don't omit `will-change: transform`:** Fixed position players cause repaints on scroll; this optimizes rendering

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YouTube embed controls | Custom YouTube IFrame API wrapper | Plyr | Handles YouTube API initialization, state management, control binding, accessibility, and cross-browser quirks |
| Visibility detection | Scroll event + getBoundingClientRect() | Intersection Observer API | Scroll listeners block main thread; Intersection Observer runs async and is optimized by browser |
| Audio element controls | Raw HTML5 <audio> with custom UI | Plyr or browser native controls | Keyboard shortcuts, screen reader support, mobile gestures already implemented |
| Player state persistence | Cookies or query params | localStorage | Simpler API, larger storage (5-10MB), no server requests, built for client-side state |
| Animation states | JavaScript class toggling with setTimeout | CSS transitions + data attributes | Smoother, GPU-accelerated, respects prefers-reduced-motion, less JS to maintain |

**Key insight:** Browser APIs and mature libraries handle edge cases that seem simple but aren't (autoplay policies, mobile gestures, CORS, screen readers, keyboard navigation). Custom solutions miss these.

## Common Pitfalls

### Pitfall 1: Autoplay Blocked on Mobile
**What goes wrong:** Player starts on desktop but silently fails on mobile Safari/Chrome
**Why it happens:** Browsers require user gesture to play media with audio (prevents annoying auto-playing ads)
**How to avoid:** Always trigger play() from a click/tap handler; show visual feedback if autoplay fails
**Warning signs:** player.play() returns rejected Promise with "NotAllowedError: play() can only be initiated by a user gesture"

**Solution:**
```typescript
async function playTrack(youtubeId: string) {
  try {
    await player.play();
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      // Show play button to user
      showPlayButton();
    }
  }
}
```

### Pitfall 2: View Transitions Breaking on Transform Ancestors
**What goes wrong:** Player positioned relative to ancestor instead of viewport
**Why it happens:** If any ancestor has `transform`, `perspective`, or `filter` (other than `none`), that element becomes the containing block for `position: fixed`
**How to avoid:** Ensure player's ancestors have no transform/perspective/filter, or nest player outside transformed elements
**Warning signs:** Player scrolls with page instead of staying fixed to viewport

**Solution:**
```astro
<!-- ❌ Bad: Player inside transformed element -->
<div style="transform: translateZ(0)">
  <FloatingPlayer transition:persist />
</div>

<!-- ✅ Good: Player at body level -->
<body>
  <main>...</main>
  <FloatingPlayer transition:persist />
</body>
```

### Pitfall 3: Player State Lost on Browser Refresh
**What goes wrong:** User refreshes page mid-track, player resets to empty state
**Why it happens:** View Transitions persist across client-side navigation only; full refresh clears DOM
**How to avoid:** Save state to localStorage on timeupdate; restore on player initialization
**Warning signs:** Player works across navigation but loses state on F5/Cmd+R

### Pitfall 4: Missing User Gesture for First Play
**What goes wrong:** User clicks "Play" on music card, nothing happens
**Why it happens:** Play button handler tries to autoplay before user has interacted with player element
**How to avoid:** Ensure first play() call happens in direct response to user click event (not async callback)
**Warning signs:** Works on subsequent plays but fails on first

**Solution:**
```typescript
// ❌ Bad: Async breaks user gesture chain
playButton.addEventListener('click', async () => {
  const data = await fetch('/api/track');
  player.play(); // Fails - too far from click
});

// ✅ Good: Play immediately from click
playButton.addEventListener('click', () => {
  player.play(); // Works - direct response to click
});
```

### Pitfall 5: YouTube Iframe Not Cleaning Up
**What goes wrong:** Loading new track creates additional YouTube iframes, memory leak
**Why it happens:** Not destroying previous Plyr instance before creating new one
**How to avoid:** Call `player.destroy()` before loading new track
**Warning signs:** Multiple YouTube players in DOM, increasing memory usage, multiple audio streams

**Solution:**
```typescript
let currentPlayer: Plyr | null = null;

function loadTrack(youtubeId: string) {
  if (currentPlayer) {
    currentPlayer.destroy(); // Clean up previous instance
  }
  currentPlayer = new Plyr(...);
}
```

### Pitfall 6: Position Fixed Causing Scroll Jank
**What goes wrong:** Scrolling feels janky/stuttery with player visible
**Why it happens:** Browser repaints fixed element on every scroll frame
**How to avoid:** Add `will-change: transform` to create own layer; consider using transform instead of top/bottom for minimize animation
**Warning signs:** Choppy scroll on mobile, poor FPS in Chrome DevTools performance panel

## Code Examples

Verified patterns from official sources:

### Basic Player Setup with View Transitions
```astro
---
// src/components/player/FloatingPlayer.astro
---
<div
  id="floating-player"
  class="floating-player"
  transition:persist
  transition:name="audio-player"
>
  <div class="player-header">
    <img id="player-cover" class="player-cover" alt="" />
    <div class="player-info">
      <div id="player-title" class="player-title">No track loaded</div>
      <div id="player-artist" class="player-artist"></div>
    </div>
    <button id="minimize-btn" aria-label="Minimize player">−</button>
  </div>

  <div id="player-container" class="player-container">
    <!-- Plyr YouTube iframe will be inserted here -->
  </div>

  <div class="player-controls">
    <button id="play-btn" aria-label="Play">▶</button>
    <div class="progress-bar">
      <div id="progress" class="progress"></div>
    </div>
    <button id="mute-btn" aria-label="Mute">🔊</button>
  </div>
</div>

<style>
  .floating-player {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 400px;
    background: rgba(9, 9, 11, 0.95);
    border: 1px solid rgba(63, 63, 70, 0.5);
    border-radius: 12px;
    z-index: 1000;
    will-change: transform;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);
  }

  .floating-player.minimized {
    transform: translateY(calc(100% - 60px));
  }

  @media (max-width: 640px) {
    .floating-player {
      bottom: 0;
      left: 0;
      right: 0;
      width: 100%;
      border-radius: 12px 12px 0 0;
    }
  }
</style>

<script>
  import Plyr from 'plyr';
  import 'plyr/dist/plyr.css';

  // Initialize player state from localStorage
  const savedState = localStorage.getItem('djPlayerState');
  let currentPlayer: Plyr | null = null;

  // Listen for track load events from music cards
  window.addEventListener('loadTrack', (event) => {
    const { youtubeId, title, artist, cover } = event.detail;
    loadYouTubeTrack(youtubeId, title, artist, cover);
  });

  function loadYouTubeTrack(youtubeId: string, title: string, artist: string, cover: string) {
    // Clean up previous player
    if (currentPlayer) {
      currentPlayer.destroy();
    }

    // Update UI
    document.getElementById('player-title').textContent = title;
    document.getElementById('player-artist').textContent = artist;
    document.getElementById('player-cover').src = cover;
    document.getElementById('player-cover').alt = `${title} cover`;

    // Create YouTube embed
    const container = document.getElementById('player-container');
    container.innerHTML = `
      <div class="plyr__video-embed">
        <iframe
          src="https://www.youtube.com/embed/${youtubeId}?origin=${window.location.origin}&iv_load_policy=3&modestbranding=1&playsinline=1&rel=0&enablejsapi=1"
          allowfullscreen
          allow="autoplay"
        ></iframe>
      </div>
    `;

    // Initialize Plyr
    currentPlayer = new Plyr(container.querySelector('.plyr__video-embed'), {
      controls: ['play-large', 'play', 'progress', 'current-time', 'duration', 'mute', 'volume'],
      youtube: { noCookie: true }
    });

    // Auto-play (will only work if user clicked)
    currentPlayer.on('ready', async () => {
      try {
        await currentPlayer.play();
      } catch (error) {
        console.log('Autoplay prevented - user must click play');
      }
    });

    // Save state on updates
    currentPlayer.on('timeupdate', () => {
      localStorage.setItem('djPlayerState', JSON.stringify({
        youtubeId,
        title,
        artist,
        cover,
        position: currentPlayer.currentTime,
        volume: currentPlayer.volume
      }));
    });
  }

  // Minimize/expand toggle
  document.getElementById('minimize-btn').addEventListener('click', () => {
    document.getElementById('floating-player').classList.toggle('minimized');
  });

  // Restore state if available
  if (savedState) {
    const state = JSON.parse(savedState);
    loadYouTubeTrack(state.youtubeId, state.title, state.artist, state.cover);
  }
</script>
```
**Source:** Astro View Transitions docs, Plyr documentation, HTML5 Audio MDN

### Music Card Play Button Integration
```astro
---
// src/components/library/MediaCard.astro (additions)
const { item } = Astro.props;
const { type, youtubeId, title, artist, coverImage } = item.data;
---

{type === 'music' && youtubeId && (
  <button
    class="absolute top-2 left-2 z-20 bg-blue-600 hover:bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-transform hover:scale-110"
    data-play-music
    data-youtube-id={youtubeId}
    data-title={title}
    data-artist={artist}
    data-cover={coverImage}
    aria-label={`Play ${title}`}
  >
    ▶
  </button>
)}

<script>
  // Event delegation for all play buttons
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-play-music]');
    if (!btn) return;

    e.preventDefault();

    const { youtubeId, title, artist, cover } = btn.dataset;

    // Dispatch event to player
    window.dispatchEvent(new CustomEvent('loadTrack', {
      detail: { youtubeId, title, artist, cover }
    }));
  });
</script>
```

### Auto-Minimize on Scroll with Intersection Observer
```typescript
// Add to FloatingPlayer.astro <script>
const player = document.getElementById('floating-player');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        // Player scrolled out of view - auto-minimize
        player.classList.add('minimized');
      }
    });
  },
  { threshold: 0.25 }
);

// Observe the player itself or a trigger element
observer.observe(player);
```
**Source:** https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Full iframe page for player | View Transitions API | Astro 3.0 (Sept 2023) | Enables SPA-like navigation in MPA; audio continues across routes |
| jQuery-based players | Vanilla JS + Plyr | Plyr 3.0 (2018) | Zero dependencies, smaller bundles, better performance |
| Scroll event listeners | Intersection Observer API | Baseline since March 2019 | Non-blocking visibility detection, better performance |
| position: absolute with scroll tracking | position: fixed + will-change | Modern CSS (2015+) | GPU-accelerated, smoother scroll, less JavaScript |

**Deprecated/outdated:**
- **getBoundingClientRect() on scroll:** Use Intersection Observer instead - non-blocking and optimized
- **jQuery audio plugins:** Plyr and native APIs are lighter and more maintainable
- **Flash-based players:** Dead technology; use HTML5 Audio or YouTube IFrame API

## Open Questions

1. **Should we support hosted audio files or YouTube-only?**
   - What we know: All current music entries have youtubeId and link to YouTube
   - What's unclear: Whether future music entries might use hosted MP3/OGG files
   - Recommendation: Start with YouTube-only (Plyr); Plyr also supports HTML5 audio if needed later (easy migration path)

2. **Should minimize be automatic on scroll or manual-only?**
   - What we know: Intersection Observer can auto-minimize when scrolled out of view
   - What's unclear: User preference - some may find auto-minimize disruptive
   - Recommendation: Implement manual minimize/expand first; add auto-minimize as enhancement with localStorage preference

3. **Should player sync across tabs?**
   - What we know: localStorage changes fire `storage` event in other tabs
   - What's unclear: Whether multi-tab sync is desired or confusing
   - Recommendation: Skip multi-tab sync for v1; single-tab persistence is sufficient

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.x (recommended for Astro) |
| Config file | none — see Wave 0 |
| Quick run command | `npx playwright test --grep @player` |
| Full suite command | `npx playwright test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLAYER-01 | Floating player appears when music item is played | e2e | `npx playwright test tests/player.spec.ts::test_player_appears -x` | ❌ Wave 0 |
| PLAYER-02 | Player persists across page navigation | e2e | `npx playwright test tests/player.spec.ts::test_player_persists -x` | ❌ Wave 0 |
| PLAYER-03 | Player shows track info and cover art | e2e | `npx playwright test tests/player.spec.ts::test_player_metadata -x` | ❌ Wave 0 |
| PLAYER-04 | Player has working controls | e2e | `npx playwright test tests/player.spec.ts::test_player_controls -x` | ❌ Wave 0 |
| PLAYER-05 | Player minimize/expand works | e2e | `npx playwright test tests/player.spec.ts::test_player_states -x` | ❌ Wave 0 |
| PLAYER-06 | Play button on music cards loads track | e2e | `npx playwright test tests/player.spec.ts::test_music_card_integration -x` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx playwright test --grep @smoke` (smoke tests only)
- **Per wave merge:** `npx playwright test --grep @player` (all player tests)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/player.spec.ts` — covers all PLAYER-* requirements
- [ ] `playwright.config.ts` — Playwright configuration for Astro
- [ ] Framework install: `npm install -D @playwright/test` — if none detected

**Rationale for Playwright:** Astro is a server-rendered framework; E2E tests validate View Transitions behavior, YouTube embed loading, and cross-page persistence that unit tests cannot verify.

## Sources

### Primary (HIGH confidence)
- Astro View Transitions Documentation - https://docs.astro.build/en/guides/view-transitions/ - Fetched 2026-03-10
- HTML5 Audio Element MDN - https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio - Fetched 2026-03-10
- Intersection Observer API MDN - https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API - Fetched 2026-03-10
- CSS Position Property MDN - https://developer.mozilla.org/en-US/docs/Web/CSS/position - Fetched 2026-03-10
- localStorage API MDN - https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage - Fetched 2026-03-10

### Secondary (MEDIUM confidence)
- Plyr GitHub Repository - https://github.com/sampotts/plyr - Fetched 2026-03-10 (version 3.8.4, actively maintained)
- Howler.js GitHub Repository - https://github.com/goldfire/howler.js - Fetched 2026-03-10 (7kb gzipped, Web Audio API)
- YouTube Player Parameters - https://developers.google.com/youtube/player_parameters - Fetched 2026-03-10

### Tertiary (LOW confidence)
- None - all findings verified with official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Astro View Transitions documented for this exact use case; Plyr actively maintained and supports YouTube
- Architecture: HIGH - Patterns derived from official MDN and Astro documentation
- Pitfalls: HIGH - Autoplay restrictions and transform containment well-documented; common issues across web audio projects

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (30 days - stable ecosystem, unlikely to change rapidly)
