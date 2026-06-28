declare namespace Express {
  interface Request {
    user?: {
      id: string;
      firstName: string;
    };
  }
}
