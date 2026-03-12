import { getCollection } from 'astro:content';
import type { Achievement, ComputedAchievement, SiteData } from '../types/achievement';
import travelData from './travel.json';

// Helper function to count continents from country codes
function countContinents(countries: { name: string; code: string }[]): number {
  const continentMap: Record<string, string> = {
    // North America
    'US': 'NA', 'CA': 'NA', 'MX': 'NA', 'GT': 'NA', 'HN': 'NA', 'CR': 'NA',
    'PA': 'NA', 'DO': 'NA', 'BS': 'NA',
    // South America
    'PE': 'SA', 'CO': 'SA',
    // Europe
    'GB': 'EU', 'FR': 'EU', 'ES': 'EU', 'PT': 'EU', 'NL': 'EU', 'BE': 'EU',
    'DE': 'EU', 'CH': 'EU', 'AT': 'EU', 'LI': 'EU', 'IT': 'EU', 'SI': 'EU',
    'HR': 'EU', 'ME': 'EU', 'AL': 'EU', 'MK': 'EU', 'GR': 'EU', 'CZ': 'EU',
    'HU': 'EU', 'SK': 'EU', 'RO': 'EU', 'BG': 'EU', 'RS': 'EU', 'CY': 'EU',
    'VA': 'EU',
    // Asia
    'TR': 'AS', 'AM': 'AS', 'GE': 'AS', 'AE': 'AS', 'OM': 'AS', 'TH': 'AS',
    'ID': 'AS', 'MY': 'AS', 'SG': 'AS', 'TW': 'AS', 'JP': 'AS',
  };

  const continents = new Set(
    countries.map(country => continentMap[country.code]).filter(Boolean)
  );

  return continents.size;
}

// Helper to count continents from cities lived
function countContinentsFromCities(cities: { city: string; country: string }[]): number {
  const continentMap: Record<string, string> = {
    'USA': 'NA',
    'Mexico': 'NA',
    'Indonesia': 'AS',
    'Germany': 'EU',
  };

  const continents = new Set(
    cities.map(city => continentMap[city.country]).filter(Boolean)
  );

  return continents.size;
}

export const achievements: Achievement[] = [
  // ============================================
  // TRAVEL ACHIEVEMENTS
  // ============================================
  {
    id: 'globe-trotter',
    title: 'Globe Trotter',
    description: 'Visit 50 countries',
    category: 'travel',
    icon: '🌍',
    tier: 'gold',
    requirement: 50,
    computeProgress: (data) => data.countries.length,
    unlockedMessage: 'Half a hundred countries explored!',
  },
  {
    id: 'all-american',
    title: 'All-American',
    description: 'Visit 25 US states',
    category: 'travel',
    icon: '🗽',
    tier: 'silver',
    requirement: 25,
    computeProgress: (data) => data.usStates.length,
    unlockedMessage: 'Coast to coast explorer!',
  },
  {
    id: 'nomad-life',
    title: 'Nomad Life',
    description: 'Live in 5+ cities',
    category: 'travel',
    icon: '🎒',
    tier: 'silver',
    requirement: 5,
    computeProgress: (data) => data.citiesLived.length,
    unlockedMessage: 'The world is your home.',
  },
  {
    id: 'continent-collector',
    title: 'Continent Collector',
    description: 'Visit 5 continents',
    category: 'travel',
    icon: '🗺️',
    tier: 'gold',
    requirement: 5,
    computeProgress: (data) => countContinents(data.countries),
    unlockedMessage: 'A true global citizen!',
  },
  {
    id: 'mexico-explorer',
    title: 'Mexico Explorer',
    description: 'Visit 5 Mexican states',
    category: 'travel',
    icon: '🇲🇽',
    tier: 'bronze',
    requirement: 5,
    computeProgress: (data) => {
      // Count Mexican states from travel.json
      return travelData.mexicanStatesVisited.length;
    },
    unlockedMessage: '¡Qué padre!',
  },
  {
    id: 'us-roadtripper',
    title: 'US Roadtripper',
    description: 'Visit 30+ US states',
    category: 'travel',
    icon: '🚗',
    tier: 'gold',
    requirement: 30,
    computeProgress: (data) => data.usStates.length,
    unlockedMessage: 'American highways mastered!',
  },

  // ============================================
  // READING ACHIEVEMENTS
  // ============================================
  {
    id: 'bookworm',
    title: 'Bookworm',
    description: 'Read 10 books',
    category: 'reading',
    icon: '📚',
    tier: 'bronze',
    requirement: 10,
    computeProgress: (data) => data.books.length,
    unlockedMessage: 'The reading journey begins!',
  },
  {
    id: 'avid-reader',
    title: 'Avid Reader',
    description: 'Read 50 books',
    category: 'reading',
    icon: '📖',
    tier: 'silver',
    requirement: 50,
    computeProgress: (data) => data.books.length,
    unlockedMessage: 'Hundreds of thousands of pages conquered!',
  },
  {
    id: 'curator',
    title: 'Curator',
    description: 'Rate 5 items S+',
    category: 'reading',
    icon: '⭐',
    tier: 'gold',
    requirement: 5,
    computeProgress: (data) => {
      return data.library.filter(item => item.data.tier === 'S+').length;
    },
    unlockedMessage: 'Elite taste recognized!',
  },
  {
    id: 's-tier-collector',
    title: 'S-Tier Collector',
    description: 'Rate 10 items S or S+',
    category: 'reading',
    icon: '💎',
    tier: 'silver',
    requirement: 10,
    computeProgress: (data) => {
      return data.library.filter(item =>
        item.data.tier === 'S' || item.data.tier === 'S+'
      ).length;
    },
    unlockedMessage: 'Top-tier content curator!',
  },
  {
    id: 'media-connoisseur',
    title: 'Media Connoisseur',
    description: 'Log 50 items total in library',
    category: 'reading',
    icon: '🎬',
    tier: 'gold',
    requirement: 50,
    computeProgress: (data) => data.library.length,
    unlockedMessage: 'A diverse media diet!',
  },
  {
    id: 'series-devotee',
    title: 'Series Devotee',
    description: 'Read 10+ books in a single series',
    category: 'reading',
    icon: '📚',
    tier: 'silver',
    requirement: 10,
    computeProgress: (data) => {
      // Count books per series using the series field
      const seriesCounts: Record<string, number> = {};

      data.books.forEach(book => {
        const series = book.data.series;
        if (series) {
          seriesCounts[series] = (seriesCounts[series] || 0) + 1;
        }
      });

      // Return the highest count from any series
      const maxSeriesCount = Math.max(0, ...Object.values(seriesCounts));
      return maxSeriesCount;
    },
    unlockedMessage: 'Series completion champion!',
  },

  // ============================================
  // PROJECTS ACHIEVEMENTS
  // ============================================
  {
    id: 'builder',
    title: 'Builder',
    description: 'Launch 3 projects',
    category: 'projects',
    icon: '🔨',
    tier: 'bronze',
    requirement: 3,
    computeProgress: (data) => data.projects, // Hardcoded count from projects page
    unlockedMessage: 'The maker journey begins!',
  },
  {
    id: 'serial-entrepreneur',
    title: 'Serial Entrepreneur',
    description: 'Launch 5+ projects',
    category: 'projects',
    icon: '🚀',
    tier: 'gold',
    requirement: 5,
    computeProgress: (data) => data.projects,
    unlockedMessage: 'Ideas to execution!',
  },
  {
    id: 'portfolio-king',
    title: 'Portfolio King',
    description: 'Launch 10 projects',
    category: 'projects',
    icon: '👑',
    tier: 'legendary',
    requirement: 10,
    computeProgress: (data) => data.projects,
    unlockedMessage: 'A legendary portfolio!',
  },

  // ============================================
  // PERSONAL ACHIEVEMENTS
  // ============================================
  {
    id: 'world-citizen',
    title: 'World Citizen',
    description: 'Live on 3+ continents',
    category: 'personal',
    icon: '🌏',
    tier: 'legendary',
    requirement: 3,
    computeProgress: (data) => countContinentsFromCities(data.citiesLived),
    unlockedMessage: 'Home is wherever you are!',
  },
  {
    id: 'transformation',
    title: 'Transformation',
    description: 'Lose 100+ lbs',
    category: 'personal',
    icon: '💪',
    tier: 'legendary',
    requirement: 100,
    computeProgress: () => 100, // Personal milestone — not derived from content data
    unlockedMessage: 'A journey of dedication and discipline!',
  },
  {
    id: 'polyglot-explorer',
    title: 'Polyglot Explorer',
    description: 'Visit countries across 4+ continents',
    category: 'personal',
    icon: '🗣️',
    tier: 'gold',
    requirement: 4,
    computeProgress: (data) => countContinents(data.countries),
    unlockedMessage: 'Cultural explorer extraordinaire!',
  },
];

export async function computeAchievementStates(): Promise<ComputedAchievement[]> {
  // Get library collection
  const library = await getCollection('library');
  const books = library.filter(item => item.data.type === 'book');

  // Build SiteData object
  const siteData: SiteData = {
    library,
    books,
    countries: travelData.countriesVisited,
    usStates: travelData.usStatesVisited,
    citiesLived: travelData.citiesLived,
    projects: 9, // Hardcoded from projects.astro — there is no projects content collection
  };

  // Compute achievement states
  return achievements.map(achievement => {
    const current = achievement.computeProgress(siteData);
    const isUnlocked = current >= achievement.requirement;
    const progress = Math.min(100, Math.round((current / achievement.requirement) * 100));

    return {
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      category: achievement.category,
      icon: achievement.icon,
      tier: achievement.tier,
      requirement: achievement.requirement,
      unlockedMessage: achievement.unlockedMessage,
      current,
      isUnlocked,
      progress,
    };
  });
}
