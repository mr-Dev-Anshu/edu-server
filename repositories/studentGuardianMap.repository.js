import { StudentGuardianMap } from "../models/index.js";
import { BaseRepository } from "./base.repository.js";

export class StudentGuardianMapRepository extends BaseRepository {
  constructor() {
    super(StudentGuardianMap);
  }

  async getStudentMappings(studentId, tenantId, options = {}) {
    return await this.model.findAll({ where: { studentId, tenantId }, ...options });
  }

  async addMapping(studentId, guardianId, tenantId, { relationType, isPrimary, canPickup } = {}, options = {}) {
    return await this.model.create(
      { studentId, guardianId, tenantId, relationType, isPrimary, canPickup },
      options,
    );
  }

  async addMappings(rows, options = {}) {
    if (!rows?.length) {
      return [];
    }

    return await this.model.bulkCreate(rows, options);
  }

  async updateMapping(studentId, guardianId, tenantId, { relationType, isPrimary, canPickup } = {}, options = {}) {
    const record = await this.model.findOne({ where: { studentId, guardianId, tenantId }, ...options });
    if (!record) return null;
    return await record.update({ relationType, isPrimary, canPickup }, options);
  }

  async removeMapping(studentId, guardianId, tenantId, options = {}) {
    return await this.model.destroy({ where: { studentId, guardianId, tenantId }, ...options });
  }

  async removeAllStudentMappings(studentId, tenantId, options = {}) {
    return await this.model.destroy({ where: { studentId, tenantId }, ...options });
  }

  async getGuardianIdsForStudent(studentId, tenantId, options = {}) {
    const mappings = await this.getStudentMappings(studentId, tenantId, options);
    return mappings.map((m) => m.guardianId);
  }
}
