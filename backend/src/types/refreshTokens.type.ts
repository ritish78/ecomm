export interface RefreshToken {
  id: number;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revoked: boolean;
}
