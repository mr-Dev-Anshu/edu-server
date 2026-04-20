import { Worker } from "bullmq";
import "dotenv/config";
import connection from "../config/bullmq-connection.js";
import { SendMailService } from "../services/sendMail.js";

const sendMailService = new SendMailService();

export class EmailWorker {
  constructor() {
    this.worker = null;
  }

  start() {
    this.worker = new Worker("email", this.processJob.bind(this), {
      connection,
      concurrency: 5,
    });

    this.worker.on("completed", (job) => {
      console.log(`Email job completed: ${job.id}`);
    });

    this.worker.on("failed", (job, err) => {
      console.error(`Email job failed: ${job?.id}`, err.message);
    });

    this.worker.on("error", (err) => {
      console.error("Email worker error:", err.message);
    });

    console.log("BullMQ Email Worker started and ready for jobs");
  }

  async processJob(job) {
    console.log(`Processing email job ${job.id} - ${job.name}`);

    if (job.name === "welcome-candidate") {
      return sendMailService.sendWelcomeEmail(job.data);
    }

    if (job.name === "verification-mail") {
      return sendMailService.sendVerificationEmail(job.data);
    }

    if (job.name === "enroll-candidate") {
      return sendMailService.sendEnrollEmail(job.data);
    }

    throw new Error(`Unknown email job type: ${job.name}`);
  }
}

const emailWorker = new EmailWorker();
emailWorker.start();
