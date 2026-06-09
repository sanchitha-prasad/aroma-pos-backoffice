import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { globalMessage } from './globalMessage';
import { API_CONFIG } from './config';
import { authStore } from '../auth/authStore';

// Extended request config to support custom options
interface CustomRequestConfig extends AxiosRequestConfig {
    skipAuth?: boolean;
    skipErrorRedirect?: boolean;
    suppressErrorToast?: boolean;
    overrideBaseURL?: string;
    skipBranchId?: boolean;
}

// Standard API Response Structure
interface ApiResponse<T> {
    success: boolean;
    status: number;
    message: string;
    data: T;
    error: any;
}

class ApiClient {
    private axiosInstance: AxiosInstance;

    constructor() {
        this.axiosInstance = axios.create({
            baseURL: API_CONFIG.CORE_URL,
            timeout: API_CONFIG.TIMEOUT,
            headers: API_CONFIG.HEADERS,
        });

        this.setupInterceptors();
    }

    private setupInterceptors() {
        // ── Request Interceptor ───────────────────────────────────────────────
        this.axiosInstance.interceptors.request.use(
            (config: InternalAxiosRequestConfig & CustomRequestConfig) => {

                // 1. Allow dynamic override of baseURL
                if (config.overrideBaseURL) {
                    config.baseURL = config.overrideBaseURL;
                }

                // 2. Inject Bearer Token (from in-memory store — never localStorage)
                if (!config.skipAuth) {
                    const token = authStore.accessToken;
                    if (token) {
                        config.headers.set('Authorization', `Bearer ${token}`);
                    }
                }

                // 3. Inject Tenant & Branch context headers
                const tenantId = authStore.tenantId;
                const branchId = authStore.branchId;
                if (tenantId) config.headers.set('X-Tenant-Id', tenantId);
                if (branchId && !config.skipBranchId) config.headers.set('X-Branch-Id', branchId);

                // 4. Ensure JSON Content-Type
                if (!config.headers.get('Content-Type')) {
                    config.headers.set('Content-Type', 'application/json');
                }

                // Remove on production — only for ngrok tunnels
                config.headers.set('ngrok-skip-browser-warning', 'true');

                // ── Debug logging (dev only) ──────────────────────────────────
                // import.meta.env.DEV is a compile-time boolean — esbuild strips
                // the entire block in production with no runtime overhead.
                if (import.meta.env.DEV) {
                    console.groupCollapsed(`🚀 API Request: [${config.method?.toUpperCase()}] ${config.url}`);
                    console.log('URL:', `${config.baseURL || ''}${config.url}`);
                    console.log('Headers:', config.headers);
                    if (config.data) {
                        try {
                            const dataToLog = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
                            console.log('📦 Request Body (JSON):', dataToLog);
                        } catch {
                            console.log('📦 Request Body:', config.data);
                        }
                    }
                    console.groupEnd();
                }

                return config;
            },
            (error) => {
                if (import.meta.env.DEV) {
                    console.error('Request Error:', error);
                }
                return Promise.reject(error);
            }
        );

        // ── Response Interceptor ──────────────────────────────────────────────
        this.axiosInstance.interceptors.response.use(
            (response: AxiosResponse<ApiResponse<any>>) => {
                const { data } = response;
                const config = response.config as CustomRequestConfig;

                if (import.meta.env.DEV) {
                    console.groupCollapsed(`✅ API Response: [${response.config.method?.toUpperCase()}] ${response.config.url}`);
                    console.log('Status:', response.status);
                    console.log('📦 Response Data:', data);
                    console.groupEnd();
                }

                if (data && data.success === false) {
                    const errorMsg = data.message || 'Operation failed';
                    if (!config.suppressErrorToast) {
                        globalMessage.error(errorMsg);
                    }
                    return Promise.reject(new Error(errorMsg));
                }

                return data.data;
            },
            (error: AxiosError<ApiResponse<any>>) => {
                this.handleError(error);
                return Promise.reject(error);
            }
        );
    }

    private handleError(error: AxiosError<ApiResponse<any>>) {
        const config = error.config as CustomRequestConfig | undefined;
        let displayMessage = 'An unexpected error occurred';

        if (error.response) {
            const { status, data } = error.response;
            displayMessage = data?.message || error.message;

            if (status === 401) {
                if (!config?.skipErrorRedirect) {
                    // Wipe the in-memory store and the sessionStorage refresh-token entry
                    authStore.clear();
                    if (!window.location.pathname.includes('/login')) {
                        window.location.href = '/login';
                    }
                }
                displayMessage = 'Session expired. Please login again.';
            }
        } else if (error.request) {
            displayMessage = 'Network Error: Unable to connect to server. Please check your connection.';
        } else {
            displayMessage = error.message;
        }

        if (!config?.suppressErrorToast) {
            globalMessage.error(displayMessage);
        }
    }

    // ── Typed Request Wrappers ────────────────────────────────────────────────

    public async get<T>(endpoint: string, config?: CustomRequestConfig): Promise<T> {
        return this.axiosInstance.get(endpoint, config) as Promise<T>;
    }

    public async post<T>(endpoint: string, data?: any, config?: CustomRequestConfig): Promise<T> {
        return this.axiosInstance.post(endpoint, data, config) as Promise<T>;
    }

    public async put<T>(endpoint: string, data?: any, config?: CustomRequestConfig): Promise<T> {
        return this.axiosInstance.put(endpoint, data, config) as Promise<T>;
    }

    public async patch<T>(endpoint: string, data?: any, config?: CustomRequestConfig): Promise<T> {
        return this.axiosInstance.patch(endpoint, data, config) as Promise<T>;
    }

    public async delete<T>(endpoint: string, config?: CustomRequestConfig): Promise<T> {
        return this.axiosInstance.delete(endpoint, config) as Promise<T>;
    }
}

export const apiClient = new ApiClient();
