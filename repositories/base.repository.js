import { AppError } from '../utils/AppError.js';

export class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  // Argument change: 'include' ki jagah 'options' use karo jo flexible ho
  async findById(id, tenantId, options = {}) {
    // Agar options ek array hai (puraane code ke liye support), toh use include bana do
    const queryOptions = Array.isArray(options) ? { include: options } : options;
    
    const record = await this.model.findOne({ 
      where: { id, tenantId }, 
      ...queryOptions // Isme transaction aur include dono sahi jagah jayenge
    });

    if (!record) throw new AppError(`${this.model.name} not found`, 404);
    return record;
  }

  async findAll(tenantId, filter = {}, options = {}) {
    // Same logic: options handles include and transaction
    const queryOptions = Array.isArray(options) ? { include: options } : options;

    return await this.model.findAll({ 
      where: { ...filter, tenantId }, 
      ...queryOptions 
    });
  }

  async create(data, options = {}) {
    return await this.model.create(data, options);
  }

  // Update aur Delete mein bhi options (transaction) pass karna zaroori hai
  async update(id, tenantId, data, options = {}) {
    const record = await this.findById(id, tenantId, options);
    return await record.update(data, options);
  }
 
  async delete(id, tenantId, options = {}) {
    const record = await this.findById(id, tenantId, options);
    return await record.destroy(options);
  }
}