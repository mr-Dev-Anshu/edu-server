import { TenantRepository } from '../repositories/tenant.repository.js';
import { AppError } from '../utils/AppError.js';

const tenantRepo = new TenantRepository();

export class TenantService {
  async registerTenant(data) {
    const existing = await tenantRepo.findBySubdomain(data.subdomain);
    if (existing) throw new AppError('This subdomain is already registered', 400);

    return await tenantRepo.create(data);
  }

  async getTenantDetails(id) {
    return await tenantRepo.findById(id);
  }

  async updateSettings(id, updateData) {
    const tenant = await tenantRepo.findById(id);
    return await tenant.update(updateData);
  }

  async deleteTenant(id) {
    const tenant = await tenantRepo.findById(id);
    return await tenant.destroy(); 
  }
}