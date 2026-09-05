import React, { useState, useRef } from 'react';
import { FocusData } from '../../types';
import { getTodayDateStr } from '../../services/storage';
import { TrendingUp, Target } from 'lucide-react';

interface StudyHoursProgressionChartProps {
  focus: FocusData;
  timeframe?: 7 | 14 | 30 | 90;
}

export const StudyHoursProgressionChart: React.FC<StudyHoursProgressionChartProps> = ({
  focus,
  timeframe = 7,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const todayStr = getTodayDateStr();

  // Determine whether to use Daily resolution or Adaptive Weekly Bucketing
  // <= 21 days: Daily (7 or 14 points)
  // > 21 days: Weekly (e.g. 5 weeks for 30D, 13 weeks for 90D)
  const isWeeklyBucketed = timeframe > 21;
  const numBuckets = isWeeklyBucketed ? Math.ceil(timeframe / 7) : timeframe;

  // Generate historical data points (either daily or weekly buckets)
  const points = Array.from({ length: numBuckets }).map((_, idx) => {
    if (!isWeeklyBucketed) {
      // 1. Daily Point
      const daysAgo = timeframe - 1 - idx;
      const [y, m, d] = todayStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      dateObj.setDate(dateObj.getDate() - daysAgo);

      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const label = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const fullDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

      // Filter sessions on this day
      const daySessions = (focus.sessions || []).filter((s) => s.dateStr === dateStr);
      const totalMinutes = daySessions.reduce(
        (acc, s) => acc + (s.durationMinutes || Math.round((s.durationSeconds || 0) / 60)),
        0
      );
      const totalHours = +(totalMinutes / 60).toFixed(1);

      const deepMinutes = daySessions
        .filter(
          (s) =>
            s.bucket === 'deep' ||
            (!s.bucket && (s.subject || s.taskTitle || '').toLowerCase().includes('anchor'))
        )
        .reduce(
          (acc, s) => acc + (s.durationMinutes || Math.round((s.durationSeconds || 0) / 60)),
          0
        );
      const deepHours = +(deepMinutes / 60).toFixed(1);

      // Check daily history or active tasks
      const histDay = focus.dailyHistory?.[dateStr];
      const histTasks = histDay?.completedTasks || 0;
      const tasksCompleted =
        histTasks || (dateStr === todayStr ? (focus.tasks || []).filter((t) => t.completed).length : 0);
      const histHours =
        histDay && histDay.studySeconds !== 9449
          ? histDay.studyHours || (histDay.studySeconds ? +(histDay.studySeconds / 3600).toFixed(1) : 0)
          : 0;

      return {
        id: dateStr,
        dateStr,
        label,
        fullDate,
        hours: totalHours > 0 ? totalHours : histHours,
        deepHours,
        sessionsCount: daySessions.length,
        tasksCompleted,
      };
    } else {
      // 2. Weekly Bucket
      const weeksAgo = numBuckets - 1 - idx;
      const [y, m, d] = todayStr.split('-').map(Number);
      const endBucketDate = new Date(y, m - 1, d);
      endBucketDate.setDate(endBucketDate.getDate() - weeksAgo * 7);

      const startBucketDate = new Date(endBucketDate);
      startBucketDate.setDate(startBucketDate.getDate() - 6);

      const label = `W${idx + 1}`;
      const fullDate = `${startBucketDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })} - ${endBucketDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

      const weekSessions = (focus.sessions || []).filter((s) => {
        if (!s.dateStr) return false;
        const [sy, sm, sd] = s.dateStr.split('-').map(Number);
        const sDate = new Date(sy, sm - 1, sd);
        return sDate >= startBucketDate && sDate <= endBucketDate;
      });

      const totalMinutes = weekSessions.reduce(
        (acc, s) => acc + (s.durationMinutes || Math.round((s.durationSeconds || 0) / 60)),
        0
      );
      const totalHours = +(totalMinutes / 60).toFixed(1);

      const deepMinutes = weekSessions
        .filter(
          (s) =>
            s.bucket === 'deep' ||
            (!s.bucket && (s.subject || s.taskTitle || '').toLowerCase().includes('anchor'))
        )
        .reduce(
          (acc, s) => acc + (s.durationMinutes || Math.round((s.durationSeconds || 0) / 60)),
          0
        );
      const deepHours = +(deepMinutes / 60).toFixed(1);

      return {
        id: `week-${idx}`,
        dateStr: label,
        label,
        fullDate,
        hours: totalHours,
        deepHours,
        sessionsCount: weekSessions.length,
        tasksCompleted: Math.round(weekSessions.length * 1.5),
      };
    }
  });

  // Calculate scaling ranges
  const maxHours = Math.max(isWeeklyBucketed ? 40 : 8, ...points.map((p) => p.hours));
  const maxValue = maxHours;

  // Chart dimensions & padding
  const width = 360;
  const height = 170;
  const paddingLeft = 32;
  const paddingRight = 16;
  const paddingTop = 20;
  const paddingBottom = 26;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Coordinate mapper
  const coords = points.map((p, i) => {
    const x = paddingLeft + (i / Math.max(1, points.length - 1)) * chartWidth;
    const yVal = p.hours;
    const y = paddingTop + chartHeight - (maxValue > 0 ? (yVal / maxValue) * chartHeight : 0);
    return { x, y, point: p };
  });

  // Generate SVG path strings
  let pathD = '';
  let areaD = '';

  if (coords.length > 0) {
    pathD = coords.reduce((acc, pt, i) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      // Smooth cubic bezier
      const prev = coords[i - 1];
      const cx1 = prev.x + (pt.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (pt.x - prev.x) / 2;
      const cy2 = pt.y;
      return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`;
    }, '');

    const firstPt = coords[0];
    const lastPt = coords[coords.length - 1];
    const baselineY = paddingTop + chartHeight;
    areaD = `${pathD} L ${lastPt.x} ${baselineY} L ${firstPt.x} ${baselineY} Z`;
  }

  // Target threshold baseline (5.5h / day or 38.5h / week)
  const targetThreshold = isWeeklyBucketed ? 38.5 : 5.5;
  const targetY =
    paddingTop + chartHeight - (maxValue > 0 ? (targetThreshold / maxValue) * chartHeight : 0);

  // Interaction handlers
  const handleTouchOrMouse = (clientX: number) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = clientX - rect.left;
    const scale = width / rect.width;
    const svgX = relX * scale;

    let closestIdx = 0;
    let minDistance = Infinity;

    coords.forEach((pt, i) => {
      const dist = Math.abs(pt.x - svgX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = i;
      }
    });

    setHoveredIdx(closestIdx);
  };

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : points[points.length - 1];
  const activePtCoord = hoveredIdx !== null ? coords[hoveredIdx] : coords[coords.length - 1];

  // Total summary in timeframe
  const totalPeriodHours = +points.reduce((acc, p) => acc + p.hours, 0).toFixed(1);
  const totalPeriodSessions = points.reduce((acc, p) => acc + p.sessionsCount, 0);
  const totalPeriodTasks = points.reduce((acc, p) => acc + p.tasksCompleted, 0);

  return (
    <div className="matte-card p-4 space-y-3 border-purple-500/20 bg-[#090d16] shadow-lg">
      {/* Header & Target Benchmark */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Daily Focus Volume
            </h3>
          </div>
        </div>

        {/* Target Benchmark Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 font-mono text-[11px] text-emerald-300">
          <Target className="w-3 h-3 text-emerald-400" />
          <span>{isWeeklyBucketed ? '38.5h / wk' : '5.5h / day'}</span>
        </div>
      </div>

      {/* Dynamic HUD Strip */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5 font-mono text-xs">
        <div>
          <span className="text-[9px] text-slate-400 block mb-0.5">
            {activePoint?.fullDate || 'Today'}
          </span>
          <p className="text-base font-bold text-white tabular-nums">
            {activePoint?.hours || 0} <span className="text-xs font-normal text-slate-400">hrs</span>
          </p>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
            {activePoint?.sessionsCount || 0} sessions • {activePoint?.tasksCompleted || 0} tasks done
          </p>
        </div>

        <div className="text-right">
          <span className="text-[9px] text-slate-400 block mb-0.5">{timeframe}D Total</span>
          <p className="text-base font-bold text-purple-300 tabular-nums">
            {totalPeriodHours} <span className="text-xs font-normal text-purple-400/70">hrs</span>
          </p>
          <p className="text-[10px] text-purple-300/70 font-mono mt-0.5">
            {totalPeriodSessions} sessions • {totalPeriodTasks} tasks total
          </p>
        </div>
      </div>

      {/* Interactive SVG Chart */}
      <div className="relative select-none touch-pan-y">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-44 overflow-visible cursor-crosshair"
          onTouchStart={(e) => handleTouchOrMouse(e.touches[0].clientX)}
          onTouchMove={(e) => handleTouchOrMouse(e.touches[0].clientX)}
          onTouchEnd={() => setHoveredIdx(null)}
          onMouseMove={(e) => handleTouchOrMouse(e.clientX)}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            {/* Area Gradient */}
            <linearGradient id="focusAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>

            {/* Line Gradient */}
            <linearGradient id="focusLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingLeft}
            y1={paddingTop}
            x2={width - paddingRight}
            y2={paddingTop}
            stroke="#ffffff10"
            strokeDasharray="3 3"
          />
          <line
            x1={paddingLeft}
            y1={paddingTop + chartHeight / 2}
            x2={width - paddingRight}
            y2={paddingTop + chartHeight / 2}
            stroke="#ffffff10"
            strokeDasharray="3 3"
          />
          <line
            x1={paddingLeft}
            y1={paddingTop + chartHeight}
            x2={width - paddingRight}
            y2={paddingTop + chartHeight}
            stroke="#ffffff15"
          />

          {/* Target Reference Line (e.g. 5.5h or 38.5h) */}
          {targetY >= paddingTop && targetY <= paddingTop + chartHeight && (
            <g>
              <line
                x1={paddingLeft}
                y1={targetY}
                x2={width - paddingRight}
                y2={targetY}
                stroke="#10b981"
                strokeWidth="1.2"
                strokeDasharray="4 3"
                opacity="0.75"
              />
              <text
                x={width - paddingRight - 2}
                y={targetY - 4}
                textAnchor="end"
                className="text-[9px] font-mono fill-emerald-400 font-bold"
              >
                Target {targetThreshold}h
              </text>
            </g>
          )}

          {/* Y-Axis Value Labels */}
          <text
            x={paddingLeft - 6}
            y={paddingTop + 4}
            textAnchor="end"
            className="text-[9px] font-mono fill-slate-500"
          >
            {maxValue}h
          </text>
          <text
            x={paddingLeft - 6}
            y={paddingTop + chartHeight + 3}
            textAnchor="end"
            className="text-[9px] font-mono fill-slate-500"
          >
            0
          </text>

          {/* Shaded Area */}
          {areaD && <path d={areaD} fill="url(#focusAreaGradient)" />}

          {/* Main Progression Line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="url(#focusLineGradient)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Individual Data Points */}
          {coords.map((pt, i) => {
            const isHovered = i === hoveredIdx;
            const isLatest = i === coords.length - 1 && hoveredIdx === null;
            const highlighted = isHovered || isLatest;

            return (
              <g key={i}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={highlighted ? 4.5 : 2.5}
                  className={`transition-all duration-150 ${
                    highlighted
                      ? 'fill-white stroke-purple-400 stroke-2'
                      : 'fill-[#c084fc] hover:fill-white'
                  }`}
                />
                {/* X-Axis labels (spaced appropriately) */}
                {(points.length <= 7 || i % 2 === 0 || i === points.length - 1) && (
                  <text
                    x={pt.x}
                    y={paddingTop + chartHeight + 16}
                    textAnchor="middle"
                    className={`text-[9px] font-mono transition-colors ${
                      highlighted ? 'fill-purple-300 font-bold' : 'fill-slate-500'
                    }`}
                  >
                    {pt.point.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Scrubbing cursor vertical guideline */}
          {hoveredIdx !== null && activePtCoord && (
            <line
              x1={activePtCoord.x}
              y1={paddingTop}
              x2={activePtCoord.x}
              y2={paddingTop + chartHeight}
              stroke="#a855f7"
              strokeWidth="1"
              strokeDasharray="2 2"
              opacity="0.8"
            />
          )}
        </svg>
      </div>
    </div>
  );
};
