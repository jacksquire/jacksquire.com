import { getCollection } from 'astro:content';
import travelData from '../data/travel.json';

// TypeScript interfaces for return types
export interface YearStats {
  totalItems: number;
  books: {
    total: number;
    byTier: Record<string, number>;
    byCategory: Record<string, number>;
    fiction: number;
    nonfiction: number;
  };
  podcasts: {
    total: number;
  };
  videos: {
    total: number;
  };
  articles: {
    total: number;
  };
  music: {
    total: number;
  };
}

export interface TripInfo {
  destination: string;
  stateOrRegion: string;
  country: string;
  startDate: string;
  endDate: string;
  highlights: string;
  lat: number;
  lon: number;
}

export interface TravelStats {
  totalCountries: number;
  totalUSStates: number;
  totalMexicoStates: number;
  totalCitiesLived: number;
  tripsByYear: Record<string, TripInfo[]>;
  countriesByYear: number; // all-time total (travel.json has no per-year country data)
}

/**
 * Aggregates library stats by year from content collections
 * @returns Record<year, YearStats> where year is "2024", "2025", etc.
 */
export async function aggregateStatsByYear(): Promise<Record<string, YearStats>> {
  const items = await getCollection('library');
  const statsByYear: Record<string, YearStats> = {};

  items.forEach((item) => {
    // Extract year from dateRead (format: "YYYY-MM" or "YYYY-MM-DD")
    const year = item.data.dateRead.split('-')[0];

    // Initialize year if not exists
    if (!statsByYear[year]) {
      statsByYear[year] = {
        totalItems: 0,
        books: {
          total: 0,
          byTier: {},
          byCategory: {},
          fiction: 0,
          nonfiction: 0,
        },
        podcasts: { total: 0 },
        videos: { total: 0 },
        articles: { total: 0 },
        music: { total: 0 },
      };
    }

    const yearStats = statsByYear[year];
    yearStats.totalItems++;

    // Aggregate by type
    const itemType = item.data.type;

    if (itemType === 'book') {
      yearStats.books.total++;

      // Aggregate by tier
      const tier = item.data.tier;
      yearStats.books.byTier[tier] = (yearStats.books.byTier[tier] || 0) + 1;

      // Aggregate by category
      item.data.categories.forEach((category) => {
        yearStats.books.byCategory[category] = (yearStats.books.byCategory[category] || 0) + 1;
      });

      // Fiction vs nonfiction
      if ('isFiction' in item.data && item.data.isFiction) {
        yearStats.books.fiction++;
      } else if ('isFiction' in item.data) {
        yearStats.books.nonfiction++;
      }
    } else if (itemType === 'podcast') {
      yearStats.podcasts.total++;
    } else if (itemType === 'video') {
      yearStats.videos.total++;
    } else if (itemType === 'article') {
      yearStats.articles.total++;
    } else if (itemType === 'music') {
      yearStats.music.total++;
    }
  });

  return statsByYear;
}

/**
 * Aggregates travel stats from travel.json
 * @returns TravelStats object with country/state counts and trips by year
 */
export function aggregateTravelStats(): TravelStats {
  const tripsByYear: Record<string, TripInfo[]> = {};

  // Group trips by year
  travelData.tripLog.forEach((trip) => {
    const year = trip.startDate.split('-')[0];
    if (!tripsByYear[year]) {
      tripsByYear[year] = [];
    }
    tripsByYear[year].push(trip);
  });

  return {
    totalCountries: travelData.countriesVisited.length,
    totalUSStates: travelData.usStatesVisited.length,
    totalMexicoStates: travelData.mexicanStatesVisited.length,
    totalCitiesLived: travelData.citiesLived.length,
    tripsByYear,
    countriesByYear: travelData.countriesVisited.length, // all-time total
  };
}
