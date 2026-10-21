import React, { useState, useMemo } from 'react';
import {
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Flame,
  Calendar,
  Clock,
  Sparkles,
  TrendingUp,
  BarChart2,
  CheckCircle2,
  Target,
  Compass,
  Award,
  Layers,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { SessionRecord } from '../types/stats';
import { calculateInsights } from '../utils/insightsLogic';

interface InsightsProps {
  history: SessionRecord[];
  onLoadSampleData?: () => void;
  onStartSession?: () => void;
}

export const Insights: React.FC<InsightsProps> = ({
  history,
  onLoadSampleData,
  onStartSession,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'trends' | 'consistency'>('trends');

  // Compute rich insights data from history
  const insights = useMemo(() => calculateInsights(history), [history]);

  const {
    weeklyStreaks,
    bestTimeOfDay,
    monthlyConsistency,
    totalSessions,
    totalRounds,
    totalMinutes,
    overallConsistencyScore,
  } = insights;

  const hasData = history.length > 0;

  // Custom Recharts Tooltip for Monthly Trends
  const CustomMonthlyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-xl shadow-xl backdrop-blur-md text-xs space-y-1.5 min-w-[150px]">
          <p className="font-semibold text-slate-200 border-b border-slate-800 pb-1 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] text-teal-400 font-mono">
              {data.sessionCount} {data.sessionCount === 1 ? 'session' : 'sessions'}
            </span>
          </p>
          <div className="flex items-center justify-between gap-3 text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />
              Completed Rounds:
            </span>
            <span className="font-semibold text-teal-300 font-mono">{data.totalRounds}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
              Mindful Time:
            </span>
            <span className="font-semibold text-cyan-300 font-mono">{data.totalMinutes} min</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-slate-300 pt-1 border-t border-slate-800/80">
            <span className="text-slate-400">Consistency:</span>
            <span className="font-semibold text-emerald-400 font-mono">{data.consistencyRate}% active</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Recharts Tooltip for Time of Day
  const CustomTimeTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700/80 p-2.5 rounded-xl shadow-xl backdrop-blur-md text-xs space-y-1 min-w-[140px]">
          <p className="font-semibold text-slate-200 flex items-center justify-between">
            <span>{item.label}</span>
            <span className="text-[10px] text-teal-400 font-mono">{item.percentage}% of total</span>
          </p>
          <p className="text-[11px] text-slate-400">{item.timeRange}</p>
          <div className="flex items-center justify-between gap-3 text-slate-300 pt-1 border-t border-slate-800">
            <span>Rounds:</span>
            <span className="font-semibold text-teal-300 font-mono">{item.roundsCount}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-slate-300">
            <span>Sessions:</span>
            <span className="font-semibold text-cyan-300 font-mono">{item.sessionsCount}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Time-of-day icon resolver
  const renderTimeIcon = (iconName: string, className = 'w-4 h-4') => {
    switch (iconName) {
      case 'sunrise':
        return <Sunrise className={`${className} text-amber-400`} aria-hidden="true" />;
      case 'sun':
        return <Sun className={`${className} text-yellow-400`} aria-hidden="true" />;
      case 'sunset':
        return <Sunset className={`${className} text-orange-400`} aria-hidden="true" />;
      case 'moon':
        return <Moon className={`${className} text-indigo-400`} aria-hidden="true" />;
      default:
        return <Clock className={`${className} text-teal-400`} aria-hidden="true" />;
    }
  };

  return (
    <section
      aria-label="Breath Insights Dashboard"
      className="w-full rounded-2xl bg-gradient-to-b from-slate-900/70 via-slate-900/40 to-slate-950/80 border border-slate-800/80 p-4 sm:p-6 backdrop-blur-md shadow-2xl space-y-6"
    >
      {/* Header & Subtitle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Breath Insights & Rhythms
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-teal-500/10 text-teal-300 border border-teal-500/30">
              Analytics
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Calculated patterns from your sessions: weekly streaks, optimal time of day, and monthly consistency.
          </p>
        </div>

        {/* Action Button: Load Demo or Status */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {!hasData && onLoadSampleData && (
            <button
              type="button"
              onClick={onLoadSampleData}
              className="w-full sm:w-auto min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 hover:border-teal-400/50 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(45,212,191,0.08)]"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-400" aria-hidden="true" />
              <span>Explore With Demo Data</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Weekly Streak */}
        <div className="rounded-xl p-3.5 sm:p-4 bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-xl pointer-events-none group-hover:from-amber-500/20 transition-all" />
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span className="font-medium text-slate-300">Weekly Streak</span>
            <div className="p-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Flame className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                {weeklyStreaks.currentWeeklyStreak}
              </span>
              <span className="text-xs text-amber-300 font-medium">
                {weeklyStreaks.currentWeeklyStreak === 1 ? 'week' : 'weeks'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>Best: {weeklyStreaks.longestWeeklyStreak} wks</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-medium">{weeklyStreaks.weeklyConsistencyRate}% active</span>
            </p>
          </div>
        </div>

        {/* Card 2: Best Time of Day */}
        <div className="rounded-xl p-3.5 sm:p-4 bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-500/10 to-transparent rounded-full blur-xl pointer-events-none group-hover:from-teal-500/20 transition-all" />
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span className="font-medium text-slate-300">Best Time Window</span>
            <div className="p-1 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              {bestTimeOfDay.bestBucket
                ? renderTimeIcon(bestTimeOfDay.bestBucket.iconName, 'w-3.5 h-3.5')
                : <Compass className="w-3.5 h-3.5 text-teal-400" aria-hidden="true" />}
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold text-white truncate">
              {bestTimeOfDay.bestBucket ? bestTimeOfDay.bestBucket.label : 'Flexible'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 truncate">
              {bestTimeOfDay.peakHour !== null
                ? `Peak: ${bestTimeOfDay.peakHourLabel.split('–')[0].trim()}`
                : 'No peak hour yet'}
            </p>
          </div>
        </div>

        {/* Card 3: Monthly Active Consistency */}
        <div className="rounded-xl p-3.5 sm:p-4 bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-xl pointer-events-none group-hover:from-cyan-500/20 transition-all" />
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span className="font-medium text-slate-300">Monthly Rhythm</span>
            <div className="p-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                {monthlyConsistency[monthlyConsistency.length - 1]?.consistencyRate || 0}%
              </span>
              <span className="text-xs text-cyan-300 font-medium">rate</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {monthlyConsistency[monthlyConsistency.length - 1]?.activeDays || 0} active days this month
            </p>
          </div>
        </div>

        {/* Card 4: Mindful Habit Score */}
        <div className="rounded-xl p-3.5 sm:p-4 bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-xl pointer-events-none group-hover:from-emerald-500/20 transition-all" />
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span className="font-medium text-slate-300">Consistency Score</span>
            <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Target className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                {overallConsistencyScore}
              </span>
              <span className="text-xs text-emerald-300 font-mono">/ 100</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, overallConsistencyScore)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Analytics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Weekly Streaks Timeline & Best Time of Day (5 cols) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
          {/* Weekly Streaks Tracker Card */}
          <div className="rounded-xl p-4 sm:p-5 bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-white">Weekly Consistency Streaks</h3>
              </div>
              <span className="text-[11px] font-mono text-amber-300/90 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                {weeklyStreaks.currentWeeklyStreak} consecutive wks
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
              {weeklyStreaks.streakMessage}
            </p>

            {/* Sequence of 8 Recent Weeks */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>Recent 8-Week Cadence</span>
                <span>Rounds / Mins</span>
              </div>
              <div className="space-y-1.5">
                {weeklyStreaks.recentWeeks.map((w, idx) => (
                  <div
                    key={w.weekKey}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors border ${
                      w.isCurrent
                        ? 'bg-teal-500/10 border-teal-500/30 text-white'
                        : w.hasActivity
                        ? 'bg-slate-900/80 border-slate-800/80 text-slate-300'
                        : 'bg-slate-950/30 border-slate-900 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold ${
                          w.hasActivity
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                        }`}
                      >
                        {w.hasActivity ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <span className="font-medium">
                        {w.label}
                        {w.isCurrent && (
                          <span className="ml-1.5 text-[10px] font-semibold text-teal-400 uppercase tracking-wider">
                            (Current)
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="text-right font-mono text-[11px]">
                      {w.hasActivity ? (
                        <span className="text-teal-300 font-semibold">
                          {w.rounds} <span className="text-slate-400 font-normal">rnds</span> ({w.minutes}m)
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No session</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Best Time of Day Card */}
          <div className="rounded-xl p-4 sm:p-5 bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-400" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-white">Best Time of Day for Sessions</h3>
              </div>
              {bestTimeOfDay.peakHour !== null && (
                <span className="text-[11px] font-mono text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">
                  {bestTimeOfDay.peakHourLabel}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
              {bestTimeOfDay.summary}
            </p>

            {/* Time of Day Windows Breakdown */}
            <div className="space-y-2.5">
              {bestTimeOfDay.allBuckets.map((bucket) => {
                const isOptimal = bestTimeOfDay.bestBucket?.bucket === bucket.bucket && bucket.sessionsCount > 0;
                return (
                  <div
                    key={bucket.bucket}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isOptimal
                        ? 'bg-teal-500/10 border-teal-500/40 shadow-[0_0_15px_rgba(45,212,191,0.06)]'
                        : 'bg-slate-950/40 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        {renderTimeIcon(bucket.iconName, 'w-3.5 h-3.5')}
                        <span className="text-xs font-semibold text-slate-200">{bucket.label}</span>
                        <span className="text-[10px] text-slate-400">({bucket.timeRange})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOptimal && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-teal-400/20 text-teal-300 border border-teal-400/30">
                            Optimal
                          </span>
                        )}
                        <span className="text-xs font-mono font-semibold text-white">
                          {bucket.roundsCount} <span className="text-slate-400 text-[10px] font-normal">rnds</span>
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isOptimal
                            ? 'bg-gradient-to-r from-teal-400 to-emerald-400'
                            : 'bg-slate-600'
                        }`}
                        style={{ width: `${bucket.percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                      <span>{bucket.sessionsCount} {bucket.sessionsCount === 1 ? 'session' : 'sessions'}</span>
                      <span>{bucket.percentage}% of practice</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Total Monthly Breathing Consistency Charts (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4 rounded-xl p-4 sm:p-5 bg-slate-900/60 border border-slate-800">
          <div>
            {/* Chart Title and View Toggles */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                  Monthly Breathing Consistency
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track monthly volume, mindful time, and consistency trends over time.
                </p>
              </div>

              {/* Chart Mode Toggle */}
              <div
                role="tablist"
                aria-label="Monthly Chart View Options"
                className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeChartTab === 'trends'}
                  onClick={() => setActiveChartTab('trends')}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    activeChartTab === 'trends'
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Rounds & Minutes
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeChartTab === 'consistency'}
                  onClick={() => setActiveChartTab('consistency')}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    activeChartTab === 'consistency'
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Consistency Rate (%)
                </button>
              </div>
            </div>

            {/* Recharts Chart Container */}
            <div className="w-full mt-4 h-[280px] sm:h-[300px]">
              {activeChartTab === 'trends' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={monthlyConsistency}
                    margin={{ top: 15, right: 15, left: -15, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="roundsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="minutesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                      dataKey="monthShort"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#334155' }}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#334155' }}
                    />
                    <Tooltip content={<CustomMonthlyTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="totalRounds"
                      name="Rounds"
                      stroke="#2dd4bf"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#roundsGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="totalMinutes"
                      name="Minutes"
                      stroke="#22d3ee"
                      strokeWidth={2}
                      strokeDasharray="4 2"
                      fillOpacity={1}
                      fill="url(#minutesGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyConsistency}
                    margin={{ top: 15, right: 15, left: -15, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                      dataKey="monthShort"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#334155' }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#334155' }}
                      unit="%"
                    />
                    <Tooltip content={<CustomMonthlyTooltip />} />
                    <Bar
                      dataKey="consistencyRate"
                      name="Consistency %"
                      radius={[6, 6, 0, 0]}
                    >
                      {monthlyConsistency.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.consistencyRate >= 70
                              ? '#34d399' // Emerald
                              : entry.consistencyRate >= 40
                              ? '#2dd4bf' // Teal
                              : '#38bdf8' // Sky
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Legend & Chart Insights */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 mt-2 px-1">
              <div className="flex items-center gap-4">
                {activeChartTab === 'trends' ? (
                  <>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-400 inline-block" />
                      <span className="text-slate-300">Total Rounds</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                      <span className="text-slate-300">Mindful Minutes</span>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                      <span className="text-slate-300">High Habit (≥70%)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-400 inline-block" />
                      <span className="text-slate-300">Steady (≥40%)</span>
                    </span>
                  </>
                )}
              </div>

              <span className="text-[11px] font-mono text-slate-400">
                6-Month Trajectory
              </span>
            </div>
          </div>

          {/* Monthly Consistency Summary Table / Cards */}
          <div className="border-t border-slate-800/80 pt-4 grid grid-cols-3 gap-2 sm:gap-3 text-center">
            <div className="bg-slate-950/40 p-2 sm:p-2.5 rounded-lg border border-slate-800/60">
              <span className="text-[10px] text-slate-400 block font-medium">All-Time Rounds</span>
              <span className="text-sm sm:text-base font-bold font-mono text-teal-300">{totalRounds}</span>
            </div>
            <div className="bg-slate-950/40 p-2 sm:p-2.5 rounded-lg border border-slate-800/60">
              <span className="text-[10px] text-slate-400 block font-medium">Mindful Minutes</span>
              <span className="text-sm sm:text-base font-bold font-mono text-cyan-300">{totalMinutes}m</span>
            </div>
            <div className="bg-slate-950/40 p-2 sm:p-2.5 rounded-lg border border-slate-800/60">
              <span className="text-[10px] text-slate-400 block font-medium">Recorded Sessions</span>
              <span className="text-sm sm:text-base font-bold font-mono text-white">{totalSessions}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
