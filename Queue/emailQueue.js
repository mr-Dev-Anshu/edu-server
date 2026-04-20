import { Queue } from "bullmq";
import connection from "../config/bullmq-connection.js";

export class EmailQueue {
  constructor() {
    this.queue = new Queue("email", {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });
  }

  async addWelcomeEmailJob(data) {
    return this.queue.add("welcome-candidate", {
      to: data.to,
      name: data.name,
    });
  }

  async addVerificationEmailJob(data) {
    return this.queue.add("verification-mail", {
      id: data.id,
      email: data.email,
      name: data.name,
    });
  }

  async addEnrollEmailJob(data) {
    return this.queue.add("enroll-candidate", {
      to: data.to,
      name: data.name,
      testId: data.testId,
    });
  }
}
