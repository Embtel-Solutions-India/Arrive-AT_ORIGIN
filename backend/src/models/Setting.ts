import mongoose, { Schema, Document } from "mongoose";

export interface ISetting extends Document {
  key: string;
  value: Schema.Types.Mixed;
  group: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettingSchema = new Schema<ISetting>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
    group: { type: String, default: "general", index: true },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Setting =
  mongoose.models.Setting || mongoose.model<ISetting>("Setting", SettingSchema);
