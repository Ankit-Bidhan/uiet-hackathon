import React, { useEffect, useState } from 'react';
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, ExternalLink, X, 
  MessageSquare, Globe, ArrowRight, Zap 
} from 'lucide-react';
import { playThreatAlarm, playCyberClick, playSafeShieldSound } from '../lib/audio';

export interface ToastNotification {
  id: string;
  type: 'sms_blocked' | 'url_blocked' | 'sms_received' | 'new_scan';
  title: string;
  subtitle: string;
  riskScore?: number;
  category?: string;
  timestamp: string;
  data?: unknown;
}

interface GlobalToastContainerProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
  onInspectToast?: (toast: ToastNotification) => void;
}

export const GlobalToastContainer: React.FC<GlobalToastContainerProps> = ({
  toasts,
  onDismiss,
  onInspectToast
}) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none select-none">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => onDismiss(toast.id)}
          onInspect={() => onInspectToast && onInspectToast(toast)}
        />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{
  toast: ToastNotification;
  onDismiss: () => void;
  onInspect: () => void;
}> = ({ toast, onDismiss, onInspect }) => {
  const [progress, setProgress] = useState(100);
  const isCritical = (toast.riskScore ?? 0) >= 70;

  useEffect(() => {
    const duration = 6500;
    const interval = 50;
    const step = (interval / duration) * 100;

    const progressTimer = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - step));
    }, interval);

    const dismissTimer = setTimeout(() => {
      onDismiss();
    }, duration);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(dismissTimer);
    };
  }, [onDismiss]);

  return (
    <div 
      className={`pointer-events-auto rounded-2xl border shadow-2xl backdrop-blur-xl p-4 transition-all duration-300 transform translate-y-0 opacity-100 animate-in slide-in-from-bottom-5 overflow-hidden ${
        isCritical
          ? 'bg-[#0f0914]/95 border-red-500/80 shadow-[0_0_35px_rgba(239,68,68,0.3)]'
          : 'bg-[#090e1c]/95 border-cyan-500/60 shadow-[0_0_30px_rgba(6,182,212,0.2)]'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl shrink-0 ${
            isCritical 
              ? 'bg-red-600/30 border border-red-500 text-red-400 animate-pulse' 
              : 'bg-cyan-600/30 border border-cyan-500 text-cyan-400'
          }`}>
            {toast.type.includes('url') ? (
              <Globe className="w-4 h-4" />
            ) : (
              <MessageSquare className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                isCritical ? 'text-red-400' : 'text-cyan-400'
              }`}>
                {toast.title}
              </span>
              {toast.riskScore !== undefined && (
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                  isCritical ? 'bg-red-600 text-white' : 'bg-cyan-600 text-white'
                }`}>
                  {toast.riskScore}%
                </span>
              )}
            </div>
            <div className="text-xs font-semibold text-white mt-0.5 line-clamp-1">
              {toast.subtitle}
            </div>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-slate-500 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Category / Context */}
      {toast.category && (
        <div className="mt-2 text-[11px] font-mono text-amber-300/90 truncate bg-black/40 px-2 py-1 rounded-md border border-slate-800">
          Vector: {toast.category}
        </div>
      )}

      {/* Quick Action Footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
        <span className="text-slate-500 text-[10px]">
          {new Date(toast.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>

        <button
          onClick={onInspect}
          className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-bold transition-colors cursor-pointer"
        >
          <span>Inspect Forensics</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Progress Bar Timer */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/60">
        <div
          className={`h-full transition-all duration-75 ${
            isCritical ? 'bg-red-500' : 'bg-cyan-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
