export interface ApiResponse<T> {
  code: string;
  data: T;
  message?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface Member {
  memberId: number;
  email: string;
  nickname: string;
  creditBalance: number;
  createdAt: string;
}

export interface UploadResult {
  videoId: string;
  originalName: string;
  videoPath: string;
  durationSec: number;
  requiredCreditMin: number;
  fileSizeMB: number;
}

export interface TranslateResult {
  jobId: number;
  status: string;
  creditUsed: number;
  creditBalance: number;
}

export interface Job {
  jobId: number;
  status: 'CREATED' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  originalName: string;
  durationSec: number;
  creditUsed: number;
  sourceLang: string;
  targetLang: string;
  detectedLang?: string;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface SSEEvent {
  jobId: number;
  type: string;
  step: string;
  percent: number;
  message?: string;
  queuePosition?: number;
  estimatedWaitSec?: number;
  originalSrt?: string;
  translatedSrt?: string;
  detectedLang?: string;
  error?: string;
}

export interface CreditPackage {
  type: string;
  creditMin: number;
  price: number;
  label: string;
}

export interface PurchaseResult {
  orderId: string;
  packageType: string;
  price: number;
  creditMin: number;
}
