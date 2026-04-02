import Tenant from '../models/Tenant.js';
import { AppError } from '../utils/AppError.js';
import { BaseRepository } from './base.repository.js';

export class TenantRepository extends BaseRepository {
  constructor() {
    super(Tenant);
  }

  async findById(id) {
    const tenant = await this.model.findByPk(id);
    if (!tenant) throw new AppError('Organization not found', 404);
    return tenant;
  }

  async findAll(options = {}) {
    return await this.model.findAll(options);
  }

  async findBySubdomain(subdomain) {
    return await this.model.findOne({ where: { subdomain } });
  }

}