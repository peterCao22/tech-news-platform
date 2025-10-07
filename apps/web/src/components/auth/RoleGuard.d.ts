interface RoleGuardProps {
    children: React.ReactNode;
    role?: 'USER' | 'EDITOR' | 'ADMIN';
    permission?: string;
    fallback?: React.ReactNode;
    requireAll?: boolean;
}
export declare function RoleGuard({ children, role, permission, fallback, requireAll, }: RoleGuardProps): import("react").JSX.Element;
export declare function AdminOnly({ children, fallback }: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}): import("react").JSX.Element;
export declare function EditorOnly({ children, fallback }: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}): import("react").JSX.Element;
export declare function AuthenticatedOnly({ children, fallback }: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}): import("react").JSX.Element;
export declare function GuestOnly({ children, fallback }: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}): import("react").JSX.Element;
export {};
