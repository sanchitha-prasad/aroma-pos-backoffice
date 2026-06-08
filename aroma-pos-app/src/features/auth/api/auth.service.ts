import { apiClient } from '../../../shared/services/api/client';
import { API_CONFIG } from '../../../shared/services/api/config';
import { Employee, Role } from '../../../shared/types';
import { authStore } from '../../../shared/services/auth/authStore';

interface LoginResponseData {
    accessToken: string;
    // refreshToken: string;
    tenantId: string;
    roles: string[];
}

const decodeToken = (token: string): Record<string, any> => {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return {};

        let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const pad = base64.length % 4;
        if (pad) base64 += '='.repeat(4 - pad);

        const jsonPayload = decodeURIComponent(
            window.atob(base64).split('').map(c =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join('')
        );

        return JSON.parse(jsonPayload);
    } catch (e) {
        console.warn('Failed to decode token', e);
        return {};
    }
};

const mapRole = (apiRole: string): Role => {
    if (!apiRole) return 'Manager';
    const r = apiRole.toLowerCase();
    if (r === 'superadmin') return 'SuperAdmin';
    if (r === 'admin')      return 'Admin';
    if (r === 'manager')    return 'Manager';
    if (r === 'cashier')    return 'Cashier';
    if (r === 'waiter' || r === 'server') return 'Waiter';
    if (r === 'kitchen')    return 'Kitchen';
    return 'Manager';
};

/**
 * Shared helper — decodes the token, builds the Employee object, and writes
 * everything into the in-memory authStore.  Used by both login and refreshSession.
 */
const applySession = (data: LoginResponseData, emailHint?: string): Employee => {
    const payload  = decodeToken(data.accessToken);
    const tenantId = data.tenantId || payload.TenantId || payload.tenantId || '';
    const branchId = payload.BranchId || payload.branchId || '';
    const userRole = data.roles?.length > 0 ? data.roles[0] : (payload.role || 'server');

    const user: Employee = {
        id:          payload.sub || 'unknown',
        name:        payload.username || payload.unique_name || emailHint?.split('@')[0] || 'User',
        email:       payload.email   || emailHint || payload.unique_name || 'user@system.com',
        role:        mapRole(userRole),
        status:      'Active',
        branchId,
        loginNumber: '0000',
    };

    authStore.setSession({ accessToken: data.accessToken,  tenantId, branchId, user });
    return user;
};

export const authService = {

    login: async (email: string, password: string): Promise<Employee> => {
        const data = await apiClient.post<LoginResponseData>(
            '/api/authentication/login',
            { email, password },
            { skipAuth: true, overrideBaseURL: API_CONFIG.AUTH_URL }
        );
        return applySession(data, email);
    },

    /**
     * Called automatically on every page load / refresh.
     *
     * Sends the refresh token (kept in sessionStorage) to the backend to
     * obtain a fresh access token, then restores the in-memory session without
     * the user having to re-enter their credentials.
     *
     * Returns the restored Employee on success, or null if the refresh token
     * is missing / expired (which will redirect the user to login).
     */
    // refreshSession: async (): Promise<Employee | null> => {
    //     const refreshToken = authStore.refreshToken; // reads from sessionStorage
    //     if (!refreshToken) return null;

    //     try {
    //         const data = await apiClient.post<LoginResponseData>(
    //             '/api/authentication/refresh',
    //             { refreshToken },
    //             {
    //                 skipAuth:           true,  // no Bearer token yet
    //                 suppressErrorToast: true,  // silent — user never sees a toast
    //                 skipErrorRedirect:  true,  // we handle redirect ourselves below
    //                 overrideBaseURL:    API_CONFIG.AUTH_URL,
    //             }
    //         );
    //         return applySession(data);
    //     } catch {
    //         // Refresh token expired or server unreachable — let App decide what to do
    //         return null;
    //     }
    // },

    logout: () => {
        authStore.clear();
    },

    getCurrentUser: (): Employee | null => {
        return authStore.currentUser;
    },
};
