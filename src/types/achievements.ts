export type AchievementCategory = 'time' | 'streak';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface AchievementBadgeDefinition {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  target: number; // minutes for 'time', days for 'streak'
  unit: 'min' | 'days';
  tier: AchievementTier;
  iconName:
    | 'wind'
    | 'feather'
    | 'compass'
    | 'clock'
    | 'waves'
    | 'sparkles'
    | 'crown'
    | 'gem'
    | 'flame'
    | 'zap'
    | 'shield'
    | 'calendar'
    | 'sun'
    | 'award'
    | 'mountain';
}

export interface AchievementBadge extends AchievementBadgeDefinition {
  unlocked: boolean;
  currentValue: number;
  progressPct: number; // 0 - 100
  remaining: number;
  unlockedAt: number | null; // timestamp of unlock if known
  unlockedDateStr: string | null; // e.g., 'Oct 22, 2026'
}

export interface AchievementsOverview {
  badges: AchievementBadge[];
  totalBadges: number;
  unlockedCount: number;
  completionPct: number;
  timeBadgesCount: number;
  timeUnlockedCount: number;
  streakBadgesCount: number;
  streakUnlockedCount: number;
  nextBadge: AchievementBadge | null;
  recentlyUnlocked: AchievementBadge[];
}
