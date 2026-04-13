import { TransportRepository } from "../repositories/transport.repository.js";
import { BaseService} from "./base.service.js"

const transportRepo = new TransportRepository();

export class TransportServiceService extends BaseService {
  constructor() {
    super(transportRepo);
  }
}