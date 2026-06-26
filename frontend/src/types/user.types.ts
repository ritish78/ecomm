export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  emailVerified: boolean;
};

export type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  isRestoring: boolean;
  setAuth: (user: AuthUser, accessToken: string) => void;
  clearAuth: () => void;
  setRestoring: (value: boolean) => void;
};
