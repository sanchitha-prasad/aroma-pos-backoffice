import { Employee } from '../../types';

interface SessionData {
    accessToken: string;
    // refreshToken: string;
    tenantId: string;
    branchId: string;
    user: Employee;
}

class AuthStore {
    private _accessToken: string | null = null;
    private _tenantId: string | null = null;
    private _branchId: string | null = null;
    private _currentUser: Employee | null = null;

    private readonly RT_KEY   = '_sid';
    private readonly AT_KEY   = '_sat';
    private readonly USR_KEY  = '_susr';
    private readonly TID_KEY  = '_stid';
    private readonly BID_KEY  = '_sbid';

    // ── Write ──────────────────────────────────────────────────────────────────

    setSession(data: SessionData): void {
        this._accessToken = data.accessToken;
        this._tenantId    = data.tenantId;
        this._branchId    = data.branchId;
        this._currentUser = data.user;

        // Persist full session in sessionStorage so a hard-refresh can restore
        // the in-memory state without a round-trip to the refresh endpoint.
        // sessionStorage.setItem(this.RT_KEY,  data.refreshToken);
        sessionStorage.setItem(this.AT_KEY,  data.accessToken);
        sessionStorage.setItem(this.TID_KEY, data.tenantId);
        sessionStorage.setItem(this.BID_KEY, data.branchId);
        sessionStorage.setItem(this.USR_KEY, JSON.stringify(data.user));
    }

    clear(): void {
        this._accessToken = null;
        this._tenantId    = null;
        this._branchId    = null;
        this._currentUser = null;
        [this.RT_KEY, this.AT_KEY, this.USR_KEY, this.TID_KEY, this.BID_KEY]
            .forEach(k => sessionStorage.removeItem(k));
    }

    /**
     * Restores in-memory state from sessionStorage after a page reload.
     * Returns true if a complete session was found and restored.
     */
    restoreFromStorage(): boolean {
        const at   = sessionStorage.getItem(this.AT_KEY);
        const usr  = sessionStorage.getItem(this.USR_KEY);
        const tid  = sessionStorage.getItem(this.TID_KEY);
        const bid  = sessionStorage.getItem(this.BID_KEY);
        if (!at || !usr) return false;

        try {
            this._accessToken = at;
            this._tenantId    = tid;
            this._branchId    = bid;
            this._currentUser = JSON.parse(usr) as Employee;
            return true;
        } catch {
            return false;
        }
    }

    // ── Read ───────────────────────────────────────────────────────────────────

    get accessToken(): string | null   { return this._accessToken; }
    get tenantId(): string | null      { return this._tenantId; }
    get branchId(): string | null      { return this._branchId; }
    get currentUser(): Employee | null { return this._currentUser; }

    get refreshToken(): string | null {
        return sessionStorage.getItem(this.RT_KEY);
    }

    isAuthenticated(): boolean {
        return this._accessToken !== null;
    }
}

export const authStore = new AuthStore();
