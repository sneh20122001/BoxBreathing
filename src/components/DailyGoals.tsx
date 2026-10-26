import React, { useState, useEffect } from 'react';
import {
  Target,
  Flame,
  Trophy,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Edit2,
  Check,
  Zap,
} from 'lucide-react';
import { SessionRecord } from '../types/stats';
import {
  DAILY_GOAL_PRESETS,
  calculateDailyGoalStats,
  getStoredDailyGoal,
  setStoredDailyGoal,
} from '../utils/dailyGoals';

interface DailyGoalsProps {
  history: SessionRecord[];
  onStartBreathing?: () => void;
}

export const DailyGoals: React.FC<DailyGoalsProps> = ({
  history,
  onStartBreathing,
}) => {
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(() => getStoredDailyGoal());
  const [isEditingCustom, setIsEditingCustom] = useState<boolean>(false);
  const [customInputVal, setCustomInputVal] = useState<string>(dailyGoalMinutes.toString());

  // Keep state in sync with localStorage if altered
  useEffect(() => {
    setDailyGoalMinutes(getStoredDailyGoal());
  }, []);

  const handleSelectGoal = (minutes: number) => {
    const valid = Math.max(1, Math.min(120, Math.round(minutes)));
    setDailyGoalMinutes(valid);
    setStoredDailyGoal(valid);
    setCustomInputVal(valid.toString());
    setIsEditingCustom(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customInputVal, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 120) {
      handleSelectGoal(parsed);
    } else {
      setCustomInputVal(dailyGoalMinutes.toString());
      setIsEditingCustom(false);
    }
  };

  const stats = calculateDailyGoalStats(history, dailyGoalMinutes);

  // SVG Progress Ring calculations
  const size = 180;
  const strokeWidth = 14;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  // Progress stroke offset
  const progressOffset = circumference - (stats.progressPct / 100) * circumference;

  return (
    <div
      data-testid="daily-goals-card"
      className="w-full rounded-xl bg-slate-950/70 border border-slate-800/90 p-4 sm:p-5 flex flex-col gap-4 shadow-lg backdrop-blur-sm"
    >
      {/* Top Header: Title & Goal Presets Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-100">
                Daily Breathing Goal
              </h3>
              {stats.isGoalMetToday && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Met Today
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Target mindful duration to establish calm and consistency
            </p>
          </div>
        </div>

        {/* Goal Selector Controls */}
        <div className="flex items-center gap-1.5 flex-wrap self-start sm:self-auto">
          <span className="text-[11px] font-medium text-slate-400 mr-1">
            Goal:
          </span>
          {DAILY_GOAL_PRESETS.map((preset) => {
            const isSelected = !isEditingCustom && dailyGoalMinutes === preset;
            return (
              <button
                key={preset}
                onClick={() => handleSelectGoal(preset)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(16,185,129,0.35)] scale-105'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:text-slate-100'
                }`}
                title={`Set daily target to ${preset} minutes`}
              >
                {preset}m
              </button>
            );
          })}

          {/* Custom Minute Input or Button */}
          {isEditingCustom ? (
            <form onSubmit={handleCustomSubmit} className="flex items-center gap-1">
              <input
                type="number"
                min={1}
                max={120}
                value={customInputVal}
                onChange={(e) => setCustomInputVal(e.target.value)}
                autoFocus
                className="w-14 px-1.5 py-0.5 rounded bg-slate-900 border border-emerald-500/60 text-emerald-300 text-xs font-mono font-bold text-center focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
              <span className="text-[10px] text-slate-400">m</span>
              <button
                type="submit"
                aria-label="Save custom goal"
                className="p-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors"
              >
                <Check className="w-3 h-3" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => {
                setIsEditingCustom(true);
                setCustomInputVal(dailyGoalMinutes.toString());
              }}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                !DAILY_GOAL_PRESETS.includes(dailyGoalMinutes as any)
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Enter custom daily goal minutes"
            >
              <Edit2 className="w-3 h-3" />
              <span>
                {!DAILY_GOAL_PRESETS.includes(dailyGoalMinutes as any)
                  ? `${dailyGoalMinutes}m`
                  : 'Custom'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Grid: Progress Ring + Streak & Milestone Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Left Column: SVG Circular Progress Ring */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl bg-slate-900/40 border border-slate-800/50">
          <div className="relative flex items-center justify-center">
            <svg
              width={size}
              height={size}
              className="transform -rotate-90"
              role="progressbar"
              aria-valuenow={stats.progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Daily goal progress: ${stats.todayMinutes} of ${stats.targetMinutes} minutes completed`}
            >
              <defs>
                <linearGradient id="goalProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" /> {/* emerald-500 */}
                  <stop offset="100%" stopColor="#2dd4bf" /> {/* teal-400 */}
                </linearGradient>
                <linearGradient id="goalCompleteGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>

              {/* Background Ring Track */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-slate-800/80"
              />

              {/* Animated Progress Arc */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={stats.isGoalMetToday ? 'url(#goalCompleteGradient)' : 'url(#goalProgressGradient)'}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={progressOffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
                style={{
                  filter: stats.progressPct > 0 ? 'drop-shadow(0 0 8px rgba(16,185,129,0.35))' : 'none',
                }}
              />
            </svg>

            {/* Inner Content inside Ring */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 select-none pointer-events-none">
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Today
              </span>
              <div className="flex items-baseline justify-center gap-0.5 my-0.5">
                <span className="text-3xl font-extrabold tracking-tight text-slate-100 font-mono">
                  {stats.todayMinutes}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  /{stats.targetMinutes}m
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span
                  className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                    stats.isGoalMetToday
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800/80 text-slate-300'
                  }`}
                >
                  {stats.progressPct}%
                </span>
              </div>
            </div>
          </div>

          {/* Motivational Ring Subtitle */}
          <div className="mt-3 text-center">
            {stats.isGoalMetToday ? (
              <div className="flex items-center justify-center gap-1 text-xs font-medium text-emerald-300">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Daily goal reached! Great job!</span>
              </div>
            ) : stats.todayMinutes > 0 ? (
              <p className="text-xs text-slate-400">
                <span className="font-semibold text-teal-300">{stats.remainingMinutes} min</span> remaining to achieve today's goal
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                Take a {stats.targetMinutes}-min pause to start today's goal
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Streaks, Records, and 7-Day Habit Tracker */}
        <div className="md:col-span-7 flex flex-col gap-3">
          {/* Streak Status Box */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform ${
                  stats.currentStreak > 0
                    ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                    : 'bg-slate-800/50 border border-slate-700/50 text-slate-400'
                }`}
              >
                <Flame
                  className={`w-6 h-6 ${
                    stats.currentStreak > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-400'
                  }`}
                />
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tight text-slate-100 font-mono">
                    {stats.currentStreak}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {stats.currentStreak === 1 ? 'day streak' : 'days streak'}
                  </span>
                </div>
                <div className="text-xs mt-0.5">
                  {stats.streakStatus === 'completed' ? (
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Streak extended today!
                    </span>
                  ) : stats.streakStatus === 'in_progress' ? (
                    <span className="text-amber-400 font-medium">
                      Streak active · Finish today to make it {stats.currentStreak + 1} days
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      Reach today's {stats.targetMinutes}m goal to start a streak
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action: Breathe Now */}
            {onStartBreathing && (
              <button
                onClick={onStartBreathing}
                className="self-start sm:self-center px-3 py-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 text-xs font-medium transition-all flex items-center gap-1.5 active:scale-95 shadow-sm whitespace-nowrap"
              >
                <span>Breathe Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Stats Grid: Longest Streak & Total Met Days */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/50 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-medium text-slate-400 block">
                  Best Streak
                </span>
                <span className="text-sm font-bold text-purple-300 font-mono">
                  {stats.longestStreak} {stats.longestStreak === 1 ? 'day' : 'days'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/50 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-medium text-slate-400 block">
                  Total Days Met
                </span>
                <span className="text-sm font-bold text-teal-300 font-mono">
                  {stats.totalDaysGoalMet} {stats.totalDaysGoalMet === 1 ? 'day' : 'days'}
                </span>
              </div>
            </div>
          </div>

          {/* 7-Day Rolling Habit Mini Cadence */}
          <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/50">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
              <span className="font-medium text-slate-300">Past 7 Days Cadence</span>
              <span className="text-slate-400 text-[10px]">Target: {stats.targetMinutes}m / day</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {stats.last7Days.map((day) => {
                return (
                  <div
                    key={day.dateStr}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all ${
                      day.isGoalMet
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : day.isToday
                        ? 'bg-slate-800/60 border-teal-500/40 text-teal-300 ring-1 ring-teal-500/20'
                        : day.seconds > 0
                        ? 'bg-slate-900/80 border-slate-700/60 text-slate-300'
                        : 'bg-slate-950/40 border-slate-800/40 text-slate-400'
                    }`}
                    title={`${day.dateStr} (${day.dayName}): ${day.minutes} min logged (${day.rounds} rounds)`}
                  >
                    <span className="text-[10px] font-semibold">{day.dayName}</span>
                    <div className="my-1">
                      {day.isGoalMet ? (
                        <div className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      ) : day.isToday ? (
                        <div className="w-4 h-4 rounded-full border border-dashed border-teal-400 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
                        </div>
                      ) : day.seconds > 0 ? (
                        <div className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-slate-900/60 border border-slate-800 flex items-center justify-center">
                          <span className="text-[8px] text-slate-400">·</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] font-mono text-slate-400">
                      {day.minutes > 0 ? `${day.minutes}m` : '0m'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
