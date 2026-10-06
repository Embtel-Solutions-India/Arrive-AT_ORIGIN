import type { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { Media } from "../../models/Media.js";
import { ok } from "../../utils/response.js";
import { HttpError } from "../../utils/httpError.js";
import { uploadDir } from "../../middleware/upload.js";
import { isS3Configured, uploadFileToS3, deleteFileFromS3, getFileStreamFromS3 } from "../../services/s3.service.js";
import { logger } from "../../utils/logger.js";

export const mediaController = {
  async getMedia(req: Request, res: Response) {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 24);
    const search = (req.query.search as string) || "";
    const type = req.query.type as string | undefined;

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { originalName: { $regex: search, $options: "i" } },
        { altText: { $regex: search, $options: "i" } },
      ];
    }
    if (type) {
      query.mimeType = { $regex: type, $options: "i" };
    }

    const [media, total] = await Promise.all([
      Media.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Media.countDocuments(query),
    ]);

    ok(res, {
      media,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  },

  async uploadFiles(req: Request, res: Response) {
    const files = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);
    if (!files || files.length === 0) {
      throw HttpError.badRequest("No image files provided for upload");
    }

    const createdMedia = [];
    const useS3 = isS3Configured();

    for (const f of files) {
      let finalUrl = `/uploads/${f.filename}`;
      let s3Key: string | undefined;
      let storageType: "s3" | "local" = "local";

      if (useS3) {
        try {
          const s3Result = await uploadFileToS3({
            filePath: f.path,
            filename: f.filename,
            mimeType: f.mimetype,
          });
          finalUrl = s3Result.url;
          s3Key = s3Result.key;
          storageType = "s3";

          // Safely remove local temporary file after S3 upload succeeds
          if (fs.existsSync(f.path)) {
            try {
              fs.unlinkSync(f.path);
            } catch {
              // Ignore local cleanup error
            }
          }
        } catch (s3Err) {
          logger.error({ err: s3Err, file: f.originalname }, "S3 upload failed, falling back to local file");
          finalUrl = `/uploads/${f.filename}`;
          storageType = "local";
        }
      }

      const doc = await Media.create({
        filename: f.filename,
        originalName: f.originalname,
        url: finalUrl,
        mimeType: f.mimetype,
        size: f.size,
        altText: path.parse(f.originalname).name.replace(/[-_]/g, " "),
        uploadedBy: req.user?.name || "Admin",
        s3Key,
        storage: storageType,
      });
      createdMedia.push(doc);
    }

    ok(res, { media: createdMedia }, `${createdMedia.length} file(s) uploaded successfully`, 201);
  },

  async deleteMedia(req: Request, res: Response) {
    const { id } = req.params;
    const media = await Media.findById(id);
    if (!media) throw HttpError.notFound("Media item not found");

    // Delete from S3 if it was stored in S3 or has an s3Key
    if (media.storage === "s3" || media.s3Key || media.url.includes("amazonaws.com")) {
      const key = media.s3Key || `media/${media.filename}`;
      await deleteFileFromS3(key);
    }

    // Delete local file if it exists
    const filePath = path.join(uploadDir, media.filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {
        // Log & continue
      }
    }

    await Media.findByIdAndDelete(id);
    ok(res, null, "Media item deleted successfully");
  },

  async updateMedia(req: Request, res: Response) {
    const { id } = req.params;
    const { title, altText, caption, seoDescription, customUrl } = req.body;

    const media = await Media.findById(id);
    if (!media) throw HttpError.notFound("Media item not found");

    if (title !== undefined) media.title = title;
    if (altText !== undefined) media.altText = altText;
    if (caption !== undefined) media.caption = caption;
    if (seoDescription !== undefined) media.seoDescription = seoDescription;
    if (customUrl !== undefined) media.customUrl = customUrl;

    await media.save();
    ok(res, { media }, "Media updated successfully");
  },

  async downloadMedia(req: Request, res: Response) {
    const { id } = req.params;
    const media = await Media.findById(id);
    if (!media) throw HttpError.notFound("Media item not found");

    const downloadFilename = media.originalName || media.filename;

    if (media.storage === "s3" || media.s3Key || media.url.includes("amazonaws.com")) {
      const key = media.s3Key || `media/${media.filename}`;
      const stream = await getFileStreamFromS3(key);
      if (stream) {
        res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(downloadFilename)}"`);
        res.setHeader("Content-Type", media.mimeType || "application/octet-stream");
        return (stream as any).pipe(res);
      }
      // If direct stream fails, redirect to S3 URL
      return res.redirect(media.url);
    }

    const localPath = path.join(uploadDir, media.filename);
    if (fs.existsSync(localPath)) {
      return res.download(localPath, downloadFilename);
    }

    return res.redirect(media.url);
  },
};
