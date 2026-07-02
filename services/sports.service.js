import sportRepository from "../repositories/sports.repository.js";
import { AppError } from "../utils/AppError.js";

class SportService {
  async createSport(data) {
    const existingSport = await sportRepository.findByName(
      data.name,
      data.tenantId,
    );

    if (existingSport) {
      throw new AppError("Sport already exists", 400);
    }

    return await sportRepository.create(data);
  }

  async getAllSports(tenantId) {
    return await sportRepository.findAll(tenantId);
  }

  async getSportById(id, tenantId) {
    return await sportRepository.findById(id, tenantId);
  }

  async updateSport(id, tenantId, data) {
    if (data.name) {
      const existingSport = await sportRepository.findByName(
        data.name,
        tenantId,
      );

      if (existingSport && existingSport.id !== Number(id)) {
        throw new AppError("Sport already exists", 400);
      }
    }

    return await sportRepository.update(id, tenantId, data);
  }

  async deleteSport(id, tenantId) {
    return await sportRepository.delete(id, tenantId);
  }

  async searchSports(tenantId, searchTerm) {
    return await sportRepository.search(tenantId, searchTerm, [
      "name",
      "description",
      "location",
    ]);
  }

  async getSportsByStatus(status, tenantId) {
    return await sportRepository.findByStatus(status, tenantId);
  }

  async getUpcomingSports(tenantId) {
    return await sportRepository.getUpcomingSports(tenantId);
  }
}

export default new SportService();
