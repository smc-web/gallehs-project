export default async function handler(req, res) {
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
    const { url, platform } = req.body || {};

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "Link belum dimasukkan."
      });
    }

    let targetURL;

    try {
      targetURL = new URL(url).href;
    } catch {
      return res.status(400).json({
        success: false,
        message: "Link tidak valid."
      });
    }

    const hostname =
      new URL(targetURL).hostname.toLowerCase();

    let selected = platform || "auto";

    // ================================
    // AUTO DETECT
    // ================================

    if (selected === "auto") {

      if (hostname.includes("tiktok.com")) {
        selected = "tiktok";

      } else if (hostname.includes("spotify.com")) {
        selected = "spotify";

      } else if (
        hostname.includes("youtube.com") ||
        hostname.includes("youtu.be")
      ) {
        selected = "youtube";

      } else if (
        hostname.includes("instagram.com") ||
        hostname.includes("instagr.am")
      ) {
        selected = "instagram";

      } else if (
        hostname.includes("facebook.com") ||
        hostname.includes("fb.watch")
      ) {
        selected = "facebook";

      } else {
        selected = null;
      }
    }

    // ================================
    // UNSUPPORTED
    // ================================

    if (!selected) {
      return res.status(400).json({
        success: false,
        message: "Platform tidak didukung."
      });
    }

    // ================================
    // COMING SOON
    // ================================

    if (
      selected === "youtube" ||
      selected === "instagram" ||
      selected === "facebook"
    ) {
      return res.status(400).json({
        success: false,
        message:
          `${selected} masih Coming Soon.`
      });
    }

    // ================================
    // TIKTOK
    // ================================

    if (selected === "tiktok") {

      const apiURL =
        "https://elysian-api.vercel.app/api/downloader/all-in-one.php?url=" +
        encodeURIComponent(targetURL);

      const response =
        await fetch(apiURL, {
          headers: {
            Accept: "application/json"
          }
        });

      if (!response.ok) {
        return res.status(502).json({
          success: false,
          message:
            `API TikTok error (${response.status}).`
        });
      }

      const data =
        await response.json();

      if (data?.status !== true) {
        return res.status(400).json({
          success: false,
          message:
            "TikTok gagal diproses."
        });
      }

      const result =
        data.result || {};

      // API All-In-One menggunakan media
      const media =
        Array.isArray(result.media)
          ? result.media
          : [];

      let videoUrl = null;

      // Cari URL dari media
      for (const item of media) {

        if (typeof item === "string") {
          videoUrl = item;
          break;
        }

        if (
          item &&
          typeof item === "object"
        ) {
          videoUrl =
            item.url ||
            item.downloadUrl ||
            item.download_url ||
            item.video ||
            item.videoUrl ||
            null;

          if (videoUrl) break;
        }
      }

      // ================================
      // MEDIA KOSONG
      // ================================

      if (!videoUrl) {
        return res.status(404).json({
          success: false,
          message:
            "API TikTok tidak memberikan URL video.",
          platform: "tiktok",
          apiStatus: data.status,
          mediaCount: media.length
        });
      }

      return res.status(200).json({
        success: true,
        platform: "tiktok",

        title:
          result.title ||
          "TikTok Video",

        author:
          result.author ||
          result.username ||
          "-",

        thumbnail:
          result.thumbnail ||
          "",

        downloadUrl:
          videoUrl,

        videoUrl:
          videoUrl,

        filename:
          "tiktok-video.mp4"
      });
    }

    // ================================
    // SPOTIFY
    // ================================

    if (selected === "spotify") {

      const apiURL =
        "https://elysian-api.vercel.app/api/downloader/spotify-dl.php?url=" +
        encodeURIComponent(targetURL);

      const response =
        await fetch(apiURL, {
          headers: {
            Accept: "application/json"
          }
        });

      if (!response.ok) {
        return res.status(502).json({
          success: false,
          message:
            `API Spotify error (${response.status}).`
        });
      }

      const data =
        await response.json();

      if (data?.status !== true) {
        return res.status(400).json({
          success: false,
          message:
            "Spotify gagal diproses."
        });
      }

      const metadata =
        data.metadata || {};

      const downloadUrl =
        data.download_url;

      if (!downloadUrl) {
        return res.status(404).json({
          success: false,
          message:
            "URL audio Spotify tidak ditemukan."
        });
      }

      const song =
        metadata.name ||
        "Spotify Audio";

      const artist =
        metadata.artist ||
        "Unknown Artist";

      const filename =
        `${song} - ${artist}`
          .replace(/[\\/:*?"<>|]/g, "")
          .trim() +
        ".mp3";

      return res.status(200).json({
        success: true,
        platform: "spotify",

        title: song,
        author: artist,

        duration:
          metadata.duration || "-",

        thumbnail:
          metadata.image || "",

        downloadUrl:
          downloadUrl,

        audioUrl:
          downloadUrl,

        filename:
          filename
      });
    }

    return res.status(400).json({
      success: false,
      message:
        "Platform belum didukung."
    });

  } catch (error) {

    console.error(
      "DOWNLOAD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Terjadi kesalahan pada server.",
      error:
        error.message
    });
  }
}
