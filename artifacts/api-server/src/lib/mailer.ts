import { ReplitConnectors } from "@replit/connectors-sdk";
import { logger } from "./logger";

const connectors = new ReplitConnectors();

function buildRawMessage(opts: {
  to: string;
  subject: string;
  htmlBody: string;
}): string {
  const { to, subject, htmlBody } = opts;
  const headers = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "",
    htmlBody,
  ].join("\r\n");
  return Buffer.from(headers, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendAdminOtpEmail(opts: { code: string }): Promise<void> {
  const { code } = opts;
  const subject = "Sahara Admin — Login OTP";
  const htmlBody = `
<!DOCTYPE html>
<html><body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:#f5f5f5;">
  <div style="max-width:560px;margin:24px auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #eee;">
    <div style="background:linear-gradient(135deg,#064E3B,#065F46,#047857);padding:28px 24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">सहारा Admin</h1>
      <p style="color:rgba(255,255,255,0.9);margin:6px 0 0;font-size:13px;">Secure Admin Login</p>
    </div>
    <div style="padding:28px 24px;color:#1f2937;">
      <p style="font-size:16px;margin:0 0 12px;">नमस्ते Admin,</p>
      <p style="font-size:14px;line-height:22px;margin:0 0 18px;">
        Sahara Admin Panel mein login karne ke liye neeche diya OTP use karein।
        Yeh code <strong>10 minute</strong> tak valid hai।
      </p>
      <div style="background:#ECFDF5;border:2px dashed #059669;border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
        <div style="font-size:13px;color:#065F46;margin-bottom:8px;letter-spacing:1px;">YOUR LOGIN OTP</div>
        <div style="font-size:40px;font-weight:800;color:#059669;letter-spacing:10px;font-family:monospace;">${code}</div>
      </div>
      <p style="font-size:13px;color:#6b7280;line-height:20px;margin:0 0 8px;">
        Agar aapne yeh request nahi ki hai, toh kisi ko yeh OTP mat batayein — aapka account safe hai।
      </p>
      <p style="font-size:13px;color:#6b7280;">— Sahara Team<br/>
        <a href="https://saharaapphelp.com" style="color:#059669;text-decoration:none;">saharaapphelp.com</a>
      </p>
    </div>
  </div>
</body></html>`.trim();

  const raw = buildRawMessage({ to: "saharaapphelp@gmail.com", subject, htmlBody });
  const response = await connectors.proxy("google-mail", "/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raw }),
  });
  if (!response.ok) {
    const text = await response.text();
    logger.error({ status: response.status, body: text }, "Admin OTP Gmail send failed");
    throw new Error(`Gmail API error: ${response.status}`);
  }
}

export async function sendResetEmail(opts: {
  to: string;
  name: string;
  code: string;
}): Promise<void> {
  const { to, name, code } = opts;
  const subject = "Sahara — आपका Password Reset Code";
  const htmlBody = `
<!DOCTYPE html>
<html><body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:#f5f5f5;">
  <div style="max-width:560px;margin:24px auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #eee;">
    <div style="background:linear-gradient(135deg,#064E3B,#065F46,#047857);padding:28px 24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">सहारा</h1>
      <p style="color:rgba(255,255,255,0.9);margin:6px 0 0;font-size:13px;">Sahara — Together we make a difference</p>
    </div>
    <div style="padding:28px 24px;color:#1f2937;">
      <p style="font-size:16px;margin:0 0 12px;">नमस्ते ${name},</p>
      <p style="font-size:14px;line-height:22px;margin:0 0 18px;">
        आपका Sahara account का password reset करने के लिए नीचे दिया code app में डालें।
        यह code <strong>15 मिनट</strong> तक valid है।
      </p>
      <div style="background:#ECFDF5;border:2px dashed #059669;border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
        <div style="font-size:13px;color:#065F46;margin-bottom:8px;letter-spacing:1px;">YOUR RESET CODE</div>
        <div style="font-size:36px;font-weight:800;color:#059669;letter-spacing:8px;font-family:monospace;">${code}</div>
      </div>
      <p style="font-size:13px;color:#6b7280;line-height:20px;margin:0 0 8px;">
        अगर आपने यह request नहीं की है, तो इस email को ignore करें — आपका account safe है।
      </p>
      <p style="font-size:13px;color:#6b7280;line-height:20px;margin:0;">
        — Sahara Team<br/>
        <a href="https://saharaapphelp.com" style="color:#059669;text-decoration:none;">saharaapphelp.com</a>
      </p>
    </div>
  </div>
</body></html>`.trim();

  const raw = buildRawMessage({ to, subject, htmlBody });

  const response = await connectors.proxy(
    "google-mail",
    "/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raw }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    logger.error({ status: response.status, body: text }, "Gmail send failed");
    throw new Error(`Gmail API error: ${response.status}`);
  }
}
