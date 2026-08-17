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

    const { url } = req.body || {};

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
    // PLATFORM
    // =========================

    const hostname =
      new URL(targetURL).hostname.toLowerCase();

    let platform = "unknown";

    if (
      hostname.includes("tiktok.com") ||
      hostname.includes("vt.tiktok.com")
    ) {
      platform = "tiktok";
    } else if (
      hostname.includes("youtube.com") ||
      hostname.includes("youtu.be")
    ) {
      platform = "youtube";
    } else if (
      hostname.includes("instagram.com") ||
      hostname.includes("instagr.am")
    ) {
      platform = "instagram";
    } else if (
      hostname.includes("facebook.com") ||
      hostname.includes("fb.watch")
    ) {
      platform = "facebook";
    }

    // =========================
    // ELYSIAN API
    // =========================

    const apiURL =
      "https://elysian-api.vercel.app/api/downloader/all-in-one.php?url=" +
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
          `Elysian API mengembalikan HTTP ${response.status}.`
      });
    }

    // =========================
    // PARSE JSON
    // =========================

    const data = await response.json();

    if (!data || data.status !== true) {
      return res.status(400).json({
        success: false,
        message:
          data?.message ||
          "Media gagal diproses oleh Elysian API."
      });
    }

    // =========================
    // RESULT
    // =========================

    const result = data.result || {};

    // =========================
    // MEDIA
    // =========================

    const media = Array.isArray(result.media)
      ? result.media
      : [];

    if (media.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Elysian API tidak memberikan URL media untuk link ini."
      });
    }

    // =========================
    // CARI VIDEO
    // =========================

    let videoUrl = null;

    for (const item of media) {
      if (typeof item === "string") {
        videoUrl = item;
        break;
      }

      if (item && typeof item === "object") {
        const candidate =
          item.url ||
          item.download ||
          item.link ||
          item.src;

        if (candidate) {
          videoUrl = candidate;
          break;
        }
      }
    }

    if (!videoUrl) {
      return res.status(404).json({
        success: false,
        message:
          "URL video tidak ditemukan di media Elysian API."
      });
    }

    // =========================
    // RESPONSE FRONTEND
    // =========================

    return res.status(200).json({
      success: true,

      platform:
        data.platform ||
        platform,

      title:
        result.title ||
        result.name ||
        "Video",

      author:
        result.author ||
        result.username ||
        result.uploader ||
        "-",

      duration:
        result.duration ||
        "-",

      thumbnail:
        result.thumbnail ||
        result.thumb ||
        "",

      downloadUrl:
        videoUrl,

      videoUrl:
        videoUrl,

      qualities: [
        {
          quality: "Original",
          url: videoUrl
        }
      ]
    });

  } catch (error) {
    console.error(
      "ELYSIAN DOWNLOAD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Terjadi kesalahan saat menghubungi Elysian API.",
      error: error.message
    });
  }
}
