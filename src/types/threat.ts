export type RiskLevel = 'LOW' | 'SUSPICIOUS' | 'HIGH' | 'CRITICAL'

export type ScanType = 'message' | 'url' | 'email' | 'qr' | 'realtime_sms' | 'realtime_url'

export interface NextMovePrediction {
  type: string
  confidence: number
  why: string[]
  action_label: string
}

export interface JourneyNode {
  id: string
  label: string
  type: 'phone' | 'sms' | 'url' | 'website' | 'payment' | 'otp' | 'apk' | 'bot'
  status: 'flagged' | 'warning' | 'pending' | 'neutral' | 'blocked'
  details?: string
  stage?: 'OBSERVED' | 'CURRENT' | 'PREDICTED'
  evidence?: string[]
}

export interface ThreatMemoryContext {
  entity: string
  entity_type: 'domain' | 'url' | 'phone' | 'email' | 'sender'
  first_seen: string
  last_seen: string
  observation_count: number
  previous_risk: string
  previous_category: string
  previous_scan_ids: string[]
  is_new: boolean
}

export type SenderClassificationType = 'SAVED_CONTACT' | 'UNKNOWN_NUMBER' | 'REGISTERED_BANK_DLT' | 'SPOOFED_ALPHANUMERIC' | 'UNKNOWN_USER'

export interface SenderClassification {
  type: SenderClassificationType
  label: string
  badge: string
  isHighRiskVector: boolean
  description: string
}

export interface QrCodeAnalysis {
  raw_payload: string
  qr_category: 'UPI_PAYMENT_TRAP' | 'PHISHING_URL' | 'APK_MALWARE_DROPPER' | 'WIFI_EXPLOIT' | 'SAFE_WEBSITE' | 'SAFE_PAYMENT' | 'UNKNOWN_FORMAT'
  title: string
  risk_score: number
  risk_level: RiskLevel
  fraud_mechanism: string
  warning_highlight: string
  countermeasures: string[]
  upi_data?: {
    payee_vpa?: string
    payee_name?: string
    amount?: string
    currency?: string
    transaction_note?: string
    is_reverse_debit_fraud: boolean
  }
  url_data?: {
    destination_url: string
    domain: string
    is_phishing: boolean
    typosquat_brand?: string
    tld?: string
  }
}

export interface ScanRecord {
  id: string
  scan_type: ScanType
  raw_payload: string
  sender?: string
  is_unknown_sender?: boolean
  sender_classification?: SenderClassification
  qr_analysis?: QrCodeAnalysis
  extracted_urls?: string[]
  risk_score: number // 0-100
  risk_level: RiskLevel
  scam_category: string
  indicators: string[]
  explanation: string
  predicted_next_step: string
  journey_nodes: JourneyNode[]
  actions: {
    verify?: string
    avoid?: string
    block?: string
    report?: string
  }
  created_at: string
  threat_memory?: ThreatMemoryContext[]
  next_moves?: NextMovePrediction[]
  was_auto_blocked?: boolean
  source?: 'manual' | 'realtime_sms_receiver' | 'realtime_url_guard' | 'webhook' | 'live_notification_listener'
  deep_analysis?: {
    social_engineering_tactics?: string[]
    technical_indicators?: string[]
    targeted_demographic?: string
    countermeasures?: string[]
  }
}

export interface IncomingSms {
  id: string
  sender: string
  body: string
  receivedAt: string
  riskScore: number
  riskLevel: RiskLevel
  category: string
  isAutoBlocked: boolean
  isQuarantined: boolean
  urls: string[]
  isUnknownSender?: boolean
  senderClassification?: SenderClassification
  scanRecord?: ScanRecord
}

export interface BlockedUrlRecord {
  id: string
  url: string
  domain: string
  blockedAt: string
  threatCategory: string
  reason: string
  riskScore: number
  interceptedFrom?: string
}

export interface ProtectionSettings {
  realTimeShieldActive: boolean
  autoBlockSmsThreshold: number // e.g. 70
  autoBlockPhishingUrls: boolean
  soundAlertsEnabled: boolean
  interceptShortLinks: boolean
  blockApkDownloads: boolean
  telecomStreamSimulation: boolean
}
