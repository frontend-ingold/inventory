import { HttpError } from "../utils/httpError.js";
import { verifyAuthToken } from "../utils/auth.js";

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    next(new HttpError(401, "Authentication required"));
    return;
  }

  try {
    req.user = verifyAuthToken(token);
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired token"));
  }
}
