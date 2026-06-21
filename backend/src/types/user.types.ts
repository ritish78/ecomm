export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  googleId: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  emailVerifiedAt: Date | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  googleId: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  active: boolean;
}
