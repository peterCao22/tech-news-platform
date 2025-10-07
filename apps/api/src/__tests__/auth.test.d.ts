export declare const createTestUser: (overrides?: {}) => Promise<{
    email: string;
    password: string;
    name: string;
    role: string;
    status: string;
}>;
export declare const generateTestJWT: (userId: string) => string;
