import React, { useState, useEffect } from 'react';
import { 
  Shield, ShieldAlert, ShieldCheck, Smartphone, Send, Globe, MessageSquare, 
  Settings, RefreshCw, Zap, Bell, CheckCircle, ExternalLink, Play, Pause, ChevronRight, Lock, Eye
} from 'lucide-react';
import type { IncomingSms, ScanRecord, BlockedUrlRecord } from '../types/threat';
import { playCyberClick, playCyberScan, playThreatAlarm, playSafeShieldSound } from '../lib/audio';

interface MobileDeviceSimulatorProps {
  incomingSmsList: IncomingSms[];
  onInjectSms: (sender: string, body: string) => Promise<void>;
  onInspectScan: (scan: ScanRecord) => void;
  onInterceptUrl: (url: string, source: string) => Promise<void>;
  shieldActive: boolean;
  onToggleShield: () => void;
  blockedUrls: BlockedUrlRecord[];
}

export const MobileDeviceSimulator: React.FC<MobileDeviceSimulatorProps> = ({
  incomingSmsList,
  onInjectSms,
  onInspectScan,
  onInterceptUrl,
  shieldActive,
  onToggleShield,
  blockedUrls
}) => {
  const [activeApp, setActiveApp] = useState<'messages' | 'shield' | 'browser'>('messages');
  const [selectedSms, setSelectedSms] = useState<IncomingSms | null>(null);
  const [browserInputUrl, setBrowserInputUrl] = useState('https://sbi-kyc-portal.cc/login');
  const [isSending, setIsSending] = useState(false);
  const [headsUpAlert, setHeadsUpAlert] = useState<IncomingSms | null>(null);

  // Custom injector form
  const [customSender, setCustomSender] = useState('AD-HDFCBK');
  const [customBody, setCustomBody] = useState('ALERT: Your HDFC Debit Card is locked due to suspicious login. Re-activate here: http://hdfc-card-verify.top/auth');

  // Auto-stream telecom simulation
  const [autoStreamActive, setAutoStreamActive] = useState(false);

  // Dynamic live local clock for mobile status bar
  const [localClockStr, setLocalClockStr] = useState(() => 
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  );

  useEffect(() => {
    const t = setInterval(() => {
      setLocalClockStr(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    }, 10000);
    return () => clearInterval(t);
  }, []);

  // Set default selected message
  useEffect(() => {
    if (incomingSmsList.length > 0 && !selectedSms) {
      setSelectedSms(incomingSmsList[0]);
    }
  }, [incomingSmsList, selectedSms]);

  // Handle heads up alert when a new SMS arrives
  useEffect(() => {
    if (incomingSmsList.length > 0) {
      const latest = incomingSmsList[0];
      setHeadsUpAlert(latest);
      const timer = setTimeout(() => {
        setHeadsUpAlert(null);
      }, 5500);
      return () => clearTimeout(timer);
    }
  }, [incomingSmsList]);

  // Real-time automatic telecom stream generator
  useEffect(() => {
    if (!autoStreamActive) return;

    const testPool = [
      { sender: 'POLICE-CBI', body: 'CRITICAL NOTICE: FIR #4928 lodged by Cyber Crime Cell Mumbai against your Aadhaar. Illegal parcel seized. Contact Investigating Officer immediately at +919830192837 or face digital arrest.' },
      { sender: 'POWER-DEPT', body: 'Dear Consumer, your electricity power line will be disconnected tonight at 9:30 PM due to pending bill update. Immediately contact power officer Sharma at +919128392819.' },
      { sender: 'TELEGRAM-HR', body: 'Part-Time Job Opportunity: Earn Rs 4,500 - 8,000 daily by simply rating travel videos. 100% genuine daily payout. Contact recruiter: https://t.me/travel_rating_hr' },
      { sender: 'IND-POST', body: 'India Post: Your package #IN94829 is on hold at Mumbai sorting depot due to incorrect address and unpaid customs surcharge of Rs 3.99. Rectify here: http://ind-post-tracking.xyz/pay' },
      { sender: 'UPI-CASHBACK', body: 'Congratulations! You have received ₹3,499 GooglePay scratch card cashback. Click to claim into bank account: http://gpay-reward-claim.top/scratch' }
    ];

    let idx = 0;
    const interval = setInterval(() => {
      const item = testPool[idx % testPool.length];
      idx++;
      onInjectSms(item.sender, item.body);
    }, 12000);

    return () => clearInterval(interval);
  }, [autoStreamActive, onInjectSms]);

  const handleQuickInject = async (sender: string, body: string) => {
    playCyberClick();
    setIsSending(true);
    await onInjectSms(sender, body);
    setIsSending(false);
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customBody.trim()) return;
    playCyberClick();
    setIsSending(true);
    await onInjectSms(customSender || '+919876543210', customBody);
    setIsSending(false);
  };

  const handleBrowserGo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!browserInputUrl.trim()) return;
    playCyberClick();
    await onInterceptUrl(browserInputUrl, 'Mobile Browser Address Bar');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* LEFT / CENTER: Realistic Mobile Phone Frame (Cols 1-7) */}
      <div className="lg:col-span-7 flex flex-col items-center">
        {/* Phone Outer Shell */}
        <div className="w-full max-w-[390px] bg-[#0c1222] border-[10px] border-[#1e293b] rounded-[52px] shadow-[0_0_80px_rgba(6,182,212,0.15)] overflow-hidden relative flex flex-col h-[740px] select-none">
          {/* Dynamic Island / Camera Notch */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-30 flex items-center justify-end px-3">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700"></div>
          </div>

          {/* Android Status Bar */}
          <div className="pt-3 px-6 pb-1 bg-slate-950 flex items-center justify-between text-[11px] text-slate-400 font-mono z-20">
            <span>{localClockStr}</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] text-cyan-400">
                <Shield className="w-3 h-3 text-cyan-400" /> SafeCore
              </span>
              <span>5G</span>
              <div className="w-4 h-2 border border-slate-500 rounded-sm p-0.5 flex items-center">
                <div className="w-full h-full bg-slate-300 rounded-2xs"></div>
              </div>
            </div>
          </div>

          {/* Real-Time Heads-Up Notification Banner (Slide down overlay) */}
          {headsUpAlert && (
            <div className="absolute top-9 left-2 right-2 z-40 animate-in slide-in-from-top-6 duration-300">
              <div className={`p-3 rounded-2xl border shadow-xl backdrop-blur-md ${
                headsUpAlert.isAutoBlocked 
                  ? 'bg-red-950/95 border-red-500 text-white' 
                  : 'bg-slate-900/95 border-slate-700 text-slate-100'
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${headsUpAlert.isAutoBlocked ? 'bg-red-600 text-white' : 'bg-cyan-600 text-white'}`}>
                      {headsUpAlert.isAutoBlocked ? <ShieldAlert className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-[11px] font-bold font-mono tracking-wide text-red-300">
                        {headsUpAlert.isAutoBlocked ? '🛑 SAFECORE AUTO-INTERCEPT' : '💬 NEW SMS RECEIVED'}
                      </div>
                      <div className="text-xs font-semibold">{headsUpAlert.sender}</div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    headsUpAlert.isAutoBlocked ? 'bg-red-600/80 text-white' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {headsUpAlert.riskScore}% THREAT
                  </span>
                </div>
                <p className="text-[11px] mt-1 line-clamp-2 text-slate-200">
                  {headsUpAlert.body}
                </p>
                {headsUpAlert.isAutoBlocked && (
                  <div className="mt-2 text-[10px] font-mono text-emerald-300 flex items-center gap-1 bg-black/40 p-1.5 rounded-lg">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    <span>Malicious payload quarantined with zero-click exposure.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* App Top Bar */}
          <div className="bg-slate-950/80 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeApp === 'messages' && (
                <>
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold font-mono tracking-wide">MESSAGES (REAL-TIME STREAM)</span>
                </>
              )}
              {activeApp === 'shield' && (
                <>
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold font-mono tracking-wide">SAFECORE ACTIVE SHIELD</span>
                </>
              )}
              {activeApp === 'browser' && (
                <>
                  <Globe className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold font-mono tracking-wide">SAFE BROWSER WITH URL FILTER</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${shieldActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
              <span className="text-[10px] font-mono text-slate-400">
                {shieldActive ? 'SHIELD ON' : 'PAUSED'}
              </span>
            </div>
          </div>

          {/* Phone Main Screen Content Area */}
          <div className="flex-1 bg-[#070b16] overflow-y-auto">
            {/* 1. MESSAGES APP */}
            {activeApp === 'messages' && (
              <div className="h-full flex flex-col">
                {selectedSms ? (
                  /* Thread Detail View */
                  <div className="p-4 space-y-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <button
                        onClick={() => setSelectedSms(null)}
                        className="text-xs text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        ← Back to Inbox
                      </button>
                      <span className="text-[11px] font-mono text-slate-400">{selectedSms.sender}</span>
                    </div>

                    {/* Threat Status Badge */}
                    <div className={`p-3 rounded-xl border ${
                      selectedSms.isAutoBlocked 
                        ? 'bg-red-950/40 border-red-500/60 text-red-200' 
                        : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                    }`}>
                      <div className="flex items-center justify-between text-xs font-mono font-bold">
                        <span className="flex items-center gap-1.5">
                          {selectedSms.isAutoBlocked ? <ShieldAlert className="w-4 h-4 text-red-400" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                          {selectedSms.isAutoBlocked ? 'QUARANTINED BY SAFECORE' : 'BENIGN NOTIFICATION'}
                        </span>
                        <span>{selectedSms.riskScore}% RISK</span>
                      </div>
                      <div className="text-[11px] mt-1 text-slate-300">
                        {selectedSms.category}
                      </div>
                    </div>

                    {/* Chat Bubble */}
                    <div className="flex-1">
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-slate-200 space-y-3 shadow-md">
                        <div className="text-[10px] text-slate-400 font-mono">
                          Received: {new Date(selectedSms.receivedAt).toLocaleTimeString()}
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap select-text">
                          {selectedSms.body}
                        </p>

                        {/* Extracted Interactive Phishing Links */}
                        {selectedSms.urls.length > 0 && (
                          <div className="pt-2 border-t border-slate-800/80 space-y-2">
                            <div className="text-[10px] font-mono text-amber-300 uppercase tracking-wider flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" />
                              Detected Link in Payload (Click to Test Real-Time Blocker):
                            </div>
                            {selectedSms.urls.map((link, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  playCyberScan();
                                  onInterceptUrl(link, `SMS Click (${selectedSms.sender})`);
                                }}
                                className="w-full text-left p-2.5 rounded-lg bg-red-950/50 border border-red-500/40 hover:border-red-400 hover:bg-red-900/50 transition-colors text-red-200 text-xs font-mono break-all flex items-center justify-between group cursor-pointer"
                              >
                                <span className="underline">{link}</span>
                                <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-bold shrink-0 ml-2">
                                  TEST BLOCK
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Bar */}
                    {selectedSms.scanRecord && (
                      <button
                        onClick={() => {
                          playCyberClick();
                          onInspectScan(selectedSms.scanRecord!);
                        }}
                        className="w-full py-2.5 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/50 text-cyan-200 rounded-xl text-xs font-mono font-semibold flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect in Forensic Command Center →</span>
                      </button>
                    )}
                  </div>
                ) : (
                  /* Inbox Message List */
                  <div className="p-3 space-y-2">
                    <div className="text-[11px] font-mono text-slate-400 px-1 py-1 flex items-center justify-between">
                      <span>INCOMING SMS LOG ({incomingSmsList.length})</span>
                      <span className="text-cyan-400">Live Auto-Monitoring</span>
                    </div>

                    {incomingSmsList.length === 0 ? (
                      <div className="py-16 text-center text-xs text-slate-500 font-mono">
                        No incoming messages yet.<br />Use the Test Station on the right to send an SMS!
                      </div>
                    ) : (
                      incomingSmsList.map((sms) => (
                        <div
                          key={sms.id}
                          onClick={() => {
                            playCyberClick();
                            setSelectedSms(sms);
                          }}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            sms.isAutoBlocked 
                              ? 'bg-red-950/20 border-red-900/60 hover:border-red-500/60' 
                              : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white flex items-center gap-1.5">
                              {sms.sender}
                              {sms.isAutoBlocked && (
                                <span className="text-[9px] bg-red-600/80 text-white px-1.5 py-0.2 rounded font-mono font-bold">
                                  BLOCKED
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {new Date(sms.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 line-clamp-2 mt-1">
                            {sms.body}
                          </p>
                          <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400">
                            <span className="text-amber-400">{sms.category}</span>
                            <span className="text-cyan-400 flex items-center gap-0.5">
                              View <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 2. SAFECORE SHIELD MOBILE APP */}
            {activeApp === 'shield' && (
              <div className="p-4 space-y-4">
                {/* Shield Status Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 text-center relative overflow-hidden">
                  <div className="relative z-10 space-y-3">
                    <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                      <ShieldCheck className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white font-mono">
                        REAL-TIME MOBILE GUARD
                      </h3>
                      <p className="text-xs text-emerald-400 font-mono mt-0.5">
                        Status: Active & Armed (Zero-Leak)
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        playCyberClick();
                        onToggleShield();
                      }}
                      className={`w-full py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                        shieldActive
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                          : 'bg-red-600 hover:bg-red-500 text-white'
                      }`}
                    >
                      {shieldActive ? 'SHIELD IS ARMED • CLICK TO PAUSE' : 'SHIELD PAUSED • CLICK TO ACTIVATE'}
                    </button>
                  </div>
                </div>

                {/* Sub-system Indicators */}
                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    Native Android Protection Modules
                  </div>

                  <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">SmsReceiver Daemon</div>
                      <div className="text-[10px] text-slate-400">Intercepts SMS_RECEIVED broadcasts before notification</div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                      ACTIVE
                    </span>
                  </div>

                  <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Local VpnService DNS Filter</div>
                      <div className="text-[10px] text-slate-400">Zero-latency blackholing of malicious domains</div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                      FILTERING
                    </span>
                  </div>

                  <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">NotificationListener Service</div>
                      <div className="text-[10px] text-slate-400">Guards WhatsApp & Telegram notification previews</div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                      ARMED
                    </span>
                  </div>
                </div>

                {/* Live Blocked URLs Quick Log */}
                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Recent Blackholed URLs ({blockedUrls.length})</span>
                  </div>
                  {blockedUrls.slice(0, 3).map((item) => (
                    <div key={item.id} className="p-2.5 bg-red-950/20 border border-red-900/40 rounded-xl text-xs space-y-1">
                      <div className="font-mono text-red-300 font-bold truncate">{item.domain}</div>
                      <div className="text-[10px] text-slate-400 truncate">{item.threatCategory}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. MOBILE BROWSER (URL FILTER DEMO) */}
            {activeApp === 'browser' && (
              <div className="p-4 space-y-4">
                {/* Browser Address Bar */}
                <form onSubmit={handleBrowserGo} className="space-y-2">
                  <div className="text-[11px] font-mono text-slate-400">
                    SafeCore Active Web Filter Address Bar
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl p-1.5">
                    <Lock className="w-3.5 h-3.5 text-cyan-400 ml-1.5 shrink-0" />
                    <input
                      type="text"
                      value={browserInputUrl}
                      onChange={(e) => setBrowserInputUrl(e.target.value)}
                      placeholder="Type or paste any URL..."
                      className="w-full bg-transparent text-xs text-white font-mono focus:outline-none px-1"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-mono font-bold shrink-0 cursor-pointer"
                    >
                      GO
                    </button>
                  </div>
                </form>

                {/* Pre-canned Phishing URLs to test with 1-click */}
                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    Test Phishing Links (Real-Time Blocker Demonstration):
                  </div>

                  <button
                    onClick={() => {
                      setBrowserInputUrl('http://youtubee.com/claim-task');
                      onInterceptUrl('http://youtubee.com/claim-task', 'Browser Address Bar');
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500 hover:bg-purple-950/30 text-xs font-mono transition-colors text-slate-200 cursor-pointer"
                  >
                    <div className="font-bold text-purple-400">1. youtubee.com (Brand Typosquatting)</div>
                    <div className="text-[10px] text-slate-400">Lookalike URL impersonating official YouTube portal</div>
                  </button>

                  <button
                    onClick={() => {
                      setBrowserInputUrl('https://www.amazn.comm/login');
                      onInterceptUrl('https://www.amazn.comm/login', 'Browser Address Bar');
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-red-500 hover:bg-red-950/30 text-xs font-mono transition-colors text-slate-200 cursor-pointer"
                  >
                    <div className="font-bold text-red-400">2. amazn.comm (Double Typosquat + .comm TLD)</div>
                    <div className="text-[10px] text-slate-400">Fake Amazon lookalike with spoofed .comm TLD extension</div>
                  </button>

                  <button
                    onClick={() => {
                      setBrowserInputUrl('https://sbi-kyc-portal.cc/login');
                      onInterceptUrl('https://sbi-kyc-portal.cc/login', 'Browser Address Bar');
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-red-500 hover:bg-red-950/30 text-xs font-mono transition-colors text-slate-200 cursor-pointer"
                  >
                    <div className="font-bold text-red-400">3. sbi-kyc-portal.cc/login</div>
                    <div className="text-[10px] text-slate-400">Spoofed State Bank Netbanking credential stealer</div>
                  </button>

                  <button
                    onClick={() => {
                      setBrowserInputUrl('http://track-parcel-indpost.top/pay-3.99');
                      onInterceptUrl('http://track-parcel-indpost.top/pay-3.99', 'Browser Address Bar');
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-red-500 hover:bg-red-950/30 text-xs font-mono transition-colors text-slate-200 cursor-pointer"
                  >
                    <div className="font-bold text-red-400">4. track-parcel-indpost.top/pay</div>
                    <div className="text-[10px] text-slate-400">Fake India Post payment card skimmer</div>
                  </button>

                  <button
                    onClick={() => {
                      setBrowserInputUrl('https://onlinesbi.sbi');
                      onInterceptUrl('https://onlinesbi.sbi', 'Browser Address Bar');
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500 hover:bg-emerald-950/30 text-xs font-mono transition-colors text-slate-200 cursor-pointer"
                  >
                    <div className="font-bold text-emerald-400">5. onlinesbi.sbi (Official Legitimate Domain)</div>
                    <div className="text-[10px] text-slate-400">Official banking portal (verified safe • no blocking)</div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Android Bottom App Dock */}
          <div className="bg-slate-950 border-t border-slate-800 p-2 flex items-center justify-around z-20">
            <button
              onClick={() => {
                playCyberClick();
                setActiveApp('messages');
              }}
              className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                activeApp === 'messages' ? 'text-cyan-400 bg-cyan-950/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-[9px] font-mono">Messages</span>
            </button>

            <button
              onClick={() => {
                playCyberClick();
                setActiveApp('shield');
              }}
              className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                activeApp === 'shield' ? 'text-emerald-400 bg-emerald-950/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-5 h-5" />
              <span className="text-[9px] font-mono">Shield App</span>
            </button>

            <button
              onClick={() => {
                playCyberClick();
                setActiveApp('browser');
              }}
              className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                activeApp === 'browser' ? 'text-blue-400 bg-blue-950/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-5 h-5" />
              <span className="text-[9px] font-mono">Browser</span>
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT: Real-Time Threat Injector & Test Station (Cols 8-12) */}
      <div className="lg:col-span-5 space-y-6">
        {/* Solution to manual copy-paste: Automated Interception Station */}
        <div className="bg-[#090d19] border border-cyan-500/40 rounded-2xl p-6 shadow-[0_0_30px_rgba(6,182,212,0.1)] space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white font-mono">
                REAL-TIME SMS INTERCEPTION ENGINE
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              ZERO COPY-PASTE
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            In production, SafeCore operates via an Android background daemon (<code className="text-cyan-300 font-mono">SmsReceiver</code>). Messages are scanned the millisecond they are received from the carrier tower. Test it immediately using the live triggers below:
          </p>

          {/* Auto Telecom Simulation Stream Switch */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div>
              <div className="text-xs font-bold text-white">Live Carrier Simulation Stream</div>
              <div className="text-[10px] text-slate-400">Periodically broadcasts real-world scam payloads</div>
            </div>
            <button
              onClick={() => {
                playCyberClick();
                setAutoStreamActive(!autoStreamActive);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                autoStreamActive
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {autoStreamActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{autoStreamActive ? 'STREAMING ON' : 'START AUTO STREAM'}</span>
            </button>
          </div>

            {/* Quick Attack Presets */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>1-Click Test Scenarios:</span>
              <span className="text-cyan-400 text-[10px]">Real-Time Evaluation</span>
            </div>

            {/* Genuine Bank Message to Prove Differentiation */}
            <button
              disabled={isSending}
              onClick={() => handleQuickInject(
                'AX-HDFCBK',
                'Dear Customer, INR 5,200.00 debited from A/C XX8921 on 06-OCT. Avl Bal: INR 48,150.00. UPI Ref: 429184910283. If not done by you, SMS BLOCK to 5676712.'
              )}
              className="w-full text-left p-3 rounded-xl bg-slate-900/80 border border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-950/30 transition-all text-xs space-y-1 cursor-pointer group"
            >
              <div className="font-bold text-emerald-300 font-mono flex items-center justify-between">
                <span>🟢 1. Genuine Bank Alert (RBI Compliant)</span>
                <span className="text-[10px] text-emerald-400 group-hover:translate-x-1 transition-transform">TEST BENIGN →</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Official DLT header (AX-HDFCBK), routine debit info, NO coercion, NO links → 4% Risk (SAFE)
              </div>
            </button>

            {/* SBI NetBanking KYC Scam */}
            <button
              disabled={isSending}
              onClick={() => handleQuickInject(
                'AD-SBIBNK',
                'SBI ALERT: Your NetBanking account is suspended due to expired PAN KYC. Verify your identity immediately at https://sbi-kyc-portal.cc/login to prevent permanent blockage.'
              )}
              className="w-full text-left p-3 rounded-xl bg-slate-900/80 border border-red-500/30 hover:border-red-500 hover:bg-red-950/30 transition-all text-xs space-y-1 cursor-pointer group"
            >
              <div className="font-bold text-red-300 font-mono flex items-center justify-between">
                <span>🔴 2. Fake Bank KYC Phishing (Coercive Scam)</span>
                <span className="text-[10px] text-red-400 group-hover:translate-x-1 transition-transform">INJECT SMS →</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Impersonates SBI, panic suspension coercion, leads to fake .cc credential harvester → 96% Risk (BLOCKED)
              </div>
            </button>

            {/* Brand Typosquatting (youtubee / amazn) */}
            <button
              disabled={isSending}
              onClick={() => handleQuickInject(
                'VK-TASKPRO',
                'Congratulations! You have been selected for YouTube rating task. Claim ₹3,500 daily bonus by logging in at: http://youtubee.com/claim-task'
              )}
              className="w-full text-left p-3 rounded-xl bg-slate-900/80 border border-purple-500/30 hover:border-purple-400 hover:bg-purple-950/30 transition-all text-xs space-y-1 cursor-pointer group"
            >
              <div className="font-bold text-purple-300 font-mono flex items-center justify-between">
                <span>🟣 3. Brand Typosquatting (youtubee Lookalike)</span>
                <span className="text-[10px] text-purple-400 group-hover:translate-x-1 transition-transform">INJECT SMS →</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Deceptive lookalike URL (youtubee.com) impersonating official YouTube → 95% Risk (BLOCKED)
              </div>
            </button>

            {/* Digital Arrest */}
            <button
              disabled={isSending}
              onClick={() => handleQuickInject(
                'POLICE-CBI',
                'CRITICAL NOTICE: FIR #4928 lodged by Cyber Crime Cell Mumbai against your Aadhaar. Illegal parcel seized with narcotics. Contact Investigating Officer immediately at +919830192837 or face digital arrest.'
              )}
              className="w-full text-left p-3 rounded-xl bg-slate-900/80 border border-orange-500/30 hover:border-orange-500 hover:bg-orange-950/30 transition-all text-xs space-y-1 cursor-pointer group"
            >
              <div className="font-bold text-orange-300 font-mono flex items-center justify-between">
                <span>🟠 4. Digital Arrest / CBI Narcotics Fraud</span>
                <span className="text-[10px] text-orange-400 group-hover:translate-x-1 transition-transform">INJECT SMS →</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Coercive law enforcement extortion threatening fake Skype arrest
              </div>
            </button>

            {/* Electricity Cutoff */}
            <button
              disabled={isSending}
              onClick={() => handleQuickInject(
                'POWER-OFFICE',
                'Dear Consumer, your electricity power line will be disconnected tonight at 9:30 PM due to pending bill update. Immediately contact electricity officer at +919128392819 to avoid disconnection.'
              )}
              className="w-full text-left p-3 rounded-xl bg-slate-900/80 border border-amber-500/30 hover:border-amber-500 hover:bg-amber-950/30 transition-all text-xs space-y-1 cursor-pointer group"
            >
              <div className="font-bold text-amber-300 font-mono flex items-center justify-between">
                <span>🟡 5. Electricity Bill Cutoff at 9:30 PM</span>
                <span className="text-[10px] text-amber-400 group-hover:translate-x-1 transition-transform">INJECT SMS →</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Utility urgency lure tricking victims into remote APK installation
              </div>
            </button>

            {/* India Post Skimmer */}
            <button
              disabled={isSending}
              onClick={() => handleQuickInject(
                'IND-POST',
                'India Post: Your package #IN94829 is held at depot due to unpaid shipping fee of Rs 3.99. Pay here to release: http://track-parcel-indpost.top/pay-3.99'
              )}
              className="w-full text-left p-3 rounded-xl bg-slate-900/80 border border-yellow-500/30 hover:border-yellow-500 hover:bg-yellow-950/30 transition-all text-xs space-y-1 cursor-pointer group"
            >
              <div className="font-bold text-yellow-300 font-mono flex items-center justify-between">
                <span>🟡 6. India Post Delivery Fee Skimmer</span>
                <span className="text-[10px] text-yellow-400 group-hover:translate-x-1 transition-transform">INJECT SMS →</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Customs delivery hold demanding micro-payment to steal credit cards
              </div>
            </button>
          </div>

          {/* Custom SMS Injector Form */}
          <form onSubmit={handleCustomSubmit} className="pt-3 border-t border-slate-800 space-y-3">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Inject Custom SMS Payload:
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={customSender}
                onChange={(e) => setCustomSender(e.target.value)}
                placeholder="Sender ID (e.g. AD-HDFCBK)"
                className="col-span-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
              <input
                type="text"
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                placeholder="Message text with link..."
                className="col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'ANALYZING & INTERCEPTING...' : 'BROADCAST TO MOBILE PHONE'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
