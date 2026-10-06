import mongoose, { Schema, Document } from "mongoose";

export interface IBackupRecord extends Document {
  filename: string;
  size: number;
  type: "MANUAL" | "AUTOMATIC";
  status: "COMPLETED" | "FAILED" | "RESTORED";
  collectionsCount: number;
  recordsCount: number;
  createdBy: string;
  checksum?: string;
  createdAt: Date;
}

const BackupRecordSchema = new Schema<IBackupRecord>(
  {
    filename: { type: String, required: true, unique: true },
    size: { type: Number, required: true, default: 0 },
    type: { type: String, enum: ["MANUAL", "AUTOMATIC"], default: "MANUAL" },
    status: {
      type: String,
      enum: ["COMPLETED", "FAILED", "RESTORED"],
      default: "COMPLETED",
    },
    collectionsCount: { type: Number, default: 0 },
    recordsCount: { type: Number, default: 0 },
    createdBy: { type: String, default: "Super Admin" },
    checksum: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

BackupRecordSchema.index({ createdAt: -1 });

export const BackupRecord =
  mongoose.models.BackupRecord || mongoose.model<IBackupRecord>("BackupRecord", BackupRecordSchema);
