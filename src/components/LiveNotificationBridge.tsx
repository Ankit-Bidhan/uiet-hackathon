import React, { useState } from 'react';
import { 
  Bell, Smartphone, Radio, QrCode, CheckCircle, Copy, ExternalLink, 
  Terminal, ShieldAlert, Zap, AlertTriangle, Layers, Send, HelpCircle, Info
} from 'lucide-react';
import { playCyberClick, playCyberScan } from '../lib/audio';

interface LiveNotificationBridgeProps {
  onInjectNotification: (sender: string, body: string) => Promise<any>;
  onNavigateTab?: (tab: 'mobile' | 'forensics') => void;
}

export const LiveNotificationBridge: React.FC<LiveNotificationBridgeProps> = ({
  onInjectNotification,
  onNavigateTab
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [testSender, setTestSender] = useState('com.whatsapp (WhatsApp Notification)');
  const [testBody, setTestBody] = useState('Part-Time Review Job: Earn ₹4,500 daily by watching YouTube videos! Tap to join: http://youtubee.com/task-invite');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-xguntzmctfbhewslil2knm-188574482368.asia-east1.run.app';
  const webhookUrl = `${currentOrigin}/api/notification/incoming`;

  const requestNativeNotification = async () => {
    playCyberClick();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        if (perm === 'granted') {
          new Notification('SafeCore AI Shield Activated', {
            body: 'Real-time mobile threat listener is armed and listening for incoming payloads.',
            icon: '/favicon.ico'
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const copyCurl = () => {
    const curlCmd = `curl -X POST "${webhookUrl}" -H "Content-Type: application/json" -d '{"sender":"WhatsApp (+919876543210)","body":"Urgent KYC expired. Update at https://sbi-kyc-portal.cc/login"}'`;
    navigator.clipboard.writeText(curlCmd);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testBody.trim()) return;
    setIsSending(true);
    setSendSuccess(false);
    playCyberScan();
    try {
      await onInjectNotification(testSender, testBody);
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3500);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner: Truth About Browser vs Native Android Notification Access */}
      <div className="bg-[#080d1a] border border-cyan-500/40 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.1)]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Radio className="w-5 h-5 animate-pulse" />
              </span>
              <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-bold">
                Live Physical Phone Bridge & Notification Listener
              </div>
            </div>
            <h2 className="text-xl font-bold text-white font-mono">
              Real Device Notification Bridge Architecture
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              <strong>Can a website directly access notifications from other phone apps?</strong> No web browser can directly read Android or iOS system notifications due to OS sandboxing. To achieve zero-latency live scanning on physical phones, SafeCore pairs with Android's native <code className="text-cyan-300 font-mono">NotificationListenerService</code> or a real-time Webhook Forwarder.
            </p>
          </div>

          {/* System Push Notification Permission Toggle */}
          <div className="shrink-0 bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-col items-center gap-2 text-center">
            <div className="text-[11px] font-mono text-slate-400">
              Browser OS Push Alerts
            </div>
            {notificationPermission === 'granted' ? (
              <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                <span>OS Alerts Armed</span>
              </div>
            ) : (
              <button
                onClick={requestNativeNotification}
                className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Grant OS Notification Access</span>
              </button>
            )}
            <span className="text-[10px] text-slate-500 max-w-[170px]">
              Allows SafeCore to pop up native system banners even if tab is minimized
            </span>
          </div>
        </div>
      </div>

      {/* Grid: 2 Setup Options for Hackathon Live Demo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: How to Connect Real Android Phone in 60 Seconds (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#090e1c] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white font-mono">
                  METHOD 1: Real Android Phone Webhook Bridge (1-Minute Setup)
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                RECOMMENDED FOR LIVE DEMO
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              To intercept live incoming WhatsApp, SMS, or Telegram messages from your actual physical Android phone during the hackathon, forward notifications via standard Android Webhook bridge (MacroDroid / Tasker / Notification Forwarder):
            </p>

            {/* Step-by-Step Instructions */}
            <div className="space-y-3">
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs space-y-1">
                <div className="font-bold text-cyan-300 font-mono flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-600/30 border border-cyan-500 flex items-center justify-center text-[10px] text-cyan-200">1</span>
                  <span>Install Free 'MacroDroid' or 'Notification Forwarder' on Android</span>
                </div>
                <div className="text-slate-400 pl-7 text-[11px]">
                  Download from Google Play Store (takes 10 seconds). Grant standard Android "Notification Access".
                </div>
              </div>

              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs space-y-1">
                <div className="font-bold text-cyan-300 font-mono flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-600/30 border border-cyan-500 flex items-center justify-center text-[10px] text-cyan-200">2</span>
                  <span>Set Trigger: 'Notification Received'</span>
                </div>
                <div className="text-slate-400 pl-7 text-[11px]">
                  Select <strong>Messages</strong>, <strong>WhatsApp</strong>, or <strong>All Applications</strong>.
                </div>
              </div>

              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs space-y-2">
                <div className="font-bold text-cyan-300 font-mono flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-600/30 border border-cyan-500 flex items-center justify-center text-[10px] text-cyan-200">3</span>
                  <span>Set Action: 'HTTP Request (POST)' to SafeCore Live Webhook</span>
                </div>
                
                {/* Webhook URL Box */}
                <div className="pl-7 space-y-2">
                  <div className="flex items-center gap-2 bg-black/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-[11px] font-mono text-cyan-300 truncate flex-1 select-all">
                      {webhookUrl}
                    </span>
                    <button
                      onClick={copyWebhook}
                      className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px] font-mono font-bold shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      {copiedUrl ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
                    </button>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 bg-slate-950 p-2 rounded border border-slate-800/80">
                    Request Body (JSON):<br />
                    <code className="text-amber-300">
                      {`{"sender": "{notification_title}", "body": "{notification_text}"}`}
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {/* Test cURL Box */}
            <div className="p-3.5 bg-black/40 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Or Test Direct from Any Terminal / Phone Termux:</span>
                <button
                  onClick={copyCurl}
                  className="text-cyan-400 hover:text-cyan-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedCurl ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCurl ? 'Copied' : 'Copy cURL'}</span>
                </button>
              </div>
              <pre className="text-[11px] font-mono text-cyan-200 bg-slate-950 p-2 rounded border border-slate-800 overflow-x-auto">
                <code>curl -X POST "{webhookUrl}" -H "Content-Type: application/json" -d '{`{"sender":"WhatsApp","body":"SBI account suspended. Update at https://sbi-kyc-portal.cc"}`}'</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Right: Instant Live Notification Simulator Sandbox (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#090e1c] border border-cyan-500/40 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Zap className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white font-mono">
                METHOD 2: Instant Notification Tester
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Test how real notification streams from apps like WhatsApp, Telegram, or banking daemons get intercepted in real time:
            </p>

            <form onSubmit={handleTestSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-400">
                  Notification Source App / Title:
                </label>
                <input
                  type="text"
                  value={testSender}
                  onChange={(e) => setTestSender(e.target.value)}
                  placeholder="e.g. WhatsApp, Messages, or Telegram"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-400">
                  Notification Message Body (with link or scam hook):
                </label>
                <textarea
                  value={testBody}
                  onChange={(e) => setTestBody(e.target.value)}
                  rows={4}
                  placeholder="Paste or write incoming message..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono text-slate-400 uppercase">
                  Quick Test Archetypes:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTestSender('WhatsApp (Work From Home Recruiter)');
                      setTestBody('Part-Time Job: Earn ₹4,500 daily by simply watching videos. Click here to start: http://youtubee.com/claim-task');
                    }}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500 text-left text-[11px] text-purple-300 font-mono transition-colors cursor-pointer truncate"
                  >
                    🟣 WhatsApp Task Scam
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTestSender('com.google.android.apps.messaging (AX-HDFCBK)');
                      setTestBody('Dear Customer, INR 3,200.00 debited from A/C XX9012 on 07-OCT. Avl Bal: INR 41,200.00. UPI Ref: 429184920194.');
                    }}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500 text-left text-[11px] text-emerald-300 font-mono transition-colors cursor-pointer truncate"
                  >
                    🟢 Genuine Bank Debit
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'PROCESSING NOTIFICATION...' : 'BROADCAST NOTIFICATION TO SAFECORE'}</span>
              </button>

              {sendSuccess && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-xs font-mono space-y-2.5 animate-in fade-in">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Notification intercepted live & threat score evaluated!</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-emerald-900/40">
                    <button
                      type="button"
                      onClick={() => onNavigateTab && onNavigateTab('mobile')}
                      className="flex-1 py-1.5 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/50 text-cyan-200 rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>📱 View on Mobile Simulator →</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateTab && onNavigateTab('forensics')}
                      className="flex-1 py-1.5 bg-red-600/30 hover:bg-red-600/50 border border-red-500/50 text-red-200 rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>🔬 View in Forensic Center →</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
