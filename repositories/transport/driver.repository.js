import { BaseRepository } from "../base.repository.js";
import { Driver } from "../../models/index.js";

export class DriverRepository extends BaseRepository {
  constructor() {
    super(Driver);
  }
}
