import Sport from "../models/sports.js";
import { BaseRepository } from "./base.repository.js";

class SportRepository extends BaseRepository {
  constructor() {
    super(Sport);
  }

  // Optional: Search sports by name
  async findByName(name, tenantId) {
    return await this.model.findOne({
      where: {
        name,
        tenantId,
      },
    });
  }

  // Optional: Get sports by status
  async findByStatus(status, tenantId) {
    return await this.findAll(tenantId, { status });
  }

  // Optional: Get upcoming sports events
  async getUpcomingSports(tenantId) {
    return await this.findAll(tenantId, {
      status: "Upcoming",
    });
  }
}

export default new SportRepository();
