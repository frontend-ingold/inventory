import cors from "cors";
import express from "express";
import { InventoryController } from "./controllers/inventoryController.js";
import { getPool } from "./config/database.js";
import { env } from "./config/env.js";
import { PostgresRepository } from "./repositories/postgresRepository.js";
import { createRoutes } from "./routes/index.js";
import { InventoryService } from "./services/inventoryService.js";

export function createApp() {
  const app = express();
  const repository = new PostgresRepository(getPool());
  const service = new InventoryService(repository);
  const controller = new InventoryController(service);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      optionsSuccessStatus: 204
    })
  );
  app.use(express.json());
  app.use("/api", createRoutes(controller));

  app.use((error, _req, res, _next) => {
    console.error(error);
    const status = error.status || 500;
    res.status(status).json({
      message: error.message || "Internal server error"
    });
  });

  return app;
}
