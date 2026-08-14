import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";

export type AuthedUser = {
  id: string;
  email: string;
  name: string;
  plan: "free" | "premium";
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthedUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) {
    return res.status(401).json({ message: "Authentication required" });
  }
  req.user = session.user as AuthedUser;
  next();
}
