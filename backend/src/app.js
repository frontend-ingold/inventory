import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { InventoryController } from "./controllers/inventoryController.js";
import { StoreRepository } from "./repositories/storeRepository.js";
import { createRoutes } from "./routes/index.js";
import { InventoryService } from "./services/inventoryService.js";

export function createApp() {
  const app = express();
  const repository = new StoreRepository(env.dataFile);
  const service = new InventoryService(repository);
  const controller = new InventoryController(service);

  app.use(cors());
  app.use(express.json());
  app.use("/api", createRoutes(controller));

  app.use((error, _req, res, _next) => {
    const status = error.status || 500;
    res.status(status).json({
      message: error.message || "Internal server error"
    });
  });

  return app;
}
