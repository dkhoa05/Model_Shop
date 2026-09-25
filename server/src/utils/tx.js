import mongoose from "mongoose";

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function transactionsUnsupported(err) {
  const msg = String(err?.message || "");
  return (
    err?.code === 20 ||
    /Transaction numbers are only allowed|replica set|does not support transactions/i.test(msg)
  );
}

/**
 * Chạy fn(session) trong transaction Mongo (cần replica set — Atlas mặc định có).
 * Môi trường dev standalone không hỗ trợ transaction → chạy fn(null) (fn tự bù trừ khi session = null).
 */
export async function withTransaction(fn) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } catch (err) {
    if (transactionsUnsupported(err)) return fn(null);
    throw err;
  } finally {
    await session.endSession();
  }
}
