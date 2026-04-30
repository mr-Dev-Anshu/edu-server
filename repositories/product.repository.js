import Product from "../models/Products.js";
import { BaseRepository } from "./base.repository.js";

export class ProductRepository extends BaseRepository {
  constructor() {
    super(Product);
  }
}
