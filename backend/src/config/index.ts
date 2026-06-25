export const NODE_ENV = process.env.NODE_ENV;
export const EXPRESS_SERVER_PORT = Number(process.env.EXPRESS_SERVER_PORT) || 5000;
export const FRONTEND_URL = process.env.FRONTEND_URL;
export const POSTGRES_DATA_URL = process.env.POSTGRES_DATA_URL;
export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: NODE_ENV === "production",
  sameSite: "strict" as const,
};

export const ACCESS_TOKEN_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 10 * 60 * 1000,
};

export const REFRESH_TOKEN_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
