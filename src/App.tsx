import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { MobileDeviceSimulator } from './components/MobileDeviceSimulator';
import { ForensicCommandCenter } from './components/ForensicCommandCenter';
import { ThreatDashboard } from './components/ThreatDashboard';
import { AndroidCodeHub } from './components/AndroidCodeHub';
import { PhishingBlockModal } from './components/PhishingBlockModal';
import { GlobalToastContainer, ToastNotification } from './components/GlobalToastContainer';
import type { ScanRecord, IncomingSms, BlockedUrlRecord } from './types/threat';
import { playThreatAlarm, playCyberScan, playSafeShieldSound, playCyberClick } from './lib/audio';

export default function App() {
  const [activeTab, setActiveTab] = useState<'mobile' | 'forensics' | 'android_code' | 'temporal'>('mobile');
  const [shieldActive, setShieldActive] = useState(true);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [incomingSmsList, setIncomingSmsList] = useState<IncomingSms[]>([]);
  const [blockedUrls, setBlockedUrls] = useState<BlockedUrlRecord[]>([]);
  const [activeScan, setActiveScan] = useState<ScanRecord | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = useCallback((toast: Omit<ToastNotification, 'id'>) => {
    setToasts((prev) => {
      // Prevent duplicate toasts for the same message/event within 3 seconds
      const isDuplicate = prev.some(
        (t) => t.subtitle === toast.subtitle || (t.title === toast.title && t.category === toast.category)
      );
      if (isDuplicate) return prev;

      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      return [{ ...toast, id }, ...prev.slice(0, 2)];
    });
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Phishing Interstitial Modal State
  const [phishingModal, setPhishingModal] = useState<{
    isOpen: boolean;
    url: string;
    domain?: string;
    category?: string;
    riskScore?: number;
    reason?: string;
    threats?: string[];
  }>({
    isOpen: false,
    url: ''
  });

  // Load initial threat records from server
  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/threats/history');
      if (res.ok) {
        const data = await res.json();
        if (data.recentScans) setScans(data.recentScans);
        if (data.quarantinedSms) setIncomingSmsList(data.quarantinedSms);
        if (data.blockedUrls) setBlockedUrls(data.blockedUrls);
        if (data.recentScans && data.recentScans.length > 0) {
          setActiveScan(data.recentScans[0]);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch initial threat history:', err);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Connect to SSE stream for Real-Time Live Push Interception
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/stream/events');

      eventSource.addEventListener('SMS_INTERCEPTED', (e) => {
        try {
          const item: IncomingSms = JSON.parse(e.data);
          setIncomingSmsList((prev) => [item, ...prev.filter((x) => x.id !== item.id)]);
          if (item.scanRecord) {
            setScans((prev) => [item.scanRecord!, ...prev.filter((x) => x.id !== item.scanRecord!.id)]);
          }

          // Trigger Global Non-Intrusive Toast
          addToast({
            type: item.isAutoBlocked ? 'sms_blocked' : 'sms_received',
            title: item.isAutoBlocked ? '🛑 SMS Auto-Quarantined' : '💬 Incoming SMS Inspected',
            subtitle: `${item.sender}: ${item.body}`,
            riskScore: item.riskScore,
            category: item.category,
            timestamp: item.receivedAt,
            data: item.scanRecord
          });

          if (item.isAutoBlocked) {
            playThreatAlarm();
          } else {
            playCyberScan();
          }
        } catch {}
      });

      eventSource.addEventListener('URL_BLOCKED', (e) => {
        try {
          const record: BlockedUrlRecord = JSON.parse(e.data);
          setBlockedUrls((prev) => [record, ...prev.filter((x) => x.id !== record.id)]);

          // Trigger Global Non-Intrusive Toast
          addToast({
            type: 'url_blocked',
            title: '🌐 Phishing URL Blackholed',
            subtitle: `${record.domain} • ${record.url}`,
            riskScore: record.riskScore,
            category: record.threatCategory,
            timestamp: record.blockedAt,
            data: record
          });

          playThreatAlarm();
        } catch {}
      });

      eventSource.addEventListener('NEW_SCAN', (e) => {
        try {
          const record: ScanRecord = JSON.parse(e.data);
          setScans((prev) => [record, ...prev.filter((x) => x.id !== record.id)]);
          if (record.risk_score >= 70) {
            addToast({
              type: 'new_scan',
              title: '⚠️ Malicious Campaign Analyzed',
              subtitle: record.scam_category,
              riskScore: record.risk_score,
              category: record.scam_category,
              timestamp: record.created_at,
              data: record
            });
          }
        } catch {}
      });
    } catch (err) {
      console.warn('SSE stream error:', err);
    }

    return () => {
      eventSource?.close();
    };
  }, []);

  // Real-Time SMS Injection Trigger
  const handleInjectSms = async (sender: string, body: string) => {
    try {
      const res = await fetch('/api/sms/incoming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender, body, receivedAt: new Date().toISOString() })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.incomingSms) {
          const item = data.incomingSms;
          setIncomingSmsList((prev) => [item, ...prev.filter((x) => x.id !== item.id)]);
          if (item.scanRecord) {
            setScans((prev) => [item.scanRecord, ...prev.filter((x) => x.id !== item.scanRecord.id)]);
          }

          // Direct toast notification trigger (Guaranteed 100% immediate visual feedback)
          addToast({
            type: item.isAutoBlocked ? 'sms_blocked' : 'sms_received',
            title: item.isAutoBlocked ? '🛑 SMS Auto-Quarantined' : '💬 Incoming SMS Inspected',
            subtitle: `${item.sender}: ${item.body}`,
            riskScore: item.riskScore,
            category: item.category,
            timestamp: item.receivedAt,
            data: item.scanRecord
          });

          if (data.blocked) {
            playThreatAlarm();
          } else {
            playSafeShieldSound();
          }
          return data;
        }
      }
    } catch (err) {
      console.error('Failed to inject SMS:', err);
    }
    return null;
  };

  // Real-Time URL Intercept Gatekeeper
  const handleInterceptUrl = async (url: string, source: string) => {
    try {
      const res = await fetch('/api/url/intercept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, source })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.blocked) {
          playThreatAlarm();
          setPhishingModal({
            isOpen: true,
            url: data.url,
            domain: data.domain,
            category: data.threatCategory,
            riskScore: data.riskScore,
            reason: data.explanation || 'Domain identified as malicious credential harvesting vector.',
            threats: data.threats || []
          });

          // Direct toast notification trigger for blocked URL
          addToast({
            type: 'url_blocked',
            title: '🌐 Phishing URL Blackholed',
            subtitle: `${data.domain} • ${data.url}`,
            riskScore: data.riskScore,
            category: data.threatCategory,
            timestamp: new Date().toISOString(),
            data: data.blockedRecord
          });

          if (data.blockedRecord) {
            setBlockedUrls((prev) => [data.blockedRecord, ...prev.filter((x) => x.id !== data.blockedRecord.id)]);
          }
        } else {
          playSafeShieldSound();
          addToast({
            type: 'sms_received',
            title: '✅ Safe Destination Verified',
            subtitle: `${data.domain || url} is authentic and verified safe`,
            riskScore: data.riskScore || 0,
            category: 'Verified Safe Domain',
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.error('URL interception error:', err);
    }
  };

  // Manual forensic query
  const handleManualAnalyze = async (payload: string, type: 'message' | 'url') => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload, type, sender: 'MANUAL_QUERY' })
      });
      if (res.ok) {
        const data: ScanRecord = await res.json();
        setScans((prev) => [data, ...prev.filter((x) => x.id !== data.id)]);
        setActiveScan(data);
        if (data.risk_score >= 70) {
          playThreatAlarm();
        } else {
          playSafeShieldSound();
        }
      }
    } catch (err) {
      console.error('Manual analyze failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Inspect Scan from Mobile Simulator in Forensics
  const handleInspectScan = (scan: ScanRecord) => {
    setActiveScan(scan);
    setActiveTab('forensics');
  };

  return (
    <div className="min-h-screen bg-[#040711] text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={{
          totalScanned: scans.length,
          quarantinedCount: incomingSmsList.filter((s) => s.isAutoBlocked).length,
          blockedUrlCount: blockedUrls.length
        }}
        shieldActive={shieldActive}
        onToggleShield={() => {
          setShieldActive(!shieldActive);
          if (!shieldActive) playSafeShieldSound();
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'mobile' && (
          <MobileDeviceSimulator
            incomingSmsList={incomingSmsList}
            onInjectSms={handleInjectSms}
            onInspectScan={handleInspectScan}
            onInterceptUrl={handleInterceptUrl}
            shieldActive={shieldActive}
            onToggleShield={() => setShieldActive(!shieldActive)}
            blockedUrls={blockedUrls}
          />
        )}

        {activeTab === 'temporal' && (
          <ThreatDashboard
            realtimeBlockedCount={blockedUrls.length}
            realtimeSmsCount={incomingSmsList.length}
          />
        )}

        {activeTab === 'forensics' && (
          <ForensicCommandCenter
            scans={scans}
            activeScan={activeScan}
            onSelectScan={setActiveScan}
            onManualAnalyze={handleManualAnalyze}
            isAnalyzing={isAnalyzing}
          />
        )}

        {activeTab === 'android_code' && <AndroidCodeHub onInjectSms={handleInjectSms} />}
      </main>

      {/* Phishing URL Interstitial Warning Modal */}
      <PhishingBlockModal
        isOpen={phishingModal.isOpen}
        onClose={() => setPhishingModal((prev) => ({ ...prev, isOpen: false }))}
        url={phishingModal.url}
        domain={phishingModal.domain}
        category={phishingModal.category}
        riskScore={phishingModal.riskScore}
        reason={phishingModal.reason}
        threats={phishingModal.threats}
        onInspectInSandbox={() => {
          setPhishingModal((prev) => ({ ...prev, isOpen: false }));
          handleManualAnalyze(phishingModal.url, 'url');
          setActiveTab('forensics');
        }}
      />

      {/* Global Non-Intrusive Toast Alerts */}
      <GlobalToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
        onInspectToast={(toast) => {
          if (toast.data && 'risk_score' in (toast.data as object)) {
            setActiveScan(toast.data as ScanRecord);
            setActiveTab('forensics');
          } else if (toast.data && 'url' in (toast.data as object)) {
            const urlItem = toast.data as BlockedUrlRecord;
            handleManualAnalyze(urlItem.url, 'url');
            setActiveTab('forensics');
          } else {
            setActiveTab('forensics');
          }
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#03060f] py-4 text-center text-xs text-slate-500 font-mono">
        SafeCore AI • Real-Time Mobile Threat & Phishing Blocker Engine • Powered by Google Gemini 3.8 Flash
      </footer>
    </div>
  );
}
