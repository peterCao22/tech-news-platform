import { ReactNode } from 'react';
interface ProtectedRouteProps {
    children: ReactNode;
    requireAuth?: boolean;
    requiredRole?: 'USER' | 'ADMIN';
    redirectTo?: string;
}
export default function ProtectedRoute({ children, requireAuth, requiredRole, redirectTo }: ProtectedRouteProps): import("react").JSX.Element | null;
export {};
