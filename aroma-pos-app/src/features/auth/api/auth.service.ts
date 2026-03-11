import { apiClient } from '../../../shared/services/api/client';
import { API_CONFIG } from '../../../shared/services/api/config';
import { Employee, Role } from '../../../shared/types';

interface LoginResponseData {
    accessToken: string;
    refreshToken: string;
    tenantId: string;
    roles: string[];
}

const decodeToken = (token: string) => {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return {};

        let base64Url = parts[1];
        let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

        const pad = base64.length % 4;
        if (pad) {
            base64 += new Array(5 - pad).join('=');
        }

        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        console.warn("Failed to decode token", e);
        return {};
    }
};

const mapRole = (apiRole: string): Role => {
    if (!apiRole) return 'Server';
    const r = apiRole.toLowerCase();
    if (r === 'admin') return 'Admin';
    if (r === 'manager') return 'Manager';
    if (r === 'server') return 'Server';
    if (r === 'kitchen') return 'Kitchen';
    return 'Server';
};

export const authService = {
    login: async (email: string, password: string): Promise<Employee> => {
        const data = await apiClient.post<LoginResponseData>('/api/authentication/login', { email, password }, {
            skipAuth: true,
            baseUrl: API_CONFIG.AUTH_URL
        });

        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        const payload = decodeToken(data.accessToken);
        const userRole = data.roles && data.roles.length > 0 ? data.roles[0] : (payload.role || 'server');

        const user: Employee = {
            id: payload.sub || 'unknown',
            name: payload.username || payload.unique_name || email.split('@')[0],
            email: email,
            role: mapRole(userRole),
            status: 'Active',
            branchId: payload.BranchId,
            loginNumber: '0000'
        };

        //to save current user during login 
        localStorage.setItem('currentUser',JSON.stringify(user));

        return user;
    },

    logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
    },

    getUserFromToken: (): Employee | null => {
        const token = localStorage.getItem('accessToken');
        if (!token) return null;

        try {
            const payload = decodeToken(token);
            if (payload.exp && Date.now() >= payload.exp * 1000) {
                authService.logout();
                return null;
            }

            //add current user
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser){
                return JSON.parse(savedUser);
            }
            const roleFromToken=
                payload.role ||
                payload.Role ||
                payload.UserRole ||
                'server';

            return {
                id: payload.sub || 'unknown',
                name: payload.Username || payload.unique_name || 'User',
                email: 'user@system.com',
                role: mapRole(payload.UserRole || 'Server'),
                status: 'Active',
                branchId: payload.BranchId,
                loginNumber: '0000'
            };
        } catch (e) {
            return null;
        }
    }
};