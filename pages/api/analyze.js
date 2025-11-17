import Jimp from "jimp";
import path from "path";
import fs from "fs";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "POST only" });
    }

    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "image (base64) diperlukan" });
    }

    // Decode base64 dari client
    let userBuffer;
    try {
      userBuffer = Buffer.from(image, "base64");
    } catch {
      return res.status(400).json({ error: "Base64 tidak valid." });
    }

    // Load gambar user
    const userImg = await Jimp.read(userBuffer);

    // Path gambar asli
    const originalPath = path.join(process.cwd(), "public", "captcha.jpg");
    if (!fs.existsSync(originalPath)) {
      return res.status(500).json({ error: "captcha.jpg tidak ditemukan di folder /public" });
    }

    // Load gambar asli
    const originalImg = await Jimp.read(originalPath);

    // --- Analisa warna pixel ---
    const analyzeColors = (img) => {
      let total = 0;
      let blackCount = 0;
      let whiteCount = 0;

      img.scan(0, 0, img.bitmap.width, img.bitmap.height, function (x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];

        total++;

        // Hitam
        if (r < 100 && g < 100 && b < 100) blackCount++;

        // Putih
        if (r > 200 && g > 200 && b > 200) whiteCount++;
      });

      return {
        total,
        blackPercent: ((blackCount / total) * 100).toFixed(2),
        whitePercent: ((whiteCount / total) * 100).toFixed(2),
      };
    };

    const userColor = analyzeColors(userImg);
    const originalColor = analyzeColors(originalImg);

    // Validasi warna (toleransi 10%)
    const colorMatch =
      Math.abs(userColor.blackPercent - originalColor.blackPercent) < 10 &&
      Math.abs(userColor.whitePercent - originalColor.whitePercent) < 10;

    return res.status(200).json({
      success: true,
      colorMatch,
      message: colorMatch
        ? "✔ Warna gambar sesuai: background putih & teks hitam mirip."
        : "❌ Warna gambar berbeda dari captcha asli.",
      userColor,
      originalColor
    });

  } catch (err) {
    return res.status(500).json({ error: err.toString() });
  }
}
