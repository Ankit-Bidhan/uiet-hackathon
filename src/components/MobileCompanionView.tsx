import React, { useState } from 'react';
import { Smartphone, Send, Clipboard, CheckCircle, Shield, AlertTriangle, ArrowLeft, Radio } from 'lucide-react';
import { playCyberClick, playCyberScan } from '../lib/audio';

interface MobileCompanionViewProps {
  onExit?: () => void;
}

export const MobileCompanionView: React.FC<MobileCompanionViewProps> = ({ onExit }) => {
  const [sender, setSender] = useState('WhatsApp (+91 98765 43210)');
  const [body, setBody] = useState('SBI ALERT: Dear customer, your YONO NetBanking account is suspended due to expired PAN KYC. Update immediately at https://sbi-kyc-portal.cc/login');
  const [status, setStatus] = useState<'idle' | 'transmitting' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setBody(text);
          playCyberClick();
        }
      }
    } catch {
      // Permission denied or not supported
    }
  };

  const handleTransmit = async (customSender = sender, customBody = body) => {
    if (!customBody.trim()) return;
    setStatus('transmitting');
    playCyberScan();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([80, 40, 80]); } catch {}
    }

    try {
      const res = await fetch('/api/notification/incoming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: customSender,
          body: customBody,
          receivedAt: new Date().toISOString()
        })
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setStatus('success');
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#060a14] text-slate-100 flex flex-col font-sans p-4 max-w-md mx-auto select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
              SafeCore<span className="text-cyan-400">.AI</span>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono">
                PHONE SYNC
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono">
              Live Phone Notification Ingestion Transmitter
            </p>
          </div>
        </div>

        {onExit && (
          <button
            onClick={onExit}
            className="text-xs text-slate-400 hover:text-white p-2 rounded-lg bg-slate-900 border border-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Sync Status Badge */}
      <div className="mt-4 p-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 text-cyan-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Transmitter Armed</span>
        </div>
        <span className="text-[10px] text-slate-400">
          Syncs to Desktop Live via SSE
        </span>
      </div>

      {/* Main Ingestion Form */}
      <div className="mt-4 space-y-4 flex-1">
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-slate-400">
            Notification Sender App / Number:
          </label>
          <input
            type="text"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            placeholder="e.g. WhatsApp, VK-SBIINB, +919876543210"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono text-slate-400">
              Notification Message / SMS:
            </label>
            <button
              type="button"
              onClick={handlePasteClipboard}
              className="text-[10px] font-mono text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Clipboard className="w-3 h-3" />
              <span>Paste from Clipboard</span>
            </button>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder="Paste SMS or WhatsApp message..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-cyan-500 focus:outline-none leading-relaxed font-sans"
          />
        </div>

        {/* Primary Big Transmit Button */}
        <button
          onClick={() => handleTransmit()}
          disabled={status === 'transmitting'}
          className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 active:scale-[0.98] text-white font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span>
            {status === 'transmitting' ? 'TRANSMITTING TO DESKTOP...' : 'TRANSMIT TO SAFECORE LIVE'}
          </span>
        </button>

        {/* Success Confirmation Card */}
        {status === 'success' && result && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500 text-xs font-mono space-y-1.5 animate-in fade-in">
            <div className="flex items-center justify-between text-emerald-300 font-bold">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Delivered to Desktop!
              </span>
              <span>{result.incomingSms?.riskScore}% RISK</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Check your computer screen! The message just popped up live with risk analysis.
            </p>
          </div>
        )}

        {/* 1-Tap Quick Phone Presets */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            1-Tap Phone Test Scenarios:
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => {
                const s = 'AD-SBIBNK';
                const b = 'SBI Alert: YONO NetBanking account blocked due to expired PAN KYC. Update at https://sbi-kyc-portal.cc/login immediately.';
                setSender(s);
                setBody(b);
                handleTransmit(s, b);
              }}
              className="p-2.5 rounded-xl bg-slate-900 border border-red-900/60 hover:border-red-500 text-left text-xs font-mono text-red-300 flex items-center justify-between"
            >
              <span>🔴 1. SBI KYC Phishing SMS</span>
              <span className="text-[10px] bg-red-950 px-2 py-0.5 rounded border border-red-500/40">SEND</span>
            </button>

            <button
              onClick={() => {
                const s = 'WhatsApp (+919830192837)';
                const b = 'Part-Time Video Job: Earn Rs 4,500 daily by rating YouTube videos. Join task group: http://youtubee.com/claim-task';
                setSender(s);
                setBody(b);
                handleTransmit(s, b);
              }}
              className="p-2.5 rounded-xl bg-slate-900 border border-purple-900/60 hover:border-purple-500 text-left text-xs font-mono text-purple-300 flex items-center justify-between"
            >
              <span>🟣 2. WhatsApp YouTube Task Scam</span>
              <span className="text-[10px] bg-purple-950 px-2 py-0.5 rounded border border-purple-500/40">SEND</span>
            </button>

            <button
              onClick={() => {
                const s = 'AX-HDFCBK';
                const b = 'Dear Customer, INR 3,450.00 debited from A/C XX4921 on 07-OCT. Avl Bal: INR 35,150.00. UPI Ref: 429184910283.';
                setSender(s);
                setBody(b);
                handleTransmit(s, b);
              }}
              className="p-2.5 rounded-xl bg-slate-900 border border-emerald-900/60 hover:border-emerald-500 text-left text-xs font-mono text-emerald-300 flex items-center justify-between"
            >
              <span>🟢 3. Genuine Bank Debit Alert (Safe)</span>
              <span className="text-[10px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40">SEND</span>
            </button>

            <button
              onClick={() => {
                const s = 'JM-SWIGGY';
                const b = 'Swiggy Alert: Your food order #92831 is out for delivery. Track live in the Swiggy mobile app.';
                setSender(s);
                setBody(b);
                handleTransmit(s, b);
              }}
              className="p-2.5 rounded-xl bg-slate-900 border border-emerald-900/60 hover:border-emerald-500 text-left text-xs font-mono text-emerald-300 flex items-center justify-between"
            >
              <span>🟢 4. Swiggy Delivery Notice (Safe)</span>
              <span className="text-[10px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40">SEND</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Instructions */}
      <footer className="pt-4 text-center text-[10px] font-mono text-slate-500 border-t border-slate-900 mt-4">
        Transmitting live to SafeCore AI Threat Engine • Keep laptop dashboard open
      </footer>
    </div>
  );
};
