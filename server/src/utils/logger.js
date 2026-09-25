import pino from "pino";

/** Log JSON có cấu trúc (dễ tìm/đẩy lên hệ thống log). Đặt LOG_LEVEL=debug|info|warn|error. */
export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "test" ? "silent" : "info"),
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "res.headers['set-cookie']"],
    censor: "[redacted]"
  }
});
