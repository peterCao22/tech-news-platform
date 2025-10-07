export interface User {
    id: string;
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    image?: string;
    role: 'USER' | 'EDITOR' | 'ADMIN';
    status: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    emailVerified?: Date | null;
    timezone?: string;
    language?: string;
    preferences?: any;
    createdAt: Date;
    lastLoginAt?: Date | null;
}
interface AuthState {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setUser: (user: User) => void;
    setTokens: (token: string, refreshToken?: string) => void;
    updateUser: (updates: Partial<User>) => void;
    logout: () => void;
    setLoading: (loading: boolean) => void;
    hasRole: (role: string) => boolean;
    hasPermission: (permission: string) => boolean;
}
export declare const useAuthStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<AuthState>, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<AuthState, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: AuthState) => void) => () => void;
        onFinishHydration: (fn: (state: AuthState) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<AuthState, unknown>>;
    };
}>;
export declare const useAuth: () => AuthState;
export declare const useUser: () => User | null;
export declare const useIsAuthenticated: () => boolean;
export declare const useAuthLoading: () => boolean;
export {};
