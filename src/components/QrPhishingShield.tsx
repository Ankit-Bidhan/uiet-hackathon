import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import {
  QrCode,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Camera,
  Upload,
  Copy,
  Check,
  ExternalLink,
  FileWarning,
  Zap,
  RefreshCw,
  Eye,
  ArrowRight,
  Lock,
  AlertCircle,
  FileText,
  CameraOff
} from 'lucide-react';
import type { ScanRecord, QrCodeAnalysis } from '../types/threat';
import { analyzeQrCode } from '../lib/heuristics';
import { playThreatAlarm, playSafeShieldSound, playCyberClick } from '../lib/audio';

interface QrPhishingShieldProps {
  onInspectInForensics?: (scan: ScanRecord) => void;
  onSendToMobile?: (payload: string, sender: string) => void;
}

interface QrPreset {
  id: string;
  title: string;
  badge: string;
  badgeColor: string;
  description: string;
  payload: string;
  dangerLevel: 'CRITICAL' | 'HIGH' | 'LOW';
  explanation: string;
}

const DEMO_PRESETS: QrPreset[] = [
  {
    id: 'upi-reverse-debit',
    title: '"Scan to Receive ₹500" UPI Scam',
    badge: 'Reverse UPI Debit Trap',
    badgeColor: 'bg-rose-950/80 text-rose-300 border-rose-500/40',
    description: 'Fraudster sends QR claiming victim will "RECEIVE" ₹500 cashback or OLX payment.',
    payload: 'upi://pay?pa=cashback_agent99@okaxis&pn=Cashback%20Verification&am=500&cu=INR&tn=Scan%20to%20Receive%20500%20Refund',
    dangerLevel: 'CRITICAL',
    explanation: 'QR codes CANNOT receive money! Scanning this will DEBIT ₹500 from your bank account.'
  },
  {
    id: 'sbi-kyc-quishing',
    title: 'Fake SBI KYC Quishing Portal',
    badge: 'Phishing URL Quishing',
    badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
    description: 'Deceptive letter/email containing QR code directing to fake SBI login page.',
    payload: 'https://sbi-kyc-update.cc/netbanking/login.php',
    dangerLevel: 'CRITICAL',
    explanation: 'Spoofed domain (.cc) masquerading as State Bank of India to harvest netbanking credentials.'
  },
  {
    id: 'malware-apk-dropper',
    title: 'Remote Support Trojan APK QR',
    badge: 'Malware Dropper QR',
    badgeColor: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
    description: 'Customer care fraud directing victim to install fake "Security Fix" APK.',
    payload: 'http://quicksupport-remote.top/SupportSecurity.apk',
    dangerLevel: 'CRITICAL',
    explanation: 'Directly downloads an unverified Android APK capable of reading SMS OTPs and hijacking device.'
  },
  {
    id: 'legit-merchant-qr',
    title: 'Authentic Official Merchant QR',
    badge: 'Legitimate Destination',
    badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
    description: 'Safe official web portal with authentic SSL certificate and zero blacklists.',
    payload: 'https://www.google.com',
    dangerLevel: 'LOW',
    explanation: 'Verified legitimate URL destination posing zero security risks.'
  }
];

export const QrPhishingShield: React.FC<QrPhishingShieldProps> = ({
  onInspectInForensics,
  onSendToMobile
}) => {
  const [activeMode, setActiveMode] = useState<'presets' | 'camera' | 'upload' | 'manual'>('presets');
  const [rawPayload, setRawPayload] = useState(DEMO_PRESETS[0].payload);
  const [activeAnalysis, setActiveAnalysis] = useState<QrCodeAnalysis | null>(() => analyzeQrCode(DEMO_PRESETS[0].payload));
  const [isScanning, setIsScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [presetQrUrls, setPresetQrUrls] = useState<Record<string, string>>({});
  const [activeQrImage, setActiveQrImage] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Generate QR images for all demo presets on mount
  useEffect(() => {
    DEMO_PRESETS.forEach(async (preset) => {
      try {
        const url = await QRCode.toDataURL(preset.payload, {
          width: 250,
          margin: 1.5,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        });
        setPresetQrUrls((prev) => ({ ...prev, [preset.id]: url }));
      } catch (err) {
        console.error('Error generating preset QR:', err);
      }
    });
  }, []);

  // Generate QR code data URL whenever rawPayload changes
  useEffect(() => {
    if (!rawPayload) {
      setActiveQrImage('');
      return;
    }
    QRCode.toDataURL(rawPayload, {
      width: 280,
      margin: 1.5,
      color: {
        dark: '#030712',
        light: '#ffffff'
      }
    })
      .then((url) => setActiveQrImage(url))
      .catch(() => setActiveQrImage(''));
  }, [rawPayload]);

  // Analyze payload function
  const handleAnalyzePayload = useCallback((payload: string) => {
    const analysis = analyzeQrCode(payload);
    setActiveAnalysis(analysis);
    setRawPayload(payload);

    if (analysis.risk_score >= 70) {
      playThreatAlarm();
    } else {
      playSafeShieldSound();
    }
  }, []);

  // Stop camera stream safely
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Camera scan loop
  const scanCameraFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code && code.data) {
        playCyberClick();
        handleAnalyzePayload(code.data);
        stopCamera();
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanCameraFrame);
  }, [cameraActive, handleAnalyzePayload, stopCamera]);

  // Start camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        animationFrameRef.current = requestAnimationFrame(scanCameraFrame);
      }
    } catch (err: unknown) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access denied or unavailable. Please use file upload or select presets.');
      setCameraActive(false);
    }
  };

  useEffect(() => {
    if (activeMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeMode]);

  // Decode uploaded image file
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WebP)');
      return;
    }
    setIsScanning(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsScanning(false);
          return;
        }
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        setIsScanning(false);
        if (code && code.data) {
          handleAnalyzePayload(code.data);
        } else {
          alert('No valid QR code could be detected in this image. Try zooming in or pasting payload directly.');
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Paste image or text from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (activeMode !== 'upload') return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            handleFileUpload(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activeMode]);

  const handleCopyPayload = () => {
    if (!rawPayload) return;
    navigator.clipboard.writeText(rawPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateScanRecord = (): ScanRecord => {
    return {
      id: `scan-qr-${Date.now()}`,
      scan_type: 'qr',
      raw_payload: rawPayload,
      sender: 'QR_SCANNER',
      is_unknown_sender: true,
      qr_analysis: activeAnalysis || undefined,
      risk_score: activeAnalysis?.risk_score ?? 50,
      risk_level: activeAnalysis?.risk_level ?? 'SUSPICIOUS',
      scam_category: activeAnalysis?.title ?? 'QR Phishing Inspection',
      indicators: [
        activeAnalysis?.fraud_mechanism || 'QR Code decoded',
        activeAnalysis?.warning_highlight || 'Suspicious payload'
      ],
      explanation: `${activeAnalysis?.title}: ${activeAnalysis?.fraud_mechanism}`,
      predicted_next_step: activeAnalysis?.countermeasures[0] || 'Verify before scanning.',
      journey_nodes: [
        {
          id: 'qr-node-1',
          label: activeAnalysis?.title || 'QR Code Payload',
          type: activeAnalysis?.qr_category === 'UPI_PAYMENT_TRAP' ? 'payment' : 'url',
          status: (activeAnalysis?.risk_score ?? 0) >= 80 ? 'flagged' : 'neutral',
          stage: 'CURRENT',
          details: activeAnalysis?.fraud_mechanism
        }
      ],
      next_moves: [
        {
          type: 'QR Code Attack Vector',
          confidence: 96,
          why: [activeAnalysis?.fraud_mechanism || 'Direct execution trap'],
          action_label: activeAnalysis?.countermeasures[0] || 'DO NOT SCAN'
        }
      ],
      actions: {
        block: 'Delete and report QR image.',
        avoid: 'Never scan QR codes sent via WhatsApp/SMS to receive money.',
        report: 'Report fraudulent UPI VPA to cybercrime.gov.in (1930).'
      },
      created_at: new Date().toISOString()
    };
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-400">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white font-mono tracking-tight">
                    Quishing & Reverse-Debit QR Shield
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono font-bold uppercase">
                    UPI Anti-Fraud Active
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Decodes fraudulent UPI "Scan to Receive" payment requests, credential-harvesting phishing links, and malware dropper QRs.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Counter */}
          <div className="flex items-center gap-2 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">Heuristics Engine:</span>
            <span className="text-cyan-400 font-bold">UPI Deep-Link & Quishing Shield V2</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left is Scanner/Input, Right is Decoded Threat Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Modes & Previews (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Input Mode Selector */}
          <div className="bg-slate-900/90 rounded-xl p-1 border border-slate-800 flex gap-1 text-xs font-mono">
            <button
              onClick={() => {
                playCyberClick();
                setActiveMode('presets');
              }}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeMode === 'presets'
                  ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>1-Click Scenarios</span>
            </button>

            <button
              onClick={() => {
                playCyberClick();
                setActiveMode('camera');
              }}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeMode === 'camera'
                  ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera Scan</span>
            </button>

            <button
              onClick={() => {
                playCyberClick();
                setActiveMode('upload');
              }}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeMode === 'upload'
                  ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload / Paste</span>
            </button>

            <button
              onClick={() => {
                playCyberClick();
                setActiveMode('manual');
              }}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeMode === 'manual'
                  ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Raw Text</span>
            </button>
          </div>

          {/* Mode 1: 1-Click Demo Scenarios */}
          {activeMode === 'presets' && (
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Test Scam Vectors (Includes Live QR)
                </span>
                <span className="text-[11px] text-indigo-400 font-mono">Click any to test</span>
              </div>

              <div className="space-y-2.5">
                {DEMO_PRESETS.map((preset) => {
                  const isSelected = rawPayload === preset.payload;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        playCyberClick();
                        handleAnalyzePayload(preset.payload);
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/10'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      {/* Thumbnail QR image */}
                      <div className="w-14 h-14 bg-white rounded-lg p-1 shrink-0 flex items-center justify-center border border-slate-700">
                        {presetQrUrls[preset.id] ? (
                          <img
                            src={presetQrUrls[preset.id]}
                            alt={preset.title}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <QrCode className="w-8 h-8 text-slate-900" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="text-xs font-semibold text-white truncate font-mono">
                            {preset.title}
                          </h4>
                          <span
                            className={`text-[9px] uppercase px-1.5 py-0.5 rounded border font-mono font-bold shrink-0 ${preset.badgeColor}`}
                          >
                            {preset.dangerLevel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mb-1.5">
                          {preset.description}
                        </p>
                        <span className="text-[10px] text-amber-300 font-mono block truncate bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-500/20">
                          {preset.explanation}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mode 2: Live Camera View */}
          {activeMode === 'camera' && (
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 space-y-3">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Reticle Viewfinder with Scanning Line */}
                {cameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-indigo-400/80 rounded-2xl relative shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                      {/* Laser scanning line */}
                      <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse shadow-[0_0_15px_#22d3ee]" />
                      <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-cyan-400" />
                      <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-cyan-400" />
                      <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-cyan-400" />
                      <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-cyan-400" />
                    </div>
                  </div>
                )}

                {cameraError && (
                  <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center">
                    <CameraOff className="w-10 h-10 text-rose-400 mb-2" />
                    <p className="text-xs text-rose-300 font-mono mb-3">{cameraError}</p>
                    <button
                      onClick={startCamera}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-mono text-white transition-colors"
                    >
                      Retry Camera
                    </button>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-400 text-center font-mono">
                Point your camera at any printed QR code, phone screen, or packaging. Interception triggers automatically upon frame detection.
              </p>
            </div>
          )}

          {/* Mode 3: Upload / Paste */}
          {activeMode === 'upload' && (
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className="border-2 border-dashed border-indigo-500/40 hover:border-indigo-400 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-indigo-950/10 hover:bg-indigo-950/20"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">
                  Click to Upload or Drag & Drop QR Image
                </h4>
                <p className="text-xs text-slate-400 mb-3">
                  Supports screenshots from WhatsApp, SMS, payment bills, and flyers (PNG, JPG, WebP)
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-full text-[11px] font-mono text-cyan-300">
                  <Copy className="w-3 h-3" />
                  <span>Or simply press Ctrl + V anywhere to paste screenshot</span>
                </div>
              </div>

              {isScanning && (
                <div className="flex items-center justify-center gap-2 py-3 text-xs text-cyan-400 font-mono">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Decoding matrix bytes with jsQR...</span>
                </div>
              )}
            </div>
          )}

          {/* Mode 4: Manual String Input */}
          {activeMode === 'manual' && (
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 space-y-3">
              <label className="text-xs font-mono text-slate-300 block">
                Paste Decoded QR String or UPI Deep Link:
              </label>
              <textarea
                value={rawPayload}
                onChange={(e) => setRawPayload(e.target.value)}
                rows={4}
                placeholder="e.g. upi://pay?pa=scammer@ybl&am=500 or https://sbi-kyc.cc/login"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
              />
              <button
                onClick={() => {
                  playCyberClick();
                  handleAnalyzePayload(rawPayload);
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                Inspect QR Payload Now
              </button>
            </div>
          )}

          {/* Active QR Code Display Card (Rendered on-the-fly) */}
          {activeQrImage && (
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 flex items-center gap-4">
              <div className="w-24 h-24 bg-white rounded-xl p-1.5 shrink-0 flex items-center justify-center shadow-lg border border-slate-700">
                <img src={activeQrImage} alt="Rendered QR" className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0 text-xs font-mono">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400 text-[10px] uppercase">Active Test Matrix</span>
                  <button
                    onClick={handleCopyPayload}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy URI'}</span>
                  </button>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[10px] text-slate-300 break-all line-clamp-3">
                  {rawPayload}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  📱 Point your real phone camera at this box to test real-world camera detection.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Deep Decoded Forensic Inspection (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {activeAnalysis ? (
            <div
              className={`rounded-2xl border p-6 space-y-6 transition-all ${
                activeAnalysis.risk_score >= 80
                  ? 'bg-gradient-to-b from-rose-950/40 via-slate-900/90 to-slate-950 border-rose-500/50 shadow-2xl shadow-rose-950/30'
                  : activeAnalysis.risk_score >= 40
                  ? 'bg-gradient-to-b from-amber-950/30 via-slate-900/90 to-slate-950 border-amber-500/50 shadow-2xl shadow-amber-950/30'
                  : 'bg-gradient-to-b from-emerald-950/30 via-slate-900/90 to-slate-950 border-emerald-500/50 shadow-2xl shadow-emerald-950/30'
              }`}
            >
              {/* Header Badge & Score */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs uppercase font-mono px-2.5 py-1 rounded-md font-bold border ${
                        activeAnalysis.risk_score >= 80
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : activeAnalysis.risk_score >= 40
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {activeAnalysis.risk_level} THREAT PROFILE
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Category: {activeAnalysis.qr_category}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white font-mono tracking-tight">
                    {activeAnalysis.title}
                  </h3>
                </div>

                {/* Big Score Gauge */}
                <div className="text-right shrink-0">
                  <div
                    className={`text-3xl font-extrabold font-mono ${
                      activeAnalysis.risk_score >= 80
                        ? 'text-rose-400'
                        : activeAnalysis.risk_score >= 40
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {activeAnalysis.risk_score}%
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase">
                    Risk Assessment
                  </span>
                </div>
              </div>

              {/* CRITICAL WARNING BANNER (Crucial Golden Rule) */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                  activeAnalysis.risk_score >= 80
                    ? 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300'
                }`}
              >
                <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-rose-300">
                    Security Vulnerability Analysis
                  </h4>
                  <p className="text-xs font-medium leading-relaxed">
                    {activeAnalysis.warning_highlight}
                  </p>
                </div>
              </div>

              {/* If UPI Code: Visual Breakdown of Fraud Parameters */}
              {activeAnalysis.upi_data && (
                <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-xs font-mono text-slate-300 font-semibold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Decoded UPI Deep-Link Parameters</span>
                    </span>
                    <span className="text-[10px] text-amber-400 font-mono">
                      {activeAnalysis.upi_data.is_reverse_debit_fraud ? '🚨 FRAUD TRAP ARTIFACT' : 'STANDARD UPI'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block mb-0.5">Payee VPA (Destination Account)</span>
                      <span className="text-rose-400 font-bold break-all">{activeAnalysis.upi_data.payee_vpa || 'None'}</span>
                    </div>

                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block mb-0.5">Payee Registered Name</span>
                      <span className="text-white font-semibold">{activeAnalysis.upi_data.payee_name || 'None'}</span>
                    </div>

                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block mb-0.5">Configured Debit Amount</span>
                      <span className="text-rose-300 font-bold text-sm">
                        {activeAnalysis.upi_data.amount ? `₹${parseFloat(activeAnalysis.upi_data.amount).toFixed(2)}` : 'Open Amount'}
                      </span>
                    </div>

                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block mb-0.5">Transaction Note (Deceptive Lure)</span>
                      <span className="text-amber-300 font-medium">
                        "{activeAnalysis.upi_data.transaction_note || 'None'}"
                      </span>
                    </div>
                  </div>

                  {/* Hindi & English Guidance Box */}
                  <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-lg p-3 text-xs space-y-1">
                    <div className="text-cyan-300 font-bold font-mono">
                      💡 क्या आप जानते हैं? (Golden Rule of UPI)
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      पैसे <strong>प्राप्त करने (Receive करने)</strong> के लिए कभी भी QR कोड स्कैन करने या UPI PIN डालने की जरूरत नहीं होती! QR कोड स्कैन करने का मतलब हमेशा <strong>अपने बैंक खाते से पैसे कटवाना (Send करना)</strong> होता है।
                    </p>
                  </div>
                </div>
              )}

              {/* If URL Quishing: Target Domain Breakdown */}
              {activeAnalysis.url_data && (
                <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-xs font-mono text-slate-300 font-semibold flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Decoded Target Web Destination</span>
                    </span>
                    <span className="text-[10px] font-mono text-rose-400">
                      {activeAnalysis.url_data.is_phishing ? 'PHISHING HOST' : 'CLEAN HOST'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block mb-0.5">Target Destination URL</span>
                      <span className="text-rose-400 font-bold break-all">{activeAnalysis.url_data.destination_url}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Identified Host Domain</span>
                        <span className="text-white font-semibold">{activeAnalysis.url_data.domain}</span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Spoofed Brand Target</span>
                        <span className="text-amber-400 font-semibold">
                          {activeAnalysis.url_data.typosquat_brand ? activeAnalysis.url_data.typosquat_brand.toUpperCase() : 'None detected'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Fraud Mechanism Explanation */}
              <div className="space-y-1.5">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                  Scam Mechanism Description:
                </span>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                  {activeAnalysis.fraud_mechanism}
                </p>
              </div>

              {/* Mandatory Countermeasures List */}
              <div className="space-y-2">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Recommended Incident Countermeasures:</span>
                </span>
                <div className="space-y-1.5">
                  {activeAnalysis.countermeasures.map((cm, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800 text-xs text-slate-300 font-mono"
                    >
                      <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 shrink-0 flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <span>{cm}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                {onInspectInForensics && (
                  <button
                    onClick={() => {
                      playCyberClick();
                      onInspectInForensics(handleCreateScanRecord());
                    }}
                    className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-semibold text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-600/20"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Send to Forensic Sandbox</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {onSendToMobile && (
                  <button
                    onClick={() => {
                      playCyberClick();
                      onSendToMobile(
                        `URGENT: Scan this QR code to claim your reward: ${rawPayload}`,
                        '+91 98765 43210'
                      );
                    }}
                    className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-700"
                  >
                    <span>Simulate as Unknown SMS</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[350px] bg-slate-900/40 rounded-2xl border border-slate-800 flex flex-col items-center justify-center p-6 text-center">
              <QrCode className="w-12 h-12 text-slate-700 mb-3" />
              <p className="text-xs text-slate-400 font-mono">
                Select a preset scenario, scan with camera, or upload an image to begin real-time QR forensic analysis.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
