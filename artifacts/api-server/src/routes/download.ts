import { Router } from "express";

const router = Router();

const APK_URL =
  process.env.APK_DOWNLOAD_URL ||
  "https://expo.dev/artifacts/eas/oh8jc3zuDoLavHTrtbJzVo.apk";

router.get("/download/sahara-app", (req, res) => {
  res.redirect(302, APK_URL);
});

export default router;
