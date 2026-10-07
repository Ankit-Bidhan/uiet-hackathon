import { RiskLevel, ScanRecord, JourneyNode, NextMovePrediction } from '../types/threat';

export const THREAT_PATTERNS = {
  BANK_KYC: /(kyc|sbi|hdfc|icici|axis|pnb|pan\s*card|netbanking|bank\s*account|account\s*suspended|account\s*blocked|yono|debit\s*card|credit\s*card|cvv|expiry)/i,
  ELECTRICITY_DISCONNECT: /(electricity|power\s*cut|bijli|disconnected\s*tonight|bill\s*unpaid|officer\s*number|line\s*disconnected)/i,
  DELIVERY_PARCEL: /(india\s*post|ups|fedex|dhl|bluedart|package|parcel|depot|held\s*at\s*customs|shipping\s*fee|delivery\s*address|unpaid\s*duty)/i,
  JOB_TASK: /(part[\s-]?time|work\s*from\s*home|youtube\s*like|subscribe|daily\s*income|rs\.?\s*\d{3,5}|hr\s*manager|telegram|salary|prepaid\s*task)/i,
  DIGITAL_ARREST: /(cbi|trai|police|arrest|warrant|narcotics|customs\s*officer|court\s*summons|fir\s*lodged|cyber\s*crime|illegal\s*parcel|sim\s*block)/i,
  UPI_LOTTERY: /(cashback|lottery|kbc|congratulations|won\s*rs|claim\s*reward|pm\s*yojana|free\s*recharge|5g\s*free|scratch\s*card|upi\s*pin)/i,
  APK_DROPPER: /(\.apk|download\s*app|install\s*support|anydesk|teamviewer|quicksupport|rustdesk|sbi_rewards|banking_update)/i,
  URGENCY: /(urgent|immediately|within\s*24\s*hours|within\s*1\s*hour|tonight\s*9:30|final\s*notice|last\s*chance|action\s*required|prevent\s*block)/i,
  SHORTENERS: /(bit\.ly|tinyurl\.com|is\.gd|cutt\.ly|rb\.gy|t\.co|goo\.gl|ow\.ly|qrco\.de)/i,
  SUSPICIOUS_TLD: /\.([a-z0-9\-]+\.)*(cc|top|xyz|vip|club|tk|ml|ga|cf|gq|click|link|ws|ru|work|site|bid)(\/|$|\?|#|\s)/i,
};

export interface ExtractedUrlInfo {
  original: string;
  domain: string;
  isHttps: boolean;
  hasSuspiciousTld: boolean;
  isShortener: boolean;
  isIpAddress: boolean;
  isTyposquat: boolean;
  spoofedBrand?: string;
  riskScore: number;
  threats: string[];
}

// Known target brands and their official legitimate hostnames
const MONITORED_BRANDS: Record<string, string[]> = {
  youtube: ['youtube.com', 'youtu.be', 'm.youtube.com'],
  amazon: ['amazon.com', 'amazon.in', 'amzn.to', 'amazon.co.uk', 'amazon.de', 'amazon.es', 'amazon.fr'],
  flipkart: ['flipkart.com', 'flipkart.net'],
  sbi: ['sbi.co.in', 'onlinesbi.sbi', 'onlinesbi.com', 'sbi.in'],
  hdfc: ['hdfcbank.com', 'hdfc.com'],
  icici: ['icicibank.com'],
  axis: ['axisbank.com'],
  kotak: ['kotak.com', 'kotakbank.com'],
  pnb: ['pnbindia.in', 'netpnb.com'],
  paytm: ['paytm.com'],
  phonepe: ['phonepe.com'],
  google: ['google.com', 'google.co.in', 'goo.gl', 'google.com.au'],
  netflix: ['netflix.com'],
  paypal: ['paypal.com'],
  apple: ['apple.com', 'icloud.com'],
  microsoft: ['microsoft.com', 'live.com', 'office.com'],
  indiapost: ['indiapost.gov.in'],
  jio: ['jio.com'],
  airtel: ['airtel.in'],
  instagram: ['instagram.com'],
  facebook: ['facebook.com', 'fb.com'],
  whatsapp: ['whatsapp.com', 'wa.me'],
  telegram: ['telegram.org', 't.me'],
  twitter: ['twitter.com', 'x.com'],
  zomato: ['zomato.com'],
  swiggy: ['swiggy.com'],
  irctc: ['irctc.co.in']
};

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

// Common conversational words that should NEVER be treated as brand lookalikes or URLs
const COMMON_BENIGN_WORDS = new Set([
  'hi', 'hii', 'hiii', 'hello', 'helloo', 'hey', 'heyy', 'hola', 'namaste',
  'ok', 'okay', 'k', 'yes', 'no', 'haan', 'nahi', 'bye', 'good', 'morning',
  'night', 'thanks', 'thank', 'thx', 'bhai', 'bro', 'sir', 'dear', 'call',
  'kya', 'kaise', 'where', 'what', 'why', 'who', 'how', 'are', 'you', 'love',
  'miss', 'test', 'wait', 'coming', 'home', 'done', 'welcome', 'please'
]);

function checkBrandTyposquat(domain: string): { isTyposquat: boolean; brand?: string; reason?: string } {
  const cleanDomain = domain.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/[\/?#].*$/, '').toLowerCase();
  const domainParts = cleanDomain.split('.');
  const baseName = domainParts[0] || cleanDomain;

  // Benign word guard
  if (COMMON_BENIGN_WORDS.has(cleanDomain) || COMMON_BENIGN_WORDS.has(baseName)) {
    return { isTyposquat: false };
  }

  for (const [brand, verifiedHosts] of Object.entries(MONITORED_BRANDS)) {
    // 1. Check if it's already an official verified domain
    const isVerified = verifiedHosts.some(vh => cleanDomain === vh || cleanDomain.endsWith('.' + vh));
    if (isVerified) continue;

    // 2. Exact match of baseName with brand on unverified domain/TLD (e.g. youtube.cc, amazon.top, sbi.online)
    if (baseName === brand && !isVerified) {
      return {
        isTyposquat: true,
        brand,
        reason: `Unverified domain posing as official '${brand}' portal`
      };
    }

    // 3. Exact substring match with lookalike additions (e.g. 'youtubee', 'youtube-reward', 'amazn-pay', 'sbi-kyc')
    if (cleanDomain.includes(brand)) {
      return {
        isTyposquat: true,
        brand,
        reason: `Impersonates '${brand}' with unverified domain name: '${cleanDomain}'`
      };
    }

    // 4. Lookalike check: For short 3-letter brands like 'sbi', do NOT use Levenshtein distance
    // (Levenshtein dist 2 on a 3-letter word like 'sbi' causes unrelated words like 'hii' or 'ski' to false-match!)
    if (brand.length <= 3) {
      if (baseName.startsWith(brand) || baseName.endsWith(brand) || baseName.includes(brand)) {
        return {
          isTyposquat: true,
          brand,
          reason: `Unverified domain targeting '${brand}' keyword: '${baseName}'`
        };
      }
    } else if (baseName.length >= 4 && brand.length >= 4) {
      // For longer brands (e.g. 'youtube', 'amazon', 'flipkart'), allow tight Levenshtein distance
      const dist = levenshteinDistance(baseName, brand);
      const maxAllowedDist = brand.length >= 7 ? 2 : 1;
      if (dist > 0 && dist <= maxAllowedDist && Math.abs(baseName.length - brand.length) <= 2) {
        return {
          isTyposquat: true,
          brand,
          reason: `High-confidence typosquatting of '${brand}' (lookalike variation: '${baseName}')`
        };
      }
    }
  }

  return { isTyposquat: false };
}

export function extractUrlsAndAnalyze(text: string): ExtractedUrlInfo[] {
  // Comprehensive regex matching genuine URLs:
  // Must either start with http://, https://, www., OR contain a domain with dot and valid recognized TLD.
  // Regular text words (like "Hii", "Hello", "WhatsApp message", "bhai kaise ho") MUST NEVER be matched as URLs!
  const urlRegex = /(?:https?:\/\/[^\s]+|www\.[^\s]+|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+(?:online|racing|neett|store|space|click|party|comm|coom|orgg|tech|live|club|shop|link|buzz|loan|site|info|c0m|con|app|dev|biz|top|xyz|icu|vip|fit|win|com|org|net|edu|gov|mil|gq|ml|cf|ga|tk|in|co|io|ai|me|cc|ru|cn|uk|de|jp|us|ca|au|fr|it|nl|es|ch|at|be|pl|br|kr|mx|za|sg|hk|nz|tw|tr|id|ph|my|vn|th)(?:\/[^\s]*)?(?=[\s.,!?;:]|$))/gi;
  const matches = text.match(urlRegex) || [];
  
  return matches.map((raw) => {
    let clean = raw.trim().replace(/[.,!?;:]$/, '');
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'http://' + clean;
    }
    
    let domain = '';
    let isHttps = clean.startsWith('https://');
    let hasSuspiciousTld = false;
    let isShortener = false;
    let isIpAddress = false;
    let riskScore = 15;
    const threats: string[] = [];

    try {
      const parsed = new URL(clean);
      domain = parsed.hostname.toLowerCase();
    } catch {
      domain = clean.replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
    }

    // 1. Check Deceptive / Invalid TLD Typos (e.g. .comm, .coom, .c0m, .cm, .con)
    if (/\.(comm|coom|c0m|con|neett|orgg)(\/|$|\?|#|\s)/i.test(clean) || domain.endsWith('.comm') || domain.endsWith('.coom') || domain.endsWith('.c0m')) {
      riskScore += 65;
      hasSuspiciousTld = true;
      threats.push('Deceptive spoofed top-level domain (.comm / .coom) mimicking legitimate .com');
    }

    // 2. High-Abuse TLDs
    if (THREAT_PATTERNS.SUSPICIOUS_TLD.test(domain)) {
      hasSuspiciousTld = true;
      riskScore += 45;
      threats.push('High-abuse Top-Level Domain (TLD) pattern (.cc, .top, .xyz, .click)');
    }

    // 3. Shorteners
    if (THREAT_PATTERNS.SHORTENERS.test(clean)) {
      isShortener = true;
      riskScore += 35;
      threats.push('Obfuscated URL shortener disguising final target');
    }

    // 4. Raw IP
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
      isIpAddress = true;
      riskScore += 50;
      threats.push('Raw numeric IP address hosting rather than verified domain');
    }

    // 5. Unencrypted HTTP
    if (!isHttps) {
      riskScore += 15;
      threats.push('Unencrypted HTTP protocol vulnerable to tampering');
    }

    // 6. Brand Typosquatting / Impersonation Check (e.g. youtubee, amazn, amazone, sbi-kyc)
    const typoCheck = checkBrandTyposquat(domain);
    let isTyposquat = false;
    let spoofedBrand: string | undefined;

    if (typoCheck.isTyposquat) {
      isTyposquat = true;
      spoofedBrand = typoCheck.brand;
      riskScore = Math.max(riskScore, 95);
      threats.push(typoCheck.reason || 'Brand typosquatting / impersonation in domain name');
    }

    // Check if domain is an officially verified brand hostname
    const isOfficiallyVerified = Object.values(MONITORED_BRANDS).some(hosts => 
      hosts.some(h => domain === h || domain.endsWith('.' + h))
    );

    // Sensitive keyword targeting in unverified domains (only if NOT an official verified domain!)
    if (!isOfficiallyVerified && /(kyc|sbi|hdfc|icici|axis|bank|paytm|login|secure|verify|update|account|auth)/i.test(domain) && !isTyposquat) {
      riskScore += 50;
      threats.push('Sensitive banking/authentication keywords in unverified domain');
    }

    // Official verified domain override
    if (isOfficiallyVerified && !isTyposquat && !hasSuspiciousTld) {
      riskScore = 0;
    }

    return {
      original: clean,
      domain,
      isHttps,
      hasSuspiciousTld,
      isShortener,
      isIpAddress,
      isTyposquat,
      spoofedBrand,
      riskScore: Math.min(100, riskScore),
      threats
    };
  });
}

export function evaluateThreatLocally(payload: string, sender = 'UNKNOWN'): Partial<ScanRecord> {
  const text = payload.toLowerCase();
  const trimmed = payload.trim();
  const urlInfos = extractUrlsAndAnalyze(payload);

  // 0. Instant detection of Casual Greetings & Everyday Personal Chat (e.g. "Hii", "Hello", "Hey", "Good morning", "Kaise ho", "bhai", "kaha ho")
  const CASUAL_GREETINGS = /^(hi+|hello+|hey+|hola|namaste|good\s*(morning|afternoon|evening|night)|how\s*are\s*you|kaise\s*ho|kya\s*haal|wassup|what'?s\s*up|ok+|okay|k|thanks|thank\s*you|thx|bye|tc|take\s*care|haan|ha|nahi|yes|no|call\s*me|where\s*are\s*you|love\s*you|miss\s*you|bhai|bro|sun|suno|kaha\s*ho|kidhar\s*ho|kya\s*kar\s*(rhe|rahe)\s*ho|kal\s*milte\s*hai|theek\s*(hai|ho)|bolo|shukriya)[\s.!,?~:)]*$/i;

  const hasUrgencyCoercion = THREAT_PATTERNS.URGENCY.test(text) || 
                             /(suspended|blocked|deactivated|expire|freeze|action required|within 24|penalty|discontinue|block your)/i.test(text);

  const hasAnyScamPattern = hasUrgencyCoercion ||
    THREAT_PATTERNS.BANK_KYC.test(text) ||
    THREAT_PATTERNS.DIGITAL_ARREST.test(text) ||
    THREAT_PATTERNS.ELECTRICITY_DISCONNECT.test(text) ||
    THREAT_PATTERNS.JOB_TASK.test(text) ||
    THREAT_PATTERNS.DELIVERY_PARCEL.test(text) ||
    THREAT_PATTERNS.UPI_LOTTERY.test(text) ||
    THREAT_PATTERNS.APK_DROPPER.test(text);

  const isCasualGreeting = urlInfos.length === 0 && !hasAnyScamPattern && (
    CASUAL_GREETINGS.test(trimmed) ||
    (trimmed.length <= 80 && /^(hi|hello|hey|ok|okay|haan|ha|kaise|kya|call|thanks|yes|no|good|done|wait|where|why|bhai|bro|sun|suno|kaha|kidhar|kal|aaj|theek|bolo|shukriya|namaste)/i.test(trimmed)) ||
    (trimmed.length <= 40 && !/(http|www|\.cc|\.top|\.xyz|\.click|inr|rs\.?|\$|kyc|otp|pan|cbi|fir|police|apk|download|click|urgent|immediately)/i.test(text))
  );

  if (isCasualGreeting) {
    return {
      risk_score: 0,
      risk_level: 'LOW',
      scam_category: 'Casual Conversation / Benign Message',
      indicators: [
        'Normal conversational human greeting / personal message',
        'Zero external links or URLs detected in payload',
        'Zero financial coercion, panic deadlines, or credential harvesting'
      ],
      explanation: `Safe Personal Message: "${trimmed}" is a routine conversational greeting or message from a contact. It contains zero malicious links, zero social engineering coercion, and poses zero security risk.`,
      predicted_next_step: 'Normal personal conversation; no threat progression or containment required.',
      journey_nodes: [
        { id: 'node-sender', label: `Sender: ${sender}`, type: 'phone', status: 'neutral', stage: 'OBSERVED', details: 'Personal contact / chat' },
        { id: 'node-msg', label: `Payload: "${trimmed}"`, type: 'sms', status: 'neutral', stage: 'CURRENT', details: 'Benign personal communication' }
      ],
      next_moves: [
        {
          type: 'Personal Conversation',
          confidence: 100,
          why: ['Everyday human communication without scam indicators'],
          action_label: 'SAFE • NORMAL CHAT'
        }
      ],
      actions: {
        block: undefined,
        avoid: 'None. Authentic personal message.',
        report: 'No action required.'
      },
      was_auto_blocked: false
    };
  }
  
  let score = 0;
  let category = 'Legitimate / Informational Notification';
  const indicators: string[] = [];
  const journeyNodes: JourneyNode[] = [];
  const nextMoves: NextMovePrediction[] = [];
  
  // Sender analysis
  const senderIsAlpha = /^[a-zA-Z]{2}-[a-zA-Z]{6}$/i.test(sender); // Indian official header e.g. AX-HDFCBK
  const isSpoofedSender = sender.toUpperCase().includes('SBI') || sender.toUpperCase().includes('HDFC') || sender.toUpperCase().includes('BANK');
  
  if (sender !== 'UNKNOWN') {
    journeyNodes.push({
      id: 'node-sender',
      label: `Sender: ${sender}`,
      type: 'phone',
      status: senderIsAlpha ? 'neutral' : 'warning',
      stage: 'OBSERVED',
      details: senderIsAlpha ? 'Registered Telecom Sender Header' : 'Unverified mobile number / VoIP line'
    });
  }

  // Check for bank credibility markers vs scam vectors
  const OFFICIAL_BANK_DOMAINS = [
    'sbi.co.in', 'onlinesbi.sbi', 'onlinesbi.com',
    'hdfcbank.com', 'hdfc.com',
    'icicibank.com',
    'axisbank.com',
    'kotak.com', 'kotakbank.com',
    'pnbindia.in', 'netpnb.com'
  ];

  const hasOnlyOfficialBankLinks = urlInfos.length > 0 && urlInfos.every(u => 
    OFFICIAL_BANK_DOMAINS.some(obd => u.domain === obd || u.domain.endsWith('.' + obd))
  );

  const hasPhishingOrUnknownLinks = urlInfos.length > 0 && !hasOnlyOfficialBankLinks;

  const isNormalBankAlert = /(debited|credited|avl bal|available balance|statement|successful|received in a\/c|transferred to|upi ref|imps ref)/i.test(text) && 
                            !hasUrgencyCoercion && !hasPhishingOrUnknownLinks;

  // 1. Bank KYC & Transactional Evaluation
  if (THREAT_PATTERNS.BANK_KYC.test(text)) {
    // If it's a routine transaction / notice without panic coercion or fake links -> LEGITIMATE!
    if (isNormalBankAlert || (!hasUrgencyCoercion && !hasPhishingOrUnknownLinks && (senderIsAlpha || urlInfos.length === 0 || hasOnlyOfficialBankLinks))) {
      const legitIndicators = [
        'Verified routine transactional / informational bank notification',
        'Complies with RBI circular on communication security (zero credential harvesting)',
        'Zero panic coercion or threat of immediate account blocking'
      ];
      if (hasOnlyOfficialBankLinks) {
        legitIndicators.push('Contains verified official banking root domain');
      }
      if (senderIsAlpha) {
        legitIndicators.push(`Verified official TRAI DLT telecom sender header: ${sender}`);
      }

      return {
        risk_score: 4,
        risk_level: 'LOW',
        scam_category: 'Legitimate Banking Notification (Verified Bank Communication)',
        indicators: legitIndicators,
        explanation: 'Verified Genuine Bank Communication: This message strictly complies with RBI and banking security guidelines. It contains routine transaction details or informational advisories with NO coercive deadlines and NO third-party phishing links.',
        predicted_next_step: 'Routine account activity; no malicious follow-up actions expected.',
        journey_nodes: journeyNodes.length > 0 ? journeyNodes : [
          { id: 'node-legit', label: senderIsAlpha ? `Sender: ${sender}` : 'Bank Notification', type: 'phone', status: 'neutral', stage: 'OBSERVED', details: 'Official banking alert' }
        ],
        next_moves: [
          {
            type: 'Standard Banking Lifecycle',
            confidence: 99,
            why: ['Adheres strictly to RBI safety standards for automated transaction notifications'],
            action_label: 'SAFE • NO ACTION REQUIRED'
          }
        ],
        actions: {
          block: 'Legitimate sender. Do not block.',
          avoid: 'None. Authentic bank alert.',
          report: 'No reporting needed.'
        }
      };
    } else {
      // Fake Bank / KYC Phishing
      score += 55;
      category = 'Bank KYC Deactivation / Phishing Fraud';
      indicators.push('Bank / KYC suspension coercion');
      indicators.push('Impersonates recognized financial institution');
      if (hasPhishingOrUnknownLinks) {
        indicators.push('Directs victim to unverified external domain violating RBI safety guidelines');
      }
      nextMoves.push({
        type: 'Fake NetBanking Portal Redirection',
        confidence: 94,
        why: ['Urgent KYC expired hook', 'Credential harvest vector'],
        action_label: 'DO NOT OPEN LINK'
      });
      nextMoves.push({
        type: 'OTP Hijacking & Unauthorized Debit',
        confidence: 89,
        why: ['Follow-up SMS or phone call demanding OTP to reverse suspension'],
        action_label: 'NEVER SHARE OTP'
      });
    }
  }
  // 2. Digital Arrest
  else if (THREAT_PATTERNS.DIGITAL_ARREST.test(text)) {
    score += 65;
    category = 'Digital Arrest & Law Enforcement Extortion';
    indicators.push('Fake CBI/Police legal threat intimidation');
    indicators.push('Threatens imminent physical arrest / bank freeze');
    nextMoves.push({
      type: 'Skype/WhatsApp Video Call Coercion',
      confidence: 96,
      why: ['Digital arrest syndicates force victims onto video calls in fake police station setups'],
      action_label: 'DISCONNECT IMMEDIATELY'
    });
    nextMoves.push({
      type: 'Extortion via "Clearance" RTGS Transfer',
      confidence: 92,
      why: ['Victim is pressured to wire funds to "RBI Verification Accounts"'],
      action_label: 'FILE REPORT ON CYBERCRIME.GOV.IN'
    });
  }
  // 3. Electricity Bill Cut
  else if (THREAT_PATTERNS.ELECTRICITY_DISCONNECT.test(text)) {
    score += 50;
    category = 'Utility / Electricity Bill Disconnection Scam';
    indicators.push('Impending utility power cut deadline');
    indicators.push('Requests direct call to private mobile number');
    nextMoves.push({
      type: 'Remote Control APK Installation (AnyDesk)',
      confidence: 91,
      why: ['Scammer instructs victim to install remote desktop app for "bill clearance"'],
      action_label: 'DO NOT CALL UNKNOWN NUMBERS'
    });
  }
  // 4. Job / Task Scam
  else if (THREAT_PATTERNS.JOB_TASK.test(text)) {
    score += 45;
    category = 'Fake Task / YouTube Rating Scam';
    indicators.push('Unrealistic daily income for minimal effort');
    indicators.push('Pushes to external encrypted Telegram group');
    nextMoves.push({
      type: 'VIP Deposit Request',
      confidence: 95,
      why: ['Small token payment given first, followed by demands for ₹10,000+ prepaid deposits'],
      action_label: 'BLOCK TELEGRAM CONTACT'
    });
  }
  // 5. Delivery
  else if (THREAT_PATTERNS.DELIVERY_PARCEL.test(text)) {
    score += 40;
    category = 'Courier & Postal Fee Phishing Bait';
    indicators.push('Fake parcel hold / unpaid re-delivery fee');
    indicators.push('Requires credit card info for nominal amount');
    nextMoves.push({
      type: 'Card Harvesting Gateway',
      confidence: 93,
      why: ['Steals CVV and card numbers while charging recurring unauthorized fees'],
      action_label: 'CHECK TRACKING ON OFFICIAL POSTAL SITE'
    });
  }
  // 6. Lottery / UPI
  else if (THREAT_PATTERNS.UPI_LOTTERY.test(text)) {
    score += 45;
    category = 'Fake Lottery / UPI PIN Debit Scam';
    indicators.push('Unsolicited lottery / cashback prize bait');
    indicators.push('Coaxes entering UPI PIN on receive request');
    nextMoves.push({
      type: 'UPI Reverse Debit Attack',
      confidence: 90,
      why: ['Victim is sent a "Receive Money" request requiring UPI PIN entry which debits their account'],
      action_label: 'NEVER ENTER UPI PIN TO RECEIVE MONEY'
    });
  }

  // APK Dropper
  if (THREAT_PATTERNS.APK_DROPPER.test(text)) {
    score += 40;
    indicators.push('Instructs sideloading unverified Android APK package');
    journeyNodes.push({
      id: 'node-apk',
      label: 'Malicious Android APK Payload',
      type: 'apk',
      status: 'flagged',
      stage: 'CURRENT',
      details: 'Automated malware dropper targeting SMS and Accessibility permissions'
    });
  }

  // Urgency
  if (THREAT_PATTERNS.URGENCY.test(text)) {
    score += 20;
    indicators.push('Psychological panic / artificial time constraint trigger');
  }

  // URL specifics
  if (urlInfos.length > 0) {
    const highestUrlScore = Math.max(...urlInfos.map(u => u.riskScore));
    const isDirectUrlScan = payload.trim().startsWith('http://') || 
                            payload.trim().startsWith('https://') || 
                            payload.trim().startsWith('www.') || 
                            !payload.trim().includes(' ');

    // For direct URL inspections, threat score directly reflects the URL's analyzed risk
    if (isDirectUrlScan) {
      score = Math.max(score, highestUrlScore);
    } else {
      score += Math.round(highestUrlScore * 0.7);
    }
    
    // Check if any extracted URL is a typosquatting campaign
    const typosquatUrl = urlInfos.find(u => u.isTyposquat);
    if (typosquatUrl) {
      score = Math.max(score, 92);
      category = `Brand Typosquatting / Fake ${typosquatUrl.spoofedBrand ? typosquatUrl.spoofedBrand.toUpperCase() : 'E-Commerce'} Portal`;
      indicators.push(`High-confidence brand lookalike attack: domain mimics '${typosquatUrl.spoofedBrand}'`);
      nextMoves.push({
        type: 'Fake Login / Checkout Credential Capture',
        confidence: 96,
        why: ['Spoofed e-commerce / service portal prompts user for email, password, and credit card details'],
        action_label: 'DO NOT ENTER PASSWORDS'
      });
      nextMoves.push({
        type: 'Unauthorized Account Hijacking',
        confidence: 88,
        why: ['Harvested credentials will be used to place fraudulent orders or hijack stored cards'],
        action_label: 'USE OFFICIAL BRAND APP/SITE ONLY'
      });
    }

    urlInfos.forEach((u, idx) => {
      journeyNodes.push({
        id: `node-url-${idx}`,
        label: u.domain || u.original,
        type: 'url',
        status: u.riskScore > 60 ? 'flagged' : (u.riskScore > 30 ? 'warning' : 'neutral'),
        stage: 'CURRENT',
        details: u.threats.join(' • ') || 'Destination Web Endpoint'
      });
      u.threats.forEach(t => indicators.push(t));
    });
  }

  // Also check individual words/tokens in the payload text for brand typosquatting (e.g. "youtubee", "amazn", "flipkartt")
  const textWords = text.replace(/[^a-zA-Z0-9.\-]/g, ' ').split(/\s+/).filter(w => w.length >= 4);
  for (const word of textWords) {
    const wordTypo = checkBrandTyposquat(word);
    if (wordTypo.isTyposquat) {
      score = Math.max(score, 95);
      category = `Brand Typosquatting / Fake ${wordTypo.brand ? wordTypo.brand.toUpperCase() : 'Web'} Portal`;
      indicators.push(`High-confidence brand lookalike detected: '${word}' mimics '${wordTypo.brand}'`);
      indicators.push(`Typosquatting attack vector targeting visual deception`);
      nextMoves.push({
        type: 'Fake Portal Credential Harvesting',
        confidence: 96,
        why: [`Victim is tricked into visiting deceptive lookalike '${word}' designed to steal credentials or banking details`],
        action_label: `USE OFFICIAL ${wordTypo.brand ? wordTypo.brand.toUpperCase() : 'BRAND'} WEBSITE ONLY`
      });
      break;
    }
  }

  const finalScore = Math.min(100, Math.max(score, urlInfos.length > 0 && score === 0 ? 30 : 0));
  
  let riskLevel: RiskLevel = 'LOW';
  if (finalScore >= 80) riskLevel = 'CRITICAL';
  else if (finalScore >= 60) riskLevel = 'HIGH';
  else if (finalScore >= 35) riskLevel = 'SUSPICIOUS';

  let explanation = '';
  if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
    explanation = `High-confidence malicious campaign detected (${category}). The payload combines psychological urgency triggers with weaponized links or social-engineering coercions to harvest credentials or execute unauthorized debits.`;
  } else if (riskLevel === 'SUSPICIOUS') {
    explanation = `Elevated risk indicators observed. The communication uses unsolicited marketing or shortened redirection links that warrant independent verification before engagement.`;
  } else {
    explanation = `Payload appears informational or benign with no recognized malicious patterns or credential harvesting payloads.`;
  }

  return {
    risk_score: finalScore,
    risk_level: riskLevel,
    scam_category: category,
    indicators: Array.from(new Set(indicators)),
    explanation,
    predicted_next_step: nextMoves[0]?.type ? `${nextMoves[0].type}: ${nextMoves[0].why.join('; ')}` : 'No malicious progression anticipated.',
    journey_nodes: journeyNodes,
    next_moves: nextMoves,
    actions: {
      block: riskLevel === 'CRITICAL' || riskLevel === 'HIGH' ? 'Immediately block the sender and blackhole the URL.' : undefined,
      avoid: 'Do not click links, download APK attachments, or communicate via secondary channels.',
      report: 'Forward this SMS to 1930 / cybercrime.gov.in (National Cyber Crime Reporting Portal) or carrier spam service (7726).'
    }
  };
}
