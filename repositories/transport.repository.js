import { Vehicle } from "../models/index.js";
import { BaseRepository } from "./base.repository.js";

export class TransportRepository extends BaseRepository {
  constructor() {
    super(Vehicle);
  }
}