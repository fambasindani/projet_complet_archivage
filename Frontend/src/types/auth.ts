import type { MonUtilisateur, Role, Division, Permission } from './models';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponseData {
  user: MonUtilisateur;
  roles: Role[];
  permissions: {
    codes: string[];
    details: Permission[];
  };
  divisions: Division[];
  token: string;
  token_type: 'Bearer';
  stats: {
    roles_count: number;
    permissions_count: number;
    divisions_count: number;
  };
}

export interface AuthState {
  user: MonUtilisateur | null;
  token: string | null;
  roles: Role[];
  permissions: string[]; // codes
  divisions: Division[];
  isAuthenticated: boolean;
}

export interface DecodedTokenPayload {
  // Sanctum personal_access_token abilities = permissions codes
  abilities: string[];
}
