import { TOKEN_COOKIE_NAME } from "../config/constants.js";
const parseDurationToMs = (duration) => {
  if (!duration || typeof duration !== "string") {
    return undefined;
  }

  const match = duration.trim().match(/^(\d+)([smhd])$/i);

  if (!match) {
    return undefined;
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();

  const unitToMs = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * unitToMs[unit];
};

export const getTokenCookieName = () => TOKEN_COOKIE_NAME;

export const getTokenCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const maxAge = parseDurationToMs(process.env.JWT_EXPIRY);

  const options = {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    path: "/",
  };

  if (maxAge) {
    options.maxAge = maxAge;
  }

  return options;
};

export const getTokenCookieClearOptions = () => {
  const { httpOnly, sameSite, secure, path } = getTokenCookieOptions();

  return {
    httpOnly,
    sameSite,
    secure,
    path,
    maxAge: 0,
  };
};

export const getCookieValue = (cookieHeader, cookieName) => {
  if (!cookieHeader) {
    return undefined;
  }

  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const [rawName, ...rawValueParts] = cookie.trim().split("=");

    if (rawName === cookieName) {
      const value = rawValueParts.join("=");

      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }

  return undefined;
};
