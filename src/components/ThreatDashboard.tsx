import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  Clock, ShieldAlert, AlertTriangle, TrendingUp, ShieldCheck, 
  Layers, Info, RefreshCw, Zap, Calendar, ArrowUpRight, Flame
} from 'lucide-react';
import { playCyberClick } from '../lib/audio';

export interface HourlyThreatPoint {
  hour: number;
  label: string;
  blockedUrls: number;
  smsThreats: number;
  totalThreats: number;
  riskScore: number;
  dominantCategory: string;
  isCurrentHour?: boolean;
  isHighRiskWindow?: boolean;
}

export interface HighRiskWindow {
  id: string;
  timeWindow: string;
  name: string;
  threatSurgePct: string;
  dominantArchetypes: string[];
  riskLevel: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'LOW';
  riskScore: number;
  attractionFactor: string;
}

export interface TemporalTrendsResponse {
  range: string;
  hourlyData: HourlyThreatPoint[];
  highRiskWindows: HighRiskWindow[];
  currentHourInfo: {
    hour: number;
    label: string;
    isInCriticalWindow: boolean;
    currentRiskScore: number;
    dominantThreat: string;
  };
  metrics: {
    peakAttackWindow: string;
    safestOperatingWindow: string;
    weekendSurgeFactor: string;
    totalPeriodIntercepts: number;
  };
}

interface ThreatDashboardProps {
  realtimeBlockedCount?: number;
  realtimeSmsCount?: number;
}

export const ThreatDashboard: React.FC<ThreatDashboardProps> = ({
  realtimeBlockedCount = 0,
  realtimeSmsCount = 0
}) => {
  const [data, setData] = useState<TemporalTrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'urls' | 'sms'>('all');
  const [hoveredPoint, setHoveredPoint] = useState<HourlyThreatPoint | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [currentLocalTime, setCurrentLocalTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  useEffect(() => {
    const t = setInterval(() => {
      setCurrentLocalTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Fetch temporal trend metrics from server using client's actual local browser hour
  const fetchTrends = async () => {
    try {
      setLoading(true);
      const localHour = new Date().getHours();
      const res = await fetch(`/api/threats/temporal-trends?range=24h&localHour=${localHour}`);
      if (res.ok) {
        const json: TemporalTrendsResponse = await res.json();
        setData(json);
        if (json.currentHourInfo) {
          setSelectedHour(json.currentHourInfo.hour);
        }
      }
    } catch (err) {
      console.error('Failed to fetch temporal threat trends:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, [realtimeBlockedCount, realtimeSmsCount]);

  // Active inspected hour item
  const activeInspectedHour = useMemo(() => {
    if (!data?.hourlyData) return null;
    if (selectedHour !== null) {
      return data.hourlyData.find((h) => h.hour === selectedHour) || data.hourlyData[0];
    }
    return data.hourlyData.find((h) => h.isCurrentHour) || data.hourlyData[0];
  }, [data, selectedHour]);

  // ----------------------------------------------------
  // D3.js Temporal Multi-Series Visualization
  // ----------------------------------------------------
  useEffect(() => {
    if (!data?.hourlyData || !svgRef.current || !containerRef.current) return;

    const hourly = data.hourlyData;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const containerWidth = containerRef.current.clientWidth || 800;
    const height = 340;
    const margin = { top: 30, right: 30, bottom: 40, left: 45 };
    const width = containerWidth - margin.left - margin.right;

    svg
      .attr('viewBox', `0 0 ${containerWidth} ${height}`)
      .attr('width', '100%')
      .attr('height', height);

    // Defs for gradients & filters
    const defs = svg.append('defs');

    // Gradient for Blocked URLs (Cyber Cyan)
    const urlGradient = defs.append('linearGradient')
      .attr('id', 'urlAreaGradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    urlGradient.append('stop').attr('offset', '0%').attr('stop-color', '#06b6d4').attr('stop-opacity', 0.55);
    urlGradient.append('stop').attr('offset', '100%').attr('stop-color', '#06b6d4').attr('stop-opacity', 0.0);

    // Gradient for SMS Threats (Rose / Red)
    const smsGradient = defs.append('linearGradient')
      .attr('id', 'smsAreaGradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    smsGradient.append('stop').attr('offset', '0%').attr('stop-color', '#f43f5e').attr('stop-opacity', 0.65);
    smsGradient.append('stop').attr('offset', '100%').attr('stop-color', '#f43f5e').attr('stop-opacity', 0.0);

    // Shaded Pattern for High-Risk Windows
    const riskWindowPattern = defs.append('pattern')
      .attr('id', 'riskStripe')
      .attr('width', 8)
      .attr('height', 8)
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('patternTransform', 'rotate(45)');
    riskWindowPattern.append('line')
      .attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 8)
      .attr('stroke', '#ef4444').attr('stroke-width', 1.5).attr('stroke-opacity', 0.25);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // X and Y Scales
    const xScale = d3.scaleLinear()
      .domain([0, 23])
      .range([0, width]);

    const maxVal = d3.max(hourly, (d) => {
      if (selectedFilter === 'urls') return d.blockedUrls;
      if (selectedFilter === 'sms') return d.smsThreats;
      return Math.max(d.blockedUrls, d.smsThreats);
    }) || 100;

    const yScale = d3.scaleLinear()
      .domain([0, maxVal * 1.15])
      .range([height - margin.top - margin.bottom, 0]);

    // High Risk Zones Shading on Canvas
    // Zone 1: Morning 10:00 - 12:30
    g.append('rect')
      .attr('x', xScale(9.5))
      .attr('width', xScale(12.5) - xScale(9.5))
      .attr('y', 0)
      .attr('height', height - margin.top - margin.bottom)
      .attr('fill', 'url(#riskStripe)')
      .attr('opacity', 0.8);

    g.append('text')
      .attr('x', (xScale(9.5) + xScale(12.5)) / 2)
      .attr('y', 14)
      .attr('text-anchor', 'middle')
      .attr('fill', '#f59e0b')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text('⚠️ 10-12h WORK WAVE');

    // Zone 2: Evening 19:30 - 23:00
    g.append('rect')
      .attr('x', xScale(19.3))
      .attr('width', xScale(23) - xScale(19.3))
      .attr('y', 0)
      .attr('height', height - margin.top - margin.bottom)
      .attr('fill', 'url(#riskStripe)')
      .attr('opacity', 0.9);

    g.append('text')
      .attr('x', (xScale(19.3) + xScale(23)) / 2)
      .attr('y', 14)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ef4444')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text('🛑 20-23h NIGHT PANIC ZONE');

    // Horizontal Grid Lines
    const yAxisTicks = yScale.ticks(5);
    g.selectAll('.grid-line')
      .data(yAxisTicks)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3');

    // D3 Area & Line Generators
    const urlArea = d3.area<HourlyThreatPoint>()
      .curve(d3.curveMonotoneX)
      .x((d) => xScale(d.hour))
      .y0(height - margin.top - margin.bottom)
      .y1((d) => yScale(d.blockedUrls));

    const urlLine = d3.line<HourlyThreatPoint>()
      .curve(d3.curveMonotoneX)
      .x((d) => xScale(d.hour))
      .y((d) => yScale(d.blockedUrls));

    const smsArea = d3.area<HourlyThreatPoint>()
      .curve(d3.curveMonotoneX)
      .x((d) => xScale(d.hour))
      .y0(height - margin.top - margin.bottom)
      .y1((d) => yScale(d.smsThreats));

    const smsLine = d3.line<HourlyThreatPoint>()
      .curve(d3.curveMonotoneX)
      .x((d) => xScale(d.hour))
      .y((d) => yScale(d.smsThreats));

    // Render Areas & Lines depending on filter
    if (selectedFilter === 'all' || selectedFilter === 'urls') {
      g.append('path')
        .datum(hourly)
        .attr('fill', 'url(#urlAreaGradient)')
        .attr('d', urlArea);

      g.append('path')
        .datum(hourly)
        .attr('fill', 'none')
        .attr('stroke', '#06b6d4')
        .attr('stroke-width', 2.5)
        .attr('d', urlLine);
    }

    if (selectedFilter === 'all' || selectedFilter === 'sms') {
      g.append('path')
        .datum(hourly)
        .attr('fill', 'url(#smsAreaGradient)')
        .attr('d', smsArea);

      g.append('path')
        .datum(hourly)
        .attr('fill', 'none')
        .attr('stroke', '#f43f5e')
        .attr('stroke-width', 2.5)
        .attr('d', smsLine);
    }

    // X Axis Labels
    const xAxis = d3.axisBottom(xScale)
      .ticks(12)
      .tickFormat((d) => `${d.toString().padStart(2, '0')}:00`);

    const xAxisG = g.append('g')
      .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
      .call(xAxis);

    xAxisG.select('.domain').attr('stroke', '#334155');
    xAxisG.selectAll('.tick line').attr('stroke', '#334155');
    xAxisG.selectAll('.tick text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    // Y Axis Labels
    const yAxis = d3.axisLeft(yScale).ticks(5);
    const yAxisG = g.append('g').call(yAxis);
    yAxisG.select('.domain').remove();
    yAxisG.selectAll('.tick line').remove();
    yAxisG.selectAll('.tick text')
      .attr('fill', '#64748b')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    // Interactive Vertical Guide Line
    const focusLine = g.append('line')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4')
      .attr('y1', 0)
      .attr('y2', height - margin.top - margin.bottom)
      .style('opacity', 0);

    const focusCircleUrls = g.append('circle')
      .attr('r', 5)
      .attr('fill', '#06b6d4')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .style('opacity', 0);

    const focusCircleSms = g.append('circle')
      .attr('r', 5)
      .attr('fill', '#f43f5e')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .style('opacity', 0);

    // Overlay for Mouse Events
    const overlay = g.append('rect')
      .attr('width', width)
      .attr('height', height - margin.top - margin.bottom)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair');

    overlay.on('mousemove', (event) => {
      const [mouseX] = d3.pointer(event);
      const hourIndex = Math.min(23, Math.max(0, Math.round(xScale.invert(mouseX))));
      const point = hourly[hourIndex];

      if (point) {
        setHoveredPoint(point);
        const xPos = xScale(point.hour);

        focusLine
          .attr('x1', xPos)
          .attr('x2', xPos)
          .style('opacity', 1);

        if (selectedFilter === 'all' || selectedFilter === 'urls') {
          focusCircleUrls
            .attr('cx', xPos)
            .attr('cy', yScale(point.blockedUrls))
            .style('opacity', 1);
        }

        if (selectedFilter === 'all' || selectedFilter === 'sms') {
          focusCircleSms
            .attr('cx', xPos)
            .attr('cy', yScale(point.smsThreats))
            .style('opacity', 1);
        }
      }
    });

    overlay.on('click', (event) => {
      const [mouseX] = d3.pointer(event);
      const hourIndex = Math.min(23, Math.max(0, Math.round(xScale.invert(mouseX))));
      playCyberClick();
      setSelectedHour(hourIndex);
    });

    overlay.on('mouseleave', () => {
      setHoveredPoint(null);
      focusLine.style('opacity', 0);
      focusCircleUrls.style('opacity', 0);
      focusCircleSms.style('opacity', 0);
    });

  }, [data, selectedFilter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner: Current Time Risk Awareness */}
      {data?.currentHourInfo && (
        <div className={`p-5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all ${
          data.currentHourInfo.isInCriticalWindow
            ? 'bg-red-950/40 border-red-500/60 shadow-[0_0_40px_rgba(239,68,68,0.2)]'
            : 'bg-emerald-950/30 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`p-3.5 rounded-2xl border ${
              data.currentHourInfo.isInCriticalWindow
                ? 'bg-red-600/30 border-red-500 text-red-300 animate-pulse'
                : 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
            }`}>
              {data.currentHourInfo.isInCriticalWindow ? <Flame className="w-7 h-7" /> : <ShieldCheck className="w-7 h-7" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-black/40 text-slate-300">
                  REAL-TIME TEMPORAL RISK MONITOR
                </span>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  Current Clock: {currentLocalTime} ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">
                {data.currentHourInfo.isInCriticalWindow
                  ? 'CRITICAL ATTACK SURGE ACTIVE: High-Risk Time Window'
                  : 'NORMAL VIGILANCE ZONE: Baseline Traffic Window'}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Dominant Vector This Hour: <span className="font-semibold text-amber-300">{data.currentHourInfo.dominantThreat}</span> ({data.currentHourInfo.currentRiskScore}% Vulnerability Index)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                playCyberClick();
                fetchTrends();
              }}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>
      )}

      {/* Main D3 Chart Container */}
      <div className="bg-[#090d19] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white font-mono">
                TEMPORAL THREAT WAVEFORM (D3.JS)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Circadian 24-hour distribution of blocked phishing URLs and intercepted SMS attacks
            </p>
          </div>

          {/* Series Filter Tabs */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                playCyberClick();
                setSelectedFilter('all');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                selectedFilter === 'all' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Composite (All)
            </button>
            <button
              onClick={() => {
                playCyberClick();
                setSelectedFilter('urls');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                selectedFilter === 'urls' ? 'bg-cyan-400 text-black font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Blocked URLs
            </button>
            <button
              onClick={() => {
                playCyberClick();
                setSelectedFilter('sms');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                selectedFilter === 'sms' ? 'bg-rose-500 text-black font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              SMS Threats
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-cyan-400"></div>
              <span>Blocked Phishing URLs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-rose-500"></div>
              <span>Intercepted SMS Threats</span>
            </div>
            <div className="flex items-center gap-2 text-red-400">
              <div className="w-3 h-3 rounded border border-red-500 bg-red-950/60"></div>
              <span>Shaded Critical Risk Window</span>
            </div>
          </div>

          {hoveredPoint ? (
            <div className="text-cyan-300 font-bold bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">
              Hour {hoveredPoint.label}: {hoveredPoint.blockedUrls} URLs • {hoveredPoint.smsThreats} SMS ({hoveredPoint.dominantCategory})
            </div>
          ) : (
            <div className="text-slate-500">
              Hover across waveform for hourly forensic breakdown
            </div>
          )}
        </div>

        {/* D3 Canvas Container */}
        <div ref={containerRef} className="w-full relative">
          <svg ref={svgRef} className="w-full overflow-visible"></svg>
        </div>
      </div>

      {/* Circadian 24-Hour Attack Heatmap Bar */}
      {data?.hourlyData && (
        <div className="bg-[#090d19] border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                CIRCADIAN 24-HOUR ATTACK HEATMAP (CLICK TO INSPECT)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Intensity: Green (0-30%) ➔ Amber (30-70%) ➔ Crimson (70-100%)
            </span>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-12 md:grid-cols-24 gap-1.5">
            {data.hourlyData.map((item) => {
              const isSelected = activeInspectedHour?.hour === item.hour;
              let bg = 'bg-slate-900 border-slate-800 text-slate-400';
              if (item.riskScore >= 90) bg = 'bg-red-600/80 border-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]';
              else if (item.riskScore >= 75) bg = 'bg-rose-600/70 border-rose-500 text-white';
              else if (item.riskScore >= 50) bg = 'bg-amber-600/60 border-amber-500 text-amber-100';
              else if (item.riskScore >= 30) bg = 'bg-blue-900/50 border-blue-700 text-blue-200';
              else bg = 'bg-slate-900/80 border-slate-800 text-slate-500';

              return (
                <button
                  key={item.hour}
                  onClick={() => {
                    playCyberClick();
                    setSelectedHour(item.hour);
                  }}
                  className={`p-2 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer relative ${bg} ${
                    isSelected ? 'ring-2 ring-cyan-400 scale-105 z-10' : 'hover:scale-102'
                  }`}
                  title={`${item.label} - ${item.riskScore}% Threat Intensity`}
                >
                  <span className="text-[10px] font-mono font-bold">{item.hour}h</span>
                  <span className="text-[9px] font-mono mt-0.5">{item.totalThreats}</span>
                  {item.isCurrentHour && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Inspected Hour Detail Drawer */}
          {activeInspectedHour && (
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 mt-3 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${
                  activeInspectedHour.riskScore >= 80 
                    ? 'bg-red-950 border-red-500 text-red-400' 
                    : 'bg-cyan-950 border-cyan-500 text-cyan-400'
                }`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-mono text-cyan-400 font-bold">
                    INSPECTING WINDOW: {activeInspectedHour.label} {activeInspectedHour.isCurrentHour ? '(CURRENT HOUR)' : ''}
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    Dominant Syndicate Vector: {activeInspectedHour.dominantCategory}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 font-mono">
                    Blocked URLs: {activeInspectedHour.blockedUrls} • Intercepted SMS: {activeInspectedHour.smsThreats} • Composite Risk: {activeInspectedHour.riskScore}%
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                  activeInspectedHour.riskScore >= 80
                    ? 'bg-red-500/20 border-red-500 text-red-300'
                    : 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                }`}>
                  {activeInspectedHour.riskScore >= 80 ? 'CRITICAL RISK TIER' : 'ELEVATED/MONITORED TIER'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* High-Risk Time Window Intelligence Cards */}
      {data?.highRiskWindows && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white font-mono">
                HIGH-RISK TIME WINDOWS & ATTACKER PSYCHOLOGY
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Why specific scams surge at specific hours of the day
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300">
              CIRCADIAN THREAT INTELLIGENCE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.highRiskWindows.map((win) => (
              <div
                key={win.id}
                className="bg-[#090e1c] border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {win.timeWindow}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-red-950 border border-red-500/60 text-red-300">
                      SURGE: {win.threatSurgePct}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white">{win.name}</h4>
                    <div className="text-[11px] font-mono text-amber-300/90 mt-1">
                      {win.dominantArchetypes.join(' • ')}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {win.attractionFactor}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Risk Severity:</span>
                  <span className="font-bold text-red-400">{win.riskScore}% {win.riskLevel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      {data?.metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="text-xs font-mono text-slate-400">Peak Attack Window</div>
            <div className="text-sm font-bold text-red-400 font-mono">{data.metrics.peakAttackWindow}</div>
            <div className="text-[10px] text-slate-500">Highest volume of extortion lures</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="text-xs font-mono text-slate-400">Safest Operating Window</div>
            <div className="text-sm font-bold text-emerald-400 font-mono">{data.metrics.safestOperatingWindow}</div>
            <div className="text-[10px] text-slate-500">Minimal scam delivery activity</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="text-xs font-mono text-slate-400">Weekend Factor</div>
            <div className="text-sm font-bold text-amber-300 font-mono">+42% Surge</div>
            <div className="text-[10px] text-slate-500">Job and task scams spike on weekends</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="text-xs font-mono text-slate-400">Total Analyzed Intercepts</div>
            <div className="text-sm font-bold text-cyan-400 font-mono">{data.metrics.totalPeriodIntercepts} Events</div>
            <div className="text-[10px] text-slate-500">Temporal model sample size</div>
          </div>
        </div>
      )}
    </div>
  );
};
