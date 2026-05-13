import { Router } from "express";

const router = Router();

router.get("/api/download/sahara-app", (req, res) => {
  const apkUrl = process.env.APK_DOWNLOAD_URL;
  if (!apkUrl) {
    return res.status(404).json({ error: "APK abhi available nahi hai. Jaldi aayega!" });
  }
  res.redirect(302, apkUrl);
});

export default router;
