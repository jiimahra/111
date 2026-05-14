import { Router } from "express";
import multer from "multer";
import { objectStorageClient } from "../lib/objectStorage";

const router = Router();

const APK_OBJECT_NAME = "apk/sahara-latest.apk";
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } });

function getBucket() {
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID ?? "";
  if (!bucketId) throw new Error("Object storage not configured");
  return objectStorageClient.bucket(bucketId);
}

router.get("/download/sahara-app", async (req, res) => {
  try {
    const bucket = getBucket();
    const file = bucket.file(APK_OBJECT_NAME);
    const [exists] = await file.exists();
    if (!exists) {
      res.status(404).json({ error: "APK abhi upload nahi hua. Admin panel se upload karein." });
      return;
    }
    const [metadata] = await file.getMetadata();
    res.setHeader("Content-Type", "application/vnd.android.package-archive");
    res.setHeader("Content-Disposition", 'attachment; filename="sahara.apk"');
    if (metadata.size) res.setHeader("Content-Length", String(metadata.size));
    res.setHeader("Cache-Control", "public, max-age=3600");
    file.createReadStream().pipe(res);
  } catch (err: any) {
    res.status(500).json({ error: "APK download failed", detail: err?.message });
  }
});

router.post("/admin/upload-apk", upload.single("apk"), async (req, res) => {
  try {
    const { userId } = req.body as { userId?: string };
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const file = req.file;
    if (!file) { res.status(400).json({ error: "APK file required" }); return; }
    const bucket = getBucket();
    const gcsFile = bucket.file(APK_OBJECT_NAME);
    await gcsFile.save(file.buffer, { contentType: "application/vnd.android.package-archive", resumable: false });
    res.json({ ok: true, message: "APK successfully upload ho gaya!" });
  } catch (err: any) {
    res.status(500).json({ error: "Upload failed", detail: err?.message });
  }
});

router.delete("/admin/delete-apk", async (req, res) => {
  try {
    const { userId } = req.body as { userId?: string };
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const bucket = getBucket();
    const file = bucket.file(APK_OBJECT_NAME);
    const [exists] = await file.exists();
    if (!exists) { res.status(404).json({ error: "Koi APK nahi hai delete karne ke liye" }); return; }
    await file.delete();
    res.json({ ok: true, message: "APK delete ho gaya!" });
  } catch (err: any) {
    res.status(500).json({ error: "Delete failed", detail: err?.message });
  }
});

router.get("/apk-version", async (req, res) => {
  try {
    const bucket = getBucket();
    const file = bucket.file(APK_OBJECT_NAME);
    const [exists] = await file.exists();
    if (!exists) { res.json({ exists: false, version: null }); return; }
    const [metadata] = await file.getMetadata();
    res.setHeader("Cache-Control", "no-cache");
    res.json({ exists: true, version: metadata.updated ?? metadata.timeCreated ?? null });
  } catch {
    res.json({ exists: false, version: null });
  }
});

router.get("/admin/apk-status", async (req, res) => {
  try {
    const bucket = getBucket();
    const file = bucket.file(APK_OBJECT_NAME);
    const [exists] = await file.exists();
    if (!exists) { res.json({ exists: false }); return; }
    const [metadata] = await file.getMetadata();
    res.json({
      exists: true,
      size: metadata.size,
      updated: metadata.updated,
    });
  } catch {
    res.json({ exists: false });
  }
});

export default router;
