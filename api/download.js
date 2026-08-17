export default async function handler(req, res) {
  // =========================
  // CORS
  // =========================

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

  // =========================
  // METHOD
  // =========================

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method tidak diperbolehkan."
    });
  }

  try {
    // =========================
    // REQUEST
    // =========================

    const { url, platform } = req.body || {};

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "Link belum dimasukkan."
      });
    }

    // =========================
    // VALIDATE URL
    // =========================

    let targetURL;

    try {
      targetURL = new URL(url).href;
    } catch {
      return res.status(400).json({
        success: false,
        message: "Link tidak valid."
      });
    }

    // =========================
    // TIKTOK
    // =========================

    const isTikTok =
      platform === "tiktok" ||
      /(^|\.)tiktok\.com$/i.test(
        new URL(targetURL).hostname
      ) ||
      /(^|\.)vt\.tiktok\.com$/i.test(
        new URL(targetURL).hostname
      );

    if (!isTikTok) {
      return res.status(400).json({
        success: false,
        message:
          "Saat ini API yang dipasang baru mendukung TikTok."
      });
    }

    // =========================
    // SAIPULANUAR API
    // =========================

    const apiURL =
      "https://api.saipulanuar.eu.org/api/download/ttdl?url=" +
      encodeURIComponent(targetURL);

    const response = await fetch(apiURL, {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        message:
          `API TikTok mengembalikan HTTP ${response.status}.`
      });
    }

    // =========================
    // PARSE JSON
    // =========================

    const data = await response.json();

    // =========================
    // CHECK API STATUS
    // =========================

    if (!data || data.status !== true) {
      return res.status(400).json({
        success: false,
        message:
          "TikTok gagal diproses oleh API."
      });
    }

    const result = data.result || {};

    // =========================
    // VIDEO
    // =========================

    const videoUrl =
      Array.isArray(result.video)
        ? result.video[0]
        : null;

    // =========================
    // AUDIO
    // =========================

    const audioUrl =
      Array.isArray(result.audio)
        ? result.audio[0]
        : null;

    if (!videoUrl) {
      return res.status(404).json({
        success: false,
        message:
          "URL video TikTok tidak ditemukan."
      });
    }

    // =========================
    // RESPONSE FRONTEND
    // =========================

    return res.status(200).json({
      success: true,

      platform: "tiktok",

      title:
        result.title_audio ||
        "TikTok Video",

      author: "-",

      duration: "-",

      thumbnail:
        result.thumbnail || "",

      downloadUrl:
        videoUrl,

      videoUrl:
        videoUrl,

      audioUrl:
        audioUrl,

      qualities: [
        {
          quality: "Original",
          url: videoUrl
        }
      ]
    });

  } catch (error) {
    console.error(
      "TIKTOK DOWNLOAD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Terjadi kesalahan saat menghubungi API TikTok.",
      error: error.message
    });
  }
}
