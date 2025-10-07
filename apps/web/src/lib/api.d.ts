import { AxiosInstance, AxiosRequestConfig } from 'axios';
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    code?: string;
    errors?: Array<{
        field: string;
        message: string;
        value?: any;
    }>;
}
export interface ApiError {
    success: false;
    message: string;
    code?: string;
    errors?: Array<{
        field: string;
        message: string;
        value?: any;
    }>;
}
export declare const apiClient: AxiosInstance;
export declare class ApiService {
    static get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
    static post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
    static put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
    static patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
    static delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
}
export declare const authApi: {
    register: (data: {
        email: string;
        password: string;
        confirmPassword: string;
        name?: string;
        firstName?: string;
        lastName?: string;
        acceptTerms: boolean;
    }) => Promise<ApiResponse<any>>;
    login: (data: {
        email: string;
        password: string;
        remember?: boolean;
    }) => Promise<ApiResponse<any>>;
    logout: () => Promise<ApiResponse<any>>;
    refreshToken: (refreshToken: string) => Promise<ApiResponse<any>>;
    getCurrentUser: () => Promise<ApiResponse<any>>;
    verifyEmail: (token: string) => Promise<ApiResponse<any>>;
    resendVerification: (email: string) => Promise<ApiResponse<any>>;
    forgotPassword: (email: string) => Promise<ApiResponse<any>>;
    resetPassword: (data: {
        token: string;
        password: string;
        confirmPassword: string;
    }) => Promise<ApiResponse<any>>;
    changePassword: (data: {
        currentPassword: string;
        newPassword: string;
        confirmNewPassword: string;
    }) => Promise<ApiResponse<any>>;
    checkEmail: (email: string) => Promise<ApiResponse<any>>;
};
export declare const userApi: {
    getProfile: () => Promise<ApiResponse<any>>;
    updateProfile: (data: {
        name?: string;
        firstName?: string;
        lastName?: string;
        bio?: string;
        timezone?: string;
        language?: string;
    }) => Promise<ApiResponse<any>>;
    updatePreferences: (preferences: any) => Promise<ApiResponse<any>>;
    getActivities: (params?: {
        page?: number;
        limit?: number;
    }) => Promise<ApiResponse<any>>;
    deleteAccount: () => Promise<ApiResponse<any>>;
};
