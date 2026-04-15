import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TenantService } from '../../../src/modules/tenant/tenant.service.js';

describe('TenantService', () => {
  let service;
  let mockRepo;

  beforeEach(() => {
    mockRepo = {
      listWithMetrics: vi.fn(),
    };

    service = new TenantService({
      tenantRepository: mockRepo,
    });
  });

  // ✅ 1. Happy path
  it('should return tenants list', async () => {
    const mockData = { data: [{ id: '1' }], meta: {} };

    mockRepo.listWithMetrics.mockResolvedValue(mockData);

    const result = await service.listTenants({});

    expect(mockRepo.listWithMetrics).toHaveBeenCalledWith({});
    expect(result).toEqual(mockData);
  });

  // ✅ 2. Pass query params correctly
  it('should pass query params to repository', async () => {
    const query = { page: 2, limit: 10 };

    mockRepo.listWithMetrics.mockResolvedValue({ data: [], meta: {} });

    await service.listTenants(query);

    expect(mockRepo.listWithMetrics).toHaveBeenCalledWith(query);
  });

  // ✅ 3. Handle empty result
  it('should handle empty tenants list', async () => {
    const mockData = { data: [], meta: { total: 0 } };

    mockRepo.listWithMetrics.mockResolvedValue(mockData);

    const result = await service.listTenants({});

    expect(result.data).toEqual([]);
    expect(result.meta.total).toBe(0);
  });

  // ✅ 4. Repository throws error
  it('should throw if repository fails', async () => {
    mockRepo.listWithMetrics.mockRejectedValue(new Error('DB Error'));

    await expect(service.listTenants({})).rejects.toThrow('DB Error');
  });

  // ✅ 5. Ensure method is async-safe
  it('should return a promise', () => {
    const result = service.listTenants({});
    expect(result).toBeInstanceOf(Promise);
  });
});