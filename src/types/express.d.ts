export interface AuthUser {
  id: string;
  phone: string;
  username: string;
  display_name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
