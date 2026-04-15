import { AppError } from "../../utils/AppError.js";

const VALID_STATUSES = ["queued", "sent", "delivered", "failed"];
const VALID_CHANNELS = ["sms", "email", "push", "whatsapp"];

const createValidator = (validateFn) => (req, res, next) => {
  try {
    validateFn(req);
    next();
  } catch (error) {
    next(error);
  }
};

export const createNotificationLogValidator = createValidator((req) => {
  const { body } = req;

  if (!body.channel) throw new AppError("channel is required", 400);
  if (!VALID_CHANNELS.includes(body.channel)) {
    throw new AppError(`channel must be one of: ${VALID_CHANNELS.join(", ")}`, 400);
  }

  if (!body.recipientId) throw new AppError("recipientId is required", 400);

  if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
    throw new AppError(`status must be one of: ${VALID_STATUSES.join(", ")}`, 400);
  }
});

export const getByStatusValidator = createValidator((req) => {
  const { status } = req.params;
  if (!status) throw new AppError("status is required", 400);
  if (!VALID_STATUSES.includes(status)) {
    throw new AppError(`status must be one of: ${VALID_STATUSES.join(", ")}`, 400);
  }
});

export const getByChannelValidator = createValidator((req) => {
  const { channel } = req.params;
  if (!channel) throw new AppError("channel is required", 400);
  if (!VALID_CHANNELS.includes(channel)) {
    throw new AppError(`channel must be one of: ${VALID_CHANNELS.join(", ")}`, 400);
  }
});

export const getByRecipientValidator = createValidator((req) => {
  if (!req.params.recipientId) {
    throw new AppError("recipientId is required", 400);
  }
});

export const markAsSentValidator = createValidator((req) => {
  if (!req.params.id) {
    throw new AppError("id is required", 400);
  }
});