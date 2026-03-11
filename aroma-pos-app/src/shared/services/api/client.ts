import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { API_CONFIG } from './config';

// Extended request config to support custom options
interface CustomRequestConfig extends AxiosRequestConfig {
    skipAuth?: boolean;
    skipErrorRedirect?: boolean;
    suppressErrorToast?: boolean;
    baseUrl?: string; // Support overriding base URL (e.g. for Auth service)
    //_retry?: boolean;
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
            //withCredentials:true,
        });

        this.setupInterceptors();
    }

    private setupInterceptors() {
        // Request Interceptor
        this.axiosInstance.interceptors.request.use(
            (config: InternalAxiosRequestConfig & CustomRequestConfig) => {
                // 1. Allow dynamic override of baseURL
                if (config.baseUrl) {
                    config.baseURL = config.baseUrl;
                    console.log(config.baseURL);
                }

                // 2. Inject Bearer Token
                if (!config.skipAuth) {
                    const token = localStorage.getItem('accessToken');
                    if (token) {
                        config.headers.set('Authorization', `Bearer ${token}`);
                    }
                }

                // 3. Ensure JSON Content-Type
                if (!config.headers.get('Content-Type')) {
                    config.headers.set('Content-Type', 'application/json');
                }

                //remove this on production / only for ngrok
                config.headers.set('ngrok-skip-browser-warning', 'true');

                // ============================================================
                // 4. LOG REQUEST JSON (Debug)
                // ============================================================
                if (process.env.NODE_ENV === 'development') { // Only log in dev mode
                    console.groupCollapsed(`🚀 API Request: [${config.method?.toUpperCase()}] ${config.url}`);
                    console.log('URL:', `${config.baseURL || ''}${config.url}`);
                    console.log('Headers:', config.headers);
                    
                    if (config.data) {
                        try {
                            // If data is already a string, parse it to pretty print, otherwise just log object
                            const dataToLog = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
                            console.log('📦 Request Body (JSON):', dataToLog);
                        } catch (e) {
                            console.log('📦 Request Body:', config.data);
                        }
                    }
                    console.groupEnd();
                }
                // ============================================================

                return config;
            },
            (error) => {
                console.error('Request Error:', error);
                return Promise.reject(error);
            }
        );

        // Response Interceptor (Just ensuring the type matches)
        this.axiosInstance.interceptors.response.use(
            (response: AxiosResponse<ApiResponse<any>>) => {
                const { data } = response;
                const config = response.config as CustomRequestConfig;

                // Debug Log Response
                if (process.env.NODE_ENV === 'development') {
                    console.groupCollapsed(`✅ API Response: [${response.config.method?.toUpperCase()}] ${response.config.url}`);
                    console.log('Status:', response.status);
                    console.log('📦 Response Data:', data);
                    console.groupEnd();
                }

                if (data && data.success === false) {
                    const errorMsg = data.message || 'Operation failed';
                    if (!config.suppressErrorToast) {
                        message.error(errorMsg);
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
        
        // Response Interceptor New
        // this.axiosInstance.interceptors.response.use(
        //     (response) => response.data.data,
        //     async (error: AxiosError<ApiResponse<any>>) => {
        //         const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        //         if (error.response?.status === 401 && !originalRequest._retry) {
        //             originalRequest._retry = true;
        //             try {
        //                 const refreshToken = localStorage.getItem('refreshToken');
        //                 const res = await axios.post(`${API_CONFIG.AUTH_URL}/api/authentication/refresh`, {
        //                     refreshToken: refreshToken
        //                 });

        //                 if (res.data.success) {
        //                     localStorage.setItem('accessToken', res.data.data.accessToken);
        //                     localStorage.setItem('refreshToken', res.data.data.refreshToken);
                            
        //                     originalRequest.headers.set('Authorization', `Bearer ${res.data.data.accessToken}`);
        //                     return this.axiosInstance(originalRequest);
        //                 }
        //             } catch (refreshError) {
        //                 this.handleError(error); // Logout if refresh fails
        //             }
        //         }
        //         this.handleError(error);
        //         return Promise.reject(error);
        //     }
        // );

        
    }

    private handleError(error: AxiosError<ApiResponse<any>>) {
        const config = error.config as CustomRequestConfig | undefined;
        let displayMessage = 'An unexpected error occurred';

        if (error.response) {
            // Server responded with a status code that falls out of the range of 2xx
            const { status, data } = error.response;
            displayMessage = data?.message || error.message;

            if (status === 401) {
                if (!config?.skipErrorRedirect) {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('currentUser');
                    if (!window.location.pathname.includes('/login')) {
                        window.location.href = '/login';
                    }
                }
                displayMessage = 'Session expired. Please login again.';
            }
        } else if (error.request) {
            // The request was made but no response was received
            displayMessage = 'Network Error: Unable to connect to server. Please check your connection.';
        } else {
            // Something happened in setting up the request that triggered an Error
            displayMessage = error.message;
        }

        // Show Global Toast unless suppressed
        if (!config?.suppressErrorToast) {
            message.error(displayMessage);
        }
    }

    // Typed Request Wrappers
    
    public async get<T>(endpoint: string, config?: CustomRequestConfig): Promise<T> {
        return this.axiosInstance.get(endpoint, config) as Promise<T>;
    }

    public async post<T>(endpoint: string, data?: any, config?: CustomRequestConfig): Promise<T> {
        return this.axiosInstance.post(endpoint, data, config) as Promise<T>;
    }

    public async put<T>(endpoint: string, data?: any, config?: CustomRequestConfig): Promise<T> {
        return this.axiosInstance.put(endpoint, data, config) as Promise<T>;
    }

    public async delete<T>(endpoint: string, config?: CustomRequestConfig): Promise<T> {
        return this.axiosInstance.delete(endpoint, config) as Promise<T>;
    }
}

export const apiClient = new ApiClient();