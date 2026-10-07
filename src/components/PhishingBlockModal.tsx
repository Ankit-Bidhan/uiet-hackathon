import React from 'react';
import { ShieldAlert, AlertTriangle, ArrowLeft, ExternalLink, Lock, CheckCircle2, Copy } from 'lucide-react';
import { playCyberClick, playSafeShieldSound } from '../lib/audio';

interface PhishingBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  domain?: string;
  category?: string;
  riskScore?: number;
  reason?: string;
  threats?: string[];
  onInspectInSandbox?: () => void;
}

export const PhishingBlockModal: React.FC<PhishingBlockModalProps> = ({
  isOpen,
  onClose,
  url,
  domain,
  category = 'Credential Harvesting / Phishing Domain',
  riskScore = 95,
  reason = 'Detected malicious lookalike domain attempting to capture sensitive banking or personal data.',
  threats = [],
  onInspectInSandbox
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#090d16] border-2 border-red-500/80 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.35)] overflow-hidden">
        {/* Siren Alert Top Bar */}
        <div className="bg-red-600/20 border-b border-red-500/40 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600 rounded-lg animate-pulse text-white">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold tracking-wider text-red-400 uppercase">
                SafeCore Active DNS & Web Shield • Zero-Day Protection
              </div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                MALICIOUS PHISHING ATTEMPT BLOCKED
              </h2>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-red-500/30 border border-red-500 text-red-200 text-xs font-mono font-bold rounded-full">
              THREAT SCORE: {riskScore}/100
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <div className="bg-red-950/30 border border-red-800/60 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-red-300 font-mono">
              <span>INTERCEPTED DESTINATION ENDPOINT:</span>
              <button 
                onClick={handleCopy}
                className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Payload'}</span>
              </button>
            </div>
            <div className="font-mono text-sm break-all text-red-200 font-semibold bg-black/40 p-3 rounded-lg border border-red-900/50">
              {url}
            </div>
            {domain && (
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>Identified Host / Origin:</span>
                <span className="font-mono text-cyan-400">{domain}</span>
              </div>
            )}
          </div>

          {/* Forensic Breakdown */}
          <div className="space-y-3">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Forensic Interception Intelligence
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                <div className="text-xs text-slate-400 font-mono">Threat Classification</div>
                <div className="text-sm font-bold text-amber-300 mt-1">{category}</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                <div className="text-xs text-slate-400 font-mono">Real-Time Action Taken</div>
                <div className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  Connection Blackholed (0ms Leak)
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="text-xs font-mono text-slate-400">Why was this blocked?</div>
              <p className="text-sm text-slate-300 leading-relaxed">
                {reason}
              </p>
              {threats.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  {threats.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-red-300">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <button
              onClick={() => {
                playSafeShieldSound();
                onClose();
              }}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Safety (Close Shield)</span>
            </button>

            {onInspectInSandbox && (
              <button
                onClick={() => {
                  playCyberClick();
                  onInspectInSandbox();
                }}
                className="w-full sm:w-auto px-5 py-3 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 hover:border-cyan-500 font-mono text-sm rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Forensic Sandbox Inspection</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
