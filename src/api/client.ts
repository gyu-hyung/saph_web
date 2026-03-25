import axios, { type InternalAxiosRequestConfig } from 'axios';
import { auth } from '../lib/firebase';
import type { ApiResponse, Member, UploadResult, TranslateResult, Job, CreditPackage, PurchaseResult, RegisterResponse } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// Cache the most recent Firebase token for synchronous URL builders (SSE/stream)
let currentFirebaseToken = '';

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    currentFirebaseToken = token;
    if (config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Firebase tokens auto-refresh via getIdToken() — no manual refresh needed.
    // If 401, the token was invalid; redirect to login.
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const user = auth.currentUser;
      if (user) {
        // Force token refresh and retry once
        const token = await user.getIdToken(true);
        currentFirebaseToken = token;
        error.config.headers['Authorization'] = `Bearer ${token}`;
        return apiClient(error.config);
      }
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (token: string, nickname?: string) =>
    axios.post<ApiResponse<RegisterResponse>>(
      `${BASE_URL}/api/auth/register`,
      { nickname: nickname || '' },
      { headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      } }
    ),
};

export const memberApi = {
  getMe: () => apiClient.get<ApiResponse<Member>>('/api/members/me'),
  withdraw: () => apiClient.delete<ApiResponse<{ message: string }>>('/api/members/me'),
};

export const videoApi = {
  upload: (
    file: File,
    onUploadProgress?: (progressEvent: { loaded: number; total?: number }) => void
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<ApiResponse<UploadResult>>('/api/video/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
  },

  translate: (videoId: string, sourceLang?: string, targetLang?: string) =>
    apiClient.post<ApiResponse<TranslateResult>>('/api/video/translate', {
      videoId,
      sourceLang: sourceLang || 'auto',
      targetLang: targetLang || 'ko',
    }),

  getStatusUrl: (jobId: number | string): string =>
    `${BASE_URL}/api/video/status/${jobId}?token=${encodeURIComponent(currentFirebaseToken)}`,

  getResultUrl: (jobId: number | string, type: 'original' | 'translated' | 'dual'): string =>
    `${BASE_URL}/api/video/result/${jobId}?type=${type}&token=${encodeURIComponent(currentFirebaseToken)}`,

  getStreamUrl: (jobId: number | string): string =>
    `${BASE_URL}/api/video/stream/${jobId}?token=${encodeURIComponent(currentFirebaseToken)}`,

  getJobs: () => apiClient.get<ApiResponse<Job[]>>('/api/jobs'),

  fetchSrt: (jobId: number | string, type: 'original' | 'translated' | 'dual') =>
    apiClient.get<string>(videoApi.getResultUrl(jobId, type), { responseType: 'text' }),
};

export const creditApi = {
  getBalance: () => apiClient.get<ApiResponse<{ creditBalance: number }>>('/api/credits'),

  getPackages: () => apiClient.get<ApiResponse<CreditPackage[]>>('/api/credits/packages'),

  purchase: (packageType: string) =>
    apiClient.post<ApiResponse<PurchaseResult>>('/api/credits/purchase', { packageType }),

  confirm: (orderId: string, paymentKey: string, amount: number) =>
    apiClient.post<ApiResponse<{ creditBalance: number }>>('/api/credits/purchase/confirm', {
      orderId,
      paymentKey,
      amount,
    }),
};

export default apiClient;
