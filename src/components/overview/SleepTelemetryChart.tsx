import React, { useState, useRef, useEffect } from 'react';
import { Moon, AlertTriangle, Clock, Info } from 'lucide-react';
import { HabitsData } from '../../types';
import { getTodayDateStr } from '../../services/storage';
import { triggerHaptic } from '../../hooks/useHaptics';

interface SleepTelemetryChartProps {
  habits: HabitsData;
  timeframe?: 7 | 14 | 30 | 90;
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
}

interface SleepDayPoint {
  dateStr: string;
  dayLabel: string;
  fullDate: string;
  bedtimeRaw: string;
  wakeupRaw: string;
  durationHours: number;
  durationFormatted: string;
  bedtimeHourDecimal: number; // 0 to 24
  wakeupHourDecimal: number;  // 0 to 24
  status: 'optimal' | 'delayed' | 'shifted' | 'short';
  isSevereShift: boolean;
}

export const SleepTelemetryChart: React.FC<SleepTelemetryChartProps> = ({
  habits,
  timeframe = 7,
  selectedDate,
  onSelectDate,
}) => {
  const [hoveredDay, setHoveredDay] = useState<SleepDayPoint | null>(null);
  const [showScienceInfo, setShowScienceInfo] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll timeline to the right (most recent day / Today) on mount & timeframe change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [timeframe]);

  const todayStr = getTodayDateStr();

  // Helper to parse time string "HH:MM" into decimal hours
  const parseHourDecimal = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) + (m || 0) / 60;
  };

  // Build daily points
  const points: SleepDayPoint[] = Array.from({ length: timeframe }).map((_, idx) => {
    const daysAgo = timeframe - 1 - idx;
    const [y, m, d] = todayStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() - daysAgo);

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const fullDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    const isToday = dateStr === todayStr;
    const dayHabit = habits.dailyRecords?.[dateStr];

    let bedtimeRaw = dayHabit?.bedtimeRaw || (isToday ? habits.sleep?.bedtimeRaw : undefined) || '23:30';
    let wakeupRaw = dayHabit?.wakeupRaw || (isToday ? habits.sleep?.wakeupRaw : undefined) || '07:30';
    let durationHours = dayHabit?.sleepDurationHours || 8.0;

    if (!dayHabit?.sleepDurationHours) {
      if (dayHabit?.sleepDuration) {
        const m = dayHabit.sleepDuration.match(/(\d+)h\s*(\d*)m?/);
        if (m) durationHours = parseInt(m[1], 10) + (parseInt(m[2], 10) || 0) / 60;
      } else if (isToday && habits.sleep?.sleepDuration) {
        const m = habits.sleep.sleepDuration.match(/(\d+)h\s*(\d*)m?/);
        if (m) durationHours = parseInt(m[1], 10) + (parseInt(m[2], 10) || 0) / 60;
      }
    }

    const bedtimeHourDecimal = parseHourDecimal(bedtimeRaw);
    const wakeupHourDecimal = parseHourDecimal(wakeupRaw);

    // Evaluate circadian status:
    // Optimal: Bedtime 21:30 - 00:30 and Duration >= 7.5h
    // Delayed: Bedtime 00:30 - 02:30
    // Shifted (Severe): Bedtime > 02:30 or morning (e.g. 06:00)
    // Short: Duration < 6.5h
    let status: 'optimal' | 'delayed' | 'shifted' | 'short' = 'optimal';
    let isSevereShift = false;

    // If bedtime is between 02:30 and 12:00, that's severe circadian phase shift
    if (bedtimeHourDecimal >= 2.5 && bedtimeHourDecimal <= 12.0) {
      status = 'shifted';
      isSevereShift = true;
    } else if (durationHours < 6.5) {
      status = 'short';
    } else if (bedtimeHourDecimal > 0.5 && bedtimeHourDecimal < 2.5) {
      status = 'delayed';
    }

    const durationFormatted = `${Math.floor(durationHours)}h ${Math.round((durationHours % 1) * 60)}m`;

    return {
      dateStr,
      dayLabel,
      fullDate,
      bedtimeRaw,
      wakeupRaw,
      durationHours,
      durationFormatted,
      bedtimeHourDecimal,
      wakeupHourDecimal,
      status,
      isSevereShift,
    };
  });

  // Calculate high-level stats
  const avgDuration = (points.reduce((acc, p) => acc + p.durationHours, 0) / points.length).toFixed(1);
  const optimalNights = points.filter((p) => p.status === 'optimal').length;
  const severeShiftCount = points.filter((p) => p.isSevereShift).length;
  const latestShiftPoint = [...points].reverse().find((p) => p.isSevereShift);

  // SVG dimensions for 24h timeline
  // Y-axis spans from 20:00 (8 PM) to 16:00 (4 PM next day) = 20 hours total
  const svgHeight = 280;
  const paddingTop = 20;
  const paddingBottom = 25;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Coordinate mapping for 20h axis:
  // Base is 20:00 (hour 20) -> Y = paddingTop
  // 16:00 next day (hour 40 relative) -> Y = paddingTop + chartHeight
  const timelineStartHour = 20; // 8 PM
  const timelineTotalHours = 20; // from 20:00 to 16:00 next day

  const mapHourToY = (hour: number): number => {
    // If hour < 16, it's next day (hour + 24)
    const normalizedHour = hour < timelineStartHour ? hour + 24 : hour;
    const fraction = Math.max(0, Math.min(1, (normalizedHour - timelineStartHour) / timelineTotalHours));
    return paddingTop + fraction * chartHeight;
  };

  // Circadian window: 22.5 (10:30 PM) to 31.5 (7:30 AM next day)
  const circadianTopY = mapHourToY(22.5);
  const circadianBottomY = mapHourToY(7.5);
  const circadianWindowHeight = circadianBottomY - circadianTopY;

  return (
    <div className="matte-card p-4 space-y-4 border-white/10 bg-[#0c101a] shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Circadian Sleep & Timing Telemetry
          </h3>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic(10);
            setShowScienceInfo((p) => !p);
          }}
          className="text-slate-400 hover:text-indigo-300 transition-colors p-1 rounded-md hover:bg-white/5"
          aria-label="Circadian sleep science information"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Science Info Popover */}
      {showScienceInfo && (
        <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs font-mono text-indigo-200 space-y-1.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <strong className="text-indigo-300">Why Sleep Timing Matters as Much as Duration:</strong>
            <button
              type="button"
              onClick={() => setShowScienceInfo(false)}
              className="text-indigo-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <p className="text-[11px] text-indigo-200/90 leading-relaxed">
            Per Dr. Satchin Panda (Salk Institute) & Matthew Walker, 70% of Growth Hormone releases between 10 PM and 2 AM.
            Sleeping from 6 AM to 2 PM desynchronizes liver clocks, blunts deep slow-wave repair, and induces brain fog for technical interviews.
          </p>
        </div>
      )}

      {/* Summary Scorecards */}
      <div className="grid grid-cols-3 gap-2 text-xs font-mono">
        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
          <span className="text-[9px] text-slate-400 block mb-0.5">Avg Duration</span>
          <span className="text-sm font-bold text-white tabular-nums">
            {avgDuration}h <span className="text-[10px] text-slate-400 font-normal">/ night</span>
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
          <span className="text-[9px] text-slate-400 block mb-0.5">Optimal Sync</span>
          <span className="text-sm font-bold text-emerald-400 tabular-nums">
            {optimalNights}/{points.length} <span className="text-[10px] text-slate-400 font-normal">nights</span>
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
          <span className="text-[9px] text-slate-400 block mb-0.5">Phase Stability</span>
          <span className={`text-sm font-bold tabular-nums ${severeShiftCount > 0 ? 'text-rose-400' : 'text-sky-300'}`}>
            {severeShiftCount > 0 ? `${severeShiftCount} Shift Alert` : '100% Calibrated'}
          </span>
        </div>
      </div>

      {/* Severe Shift Alert Banner */}
      {severeShiftCount > 0 && latestShiftPoint && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs font-mono space-y-1">
            <span className="font-bold text-rose-300 block">
              Circadian Phase Delay Detected ({latestShiftPoint.dayLabel}: {latestShiftPoint.bedtimeRaw} – {latestShiftPoint.wakeupRaw})
            </span>
            <p className="text-[11px] text-rose-200/80 leading-snug">
              Sleep shifted into daylight hours. Growth hormone release and REM consolidation were blunted by up to 50%.
              Use morning sunlight and earlier meals to shift your window back toward 11:00 PM.
            </p>
          </div>
        </div>
      )}

      {/* Reactive Touch HUD */}
      {hoveredDay && (
        <div className="p-2 rounded-xl bg-black/60 border border-indigo-400/30 flex items-center justify-between text-xs font-mono animate-fadeIn">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-bold text-white">{hoveredDay.fullDate}</span>
            <span className="text-slate-400">({hoveredDay.bedtimeRaw} → {hoveredDay.wakeupRaw})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-indigo-300">{hoveredDay.durationFormatted}</span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                hoveredDay.status === 'optimal'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : hoveredDay.status === 'shifted'
                  ? 'bg-rose-500/20 text-rose-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {hoveredDay.status.toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* 24-Hour Floating Sleep Interval Gantt Chart with Sticky Y-Axis & Horizontal Scrolling */}
      <div className="relative flex rounded-xl bg-[#080b12] border border-white/5 p-2 overflow-hidden shadow-inner">
        {/* Sticky/Fixed Left Y-Axis */}
        <div className="w-8 shrink-0 relative select-none" style={{ height: svgHeight }}>
          {[20, 24, 28, 32, 36, 40].map((hourVal) => {
            const displayH = hourVal >= 24 ? hourVal - 24 : hourVal;
            const timeLabel = `${String(displayH).padStart(2, '0')}:00`;
            const yPos = mapHourToY(displayH);

            return (
              <span
                key={hourVal}
                className="absolute right-1 text-[8px] font-mono text-slate-500 -translate-y-1/2 leading-none"
                style={{ top: `${yPos}px` }}
              >
                {timeLabel}
              </span>
            );
          })}
        </div>

        {/* Horizontally Scrollable Timeline Surface */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent select-none overscroll-contain"
          style={{ height: svgHeight }}
        >
          {(() => {
            const dayColWidth = timeframe === 7 ? Math.max(38, 280 / 7) : 34;
            const scrollableWidth = Math.max(280, points.length * dayColWidth);

            return (
              <svg
                width={scrollableWidth}
                height={svgHeight}
                viewBox={`0 0 ${scrollableWidth} ${svgHeight}`}
                className="h-full select-none"
                role="img"
                aria-label="24-Hour Circadian Sleep Interval Chart"
              >
                {/* Circadian Optimal Restorative Zone (10:30 PM - 7:30 AM) */}
                <rect
                  x={0}
                  y={circadianTopY}
                  width={scrollableWidth}
                  height={circadianWindowHeight}
                  fill="#10b981"
                  fillOpacity="0.08"
                  rx="4"
                />

                {/* Time Reference Grid Lines */}
                {[20, 24, 28, 32, 36, 40].map((hourVal) => {
                  const displayH = hourVal >= 24 ? hourVal - 24 : hourVal;
                  const yPos = mapHourToY(displayH);

                  return (
                    <line
                      key={hourVal}
                      x1={0}
                      y1={yPos}
                      x2={scrollableWidth}
                      y2={yPos}
                      stroke="rgba(255,255,255,0.07)"
                      strokeDasharray="2 2"
                    />
                  );
                })}

                {/* Daily Sleep Interval Floating Bars */}
                {points.map((p, idx) => {
                  const barWidth = 18;
                  const centerX = (idx + 0.5) * dayColWidth;
                  const x = centerX - barWidth / 2;

                  // Compute Y start and end
                  const topY = mapHourToY(p.bedtimeHourDecimal);
                  let bottomY = mapHourToY(p.wakeupHourDecimal);
                  if (bottomY <= topY) {
                    bottomY = topY + Math.max(12, p.durationHours * (chartHeight / timelineTotalHours));
                  }
                  const barHeight = Math.max(8, bottomY - topY);

                  // Bar color based on status
                  const barFill =
                    p.status === 'optimal'
                      ? '#10b981'
                      : p.status === 'shifted'
                      ? '#f43f5e'
                      : p.status === 'short'
                      ? '#f59e0b'
                      : '#38bdf8';

                  const isHovered = hoveredDay?.dateStr === p.dateStr;
                  const isSelected = selectedDate === p.dateStr;
                  const isToday = p.dateStr === todayStr;

                  return (
                    <g
                      key={p.dateStr}
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredDay(p)}
                      onClick={() => {
                        triggerHaptic(10);
                        setHoveredDay(p);
                        if (onSelectDate) onSelectDate(p.dateStr);
                      }}
                    >
                      {/* Full Column Touch Hitbox */}
                      <rect
                        x={idx * dayColWidth}
                        y={paddingTop}
                        width={dayColWidth}
                        height={chartHeight}
                        fill="transparent"
                      />

                      {/* Today subtle column highlight */}
                      {isToday && (
                        <rect
                          x={idx * dayColWidth + 2}
                          y={paddingTop}
                          width={dayColWidth - 4}
                          height={chartHeight}
                          fill="#38bdf8"
                          fillOpacity="0.04"
                          rx="4"
                        />
                      )}

                      {/* Floating Sleep Bar */}
                      <rect
                        x={x}
                        y={topY}
                        width={barWidth}
                        height={barHeight}
                        rx={barWidth / 2}
                        fill={barFill}
                        fillOpacity={isHovered || isSelected ? 0.95 : 0.75}
                        stroke={isSelected ? '#38bdf8' : isHovered ? '#ffffff' : barFill}
                        strokeWidth={isSelected ? 2 : isHovered ? 1.5 : 1}
                      />

                      {/* Day Label on X-Axis */}
                      <text
                        x={centerX}
                        y={svgHeight - 14}
                        textAnchor="middle"
                        fontSize="7.5"
                        fontFamily="monospace"
                        fill={isToday ? '#38bdf8' : isHovered ? '#ffffff' : '#64748b'}
                        fontWeight={isToday || isHovered ? 'bold' : 'normal'}
                      >
                        {p.dayLabel}
                      </text>
                      <text
                        x={centerX}
                        y={svgHeight - 5}
                        textAnchor="middle"
                        fontSize="8"
                        fontFamily="monospace"
                        fill={isToday ? '#38bdf8' : isHovered ? '#ffffff' : '#94a3b8'}
                        fontWeight={isToday || isHovered ? 'bold' : 'normal'}
                      >
                        {p.dateStr.slice(8)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            );
          })()}
        </div>
      </div>

      {/* Compact Aligned Horizontal Legend (Full Width, Zero Wasted Space) */}
      <div className="grid grid-cols-3 gap-1 p-2 rounded-xl bg-black/40 border border-white/5 text-[9px] font-mono">
        <div className="flex flex-col min-w-0 pr-1 border-r border-white/5">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-slate-200 font-bold truncate">Optimal</span>
          </div>
          <span className="text-[8px] text-slate-400 pl-3 truncate">10:30P – 7:30A</span>
        </div>

        <div className="flex flex-col min-w-0 px-1 border-r border-white/5">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
            <span className="text-slate-200 font-bold truncate">Delayed</span>
          </div>
          <span className="text-[8px] text-slate-400 pl-3 truncate">12:30A – 2:30A</span>
        </div>

        <div className="flex flex-col min-w-0 pl-1">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <span className="text-rose-300 font-bold truncate">Severe Shift</span>
          </div>
          <span className="text-[8px] text-rose-300/80 pl-3 truncate">&gt; 2:30A Onset</span>
        </div>
      </div>
    </div>
  );
};
