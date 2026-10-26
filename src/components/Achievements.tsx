import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Trophy,
  Award,
  Wind,
  Feather,
  Compass,
  Clock,
  Waves,
  Sparkles,
  Crown,
  Gem,
  Sun,
  Zap,
  Flame,
  Shield,
  Calendar,
  Mountain,
  Lock,
  CheckCircle2,
  ChevronRight,
  Target,
  X,
} from 'lucide-react';
import { SessionRecord } from '../types/stats';
import {
  AchievementBadge,
  AchievementCategory,
  AchievementTier,
} from '../types/achievements';
import {
  calculateAchievements,
  filterBadges,
} from '../utils/achievementsLogic';

interface AchievementsProps {
  history: SessionRecord[];
  onStartBreathing?: () => void;
}

type BadgeFilterType = 'all' | 'time' | 'streak' | 'unlocked';

export const Achievements: React.FC<AchievementsProps> = ({
  history,
  onStartBreathing,
}) => {
  const [filter, setFilter] = useState<BadgeFilterType>('all');
  const [selectedBadge, setSelectedBadge] = useState<AchievementBadge | null>(null);

  const achievements = calculateAchievements(history);
  const displayedBadges = filterBadges(
    achievements.badges,
    filter as 'all' | AchievementCategory | 'unlocked'
  );

  return (
    <div
      aria-label="Achievements and Milestones section"
      className="rounded-xl bg-slate-950/60 border border-slate-800/90 p-4 sm:p-5 flex flex-col gap-4 text-slate-100"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-semibold text-slate-100">
                Milestones & Badges
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                {achievements.unlockedCount} / {achievements.totalBadges} Unlocked
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Celebrate lifetime breathing minutes and uninterrupted daily streaks
            </p>
          </div>
        </div>

        {/* Start Breathing CTA if next badge exists */}
        {onStartBreathing && achievements.nextBadge && (
          <button
            onClick={onStartBreathing}
            className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <span>Breathe for Milestones</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Overview Cards: Progress Summary & Next Badge Teaser */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Total Completion Progress */}
        <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-3.5 flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium text-slate-300">Total Progress</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-amber-300">
              {achievements.completionPct}%
            </span>
            <span className="text-xs text-slate-400">
              ({achievements.unlockedCount} of {achievements.totalBadges} badges)
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-teal-400 h-full rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
              style={{ width: `${achievements.completionPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <span>Time: {achievements.timeUnlockedCount}/{achievements.timeBadgesCount}</span>
            <span>Streaks: {achievements.streakUnlockedCount}/{achievements.streakBadgesCount}</span>
          </div>
        </div>

        {/* Next Milestone Spotlight */}
        <div className="md:col-span-2 rounded-xl bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/40 border border-slate-800/90 p-3.5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-teal-400" />
              Next Milestone in Reach
            </span>
            {achievements.nextBadge && (
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/20 text-teal-300 font-medium capitalize">
                {achievements.nextBadge.tier} Tier
              </span>
            )}
          </div>

          {achievements.nextBadge ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-teal-300 shrink-0 shadow-inner">
                  <BadgeIcon iconName={achievements.nextBadge.iconName} className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-100 flex items-center gap-2">
                    <span>{achievements.nextBadge.title}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      · {achievements.nextBadge.category === 'time' ? 'Lifetime Time' : 'Daily Streak'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {achievements.nextBadge.description}
                  </p>
                </div>
              </div>

              {/* Progress pill & remaining */}
              <div className="flex flex-col sm:items-end gap-1 shrink-0">
                <div className="text-xs font-semibold text-teal-300 font-mono">
                  {achievements.nextBadge.currentValue} / {achievements.nextBadge.target} {achievements.nextBadge.unit} ({achievements.nextBadge.progressPct}%)
                </div>
                <div className="text-[11px] text-slate-400">
                  <span className="text-teal-400 font-medium">{achievements.nextBadge.remaining} {achievements.nextBadge.unit}</span> left to unlock
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-amber-300 py-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Incredible! You have unlocked all available breathwork milestones!</span>
            </div>
          )}

          {achievements.nextBadge && (
            <div className="w-full bg-slate-800/90 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-teal-400 h-full rounded-full transition-all duration-700 shadow-[0_0_6px_rgba(45,212,191,0.5)]"
                style={{ width: `${achievements.nextBadge.progressPct}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:bg-slate-800/60'
          }`}
        >
          All Badges ({achievements.totalBadges})
        </button>

        <button
          onClick={() => setFilter('time')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            filter === 'time'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:bg-slate-800/60'
          }`}
        >
          Breathing Time ({achievements.timeBadgesCount})
        </button>

        <button
          onClick={() => setFilter('streak')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            filter === 'streak'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:bg-slate-800/60'
          }`}
        >
          Daily Streaks ({achievements.streakBadgesCount})
        </button>

        <button
          onClick={() => setFilter('unlocked')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            filter === 'unlocked'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:bg-slate-800/60'
          }`}
        >
          Unlocked Only ({achievements.unlockedCount})
        </button>
      </div>

      {/* Badges Grid */}
      {displayedBadges.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayedBadges.map((badge) => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              onClick={() => setSelectedBadge(badge)}
            />
          ))}
        </div>
      ) : (
        <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-slate-800/60 flex flex-col items-center gap-2">
          <Award className="w-8 h-8 text-slate-600 mb-1" />
          <p className="text-xs text-slate-300 font-medium">No unlocked badges yet in this filter</p>
          <p className="text-[11px] text-slate-400 max-w-sm">
            Complete your first mindful breathing session to earn your first badges!
          </p>
          {onStartBreathing && (
            <button
              onClick={onStartBreathing}
              className="mt-2 px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-xs font-medium border border-teal-500/30"
            >
              Start First Session
            </button>
          )}
        </div>
      )}

      {/* Badge Detail Modal rendered via Portal to escape stacking contexts */}
      {selectedBadge &&
        typeof document !== 'undefined' &&
        createPortal(
          <BadgeDetailModal
            badge={selectedBadge}
            onClose={() => setSelectedBadge(null)}
            onStartBreathing={onStartBreathing}
          />,
          document.body
        )}
    </div>
  );
};

/**
 * Individual Badge Card Component
 */
const BadgeCard: React.FC<{
  badge: AchievementBadge;
  onClick: () => void;
}> = ({ badge, onClick }) => {
  const isUnlocked = badge.unlocked;
  const tierStyle = getTierStyles(badge.tier, isUnlocked);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl p-3.5 flex flex-col justify-between gap-3 border transition-all duration-300 cursor-pointer relative overflow-hidden group active:scale-[0.99] ${tierStyle.cardBg}`}
    >
      {/* Radiant ambient glow on hover for unlocked cards */}
      {isUnlocked && (
        <div
          className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-40 group-hover:opacity-75 transition-opacity ${tierStyle.ambientGlow}`}
        />
      )}

      {/* Header: Icon, Title, Tier & Lock state */}
      <div className="flex items-start justify-between gap-2 z-10">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 shrink-0 ${tierStyle.iconWrap}`}
          >
            {isUnlocked ? (
              <BadgeIcon iconName={badge.iconName} className="w-5 h-5" />
            ) : (
              <div className="relative flex items-center justify-center">
                <BadgeIcon iconName={badge.iconName} className="w-5 h-5 text-slate-600 group-hover:text-slate-500" />
                <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400">
                  <Lock className="w-2.5 h-2.5" />
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4
                className={`text-xs sm:text-sm font-semibold transition-colors ${
                  isUnlocked ? 'text-slate-100 group-hover:text-white' : 'text-slate-300'
                }`}
              >
                {badge.title}
              </h4>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${tierStyle.tierPill}`}>
                {badge.tier}
              </span>
              <span className="text-[10px] text-slate-400">
                · {badge.category === 'time' ? 'Time' : 'Streak'}
              </span>
            </div>
          </div>
        </div>

        {/* Status indicator tag */}
        <div className="shrink-0 z-10">
          {isUnlocked ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-1.5 py-0.5 rounded-md shadow-sm">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Unlocked</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded-md">
              <Lock className="w-2.5 h-2.5" />
              <span>Locked</span>
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed z-10">
        {badge.description}
      </p>

      {/* Progress & Target Section */}
      <div className="pt-2 border-t border-slate-800/60 flex flex-col gap-1.5 z-10">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-mono">
            {isUnlocked ? (
              <span className="text-emerald-400 font-medium">Goal Achieved ({badge.target} {badge.unit})</span>
            ) : (
              <span>{badge.currentValue} / {badge.target} {badge.unit}</span>
            )}
          </span>
          <span className={`font-mono font-medium ${isUnlocked ? 'text-emerald-400' : 'text-slate-400'}`}>
            {badge.progressPct}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${tierStyle.progressBar}`}
            style={{ width: `${badge.progressPct}%` }}
          />
        </div>

        {/* Unlock timestamp or remaining */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
          {isUnlocked ? (
            <span className="text-slate-400">
              {badge.unlockedDateStr ? `Earned ${badge.unlockedDateStr}` : 'Milestone Unlocked'}
            </span>
          ) : (
            <span className="text-slate-400">
              <strong className="text-slate-300 font-medium">{badge.remaining} {badge.unit}</strong> remaining
            </span>
          )}
          <span className="text-slate-400 group-hover:text-teal-300 flex items-center gap-0.5 transition-colors">
            Details <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </button>
  );
};

/**
 * Detailed Modal dialog for inspecting a badge
 */
const BadgeDetailModal: React.FC<{
  badge: AchievementBadge;
  onClose: () => void;
  onStartBreathing?: () => void;
}> = ({ badge, onClose, onStartBreathing }) => {
  const isUnlocked = badge.unlocked;
  const tierStyle = getTierStyles(badge.tier, isUnlocked);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${badge.title} badge details`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 p-5 shadow-2xl flex flex-col gap-4 text-slate-100 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-3.5 right-3.5 p-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Badge Hero Icon */}
        <div className="flex flex-col items-center text-center pt-2">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-lg mb-3 ${tierStyle.iconWrap}`}
          >
            <BadgeIcon iconName={badge.iconName} className="w-8 h-8" />
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-100">
            {badge.title}
          </h3>

          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${tierStyle.tierPill}`}>
              {badge.tier} Tier
            </span>
            <span className="text-xs text-slate-400">
              {badge.category === 'time' ? 'Lifetime Time' : 'Consecutive Days Streak'}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 leading-relaxed text-center">
          {badge.description}
        </div>

        {/* Milestone Specs & Progress */}
        <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Target Goal:</span>
            <span className="font-semibold text-slate-200">
              {badge.target} {badge.unit === 'min' ? 'minutes of breathwork' : 'consecutive days active'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Your Current Progress:</span>
            <span className="font-mono font-semibold text-teal-300">
              {badge.currentValue} {badge.unit} ({badge.progressPct}%)
            </span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mt-1">
            <div
              className={`h-full rounded-full transition-all duration-500 ${tierStyle.progressBar}`}
              style={{ width: `${badge.progressPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px]">
            {isUnlocked ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Unlocked {badge.unlockedDateStr ? `on ${badge.unlockedDateStr}` : 'Complete'}
              </span>
            ) : (
              <span className="text-amber-400/90 font-medium">
                {badge.remaining} {badge.unit} remaining to unlock
              </span>
            )}
            <span className="text-slate-400">
              {isUnlocked ? 'Earned' : 'In Progress'}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 pt-1">
          {onStartBreathing && !isUnlocked && (
            <button
              onClick={() => {
                onClose();
                onStartBreathing();
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-400 hover:to-sky-400 text-slate-950 font-semibold text-xs transition-all shadow-md active:scale-95 text-center cursor-pointer"
            >
              Start Breathing Now
            </button>
          )}
          <button
            onClick={onClose}
            className={`py-2 px-4 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              isUnlocked
                ? 'w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Tier styling helper
 */
function getTierStyles(tier: AchievementTier, isUnlocked: boolean) {
  if (!isUnlocked) {
    return {
      cardBg: 'bg-slate-900/40 hover:bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80',
      iconWrap: 'bg-slate-900 border-slate-800 text-slate-500',
      tierPill: 'bg-slate-800 text-slate-400 border border-slate-700/60',
      progressBar: 'bg-slate-600',
      ambientGlow: 'bg-slate-700',
    };
  }

  switch (tier) {
    case 'bronze':
      return {
        cardBg: 'bg-gradient-to-b from-amber-950/20 to-slate-900/60 hover:from-amber-950/30 border-amber-600/35 hover:border-amber-500/50 shadow-[0_4px_20px_rgba(217,119,6,0.08)]',
        iconWrap: 'bg-amber-500/15 border-amber-500/30 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]',
        tierPill: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
        progressBar: 'bg-amber-400',
        ambientGlow: 'bg-amber-500',
      };
    case 'silver':
      return {
        cardBg: 'bg-gradient-to-b from-sky-950/20 to-slate-900/60 hover:from-sky-950/30 border-sky-400/35 hover:border-sky-300/50 shadow-[0_4px_20px_rgba(56,189,248,0.08)]',
        iconWrap: 'bg-sky-500/15 border-sky-400/30 text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.2)]',
        tierPill: 'bg-sky-500/15 text-sky-200 border border-sky-400/30',
        progressBar: 'bg-sky-400',
        ambientGlow: 'bg-sky-400',
      };
    case 'gold':
      return {
        cardBg: 'bg-gradient-to-b from-yellow-950/25 to-slate-900/60 hover:from-yellow-950/35 border-yellow-500/40 hover:border-yellow-400/60 shadow-[0_4px_20px_rgba(234,179,8,0.1)]',
        iconWrap: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300 shadow-[0_0_14px_rgba(234,179,8,0.25)]',
        tierPill: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
        progressBar: 'bg-gradient-to-r from-amber-400 to-yellow-300',
        ambientGlow: 'bg-yellow-400',
      };
    case 'platinum':
      return {
        cardBg: 'bg-gradient-to-b from-cyan-950/25 to-slate-900/60 hover:from-cyan-950/35 border-cyan-400/40 hover:border-cyan-300/60 shadow-[0_4px_20px_rgba(6,182,212,0.1)]',
        iconWrap: 'bg-cyan-500/20 border-cyan-400/40 text-cyan-200 shadow-[0_0_14px_rgba(6,182,212,0.25)]',
        tierPill: 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40',
        progressBar: 'bg-gradient-to-r from-teal-400 to-cyan-300',
        ambientGlow: 'bg-cyan-400',
      };
    case 'diamond':
    default:
      return {
        cardBg: 'bg-gradient-to-b from-purple-950/30 to-slate-900/60 hover:from-purple-950/40 border-purple-400/40 hover:border-purple-300/60 shadow-[0_4px_20px_rgba(168,85,247,0.12)]',
        iconWrap: 'bg-purple-500/20 border-purple-400/40 text-purple-200 shadow-[0_0_16px_rgba(168,85,247,0.3)]',
        tierPill: 'bg-purple-500/20 text-purple-200 border border-purple-400/40',
        progressBar: 'bg-gradient-to-r from-purple-400 to-pink-400',
        ambientGlow: 'bg-purple-400',
      };
  }
}

/**
 * Icon resolver component
 */
const BadgeIcon: React.FC<{
  iconName: AchievementBadge['iconName'];
  className?: string;
}> = ({ iconName, className = 'w-5 h-5' }) => {
  switch (iconName) {
    case 'wind':
      return <Wind className={className} />;
    case 'feather':
      return <Feather className={className} />;
    case 'compass':
      return <Compass className={className} />;
    case 'clock':
      return <Clock className={className} />;
    case 'waves':
      return <Waves className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'crown':
      return <Crown className={className} />;
    case 'gem':
      return <Gem className={className} />;
    case 'sun':
      return <Sun className={className} />;
    case 'zap':
      return <Zap className={className} />;
    case 'flame':
      return <Flame className={className} />;
    case 'shield':
      return <Shield className={className} />;
    case 'calendar':
      return <Calendar className={className} />;
    case 'mountain':
      return <Mountain className={className} />;
    case 'award':
    default:
      return <Award className={className} />;
  }
};
