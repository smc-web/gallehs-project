export default async function handler(req, res) {
  // ===============================
  // CORS
  // ===============================

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

    // ===============================
    // VALIDATE URL
    // ===============================

    let targetURL;

    try {
      targetURL = new URL(url).href;
    } catch {
      return res.status(400).json({
        success: false,
        message: "Link tidak valid."
      });
    }

    // ===============================
    // AHM7X
    // ===============================

    const apiURL =
      "https://ahm7xmakki.com/api/alldl?url=" +
      encodeURIComponent(targetURL);

    const apiResponse = await fetch(apiURL, {
      headers: {
        "User-Agent": "Mozilla/5.0",
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

    // ===============================
    // CHECK JSON
    // ===============================

    const contentType =
      apiResponse.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      return res.status(502).json({
        success: false,
        message: "API downloader tidak mengembalikan JSON."
      });
    }

    const data = await apiResponse.json();

    // ===============================
    // RESPONSE
    // ===============================

    if (!data || data.success !== true) {
      return res.status(400).json({
        success: false,
        message:
          data?.message ||
          "Media gagal diproses."
      });
    }

    const media =
      data.mediaInfo || {};

    const videoUrl =
      media.videoUrl || null;

    const audioUrl =
      media.audioUrl || null;

    const title =
      media.title ||
      "gallehs-video";

    // ===============================
    // MEDIA URL
    // ===============================

    const fileUrl =
      videoUrl || audioUrl;

    if (!fileUrl) {
      return res.status(404).json({
        success: false,
        message:
          "URL video tidak ditemukan."
      });
    }

    // ===============================
    // FETCH VIDEO
    // ===============================

    const fileResponse =
      await fetch(fileUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "*/*"
        }
      });

    if (!fileResponse.ok) {
      return res.status(502).json({
        success: false,
        message:
          `Gagal mengambil video (${fileResponse.status}).`
      });
    }

    const buffer =
      Buffer.from(
        await fileResponse.arrayBuffer()
      );

    if (!buffer.length) {
      return res.status(502).json({
        success: false,
        message: "File video kosong."
      });
    }

    // ===============================
    // FILENAME
    // ===============================

    const safeTitle =
      String(title)
        .replace(/[\\/:*?"<>|]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80) ||
      "gallehs-video";

    const extension =
      audioUrl && !videoUrl
        ? "mp3"
        : "mp4";

    // ===============================
    // FORCE DOWNLOAD
    // ===============================

    res.setHeader(
      "Content-Type",
      extension === "mp3"
        ? "audio/mpeg"
        : "video/mp4"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeTitle}.${extension}"`
    );

    res.setHeader(
      "Content-Length",
      buffer.length
    );

    res.setHeader(
      "Cache-Control",
      "no-store"
    );

    return res.status(200).send(buffer);

  } catch (error) {

    console.error(
      "GALLEHS DOWNLOAD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Terjadi kesalahan saat download."
    });
  }
}
