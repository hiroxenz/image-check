import fs from "fs";
import path from "path";
import crypto from "crypto";

export default function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "POST only" });
    }

    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "image (base64) diperlukan." });
    }

    // Decode image dari user
    let userBuffer;
    try {
      userBuffer = Buffer.from(image, "base64");
    } catch {
      return res.status(400).json({ error: "Base64 tidak valid." });
    }

    // Ambil gambar asli dari /public
    const originalPath = path.join(process.cwd(), "public", "captcha.jpg");

    if (!fs.existsSync(originalPath)) {
      return res.status(500).json({ error: "captcha.jpg tidak ditemukan di /public" });
    }

    const originalBuffer = fs.readFileSync(originalPath);

    // Hash SHA256 untuk validasi identik 100%
    const hashUser = crypto.createHash("sha256").update(userBuffer).digest("hex");
    const hashOriginal = crypto.createHash("sha256").update(originalBuffer).digest("hex");

    const match = hashUser === hashOriginal;

    return res.status(200).json({
      match,
      message: match ? "✔ CAPTCHA cocok (identik 100%)" : "❌ CAPTCHA tidak cocok",
      debug: {
        hashUser,
        hashOriginal
      }
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
