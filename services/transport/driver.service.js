import { BaseService } from "../base.service.js";
import { DriverRepository } from "../../repositories/transport/driver.repository.js";

const driverRepository = new DriverRepository();

export class DriverService extends BaseService {
  constructor() {
    super(driverRepository);
  }

  async delete(id, tenantId) {
    return await this.repository.delete(id, tenantId);
  }
}
