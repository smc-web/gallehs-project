export default async function handler(req, res) {
  // =========================================
  // CORS
  // =========================================

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method tidak diperbolehkan."
    });
  }

  try {
    const { url } = req.body || {};

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "Link belum dimasukkan."
      });
    }

    // =========================================
    // VALIDATE URL
    // =========================================

    let targetURL;

    try {
      targetURL = new URL(url).href;
    } catch {
      return res.status(400).json({
        success: false,
        message: "Link tidak valid."
      });
    }

    // =========================================
    // AHM7 API
    // =========================================

    const apiURL =
      "https://ahm7xmakki.com/api/alldl?url=" +
      encodeURIComponent(targetURL);

    const apiResponse = await fetch(apiURL, {
      method: "GET",
      headers: {
        "User-Agent": "Gallehs-Project/1.0",
        "Accept": "application/json"
      }
    });

    if (!apiResponse.ok) {
      return res.status(502).json({
        success: false,
        message:
          `API downloader error (${apiResponse.status}).`
      });
    }

    const data = await apiResponse.json();

    // =========================================
    // CHECK RESPONSE
    // =========================================

    if (!data || data.success !== true) {
      return res.status(400).json({
        success: false,
        message:
          data?.message ||
          "Media gagal diproses oleh API."
      });
    }

    const media = data.mediaInfo || {};

    const videoUrl =
      media.videoUrl ||
      null;

    const audioUrl =
      media.audioUrl ||
      null;

    const thumbnail =
      media.thumbnail ||
      "";

    const title =
      media.title ||
      "Media";

    const platform =
      media.platform ||
      "Unknown";

    // =========================================
    // DOWNLOAD URL
    // =========================================

    const fileUrl =
      videoUrl || audioUrl;

    if (!fileUrl) {
      return res.status(404).json({
        success: false,
        message:
          "URL media tidak ditemukan dari API."
      });
    }

    // =========================================
    // AMBIL FILE DARI CDN
    // =========================================

    const fileResponse = await fetch(fileUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "*/*"
      }
    });

    if (!fileResponse.ok) {
      return res.status(502).json({
        success: false,
        message:
          `Gagal mengambil file media (${fileResponse.status}).`
      });
    }

    // =========================================
    // CONTENT TYPE
    // =========================================

    const contentType =
      fileResponse.headers.get("content-type") ||
      (videoUrl
        ? "video/mp4"
        : "audio/mpeg");

    // =========================================
    // FILENAME
    // =========================================

    let safeTitle =
      String(title)
        .replace(/[\\/:*?"<>|]/g, "")
        .replace(/\s+/g, " ")
        .trim();

    if (!safeTitle) {
      safeTitle = "gallehs-media";
    }

    const extension =
      contentType.includes("audio")
        ? "mp3"
        : "mp4";

    const filename =
      `${safeTitle}.${extension}`;

    // =========================================
    // DOWNLOAD HEADER
    // =========================================

    res.setHeader(
      "Content-Type",
      contentType
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    res.setHeader(
      "Cache-Control",
      "no-store"
    );

    // =========================================
    // KIRIM FILE
    // =========================================

    const arrayBuffer =
      await fileResponse.arrayBuffer();

    const buffer =
      Buffer.from(arrayBuffer);

    return res.status(200).send(buffer);

  } catch (error) {
    console.error(
      "GALLEHS DOWNLOAD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Terjadi kesalahan saat download.",
      error: error.message
    });
  }
}