import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

let isConnecting = false;

export async function connectDB(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (isConnecting) {
    while (isConnecting) {
      await new Promise((res) => setTimeout(res, 100));
    }
    return mongoose;
  }

  try {
    isConnecting = true;
    mongoose.set("strictQuery", false);

    const conn = await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    });

    logger.info("Connected to MongoDB Atlas database: " + (conn.connection.db?.databaseName ?? "soulbody"));
    return conn;
  } catch (err) {
    logger.error({ err }, "MongoDB Atlas connection failed");
    throw err;
  } finally {
    isConnecting = false;
  }
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info("MongoDB disconnected gracefully");
  }
}
