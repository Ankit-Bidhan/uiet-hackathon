import React, { useState } from 'react';
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, ArrowRight, Brain, Activity, 
  Database, FileCode, CheckCircle, Search, ExternalLink, RefreshCw
} from 'lucide-react';
import type { ScanRecord, JourneyNode, NextMovePrediction } from '../types/threat';
import { playCyberClick, playCyberScan } from '../lib/audio';

interface ForensicCommandCenterProps {
  scans: ScanRecord[];
  activeScan: ScanRecord | null;
  onSelectScan: (scan: ScanRecord) => void;
  onManualAnalyze: (payload: string, type: 'message' | 'url') => Promise<void>;
  isAnalyzing: boolean;
}

export const ForensicCommandCenter: React.FC<ForensicCommandCenterProps> = ({
  scans,
  activeScan,
  onSelectScan,
  onManualAnalyze,
  isAnalyzing
}) => {
  const [manualInput, setManualInput] = useState('');
  const [manualType, setManualType] = useState<'message' | 'url'>('message');

  const current = activeScan || scans[0] || null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    playCyberClick();
    onManualAnalyze(manualInput, manualType);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Bar with Incident Overview */}
      <div className="bg-[#080d1a] border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl border ${
            current?.risk_level === 'CRITICAL'
              ? 'bg-red-950/50 border-red-500/80 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.25)]'
              : (current?.risk_level === 'HIGH' ? 'bg-orange-950/50 border-orange-500/80 text-orange-400' : 'bg-emerald-950/50 border-emerald-500/80 text-emerald-400')
          }`}>
            {current?.risk_level === 'CRITICAL' ? <ShieldAlert className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
          </div>
          <div>
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span>ACTIVE FORENSIC INCIDENT</span>
              {current?.was_auto_blocked && (
                <span className="text-[10px] bg-red-600/90 text-white px-2 py-0.5 rounded font-bold">
                  AUTO-BLOCKED BY REAL-TIME SHIELD
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white mt-0.5">
              {current?.scam_category || 'No Scan Selected'}
            </h2>
            <div className="text-xs font-mono text-slate-400 mt-1">
              {current ? `Source: ${current.source || 'Intercepted'} • Log ID: ${current.id}` : 'Select an incident from the timeline'}
            </div>
          </div>
        </div>

        {current && (
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-xs font-mono text-slate-400">THREAT SCORE</div>
              <div className="text-3xl font-mono font-bold text-red-400">
                {current.risk_score}<span className="text-sm text-slate-500">/100</span>
              </div>
            </div>
            <div className="h-10 w-px bg-slate-800"></div>
            <div className="text-right">
              <div className="text-xs font-mono text-slate-400">STATUS</div>
              <div className="text-sm font-bold font-mono text-emerald-400">
                CONTAINED
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Incident Timeline & Forensic Deep-Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Col: Timeline List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 uppercase tracking-wider">
            <span>INCIDENT LOG STREAM ({scans.length})</span>
            <span className="text-cyan-400">Auto-Synced</span>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {scans.map((s) => {
              const isSelected = current?.id === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    playCyberClick();
                    onSelectScan(s);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/30 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white font-mono truncate max-w-[170px]">
                      {s.sender ? `Sender: ${s.sender}` : (s.extracted_urls?.[0] || 'Payload')}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      s.risk_score >= 80 ? 'bg-red-600/80 text-white' : 'bg-amber-600/80 text-white'
                    }`}>
                      {s.risk_score}%
                    </span>
                  </div>
                  <div className="text-[11px] text-amber-300/90 font-medium mt-1 truncate">
                    {s.scam_category}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                    {s.raw_payload}
                  </p>
                  <div className="mt-2 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                    <span>{new Date(s.created_at).toLocaleTimeString()}</span>
                    <span className="text-cyan-400">Forensics →</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Forensic Manual Input Tool */}
          <div className="bg-[#090d19] border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="text-xs font-mono font-bold text-slate-300">
              Manual Forensic Query Sandbox
            </div>
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <textarea
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Paste suspect message, email, or URL for deep forensic evaluation..."
                rows={3}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      checked={manualType === 'message'}
                      onChange={() => setManualType('message')}
                    />
                    <span>SMS</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      checked={manualType === 'url'}
                      onChange={() => setManualType('url')}
                    />
                    <span>URL</span>
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isAnalyzing ? 'Scanning...' : 'Analyze'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Col: Forensic Intelligence Matrix (8 cols) */}
        {current ? (
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Attack Path Replay */}
            <div className="bg-[#090e1c] border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-sm font-mono text-white">
                    ATTACK PATH REPLAY (KILL-CHAIN SEQUENCE)
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                  VISUAL TRAJECTORY
                </span>
              </div>

              {current.journey_nodes.length > 0 ? (
                <div className="flex flex-col md:flex-row items-center gap-3 overflow-x-auto py-2">
                  {current.journey_nodes.map((node, idx) => (
                    <React.Fragment key={node.id}>
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700/80 flex-1 min-w-[160px] space-y-1">
                        <div className="text-[10px] font-mono uppercase text-slate-400">
                          Step {idx + 1} • {node.type}
                        </div>
                        <div className="text-xs font-bold text-white truncate">
                          {node.label}
                        </div>
                        {node.details && (
                          <div className="text-[10px] text-slate-400 line-clamp-2">
                            {node.details}
                          </div>
                        )}
                      </div>
                      {idx < current.journey_nodes.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-cyan-500 shrink-0 rotate-90 md:rotate-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900/60 text-xs text-slate-400">
                  Single-stage payload observed.
                </div>
              )}
            </div>

            {/* 2. Next Move AI (Gemini Projection) */}
            <div className="bg-gradient-to-br from-[#0c1324] to-[#080d1a] border border-blue-500/30 rounded-2xl p-6 space-y-4 shadow-[0_0_25px_rgba(59,130,246,0.1)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold text-sm font-mono text-white">
                    NEXT MOVE AI • ATTACKER PROJECTION (GEMINI 3.8 FLASH)
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 border border-blue-500/40 text-blue-300">
                  PREDICTIVE NEURAL DEFENSE
                </span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="text-xs font-mono text-blue-300 font-bold">
                  PROJECTED NEXT STAGE:
                </div>
                <p className="text-sm text-slate-200 leading-relaxed font-sans">
                  {current.predicted_next_step}
                </p>
              </div>

              {current.next_moves && current.next_moves.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {current.next_moves.map((move, idx) => (
                    <div key={idx} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-amber-300">{move.type}</span>
                        <span className="text-[10px] font-mono text-cyan-400">{move.confidence}% Probability</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {move.why.join('; ')}
                      </div>
                      <div className="text-[10px] font-mono text-emerald-400 pt-1">
                        COUNTERMEASURE: {move.action_label}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Threat DNA & Heuristic Indicators */}
            <div className="bg-[#090e1c] border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-sm font-mono text-white">
                    THREAT DNA & HEURISTIC SIGNATURES
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {current.indicators.map((ind, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-300 leading-snug">{ind}</span>
                  </div>
                ))}
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="text-xs font-mono text-slate-400">Forensic Synthesis:</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {current.explanation}
                </p>
              </div>
            </div>

            {/* 4. Action Center */}
            <div className="bg-[#090e1c] border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Action Center & Incident Containment
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {current.actions?.block && (
                  <div className="p-3 bg-red-950/30 border border-red-800/50 rounded-xl space-y-1">
                    <span className="font-mono font-bold text-red-400">BLOCK:</span>
                    <p className="text-slate-300 text-[11px]">{current.actions.block}</p>
                  </div>
                )}
                {current.actions?.avoid && (
                  <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-xl space-y-1">
                    <span className="font-mono font-bold text-amber-400">AVOID:</span>
                    <p className="text-slate-300 text-[11px]">{current.actions.avoid}</p>
                  </div>
                )}
                {current.actions?.report && (
                  <div className="p-3 bg-blue-950/30 border border-blue-800/50 rounded-xl space-y-1">
                    <span className="font-mono font-bold text-blue-400">REPORT:</span>
                    <p className="text-slate-300 text-[11px]">{current.actions.report}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 p-12 text-center text-slate-500 font-mono text-sm border border-slate-800 rounded-2xl">
            Select an incident or inject a message from the mobile simulator to inspect forensics.
          </div>
        )}
      </div>
    </div>
  );
};
