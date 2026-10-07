import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Bell, Smartphone, Radio, QrCode as QrIcon, CheckCircle, Copy, ExternalLink, 
  Terminal, ShieldAlert, Zap, AlertTriangle, Layers, Send, HelpCircle, Info, Share2, Sparkles
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
  const [copiedCompanionUrl, setCopiedCompanionUrl] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [testSender, setTestSender] = useState('com.whatsapp (WhatsApp Notification)');
  const [testBody, setTestBody] = useState('Part-Time Review Job: Earn ₹4,500 daily by watching YouTube videos! Tap to join: http://youtubee.com/task-invite');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-xguntzmctfbhewslil2knm-188574482368.asia-east1.run.app';
  const webhookUrl = `${currentOrigin}/api/notification/incoming`;
  const companionUrl = `${currentOrigin}/?view=companion`;

  // Generate QR Code for Mobile Companion
  useEffect(() => {
    QRCode.toDataURL(companionUrl, {
      width: 220,
      margin: 1.5,
      color: {
        dark: '#22d3ee',
        light: '#050914'
      }
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('Failed to generate QR:', err));
  }, [companionUrl]);

  const requestNativeNotification = async () => {
    playCyberClick();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        if (perm === 'granted') {
          new Notification('SafeCore AI Shield Activated', {
            body: 'Real-time threat notification broadcaster is armed and will alert you if threats are detected.',
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

  const copyCompanionUrl = () => {
    navigator.clipboard.writeText(companionUrl);
    setCopiedCompanionUrl(true);
    setTimeout(() => setCopiedCompanionUrl(false), 2000);
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
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Radio className="w-5 h-5 animate-pulse" />
              </span>
              <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-bold">
                Live Physical Phone Bridge & Real-Time Listener
              </div>
            </div>
            <h2 className="text-xl font-bold text-white font-mono">
              Real Device Notification Bridge Architecture
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              <strong>Can any website directly read notifications from other phone apps?</strong> No! Due to OS security sandboxing, no web browser (Chrome/Edge/Safari on Windows or Android) can read your private WhatsApp or SMS notifications. SafeCore bridges this via: (1) <strong>Mobile Companion Portal (Scan QR below)</strong>, (2) <strong>Android MacroDroid Webhook</strong>, or (3) <strong>Native Android Background Daemon</strong>.
            </p>
          </div>

          {/* System Push Notification Permission Toggle */}
          <div className="shrink-0 bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-col items-center gap-2 text-center w-full lg:w-auto">
            <div className="text-[11px] font-mono text-slate-400">
              Desktop / Browser Push Banners
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
            <span className="text-[10px] text-slate-500 max-w-[200px]">
              Allows SafeCore to pop up native system banners when threats arrive
            </span>
          </div>
        </div>
      </div>

      {/* Grid: 3 Interactive Ways to Connect */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* METHOD 1: Mobile Companion QR Code (Cols 1-5) */}
        <div className="lg:col-span-5 bg-[#090e1c] border border-cyan-500/50 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <QrIcon className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-mono">
                METHOD 1: Scan with Real Phone Camera
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold">
              FASTEST LIVE DEMO
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Scan this QR code using your physical Android or iPhone camera to open the <strong>Mobile Companion Ingestion Portal</strong>. Any message you transmit from your phone appears instantly on this desktop screen!
          </p>

          {/* QR Code Graphic */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-3">
            {qrCodeDataUrl ? (
              <img 
                src={qrCodeDataUrl} 
                alt="SafeCore Phone Companion QR Code" 
                className="w-48 h-48 rounded-xl border border-cyan-500/30 p-2 bg-[#050914] shadow-[0_0_25px_rgba(6,182,212,0.2)]"
              />
            ) : (
              <div className="w-48 h-48 rounded-xl border border-slate-800 flex items-center justify-center text-slate-600 font-mono text-xs">
                Generating QR...
              </div>
            )}
            <div className="text-[11px] font-mono text-cyan-400 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Point Phone Camera to Scan</span>
            </div>
          </div>

          {/* Action Link & Open Buttons */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-black/60 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 truncate flex-1 select-all">
                {companionUrl}
              </span>
              <button
                onClick={copyCompanionUrl}
                className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-[10px] font-mono font-bold shrink-0 cursor-pointer flex items-center gap-1"
              >
                {copiedCompanionUrl ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCompanionUrl ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <a
              href={companionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Mobile Companion in New Tab</span>
            </a>
          </div>
        </div>

        {/* METHOD 2 & 3: Android Webhook Bridge & Tester (Cols 6-12) */}
        <div className="lg:col-span-7 space-y-6">
          {/* METHOD 2: MacroDroid / Tasker Webhook Bridge */}
          <div className="bg-[#090e1c] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white font-mono">
                  METHOD 2: 100% Automated Android Webhook Bridge
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                ZERO-TOUCH
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              To intercept live incoming WhatsApp, SMS, or Telegram messages from your actual physical Android phone in the background without opening any browser:
            </p>

            <div className="space-y-2.5">
              <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-cyan-600/30 border border-cyan-500 flex items-center justify-center text-[10px] text-cyan-200 shrink-0 font-bold">1</span>
                <div>Install free <strong>MacroDroid</strong> on Android and grant "Notification Access".</div>
              </div>

              <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-cyan-600/30 border border-cyan-500 flex items-center justify-center text-[10px] text-cyan-200 shrink-0 font-bold">2</span>
                <div>Set Trigger: <strong>Notification Received</strong> (Select Messages, WhatsApp, or All).</div>
              </div>

              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs space-y-2">
                <div className="flex items-center gap-3 font-bold text-cyan-300 font-mono">
                  <span className="w-5 h-5 rounded-full bg-cyan-600/30 border border-cyan-500 flex items-center justify-center text-[10px] text-cyan-200 shrink-0">3</span>
                  <span>Set Action: HTTP POST to SafeCore Webhook:</span>
                </div>
                
                <div className="pl-8 space-y-1.5">
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
                    Request Body: <code className="text-amber-300">{`{"sender": "{notification_title}", "body": "{notification_text}"}`}</code>
                  </div>
                </div>
              </div>
            </div>

            {/* Terminal cURL */}
            <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Or test with cURL:</span>
              <button
                onClick={copyCurl}
                className="text-cyan-400 hover:text-cyan-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                {copiedCurl ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCurl ? 'Copied cURL Command' : 'Copy cURL Command'}</span>
              </button>
            </div>
          </div>

          {/* METHOD 3: Live Quick Notification Tester */}
          <div className="bg-[#090e1c] border border-cyan-500/40 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Zap className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-mono">
                METHOD 3: Instant Live Notification Simulator
              </h3>
            </div>

            <form onSubmit={handleTestSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400">Sender / App Title:</label>
                  <input
                    type="text"
                    value={testSender}
                    onChange={(e) => setTestSender(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400">Quick Test Archetype:</label>
                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'sbi') {
                        setTestSender('AD-SBIBNK');
                        setTestBody('SBI Alert: YONO NetBanking account blocked due to expired PAN KYC. Update at https://sbi-kyc-portal.cc/login immediately.');
                      } else if (val === 'youtube') {
                        setTestSender('com.whatsapp (WhatsApp Recruiter)');
                        setTestBody('Part-Time Job: Earn ₹4,500 daily by watching YouTube videos! Tap to join: http://youtubee.com/claim-task');
                      } else if (val === 'police') {
                        setTestSender('POLICE-CBI');
                        setTestBody('CRITICAL: FIR #9420 lodged against your Aadhaar for illegal narcotics parcel. Contact IO immediately or face Digital Arrest.');
                      } else if (val === 'swiggy') {
                        setTestSender('JM-SWIGGY');
                        setTestBody('Swiggy Order #84920 is out for delivery with partner Ramesh. Track live in app.');
                      } else if (val === 'bank_safe') {
                        setTestSender('AX-HDFCBK');
                        setTestBody('Dear Customer, INR 3,200.00 debited from A/C XX9012 on 07-OCT. Avl Bal: INR 41,200.00. UPI Ref: 429184920194.');
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-cyan-300 font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="youtube">🟣 WhatsApp YouTube Task Scam</option>
                    <option value="sbi">🔴 SBI KYC Deactivation Phishing</option>
                    <option value="police">🔴 CBI Digital Arrest Extortion</option>
                    <option value="swiggy">🟢 Swiggy Order (Genuine Safe)</option>
                    <option value="bank_safe">🟢 Routine Bank Debit (Safe)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400">Message Content:</label>
                <textarea
                  value={testBody}
                  onChange={(e) => setTestBody(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:border-cyan-500 focus:outline-none leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'TRANSMITTING...' : 'INJECT NOTIFICATION LIVE'}</span>
              </button>

              {sendSuccess && (
                <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-xs font-mono flex items-center justify-between text-emerald-300 animate-in fade-in">
                  <span className="flex items-center gap-1.5 font-bold">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    Notification evaluated!
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigateTab && onNavigateTab('mobile')}
                      className="text-cyan-400 hover:underline text-[11px]"
                    >
                      View on Phone →
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateTab && onNavigateTab('forensics')}
                      className="text-red-400 hover:underline text-[11px]"
                    >
                      View in Forensics →
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Architectural Guide: Hackathon Defense & Judges Q&A */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-amber-400">
          <HelpCircle className="w-5 h-5" />
          <h3 className="text-base font-bold font-mono text-white">
            Hackathon Defense: How to Answer Judges on Mobile Notification Tracking
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 leading-relaxed">
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
            <div className="font-bold text-cyan-300 font-mono">
              Q: Why can't a website directly track phone notifications when closed?
            </div>
            <p>
              <strong>Security Reality:</strong> Android and iOS strictly sandbox third-party apps. If a web browser could read WhatsApp or SMS notifications, malicious websites could steal private OTPs and chat records! Web Notification permissions only grant permission to <em>show</em> alerts, not <em>read</em> them.
            </p>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
            <div className="font-bold text-emerald-300 font-mono">
              Q: How does SafeCore solve this in production vs this demo?
            </div>
            <p>
              <strong>Production Solution:</strong> SafeCore deploys as an Android background service utilizing <code className="text-cyan-300 font-mono">NotificationListenerService</code> and <code className="text-cyan-300 font-mono">SmsReceiver</code> (code provided in our Android Native Hub). For this live demo, our Webhook Bridge pairs seamlessly with MacroDroid or our Mobile Companion portal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
