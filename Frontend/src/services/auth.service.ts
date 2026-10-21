/**
 * Service Auth - login / logout / profil
 * Source de verite : backend Laravel (users + divisions + roles + permissions)
 */
import api from './api';
import type { LoginPayload, LoginResponseData, MonUtilisateur, Division } from '../types';

const AUTH_KEYS = {
  token: 'token',
  user: 'utilisateur',
  roles: 'role',
  permissions: 'permissions',
  divisions: 'divisions',
} as const;

export const authService = {
  async login(payload: LoginPayload) {
    const { data } = await api.post<{ success: boolean; data: LoginResponseData; message: string }>(
      '/connexion',
      payload
    );

    if (data.success && data.data) {
      const d = data.data;
      localStorage.setItem(AUTH_KEYS.token, d.token);
      localStorage.setItem(AUTH_KEYS.user, JSON.stringify(d.user));
      localStorage.setItem(AUTH_KEYS.roles, JSON.stringify(d.roles));
      localStorage.setItem(AUTH_KEYS.permissions, JSON.stringify(d.permissions.codes));
      localStorage.setItem(AUTH_KEYS.divisions, JSON.stringify(d.divisions));
      localStorage.setItem('permissionlist', JSON.stringify(d.permissions.details));
      localStorage.removeItem('departements');
      localStorage.removeItem('archive_module');
    }

    return data;
  },

  async logout() {
    try {
      await api.post('/logout');
    } catch {
      // ignore - token peut etre expire
    } finally {
      Object.values(AUTH_KEYS).forEach((key) => localStorage.removeItem(key));
      localStorage.removeItem('permissionlist');
      localStorage.removeItem('user_stats');
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('departements');
      localStorage.removeItem('archive_module');
    }
  },

  async me(): Promise<MonUtilisateur> {
    const { data } = await api.get<{ success: boolean; data: MonUtilisateur }>('/profil/mon-profil');
    return (data as any).data ?? data;
  },

  getToken(): string | null {
    return localStorage.getItem(AUTH_KEYS.token);
  },

  getUser(): MonUtilisateur | null {
    const raw = localStorage.getItem(AUTH_KEYS.user);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as MonUtilisateur;
    } catch {
      return null;
    }
  },

  getPermissions(): string[] {
    const raw = localStorage.getItem(AUTH_KEYS.permissions);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  },

  hasPermission(code: string): boolean {
    return this.getPermissions().includes(code);
  },

  getDivisions(): Division[] {
    const raw = localStorage.getItem(AUTH_KEYS.divisions);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as Division[];
    } catch {
      return [];
    }
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};

export default authService;
