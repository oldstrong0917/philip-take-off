import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "default-secret";

export interface AdminPayload {
  id: number;
  username: string;
}

export function generateToken(payload: AdminPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
}

export function verifyToken(token: string): AdminPayload {
  return jwt.verify(token, JWT_SECRET) as AdminPayload;
}

export function getAdminFromContext(context: {
  admin?: AdminPayload | null;
}): AdminPayload {
  if (!context.admin) {
    throw new Error("未經授權：請先登入管理者帳號");
  }
  return context.admin;
}
