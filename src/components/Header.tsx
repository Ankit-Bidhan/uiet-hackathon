import React from 'react';
import { Shield, Smartphone, Terminal, Volume2, VolumeX, Radio, Bug, TrendingUp } from 'lucide-react';
import { toggleAudioMute, getAudioMute, playCyberClick } from '../lib/audio';

interface HeaderProps {
  activeTab: 'mobile' | 'forensics' | 'android_code' | 'temporal' | 'live_bridge';
  setActiveTab: (tab: 'mobile' | 'forensics' | 'android_code' | 'temporal' | 'live_bridge') => void;
  stats: {
    totalScanned: number;
    quarantinedCount: number;
    blockedUrlCount: number;
  };
  shieldActive: boolean;
  onToggleShield: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  stats,
  shieldActive,
  onToggleShield
}) => {
  const [muted, setMuted] = React.useState(getAudioMute());

  const handleMuteToggle = () => {
    const isNowMuted = toggleAudioMute();
    setMuted(isNowMuted);
    if (!isNowMuted) playCyberClick();
  };

  return (
    <header className="border-b border-slate-800/80 bg-[#060a14]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                <div className="w-full h-full bg-[#050914] rounded-[10px] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              {shieldActive && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight text-white font-mono">
                  SafeCore<span className="text-cyan-400">.AI</span>
                </h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                  Real-Time Mobile Shield
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Zero-Click SMS Interception & Phishing URL Blocker
              </p>
            </div>
          </div>

          {/* Quick Audio Mute on Mobile */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={handleMuteToggle}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              title={muted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 w-full md:w-auto justify-center">
          <button
            onClick={() => {
              playCyberClick();
              setActiveTab('mobile');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              activeTab === 'mobile'
                ? 'bg-cyan-500 text-black font-semibold shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile Simulator</span>
          </button>

          <button
            onClick={() => {
              playCyberClick();
              setActiveTab('live_bridge');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              activeTab === 'live_bridge'
                ? 'bg-cyan-500 text-black font-semibold shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Live Phone Bridge</span>
          </button>

          <button
            onClick={() => {
              playCyberClick();
              setActiveTab('temporal');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              activeTab === 'temporal'
                ? 'bg-cyan-500 text-black font-semibold shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Threat Wave Dashboard (D3.js)</span>
          </button>

          <button
            onClick={() => {
              playCyberClick();
              setActiveTab('forensics');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              activeTab === 'forensics'
                ? 'bg-cyan-500 text-black font-semibold shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Bug className="w-3.5 h-3.5" />
            <span>Forensic Center</span>
          </button>

          <button
            onClick={() => {
              playCyberClick();
              setActiveTab('android_code');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              activeTab === 'android_code'
                ? 'bg-cyan-500 text-black font-semibold shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Android Native Hub</span>
          </button>
        </div>

        {/* Live Protection Stats & Controls */}
        <div className="hidden lg:flex items-center gap-4">
          {/* Active Shield Switch */}
          <button
            onClick={() => {
              playCyberClick();
              onToggleShield();
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
              shieldActive
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'bg-red-950/40 border-red-500/50 text-red-300'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${shieldActive ? 'text-emerald-400 animate-pulse' : 'text-red-400'}`} />
            <span>{shieldActive ? 'REAL-TIME SHIELD: ON' : 'REAL-TIME SHIELD: PAUSED'}</span>
          </button>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-300">
              <span className="text-red-400 font-bold">{stats.blockedUrlCount}</span>
              <span className="text-slate-500">URLs Blocked</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-300">
              <span className="text-amber-400 font-bold">{stats.quarantinedCount}</span>
              <span className="text-slate-500">SMS Quarantined</span>
            </div>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={handleMuteToggle}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
            title={muted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
