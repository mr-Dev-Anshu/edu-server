import axios from "axios";

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

async function sendBrevoEmail(payload) {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is missing");
  }

  if (!process.env.MAIL_SENDER_EMAIL) {
    throw new Error("MAIL_SENDER_EMAIL is missing");
  }

  const response = await axios.post(BREVO_URL, payload, {
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
    },
  });

  return response.data;
}

function getSender() {
  return {
    name: process.env.MAIL_SENDER_NAME || "Edu Startup",
    email: process.env.MAIL_SENDER_EMAIL,
  };
}

export async function sendWelcomeEmail(data) {
  try {
    const payload = {
      sender: getSender(),
      to: [
        {
          email: data.to,
          name: data.name || "User",
        },
      ],
      subject: "Welcome to Edu Startup",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>Hi ${data.name || "there"}!</h1>
          <p>Welcome to Edu Startup.</p>
          <p>Your account has been created successfully.</p>
        </div>
      `,
      textContent: `Hi ${data.name || "there"}, welcome to Edu Startup. Your account has been created successfully.`,
    };

    return await sendBrevoEmail(payload);
  } catch (error) {
    console.error(
      "Welcome email failed:",
      error.response?.data || error.message,
    );
    throw error;
  }
}

export async function sendVerificationEmail(user) {
  try {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const verificationLink = `${frontendUrl}/user-verification/${user.id}`;

    const payload = {
      sender: getSender(),
      to: [
        {
          email: user.email,
          name: user.name || "User",
        },
      ],
      subject: "Verify Your Email Address",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px;">
          <h2>Welcome, ${user.name || "there"}!</h2>
          <p>Please verify your email by clicking the button below:</p>

          <a href="${verificationLink}"
             style="background:#1a73e8;color:white;padding:12px 25px;text-decoration:none;border-radius:6px;display:inline-block;margin:20px 0;">
            Verify Email
          </a>

          <p>Or copy this link:</p>
          <p style="word-break: break-word; color: #1a73e8;">${verificationLink}</p>

          <hr />
          <small>If you did not sign up, you can ignore this email.</small>
        </div>
      `,
      textContent: `Verify your email: ${verificationLink}`,
    };

    return await sendBrevoEmail(payload);
  } catch (error) {
    console.error(
      "Verification email failed:",
      error.response?.data || error.message,
    );
    throw error;
  }
}

export async function sendEnrollEmail(data) {
  try {
    const payload = {
      sender: getSender(),
      to: [
        {
          email: data.to,
          name: data.name || "User",
        },
      ],
      subject: "You have been assigned a test",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>Hi ${data.name || "there"}!</h1>
          <p>You have been assigned a test.</p>
          <p>Please log in to the portal and attempt it.</p>
          ${
            data.testId ? `<p>Test ID: <strong>${data.testId}</strong></p>` : ""
          }
        </div>
      `,
      textContent: `Hi ${data.name || "there"}, you have been assigned a test. Please log in to the portal and attempt it.`,
    };

    return await sendBrevoEmail(payload);
  } catch (error) {
    console.error(
      "Enroll email failed:",
      error.response?.data || error.message,
    );
    throw error;
  }
}
