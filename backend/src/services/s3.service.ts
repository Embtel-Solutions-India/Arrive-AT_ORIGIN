import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import type { Readable } from "stream";
import fs from "fs";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

let s3ClientInstance: S3Client | null = null;

export function isS3Configured(): boolean {
  return Boolean(
    env.AWS_S3_BUCKET &&
    env.AWS_ACCESS_KEY_ID &&
    env.AWS_SECRET_ACCESS_KEY
  );
}

function getS3Client(): S3Client {
  if (!s3ClientInstance) {
    if (!isS3Configured()) {
      throw new Error("AWS S3 credentials or bucket are not properly configured");
    }
    s3ClientInstance = new S3Client({
      region: env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID!.trim(),
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY!.trim(),
      },
    });
  }
  return s3ClientInstance;
}

export interface S3UploadResult {
  url: string;
  key: string;
  bucket: string;
}

export async function uploadFileToS3(options: {
  buffer?: Buffer;
  filePath?: string;
  filename: string;
  mimeType: string;
}): Promise<S3UploadResult> {
  const client = getS3Client();
  const bucket = env.AWS_S3_BUCKET!.trim();
  const region = (env.AWS_REGION || "us-east-1").trim();

  let body: Buffer;
  if (options.buffer) {
    body = options.buffer;
  } else if (options.filePath) {
    body = fs.readFileSync(options.filePath);
  } else {
    throw new Error("Neither buffer nor filePath was provided for S3 upload");
  }

  const key = `media/${options.filename}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: options.mimeType,
    ContentDisposition: "inline",
  });

  await client.send(command);
  logger.info({ bucket, key, region }, "Uploaded file to AWS S3");

  const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  return { url, key, bucket };
}

export async function deleteFileFromS3(key: string): Promise<void> {
  if (!isS3Configured()) return;
  const client = getS3Client();
  const bucket = env.AWS_S3_BUCKET!.trim();

  try {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    await client.send(command);
    logger.info({ bucket, key }, "Deleted file from AWS S3");
  } catch (err) {
    logger.warn({ err, key, bucket }, "Failed to delete file from AWS S3");
  }
}

export async function getFileStreamFromS3(key: string): Promise<Readable | null> {
  if (!isS3Configured()) return null;
  const client = getS3Client();
  const bucket = env.AWS_S3_BUCKET!.trim();

  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    const response = await client.send(command);
    return response.Body as unknown as Readable;
  } catch (err) {
    logger.warn({ err, key, bucket }, "Failed to stream file from AWS S3");
    return null;
  }
}
