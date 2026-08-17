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

  // =========================================
  // METHOD
  // =========================================

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

    const hostname =
      new URL(targetURL)
        .hostname
        .toLowerCase();

    // =========================================
    // DETECT PLATFORM
    // =========================================

    let selected =
      platform || "auto";

    if (selected === "auto") {

      if (hostname.includes("tiktok.com")) {
        selected = "tiktok";

      } else if (
        hostname.includes("spotify.com") ||
        hostname.includes("spotify.link")
      ) {
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

    // =========================================
    // UNSUPPORTED
    // =========================================

    if (!selected) {
      return res.status(400).json({
        success: false,
        message: "Platform tidak didukung."
      });
    }

    // =========================================
    // COMING SOON
    // =========================================

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

    // =========================================
    // TIKTOK
    // TETAP SEPERTI YANG SUDAH WORK
    // =========================================

    if (selected === "tiktok") {

      const apiURL =
        "https://elysian-api.vercel.app/api/downloader/all-in-one.php?url=" +
        encodeURIComponent(targetURL);

      const response =
        await fetch(apiURL, {
          method: "GET",
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

      if (!data || data.status !== true) {
        return res.status(400).json({
          success: false,
          message:
            "TikTok gagal diproses oleh API."
        });
      }

      const result =
        data.result || {};

      const media =
        Array.isArray(result.media)
          ? result.media
          : [];

      let videoUrl = null;

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

          if (videoUrl) {
            break;
          }
        }
      }

      if (!videoUrl) {
        return res.status(404).json({
          success: false,
          message:
            "URL video TikTok tidak ditemukan dari API."
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

        duration:
          result.duration ||
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

    // =========================================
    // SPOTIFY
    // API → PROXY → BROWSER
    // =========================================

    if (selected === "spotify") {

      // -----------------------------------------
      // Ambil URL download dari API Spotify
      // -----------------------------------------

      const apiURL =
        "https://elysian-api.vercel.app/api/downloader/spotify-dl.php?url=" +
        encodeURIComponent(targetURL);

      const response =
        await fetch(apiURL, {
          method: "GET",
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

      if (
        !data ||
        data.status !== true ||
        !data.download_url
      ) {
        return res.status(404).json({
          success: false,
          message:
            "URL audio Spotify tidak ditemukan."
        });
      }

      // -----------------------------------------
      // Metadata
      // -----------------------------------------

      const metadata =
        data.metadata || {};

      const songName =
        metadata.name ||
        "Spotify Audio";

      const artist =
        metadata.artist ||
        "Unknown Artist";

      const filename =
        `${songName} - ${artist}`
          .replace(
            /[\\/:*?"<>|]/g,
            ""
          )
          .trim() +
        ".mp3";

      // -----------------------------------------
      // AMBIL FILE DARI CDN
      // -----------------------------------------

      const audioResponse =
        await fetch(data.download_url, {
          method: "GET",
          headers: {
            Accept:
              "audio/mpeg,audio/*,*/*"
          }
        });

      if (!audioResponse.ok) {
        return res.status(502).json({
          success: false,
          message:
            `Gagal mengambil file Spotify (${audioResponse.status}).`
        });
      }

      // -----------------------------------------
      // CONTENT TYPE
      // -----------------------------------------

      const contentType =
        audioResponse.headers.get(
          "content-type"
        ) ||
        "audio/mpeg";

      // -----------------------------------------
      // FILE SIZE
      // -----------------------------------------

      const contentLength =
        audioResponse.headers.get(
          "content-length"
        );

      // -----------------------------------------
      // RESPONSE SEBAGAI FILE
      // -----------------------------------------

      res.setHeader(
        "Content-Type",
        contentType
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      if (contentLength) {
        res.setHeader(
          "Content-Length",
          contentLength
        );
      }

      // -----------------------------------------
      // STREAM FILE
      // -----------------------------------------

      if (
        audioResponse.body &&
        typeof audioResponse.body.pipe === "function"
      ) {

        return audioResponse.body.pipe(res);

      }

      // -----------------------------------------
      // FALLBACK
      // -----------------------------------------

      const buffer =
        Buffer.from(
          await audioResponse.arrayBuffer()
        );

      return res.end(buffer);
    }

    // =========================================
    // UNKNOWN
    // =========================================

    return res.status(400).json({
      success: false,
      message:
        "Platform belum didukung."
    });

  } catch (error) {

    console.error(
      "DOWNLOAD API ERROR:",
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
