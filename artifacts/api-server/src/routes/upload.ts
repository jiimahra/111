import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import { objectStorageClient } from "../lib/objectStorage";
import { ObjectNotFoundError } from "../lib/objectStorage";

const router: IRouter = Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/quicktime", "video/webm", "video/3gpp", "video/x-msvideo"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only images and videos are allowed"));
    }
  },
});

function getBucketAndDir() {
  const privateDir = process.env.PRIVATE_OBJECT_DIR ?? "";
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID ?? "";
  if (!privateDir || !bucketId) throw new Error("Object storage not configured");
  const dirWithinBucket = privateDir.replace(`gs://${bucketId}/`, "").replace(/\/$/, "");
  return { bucketId, dirWithinBucket };
}

router.post("/upload", upload.array("files", 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: "No files uploaded" });
      return;
    }

    const { bucketId, dirWithinBucket } = getBucketAndDir();
    const bucket = objectStorageClient.bucket(bucketId);

    const domain = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : `http://localhost:${process.env.PORT ?? 8080}`;

    const urls: string[] = [];

    for (const f of files) {
      const objectId = randomUUID();
      const ext = path.extname(f.originalname).toLowerCase() || ".jpg";
      const objectName = `${dirWithinBucket}/uploads/${objectId}${ext}`;
      const gcsFile = bucket.file(objectName);

      await gcsFile.save(f.buffer, {
        contentType: f.mimetype,
        resumable: false,
      });

      const objectPath = `/objects/uploads/${objectId}${ext}`;
      urls.push(`${domain}/api/storage${objectPath}`);
    }

    res.json({ urls });
  } catch (err) {
    req.log.error({ err }, "Upload error");
    res.status(500).json({ error: "Upload failed" });
  }
});

router.use("/storage/objects", async (req, res) => {
  try {
    const rawParam = req.path.replace(/^\//, "");
    if (!rawParam) { res.status(404).json({ error: "Not found" }); return; }
    const { bucketId, dirWithinBucket } = getBucketAndDir();
    const bucket = objectStorageClient.bucket(bucketId);
    const objectName = `${dirWithinBucket}/${rawParam}`;
    const gcsFile = bucket.file(objectName);
    const [exists] = await gcsFile.exists();
    if (!exists) { res.status(404).json({ error: "Not found" }); return; }
    const [metadata] = await gcsFile.getMetadata();
    res.setHeader("Content-Type", (metadata.contentType as string) || "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    if (metadata.size) res.setHeader("Content-Length", String(metadata.size));
    gcsFile.createReadStream().pipe(res);
  } catch (err) {
    req.log.error({ err }, "Storage serve error");
    res.status(500).json({ error: "Failed to serve file" });
  }
});

export default router;
