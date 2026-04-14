import { AppError } from '../../utils/AppError.js';

export class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findById({ id, tenantId, include = [] }) {
    const record = await this.model.findOne({
      where: { id, tenantId },
      include,
    });

    if (!record) {
      throw new AppError(`${this.model.name} not found`, 404);
    }

    return record;
  }

  async findAll({ tenantId, filter = {}, include = [] }) {
    return await this.model.findAll({
      where: {
        tenantId,
        ...filter,
      },
      include,
    });
  }

  async create(data, options = {}) {
    return await this.model.create(data, options);
  }

  async update({ id, tenantId, data }) {
    const record = await this.findById({ id, tenantId });
    return await record.update(data);
  }

  async delete({ id, tenantId }) {
    const record = await this.findById({ id, tenantId });
    return await record.destroy();
  }
}