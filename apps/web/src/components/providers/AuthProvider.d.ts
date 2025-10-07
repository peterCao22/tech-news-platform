interface AuthProviderProps {
    children: React.ReactNode;
}
export declare function AuthProvider({ children }: AuthProviderProps): import("react").JSX.Element;
export declare function useAuth(): {
    isReady: boolean;
    user: import("@/stores/auth.store").User | null;
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setUser: (user: import("@/stores/auth.store").User) => void;
    setTokens: (token: string, refreshToken?: string) => void;
    updateUser: (updates: Partial<import("@/stores/auth.store").User>) => void;
    logout: () => void;
    setLoading: (loading: boolean) => void;
    hasRole: (role: string) => boolean;
    hasPermission: (permission: string) => boolean;
};
export declare function useUser(): {
    user: import("@/stores/auth.store").User | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isEditor: boolean;
    isActive: boolean;
    isEmailVerified: boolean;
};
export {};
