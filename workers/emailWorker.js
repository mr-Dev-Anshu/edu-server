import { Worker } from "bullmq";
import "dotenv/config";
import connection from "../config/bullmq-connection.js";
import {
  sendEnrollEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "../services/sendMail.js";

const worker = new Worker(
  "email",
  async (job) => {
    console.log(`Processing email job ${job.id} - ${job.name}`);

    if (job.name === "welcome-candidate") {
      return sendWelcomeEmail(job.data);
    }

    if (job.name === "verification-mail") {
      return sendVerificationEmail(job.data);
    }

    if (job.name === "enroll-candidate") {
      return sendEnrollEmail(job.data);
    }

    throw new Error(`Unknown email job type: ${job.name}`);
  },
  {
    connection,
    concurrency: 5,
  },
);

worker.on("completed", (job) => {
  console.log(`Email job completed: ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`Email job failed: ${job?.id}`, err.message);
});

worker.on("error", (err) => {
  console.error("Email worker error:", err.message);
});

console.log("BullMQ Email Worker started and ready for jobs");
