import sportService from "../services/sports.service.js";

class SportController {
  async createSport(req, res, next) {
    try {
      const sport = await sportService.createSport({
        ...req.body,
        tenantId: req.user.tenantId, // Change this if your tenantId comes from somewhere else
      });

      res.status(201).json({
        success: true,
        message: "Sport created successfully",
        data: sport,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllSports(req, res, next) {
    try {
      const sports = await sportService.getAllSports(req.user.tenantId);

      res.status(200).json({
        success: true,
        data: sports,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSportById(req, res, next) {
    try {
      const sport = await sportService.getSportById(
        req.params.id,
        req.user.tenantId,
      );

      res.status(200).json({
        success: true,
        data: sport,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSport(req, res, next) {
    try {
      const sport = await sportService.updateSport(
        req.params.id,
        req.user.tenantId,
        req.body,
      );

      res.status(200).json({
        success: true,
        message: "Sport updated successfully",
        data: sport,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteSport(req, res, next) {
    try {
      await sportService.deleteSport(req.params.id, req.user.tenantId);

      res.status(200).json({
        success: true,
        message: "Sport deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async searchSports(req, res, next) {
    try {
      const { search } = req.query;

      const result = await sportService.searchSports(req.user.tenantId, search);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSportsByStatus(req, res, next) {
    try {
      const sports = await sportService.getSportsByStatus(
        req.params.status,
        req.user.tenantId,
      );

      res.status(200).json({
        success: true,
        data: sports,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SportController();
