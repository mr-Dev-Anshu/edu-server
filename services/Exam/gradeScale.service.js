import { GradeScaleRepository } from "../../repositories/Exam/gradeScale.repository.js";
import { AppError } from "../../utils/AppError.js";

const gradeScaleRepo = new GradeScaleRepository();

export class GradeScaleService {
  async createGradeScale(tenantId, payload) {
    const { name, scaleType, isDefault } = payload;

    const existing = await gradeScaleRepo.findByName(name.trim(), tenantId);
    if (existing) {
      throw new AppError("A grade scale with this name already exists", 400);
    }

    const gradeScale = await gradeScaleRepo.create({
      tenantId,
      name: name.trim(),
      scaleType,
      isDefault: false,
    });

    if (isDefault) {
      await gradeScaleRepo.setDefault(gradeScale.id, tenantId);
    }

    const finalGradeScale = await gradeScaleRepo.findById(
      gradeScale.id,
      tenantId
    );

    return this.formatResponse(finalGradeScale);
  }

  async getAllGradeScales(tenantId, query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;

    const filters = {};
    if (query.scaleType) filters.scaleType = query.scaleType;
    if (query.isDefault === "true") filters.isDefault = true;

    return await gradeScaleRepo.findWithPagination(
      tenantId,
      filters,
      page,
      limit
    );
  }

  async getGradeScaleById(id, tenantId) {
    const gradeScale = await gradeScaleRepo.findById(id, tenantId);
    if (!gradeScale) throw new AppError("Grade scale not found", 404);
    return this.formatResponse(gradeScale);
  }

  async getDefaultGradeScale(tenantId) {
    const gradeScale = await gradeScaleRepo.findDefault(tenantId);
    if (!gradeScale) {
      throw new AppError("No default grade scale set for this tenant", 404);
    }

    return this.formatResponse(gradeScale);
  }

  async updateGradeScale(id, tenantId, updateData) {
    const gradeScale = await gradeScaleRepo.findById(id, tenantId);
     if (!gradeScale) throw new AppError("Grade scale not found", 404);

    // if (updateData.name && updateData.name.trim() !== gradeScale.name) {
    //   const existing = await gradeScaleRepo.findByName(
    //     updateData.name.trim(),
    //     tenantId
    //   );

    //   if (existing) {
    //     throw new AppError("A grade scale with this name already exists", 400);
    //   }
    // }

    // const updated = await gradeScaleRepo.update(id, tenantId, {
    //   ...(updateData.name !== undefined
    //     ? { name: updateData.name.trim() }
    //     : {}),
    //   ...(updateData.scaleType !== undefined
    //     ? { scaleType: updateData.scaleType }
    //     : {}),
    //   ...(updateData.isDefault !== undefined
    //     ? { isDefault: updateData.isDefault }
    //     : {}),
    // });

    // if (updateData.isDefault === true) {
    //   await gradeScaleRepo.setDefault(id, tenantId);
    // }

    // return this.formatResponse(updated);
  }

  async deleteGradeScale(id, tenantId) {
    const gradeScale = await gradeScaleRepo.findById(id, tenantId);
      if (!gradeScale) throw new AppError("Grade scale not found", 404);

    if (gradeScale.isDefault) {
      throw new AppError("Cannot delete the default grade scale", 400);
    }

    // await gradeScaleRepo.delete(id, tenantId);

    // return {
    //   message: "Grade scale deleted successfully",
    //   data: this.formatResponse(gradeScale),
    // };
  }

  async setDefaultGradeScale(id, tenantId) {
    await gradeScaleRepo.findById(id, tenantId);

    await gradeScaleRepo.setDefault(id, tenantId);

    const updated = await gradeScaleRepo.findById(id, tenantId);

    return this.formatResponse(updated);
  }

  formatResponse(gradeScale) {
    return {
      id: gradeScale.id,
      tenantId: gradeScale.tenantId,
      name: gradeScale.name,
      scaleType: gradeScale.scaleType,
      isDefault: gradeScale.isDefault,
      createdAt: gradeScale.createdAt,
      updatedAt: gradeScale.updatedAt,
    };
  }
}