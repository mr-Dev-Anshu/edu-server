import { AppError } from "../utils/AppError.js";

const toPositiveInteger = (value, fallback) => {
  const number = Number.parseInt(value, 10);
  return Number.isInteger(number) && number > 0 ? number : fallback;
};

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

  async search(tenantId, query = {}, searchableFields = [], options = {}) {
    const queryObject =
      query && typeof query === "object" ? query : { q: query };
    const searchTerm = String(
      queryObject.q ?? queryObject.search ?? queryObject.keyword ?? "",
    ).trim();
    const fields = Array.isArray(searchableFields)
      ? searchableFields.filter(Boolean)
      : [];
    const {
      filterableFields = [],
      filters = {},
      formatter,
      minSearchLength = 2,
      ...repositoryOptions
    } = options;

    if (!fields.length) {
      throw new AppError("Search fields are required", 400);
    }

    if (searchTerm.length < minSearchLength) {
      throw new AppError(
        `Search term must be at least ${minSearchLength} characters`,
        400,
      );
    }

    const queryFilters = {};
    for (const field of filterableFields) {
      if (queryObject[field] !== undefined && queryObject[field] !== "") {
        queryFilters[field] = queryObject[field];
      }
    }

    const result = await this.repository.search(tenantId, searchTerm, fields, {
      ...repositoryOptions,
      filters: { ...filters, ...queryFilters },
      page: toPositiveInteger(queryObject.page ?? repositoryOptions.page, 1),
      limit: toPositiveInteger(queryObject.limit ?? repositoryOptions.limit, 10),
    });

    return {
      ...result,
      data:
        typeof formatter === "function"
          ? result.data.map((record) => formatter(record))
          : result.data,
    };
  }

  async create(data) {
    return await this.repository.create(data);
  }

  async update(id, tenantId, data) {
    return await this.repository.update(id, tenantId, data);
  }
}
