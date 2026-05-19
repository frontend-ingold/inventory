export class InventoryController {
  constructor(service) {
    this.service = service;
  }

  list = (collection) => async (_req, res, next) => {
    try {
      const data = await this.service.list(collection);
      res.json(data);
    } catch (error) {
      next(error);
    }
  };

  create = (collection) => async (req, res, next) => {
    try {
      const data = await this.service.createEntity(collection, req.body);
      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  };

  update = (collection) => async (req, res, next) => {
    try {
      const data = await this.service.updateEntity(collection, req.params.id, req.body);
      res.json(data);
    } catch (error) {
      next(error);
    }
  };

  remove = (collection) => async (req, res, next) => {
    try {
      const data = await this.service.deleteEntity(collection, req.params.id);
      res.json(data);
    } catch (error) {
      next(error);
    }
  };

  dashboard = async (_req, res, next) => {
    try {
      const data = await this.service.getDashboard();
      res.json(data);
    } catch (error) {
      next(error);
    }
  };

  createPurchase = async (req, res, next) => {
    try {
      const data = await this.service.createPurchase(req.body);
      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  };

  createSale = async (req, res, next) => {
    try {
      const data = await this.service.createSale(req.body);
      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  };

  createAdjustment = async (req, res, next) => {
    try {
      const data = await this.service.createAdjustment(req.body);
      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  };

  login = async (req, res, next) => {
    try {
      const data = await this.service.login(req.body);
      res.json(data);
    } catch (error) {
      next(error);
    }
  };

  me = async (req, res, next) => {
    try {
      const data = await this.service.getCurrentUser(req.user?.sub);
      res.json(data);
    } catch (error) {
      next(error);
    }
  };
}
