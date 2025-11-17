import crypto from "crypto";

/**
 * API ANALISA GAMBAR - SUPPORT VERCEL SERVERLESS
 * Menerima base64 → decode → analisa (hash, size, format)
 */

export default function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "POST request only" });
    }

    const { image } = req.body;

    if (!image) {
      return res
        .status(400)
        .json({ error: "Parameter 'image' harus berisi base64." });
    }

    // Decode base64 → Buffer
    let imgBuffer;
    try {
      imgBuffer = Buffer.from(image, "base64");
    } catch {
      return res.status(400).json({ error: "Base64 tidak valid." });
    }

    // Analisa ukuran + hash
    const sizeKB = (imgBuffer.length / 1024).toFixed(2) + " KB";
    const sha256 = crypto
      .createHash("sha256")
      .update(imgBuffer)
      .digest("hex");

    // Deteksi format file
    const mimeType = detectMime(imgBuffer);

    return res.status(200).json({
      success: true,
      message: "Analisa gambar berhasil.",
      analysis: {
        mimeType,
        size: sizeKB,
        sha256
      }
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Deteksi tipe gambar (JPEG, PNG, GIF)
 */
function detectMime(buffer) {
  if (!buffer || buffer.length < 4) return "unknown";

  if (buffer[0] === 0xff && buffer[1] === 0xd8) return "image/jpeg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return "image/png";
  if (buffer[0] === 0x47 && buffer[1] === 0x49) return "image/gif";

  return "unknown";
}
