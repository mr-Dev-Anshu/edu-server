import { BiometricPunch } from "../models/index.js";
import { BaseRepository } from "./base.repository.js";

export class BiometricPunchRepository extends BaseRepository {
  constructor() {
    super(BiometricPunch);
  }
}
