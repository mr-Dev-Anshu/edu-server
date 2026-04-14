import { TenantRepository } from './tenant.repository.js';
import { TenantService } from './tenant.service.js';
import { TenantController } from './tenant.controller.js';

export const initTenantModule = () => {
  const tenantRepository = new TenantRepository();

  const tenantService = new TenantService({
    tenantRepository,
  });

  const tenantController = new TenantController({
    tenantService,
  });

  return {
    tenantController,
  };
};