export class BaseService {
  constructor(repository) {
    this.repository = repository;
  }

  async getAll(tenantId, query) {
    return await this.repository.findAll(tenantId, query);
  }

  async getOne(id, tenantId) {
    return await this.repository.findById(id, tenantId);
  }

  async create(data) {
    return await this.repository.create(data);
  }

  async update(id, tenantId, data) {
    return await this.repository.update(id, tenantId, data);
  }
}