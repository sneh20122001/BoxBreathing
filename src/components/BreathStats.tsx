import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  Flame,
  Clock,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Activity,
  Layers,
} from 'lucide-react';
import { SessionRecord, WeeklyStat } from '../types/stats';
import {
  aggregateWeeklyStats,
  calculateAllTimeStats,
  formatMinutesDisplay,
} from '../utils/statsStorage';

interface BreathStatsProps {
  history: SessionRecord[];
  onClearHistory: () => void;
  onLoadSampleData: () => void;
}

export const BreathStats: React.FC<BreathStatsProps> = ({
  history,
  onClearHistory,
  onLoadSampleData,
}) => {
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(0);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  // Compute weekly and all-time stats
  const weeklyStats = aggregateWeeklyStats(history);
  const allTimeStats = calculateAllTimeStats(history);

  // Safe selected week fallback
  const safeWeekIndex = Math.min(selectedWeekIndex, Math.max(0, weeklyStats.length - 1));
  const currentSelectedWeek: WeeklyStat | undefined = weeklyStats[safeWeekIndex];

  // Maximum rounds in a single day for scaling the bar chart
  const maxDailyRounds = currentSelectedWeek
    ? Math.max(1, ...currentSelectedWeek.dailyBreakdown.map((d) => d.rounds))
    : 1;

  // Filter sessions that belong to the currently selected week
  const selectedWeekSessions = history.filter((s) => {
    if (!currentSelectedWeek) return false;
    const sessionDateStr = new Date(s.timestamp).toISOString().slice(0, 10);
    return (
      sessionDateStr >= currentSelectedWeek.weekStartDate &&
      sessionDateStr <= currentSelectedWeek.weekEndDate
    );
  });

  return (
    <section
      aria-label="Breath Stats dashboard"
      className="w-full rounded-2xl bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-slate-950/80 border border-slate-800/80 p-4 sm:p-6 backdrop-blur-md shadow-2xl flex flex-col gap-5 text-slate-100"
    >
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.15)]">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-slate-100 flex items-center gap-2">
              Breath Stats
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300">
                Weekly History
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Track your weekly rhythm, mindful duration, and breath consistency
            </p>
          </div>
        </div>

        {/* Action Buttons: Sample Data & Reset */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {history.length === 0 ? (
            <button
              onClick={onLoadSampleData}
              className="px-3 py-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Populate realistic demo sessions to preview stats"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Demo Data</span>
            </button>
          ) : (
            <>
              {showClearConfirm ? (
                <div className="flex items-center gap-1.5 bg-red-950/40 border border-red-500/30 p-1 rounded-lg">
                  <span className="text-[11px] text-red-300 px-1">Clear history?</span>
                  <button
                    onClick={() => {
                      onClearHistory();
                      setShowClearConfirm(false);
                      setSelectedWeekIndex(0);
                    }}
                    className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[11px] font-semibold transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-slate-200 text-xs transition-colors flex items-center gap-1"
                  title="Clear all stored sessions"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Stats</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Weekly Rounds */}
        <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>This Week Rounds</span>
            <Activity className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-teal-300">
              {weeklyStats[0]?.totalRounds || 0}
            </span>
            <span className="text-xs text-slate-400">rounds</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1">
            {weeklyStats[0]?.sessionCount || 0} sessions logged
          </span>
        </div>

        {/* Weekly Minutes */}
        <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>This Week Time</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-sky-300">
              {weeklyStats[0]?.totalMinutes || 0}
            </span>
            <span className="text-xs text-slate-400">min</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1">
            {formatMinutesDisplay(weeklyStats[0]?.totalDurationSeconds || 0)} total
          </span>
        </div>

        {/* Active Streak */}
        <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Current Streak</span>
            <Flame
              className={`w-4 h-4 ${
                allTimeStats.currentStreakDays > 0 ? 'text-amber-400' : 'text-slate-400'
              }`}
            />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-bold tracking-tight ${
                allTimeStats.currentStreakDays > 0 ? 'text-amber-300' : 'text-slate-400'
              }`}
            >
              {allTimeStats.currentStreakDays}
            </span>
            <span className="text-xs text-slate-400">days</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1">
            {allTimeStats.currentStreakDays > 0 ? 'Consistent practice' : 'Start your streak today'}
          </span>
        </div>

        {/* Lifetime Mindful Minutes */}
        <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>All-Time Total</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-purple-300">
              {allTimeStats.totalMinutes}
            </span>
            <span className="text-xs text-slate-400">min</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1">
            {allTimeStats.totalRounds} total rounds ({allTimeStats.totalSessions} sessions)
          </span>
        </div>
      </div>

      {/* Week-by-Week Interactive Selector & Breakdown */}
      <div className="rounded-xl bg-slate-950/60 border border-slate-800/90 p-4 sm:p-5 flex flex-col gap-4">
        {/* Week navigation header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              Week-by-Week Breakdown
            </h3>
          </div>

          {/* Week switcher arrows / selector */}
          {weeklyStats.length > 1 && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => setSelectedWeekIndex((prev) => Math.min(prev + 1, weeklyStats.length - 1))}
                disabled={safeWeekIndex >= weeklyStats.length - 1}
                aria-label="Previous week"
                className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium text-slate-300 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-800">
                {currentSelectedWeek?.label}
              </span>
              <button
                onClick={() => setSelectedWeekIndex((prev) => Math.max(0, prev - 1))}
                disabled={safeWeekIndex <= 0}
                aria-label="Next week"
                className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Selected week details & Daily Bar Chart */}
        {currentSelectedWeek && (
          <div className="flex flex-col gap-4">
            {/* Week headline metric badge */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-slate-900/50 border border-slate-800/60 text-xs">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-slate-400">Total Rounds: </span>
                  <span className="font-semibold text-teal-300 text-sm">
                    {currentSelectedWeek.totalRounds}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Total Duration: </span>
                  <span className="font-semibold text-sky-300 text-sm">
                    {currentSelectedWeek.totalMinutes} min ({formatMinutesDisplay(currentSelectedWeek.totalDurationSeconds)})
                  </span>
                </div>
              </div>
              <div className="text-slate-400">
                <span>Week range: </span>
                <span className="text-slate-300 font-mono text-[11px]">
                  {currentSelectedWeek.weekStartDate} to {currentSelectedWeek.weekEndDate}
                </span>
              </div>
            </div>

            {/* Daily Activity Chart (Mon - Sun) */}
            <div>
              <div className="text-xs font-medium text-slate-400 mb-2 flex items-center justify-between">
                <span>Daily Practice Distribution (Rounds)</span>
                <span className="text-[11px] text-slate-400">Mon – Sun</span>
              </div>

              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 h-36 items-end pt-4 pb-1 px-1 bg-slate-900/40 rounded-xl border border-slate-800/40">
                {currentSelectedWeek.dailyBreakdown.map((day) => {
                  const heightPercent =
                    day.rounds > 0 ? Math.max(14, Math.round((day.rounds / maxDailyRounds) * 100)) : 4;
                  const hasActivity = day.rounds > 0;

                  return (
                    <div
                      key={day.dateStr}
                      className="h-full flex flex-col justify-end items-center gap-1.5 group relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-10 bg-slate-900 border border-slate-700 text-slate-200 text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-20 transition-opacity">
                        <span className="font-semibold text-teal-300">{day.rounds} rounds</span>
                        <span className="text-slate-400"> · {formatMinutesDisplay(day.seconds)}</span>
                      </div>

                      {/* Bar indicator */}
                      <div className="w-full max-w-[38px] flex flex-col justify-end items-center h-[90px]">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-md transition-all duration-500 ${
                            hasActivity
                              ? 'bg-gradient-to-t from-teal-500/50 to-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.3)] group-hover:to-teal-300'
                              : 'bg-slate-800/40 rounded'
                          }`}
                        />
                      </div>

                      {/* Day Label */}
                      <div className="text-center">
                        <span
                          className={`text-[11px] font-medium block ${
                            hasActivity ? 'text-teal-300' : 'text-slate-400'
                          }`}
                        >
                          {day.dayName}
                        </span>
                        <span className="text-[9px] text-slate-400 block font-mono">
                          {day.rounds > 0 ? `${day.rounds}r` : '—'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Multi-Week Comparison Table / List */}
        {weeklyStats.length > 0 && (
          <div className="mt-2 pt-3 border-t border-slate-800/60">
            <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              All Recorded Weeks
            </h4>

            <div className="overflow-x-auto rounded-lg border border-slate-800/70">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800/70">
                  <tr>
                    <th scope="col" className="px-3 py-2.5">Week</th>
                    <th scope="col" className="px-3 py-2.5">Rounds</th>
                    <th scope="col" className="px-3 py-2.5">Duration</th>
                    <th scope="col" className="px-3 py-2.5">Sessions</th>
                    <th scope="col" className="px-3 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 bg-slate-950/30">
                  {weeklyStats.map((week, idx) => {
                    const isSelected = idx === safeWeekIndex;
                    return (
                      <tr
                        key={week.weekKey}
                        className={`transition-colors hover:bg-slate-900/40 ${
                          isSelected ? 'bg-teal-500/10' : ''
                        }`}
                      >
                        <td className="px-3 py-2.5 font-medium flex items-center gap-2">
                          {week.isCurrentWeek && (
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                          )}
                          <span className={isSelected ? 'text-teal-300 font-semibold' : 'text-slate-200'}>
                            {week.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-teal-300">
                          {week.totalRounds} {week.totalRounds === 1 ? 'round' : 'rounds'}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-sky-300">
                          {week.totalMinutes} min ({formatMinutesDisplay(week.totalDurationSeconds)})
                        </td>
                        <td className="px-3 py-2.5 text-slate-400">
                          {week.sessionCount}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            onClick={() => setSelectedWeekIndex(idx)}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                              isSelected
                                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                            }`}
                          >
                            {isSelected ? 'Viewing' : 'View'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Session Logs in Selected Week */}
        {selectedWeekSessions.length > 0 && (
          <div className="mt-1 pt-3 border-t border-slate-800/60">
            <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              Sessions in {currentSelectedWeek?.label}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {selectedWeekSessions.map((session) => {
                const date = new Date(session.timestamp);
                const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

                return (
                  <div
                    key={session.id}
                    className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-medium text-slate-200">
                        {session.levelName} ({session.secondsPerPhase}s)
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {dateStr} at {timeStr}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-teal-300 font-semibold font-mono">
                        {session.completedRounds} {session.completedRounds === 1 ? 'round' : 'rounds'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {formatMinutesDisplay(session.durationSeconds)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
