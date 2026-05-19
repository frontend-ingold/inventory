import { Router } from "express";

export function createRoutes(controller) {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  router.get("/dashboard", controller.dashboard);

  router
    .route("/categories")
    .get(controller.list("categories"))
    .post(controller.create("categories"));
  router
    .route("/categories/:id")
    .put(controller.update("categories"))
    .delete(controller.remove("categories"));

  router
    .route("/suppliers")
    .get(controller.list("suppliers"))
    .post(controller.create("suppliers"));
  router
    .route("/suppliers/:id")
    .put(controller.update("suppliers"))
    .delete(controller.remove("suppliers"));

  router
    .route("/customers")
    .get(controller.list("customers"))
    .post(controller.create("customers"));
  router
    .route("/customers/:id")
    .put(controller.update("customers"))
    .delete(controller.remove("customers"));

  router
    .route("/products")
    .get(controller.list("products"))
    .post(controller.create("products"));
  router
    .route("/products/:id")
    .put(controller.update("products"))
    .delete(controller.remove("products"));

  router.get("/purchases", controller.list("purchases"));
  router.post("/purchases", controller.createPurchase);
  router.get("/sales", controller.list("sales"));
  router.post("/sales", controller.createSale);
  router.get("/adjustments", controller.list("adjustments"));
  router.post("/adjustments", controller.createAdjustment);
  router.get("/stock-movements", controller.list("stockMovements"));

  return router;
}
