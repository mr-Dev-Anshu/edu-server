import { Op } from 'sequelize';
import { Permission } from '../../models/Permission.js';
import { BaseRepository } from '../base/base.repository.js';

export class PermissionRepository extends BaseRepository {
  constructor() {
    super(Permission);
  }

  async findByName(name) {
    return await this.model.findOne({ where: { name } });
  }

  async findByIds(ids) {
    return await this.model.findAll({
      where: {
        id: {
          [Op.in]: ids,
        },
      },
      order: [['name', 'ASC']],
    });
  }
}
