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

export interface ScanRecord {
  id: string
  scan_type: ScanType
  raw_payload: string
  sender?: string
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
  source?: 'manual' | 'realtime_sms_receiver' | 'realtime_url_guard' | 'webhook'
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
