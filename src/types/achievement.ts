export type AchievementCategory = 'travel' | 'reading' | 'projects' | 'personal';
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'legendary';

export interface SiteData {
  library: any[]; // Content collection items
  books: any[];
  countries: { name: string; code: string }[];
  usStates: { code: string; name: string }[];
  citiesLived: { city: string; country: string; type: string }[];
  projects: number; // count
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  icon: string; // emoji
  tier: AchievementTier;
  requirement: number;
  computeProgress: (data: SiteData) => number;
  unlockedMessage?: string;
}

export interface ComputedAchievement extends Omit<Achievement, 'computeProgress'> {
  current: number;
  isUnlocked: boolean;
  progress: number; // 0-100 percentage
}
