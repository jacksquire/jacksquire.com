# Phase 2: Annual Stats Dashboard ("Wrapped") - Research

**Researched:** 2026-03-10
**Domain:** Data visualization, animation, and static site data aggregation
**Confidence:** HIGH

## Summary

The Annual Stats Dashboard phase requires creating a "Wrapped"-style annual statistics page that visualizes reading habits, travel metrics, and media consumption from existing content collections and travel.json data. The primary technical challenge is selecting lightweight, dark-mode-compatible charting libraries and implementing scroll-triggered animations while maintaining Astro's static-first architecture.

After researching charting libraries, animation patterns, and Astro data aggregation techniques, the recommended approach is to use **Chart.js 4.x** for visualizations paired with **CountUp.js** for animated number counters, implementing year-based filtering via client-side JavaScript to maintain the static build. The existing codebase already demonstrates best practices for aggregating content collection data and client-side filtering (see library/index.astro).

**Primary recommendation:** Use Chart.js for charts (lightweight, well-documented, dark mode support via custom theming), CountUp.js for number animations, Intersection Observer API for scroll triggers, and pure JavaScript for year filtering (no framework hydration needed).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| STATS-01 | Visitor can access a "Wrapped" / annual stats page | Astro static page generation with `/stats` or `/wrapped` route |
| STATS-02 | Dashboard shows books read count with breakdown by tier and category | Content collection aggregation using `getCollection()` and JavaScript array methods (filter, reduce, groupBy) |
| STATS-03 | Dashboard shows countries/states visited with year-over-year growth | travel.json data + tripLog with date parsing for YoY comparison |
| STATS-04 | Dashboard shows media consumption breakdown (books, podcasts, videos, articles, music) | Discriminated union schema supports type filtering; Chart.js pie/doughnut charts for visualization |
| STATS-05 | Stats include animated counters and visual charts | CountUp.js for number animations, Chart.js for charts, Intersection Observer for scroll triggers |
| STATS-06 | Dashboard pulls data from existing content collections and travel.json | Existing patterns in library/index.astro show how to aggregate at build time |
| STATS-07 | Year selector allows viewing stats for different years | Client-side JavaScript filtering (similar to library filters); data pre-aggregated by year at build time |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Chart.js | 4.5.1+ | Data visualization (bar, pie, line charts) | Most popular JS charting library (67k+ stars, 1.3M+ dependents), excellent docs, tree-shakable, works with vanilla JS |
| CountUp.js | 2.x | Animated number counters | Lightweight (8k stars, 131k+ dependents), dependency-free, auto-animate on scroll support, works with vanilla JS |
| Intersection Observer API | Native | Scroll-triggered animations | Browser native (widely supported since 2019), eliminates need for scroll polling, optimal performance |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS | 3.4.19 (existing) | Animation utilities and transitions | Already in project; use for fade-in, slide-up effects via CSS classes |
| date-fns | 3.x (optional) | Date parsing and manipulation | If complex date calculations needed; otherwise native Date is sufficient |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Chart.js | D3.js | D3 is more powerful but has steep learning curve; overkill for simple bar/pie charts |
| Chart.js | Observable Plot | Higher-level than D3, but still more complex than Chart.js for standard charts |
| Chart.js | ApexCharts | Good alternative with built-in dark mode, but heavier bundle and React-focused integrations |
| Chart.js | Frappe Charts | Lightweight but less ecosystem support and fewer examples |
| CountUp.js | Custom implementation | CountUp.js is already tiny; custom code adds maintenance burden |

**Installation:**
```bash
npm install chart.js countup.js
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── pages/
│   └── wrapped.astro          # or stats.astro - main dashboard page
├── components/
│   ├── stats/
│   │   ├── StatCard.astro     # Individual stat display with counter
│   │   ├── YearSelector.astro # Year filter dropdown/tabs
│   │   ├── ReadingChart.astro # Chart.js wrapper for books
│   │   ├── TravelChart.astro  # Chart.js wrapper for travel
│   │   └── MediaBreakdown.astro # Media type pie chart
│   └── ...
├── utils/
│   └── statsAggregator.ts     # Build-time data aggregation functions
└── data/
    └── travel.json            # (existing)
```

### Pattern 1: Build-Time Data Aggregation
**What:** Aggregate all statistics by year during Astro's build process, output JSON structure
**When to use:** Always - compute stats at build time, not runtime
**Example:**
```typescript
// utils/statsAggregator.ts
import { getCollection } from 'astro:content';
import travelData from '../data/travel.json';

export async function aggregateStatsByYear() {
  const library = await getCollection('library');

  // Group by year
  const statsByYear = library.reduce((acc, item) => {
    const year = item.data.dateRead.split('-')[0]; // Extract year from "2016-12"
    if (!acc[year]) {
      acc[year] = {
        books: { total: 0, byTier: {}, byCategory: {} },
        podcasts: { total: 0 },
        videos: { total: 0 },
        articles: { total: 0 },
        music: { total: 0 }
      };
    }

    const type = item.data.type;
    acc[year][type + 's'].total++;

    if (type === 'book') {
      const tier = item.data.tier;
      acc[year].books.byTier[tier] = (acc[year].books.byTier[tier] || 0) + 1;

      item.data.categories.forEach(cat => {
        acc[year].books.byCategory[cat] = (acc[year].books.byCategory[cat] || 0) + 1;
      });
    }

    return acc;
  }, {});

  return statsByYear;
}

export function aggregateTravelByYear() {
  // Parse tripLog dates and group by year
  const tripsByYear = travelData.tripLog.reduce((acc, trip) => {
    const year = new Date(trip.startDate).getFullYear().toString();
    if (!acc[year]) acc[year] = [];
    acc[year].push(trip);
    return acc;
  }, {});

  return {
    totalCountries: travelData.countriesVisited.length,
    totalUSStates: travelData.usStatesVisited.length,
    totalMexicoStates: travelData.mexicanStatesVisited.length,
    tripsByYear
  };
}
```

### Pattern 2: Client-Side Year Filtering
**What:** Pre-render all years' data, toggle visibility via JavaScript (no hydration needed)
**When to use:** For year selector functionality on static sites
**Example:**
```astro
---
// wrapped.astro
import { aggregateStatsByYear } from '../utils/statsAggregator';

const statsByYear = await aggregateStatsByYear();
const availableYears = Object.keys(statsByYear).sort((a, b) => Number(b) - Number(a));
const currentYear = new Date().getFullYear().toString();
---

<div class="year-selector">
  {availableYears.map(year => (
    <button
      class="year-btn"
      data-year={year}
      class:list={[{ active: year === currentYear }]}
    >
      {year}
    </button>
  ))}
</div>

<div id="stats-container" data-stats={JSON.stringify(statsByYear)}></div>

<script>
  const statsData = JSON.parse(document.getElementById('stats-container').dataset.stats);
  let currentYear = new Date().getFullYear().toString();

  function updateStatsDisplay(year) {
    const yearData = statsData[year];
    // Update counters, re-render charts
    updateCounters(yearData);
    updateCharts(yearData);
  }

  document.querySelectorAll('.year-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentYear = btn.dataset.year;
      updateStatsDisplay(currentYear);

      // Update active state
      document.querySelectorAll('.year-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Initialize with current year
  updateStatsDisplay(currentYear);
</script>
```

### Pattern 3: Chart.js with Dark Mode Theming
**What:** Configure Chart.js to match site's dark color palette
**When to use:** Every Chart.js implementation
**Example:**
```javascript
// Source: Chart.js official docs + dark mode patterns
const darkTheme = {
  backgroundColor: 'rgba(59, 130, 246, 0.2)',
  borderColor: 'rgb(59, 130, 246)',
  textColor: '#f4f4f5', // zinc-100
  gridColor: 'rgba(63, 63, 70, 0.3)', // zinc-700 with alpha
};

const ctx = document.getElementById('myChart').getContext('2d');
new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['S+', 'S', 'A', 'B', 'C', 'D'],
    datasets: [{
      label: 'Books by Tier',
      data: [5, 12, 8, 3, 1, 0],
      backgroundColor: darkTheme.backgroundColor,
      borderColor: darkTheme.borderColor,
      borderWidth: 2
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: darkTheme.textColor
        }
      }
    },
    scales: {
      x: {
        ticks: { color: darkTheme.textColor },
        grid: { color: darkTheme.gridColor }
      },
      y: {
        ticks: { color: darkTheme.textColor },
        grid: { color: darkTheme.gridColor }
      }
    }
  }
});
```

### Pattern 4: Scroll-Triggered Animated Counters
**What:** Use Intersection Observer to trigger CountUp.js when stat cards enter viewport
**When to use:** For all number counters on the stats dashboard
**Example:**
```astro
<div class="stat-card" data-count="42" data-target="books-read">
  <h3>Books Read</h3>
  <p class="stat-number">0</p>
</div>

<script>
  import { CountUp } from 'countup.js';

  const statCards = document.querySelectorAll('.stat-card');
  const animatedCounters = new Map();

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animatedCounters.has(entry.target)) {
        const target = entry.target.querySelector('.stat-number');
        const endValue = Number(entry.target.dataset.count);

        const countUp = new CountUp(target, endValue, {
          duration: 2,
          useEasing: true,
          useGrouping: true
        });

        if (!countUp.error) {
          countUp.start();
          animatedCounters.set(entry.target, true);
        }

        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.2,
    rootMargin: '0px 0px -50px 0px' // Trigger slightly before fully visible
  });

  statCards.forEach(card => observer.observe(card));
</script>
```

### Pattern 5: Responsive Chart Containers
**What:** Proper container sizing for Chart.js responsiveness
**When to use:** Every chart component
**Example:**
```astro
<div class="chart-container" style="position: relative; height: 400px; width: 100%;">
  <canvas id="myChart"></canvas>
</div>

<style>
  .chart-container {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 1.5rem;
  }
</style>
```

### Anti-Patterns to Avoid
- **Framework component hydration for charts:** Chart.js works with vanilla JS; don't wrap in React/Vue components unless you need framework state management
- **Fetching data client-side:** All stats should be computed at build time and embedded in page
- **Animating on every re-render:** Use Intersection Observer to animate once when entering viewport
- **Inline chart configurations:** Extract chart configs to reusable theme objects
- **Ignoring `maintainAspectRatio`:** Set to false and control height via container for better responsive behavior

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Animated number counters | Custom RAF loop with easing calculations | CountUp.js | Handles edge cases (negative numbers, decimals, formatting), battle-tested, 131k+ dependents |
| Chart rendering | Custom SVG/Canvas drawing with scales and axes | Chart.js or Observable Plot | Axis scaling, tooltips, legends, responsive behavior are complex; Chart.js handles all of this |
| Scroll-triggered animations | Custom scroll event listener with throttling | Intersection Observer API | Browser-native, more performant, handles edge cases like fast scrolling and visibility changes |
| Date parsing/manipulation | Regex on dateRead strings | Native Date or date-fns | Edge cases (leap years, timezones, invalid dates) are subtle; use proven libraries |
| Year-over-year calculations | Manual date math | Aggregate at build time, store deltas | Complex logic; pre-compute comparisons during build for accuracy |

**Key insight:** Data visualization has many edge cases (empty data, single data point, extreme values, responsive resizing). Chart.js handles these; custom solutions will hit them one by one during development.

## Common Pitfalls

### Pitfall 1: Chart.js Canvas Sizing Issues
**What goes wrong:** Charts render at wrong size or don't resize properly on viewport changes
**Why it happens:** Chart.js responsive behavior depends on proper container structure
**How to avoid:** Always wrap canvas in a positioned container with explicit height
**Warning signs:** Charts appear squashed or stretched, or don't resize on window resize
**Example:**
```html
<!-- WRONG -->
<canvas id="chart"></canvas>

<!-- RIGHT -->
<div style="position: relative; height: 400px;">
  <canvas id="chart"></canvas>
</div>
```

### Pitfall 2: Parsing dateRead Field Incorrectly
**What goes wrong:** Years extracted incorrectly from "2016-12" format vs "2025-03-10" format
**Why it happens:** Existing library entries use "YYYY-MM" format, but tripLog uses "YYYY-MM-DD"
**How to avoid:** Normalize date parsing - always extract first 4 characters for year, or use Date parser and getFullYear()
**Warning signs:** Stats show wrong year, items missing from year filters
**Example:**
```typescript
// Handles both "2016-12" and "2025-03-10"
const year = item.data.dateRead.split('-')[0]; // Always YYYY
```

### Pitfall 3: CountUp.js Not Triggering
**What goes wrong:** Number counters don't animate, stay at 0 or jump to final value
**Why it happens:** CountUp initialized before element is in viewport, or error not checked
**How to avoid:** Always check `countUp.error` before calling `start()`, use Intersection Observer for viewport detection
**Warning signs:** Console errors about target elements, numbers appearing instantly without animation
**Example:**
```javascript
const countUp = new CountUp('target-id', 100);
if (!countUp.error) {
  countUp.start();
} else {
  console.error(countUp.error);
}
```

### Pitfall 4: Over-Animating on Page Load
**What goes wrong:** Too many animations trigger simultaneously, page feels janky
**Why it happens:** All stat cards, charts, and counters animate at once when page loads
**How to avoid:** Stagger animations with Intersection Observer, or add delays to sequential elements
**Warning signs:** Browser stutters on page load, animations feel chaotic rather than polished
**Example:**
```javascript
// Add staggered delays
entries.forEach((entry, index) => {
  if (entry.isIntersecting) {
    setTimeout(() => {
      triggerAnimation(entry.target);
    }, index * 100); // 100ms stagger
  }
});
```

### Pitfall 5: Forgetting to Destroy Chart Instances
**What goes wrong:** When updating chart data (e.g., year changes), old chart persists or overlaps
**Why it happens:** Chart.js creates persistent canvas contexts; changing data requires destroying and recreating
**How to avoid:** Store chart instance, call `chart.destroy()` before creating new chart
**Warning signs:** Charts look weird after year changes, multiple tooltips appear, memory leaks
**Example:**
```javascript
let currentChart = null;

function updateChart(data) {
  if (currentChart) {
    currentChart.destroy();
  }
  currentChart = new Chart(ctx, config);
}
```

### Pitfall 6: Not Handling Empty Data States
**What goes wrong:** Charts render incorrectly or throw errors when a year has no data
**Why it happens:** Assuming every year will have data for every category
**How to avoid:** Check for empty arrays/zero sums before rendering, show "No data" message
**Warning signs:** Console errors, blank charts, NaN values displayed
**Example:**
```typescript
const yearData = statsByYear[selectedYear];
if (!yearData || yearData.books.total === 0) {
  showEmptyState('No books logged for this year');
  return;
}
```

## Code Examples

Verified patterns from official sources:

### Content Collection Aggregation (Astro 5.x)
```typescript
// Source: Astro docs - https://docs.astro.build/en/guides/content-collections/
import { getCollection } from 'astro:content';

const library = await getCollection('library');

// Filter by type
const books = library.filter(item => item.data.type === 'book');

// Filter by year
const booksIn2025 = books.filter(item =>
  item.data.dateRead.startsWith('2025')
);

// Group by category
const booksByCategory = books.reduce((acc, book) => {
  book.data.categories.forEach(category => {
    if (!acc[category]) acc[category] = [];
    acc[category].push(book);
  });
  return acc;
}, {});

// Count by tier
const tierCounts = books.reduce((acc, book) => {
  const tier = book.data.tier;
  acc[tier] = (acc[tier] || 0) + 1;
  return acc;
}, {});
```

### Chart.js Bar Chart Implementation
```javascript
// Source: Chart.js docs - https://www.chartjs.org/docs/latest/
import Chart from 'chart.js/auto';

const ctx = document.getElementById('tierChart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['S+', 'S', 'A', 'B', 'C', 'D'],
    datasets: [{
      label: 'Books by Tier',
      data: [5, 12, 8, 3, 1, 0],
      backgroundColor: [
        'rgba(250, 204, 21, 0.2)',  // S+ yellow
        'rgba(147, 51, 234, 0.2)',   // S purple
        'rgba(59, 130, 246, 0.2)',   // A blue
        'rgba(34, 197, 94, 0.2)',    // B green
        'rgba(249, 115, 22, 0.2)',   // C orange
        'rgba(239, 68, 68, 0.2)',    // D red
      ],
      borderColor: [
        'rgb(250, 204, 21)',
        'rgb(147, 51, 234)',
        'rgb(59, 130, 246)',
        'rgb(34, 197, 94)',
        'rgb(249, 115, 22)',
        'rgb(239, 68, 68)',
      ],
      borderWidth: 2
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#a1a1aa', // zinc-400
          stepSize: 1
        },
        grid: {
          color: 'rgba(39, 39, 42, 0.5)' // zinc-800
        }
      },
      x: {
        ticks: { color: '#a1a1aa' },
        grid: { display: false }
      }
    }
  }
});
```

### CountUp.js with Intersection Observer
```javascript
// Source: CountUp.js GitHub - https://github.com/inorganik/countUp.js
// Source: MDN Intersection Observer - https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
import { CountUp } from 'countup.js';

const statElements = document.querySelectorAll('[data-countup]');

const observerOptions = {
  threshold: 0.3,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const element = entry.target;
      const endValue = Number(element.dataset.countup);

      const options = {
        duration: 2.5,
        useEasing: true,
        useGrouping: true,
        separator: ',',
        decimal: '.'
      };

      const countUp = new CountUp(element, endValue, options);

      if (!countUp.error) {
        countUp.start();
      } else {
        console.error('CountUp error:', countUp.error);
        element.textContent = endValue; // Fallback
      }

      observer.unobserve(element);
    }
  });
}, observerOptions);

statElements.forEach(el => observer.observe(el));
```

### Tailwind CSS Scroll Animations
```astro
<!-- Source: Tailwind CSS docs + project's existing tailwind.config.mjs -->
<div class="stat-card opacity-0 translate-y-8 transition-all duration-700 ease-out"
     data-animate-on-scroll>
  <h3>Total Books</h3>
  <p class="text-4xl font-bold" data-countup="42">0</p>
</div>

<script>
  const animatedElements = document.querySelectorAll('[data-animate-on-scroll]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.remove('opacity-0', 'translate-y-8');
          entry.target.classList.add('opacity-100', 'translate-y-0');
        }, index * 150); // Stagger by 150ms

        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.2
  });

  animatedElements.forEach(el => observer.observe(el));
</script>

<style>
  .stat-card {
    /* Use existing Tailwind animations from project config */
    animation: slideUp 0.5s ease-out forwards;
  }
</style>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| D3.js for simple charts | Chart.js or Observable Plot | ~2020 | Lower barrier to entry; D3 now reserved for complex custom visualizations |
| jQuery for DOM manipulation | Vanilla JS + Intersection Observer | 2019+ | Native APIs are now sufficient; no library needed for scroll effects |
| Client-side data fetching | Build-time aggregation with Astro | 2021+ (Astro 1.0) | Better performance, SEO, no loading spinners |
| Manual scroll event listeners | Intersection Observer API | 2019+ (wide support) | Better performance, declarative, handles edge cases |
| CSS-only animations | JavaScript-triggered CSS transitions | Current | Best of both worlds: performant CSS with programmatic control |

**Deprecated/outdated:**
- **Highcharts free tier limitations:** Chart.js is fully open-source; Highcharts requires license for commercial use
- **Moment.js for date handling:** Now deprecated; use native Date methods or date-fns instead
- **AOS (Animate On Scroll) library:** Intersection Observer API is now widely supported; no library needed
- **requestAnimationFrame for counters:** CountUp.js handles RAF internally with better easing and error handling

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — manual testing recommended |
| Config file | none — see Wave 0 |
| Quick run command | N/A — no test framework installed |
| Full suite command | N/A |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STATS-01 | /wrapped page accessible and renders | manual | Open browser to `/wrapped` | ❌ Wave 0 |
| STATS-02 | Books breakdown by tier and category displays correctly | manual | Visual inspection of charts and numbers | ❌ Wave 0 |
| STATS-03 | Travel stats show countries/states with YoY | manual | Verify travel stats section renders | ❌ Wave 0 |
| STATS-04 | Media breakdown chart shows all types | manual | Check pie/doughnut chart displays | ❌ Wave 0 |
| STATS-05 | Counters animate on scroll, charts transition | manual | Scroll page, observe animations | ❌ Wave 0 |
| STATS-06 | Data pulls from content collections and travel.json | manual | Verify numbers match source data | ❌ Wave 0 |
| STATS-07 | Year selector filters stats by year | manual | Click year buttons, verify data updates | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** Manual browser test of changed component
- **Per wave merge:** Full page walkthrough with all years and chart types
- **Phase gate:** Complete manual test across desktop, tablet, mobile viewports

### Wave 0 Gaps
No automated testing infrastructure exists. Recommend:
- [ ] Consider adding Playwright or Cypress for E2E tests (optional for static site)
- [ ] Manual QA checklist in verification doc will be primary validation method
- [ ] Visual regression testing with Percy or Chromatic (optional)

**Rationale:** Static sites with no server logic can be effectively validated through manual testing. Automated E2E tests add value for interaction-heavy features (year selector, scroll animations) but are not critical for MVP.

## Sources

### Primary (HIGH confidence)
- Astro Content Collections - https://docs.astro.build/en/guides/content-collections/ - Query and filter methods
- Astro Client-Side Scripts - https://docs.astro.build/en/guides/client-side-scripts/ - Script handling and bundling
- Astro Client Directives - https://docs.astro.build/en/reference/directives-reference/ - Hydration strategies
- Chart.js GitHub (v4.5.1) - https://github.com/chartjs/Chart.js - Current version and features
- Chart.js Getting Started - https://www.chartjs.org/docs/latest/getting-started/ - Installation and basic usage
- Chart.js Configuration - https://www.chartjs.org/docs/latest/configuration/ - Theming and options
- Chart.js Interactions - https://www.chartjs.org/docs/latest/configuration/interactions.html - Event handling
- CountUp.js GitHub - https://github.com/inorganik/countUp.js - Features and usage
- Intersection Observer API - https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API - Scroll trigger patterns
- Tailwind CSS Animations - https://tailwindcss.com/docs/animation - Built-in animation utilities

### Secondary (MEDIUM confidence)
- D3.js Overview - https://d3js.org/ - Comparison reference for complex visualizations
- Observable Plot - https://github.com/observablehq/plot - Alternative high-level charting option
- Chart.js Plugins - https://github.com/sgratzl/chartjs-chart-graph - Community ecosystem reference
- Existing codebase patterns - /src/pages/library/index.astro - Demonstrates content collection aggregation and client-side filtering

### Tertiary (LOW confidence)
- ApexCharts - https://apexcharts.com/ - Alternative charting library (limited info retrieved)
- Frappe Charts - https://frappe.io/charts - Lightweight alternative (minimal details available)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Chart.js and CountUp.js are well-documented, widely-used, and verified through official sources
- Architecture: HIGH - Patterns based on official Astro docs and existing codebase examples
- Pitfalls: MEDIUM - Based on common Chart.js issues and inferred from library best practices; not all verified in production

**Research date:** 2026-03-10
**Valid until:** ~2026-09-10 (6 months for stable ecosystem; Chart.js v4 is mature, Astro 5.x is current)
