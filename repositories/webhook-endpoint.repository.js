import { WebhookEndpoint } from "../models/index.js";
import { BaseRepository } from "./base.repository.js";

export class WebhookEndpointRepository extends BaseRepository {
  constructor() {
    super(WebhookEndpoint);
  }
}
