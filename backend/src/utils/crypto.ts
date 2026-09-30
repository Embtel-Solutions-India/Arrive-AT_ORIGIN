import { createHash, randomBytes } from "node:crypto";

export const randomToken = (bytes = 48) => randomBytes(bytes).toString("base64url");
export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
