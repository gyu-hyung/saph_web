import axios, { type InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, AuthTokens, Member, UploadResult, TranslateResult, Job, CreditPackage, PurchaseResult } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post<ApiResponse<AuthTokens>>(
          `${BASE_URL}/api/auth/refresh`,
          { refreshToken }
        );
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  signup: (email: string, password: string, nickname: string) =>
    apiClient.post<ApiResponse<AuthTokens>>('/api/auth/signup', { email, password, nickname }),

  login: (email: string, password: string) =>
    apiClient.post<ApiResponse<AuthTokens>>('/api/auth/login', { email, password }),

  refresh: (refreshToken: string) =>
    apiClient.post<ApiResponse<AuthTokens>>('/api/auth/refresh', { refreshToken }),
};

export const memberApi = {
  getMe: () => apiClient.get<ApiResponse<Member>>('/api/members/me'),
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

  getStatusUrl: (jobId: number | string): string => {
    const token = localStorage.getItem('accessToken') || '';
    return `${BASE_URL}/api/video/status/${jobId}?token=${encodeURIComponent(token)}`;
  },

  getResultUrl: (jobId: number | string, type: 'original' | 'translated' | 'dual'): string => {
    const token = localStorage.getItem('accessToken') || '';
    return `${BASE_URL}/api/video/result/${jobId}?type=${type}&token=${encodeURIComponent(token)}`;
  },

  getStreamUrl: (jobId: number | string): string => {
    const token = localStorage.getItem('accessToken') || '';
    return `${BASE_URL}/api/video/stream/${jobId}?token=${encodeURIComponent(token)}`;
  },

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
