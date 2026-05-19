import dotenv from "dotenv";

dotenv.config({
  path: new URL("../../.env", import.meta.url)
});

export const env = {
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "change-me",
  adminEmail: process.env.ADMIN_EMAIL || "admin@mns.local",
  adminPassword: process.env.ADMIN_PASSWORD || "Admin@123",
  adminName: process.env.ADMIN_NAME || "MNS Admin",
  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:5173,https://mns-inventory.vercel.app")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
};
