export default async function handler(req, res) {
  // =========================================
  // CORS
  // =========================================

  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

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

    // =========================================
    // REQUEST
    // =========================================

    const {
      url,
      platform
    } = req.body || {};


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

      targetURL =
        new URL(url).href;

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

    let detectedPlatform =
      platform || "auto";


    if (detectedPlatform === "auto") {

      if (
        hostname.includes("tiktok.com")
      ) {

        detectedPlatform = "tiktok";

      } else if (
        hostname.includes("spotify.com")
      ) {

        detectedPlatform = "spotify";

      } else if (
        hostname.includes("youtube.com") ||
        hostname.includes("youtu.be")
      ) {

        detectedPlatform = "youtube";

      } else if (
        hostname.includes("instagram.com") ||
        hostname.includes("instagr.am")
      ) {

        detectedPlatform = "instagram";

      } else if (
        hostname.includes("facebook.com") ||
        hostname.includes("fb.watch")
      ) {

        detectedPlatform = "facebook";

      } else {

        detectedPlatform = null;

      }

    }


    // =========================================
    // UNSUPPORTED
    // =========================================

    if (!detectedPlatform) {

      return res.status(400).json({
        success: false,
        message:
          "Platform tidak didukung."
      });

    }


    // =========================================
    // COMING SOON
    // =========================================

    if (
      detectedPlatform === "youtube" ||
      detectedPlatform === "instagram" ||
      detectedPlatform === "facebook"
    ) {

      return res.status(400).json({
        success: false,
        message:
          `${detectedPlatform} masih Coming Soon.`
      });

    }


    // =========================================
    // TIKTOK
    // ELYSIAN ALL-IN-ONE
    // =========================================

    if (detectedPlatform === "tiktok") {

      const apiURL =
        "https://elysian-api.vercel.app/api/downloader/all-in-one.php?url=" +
        encodeURIComponent(targetURL);


      const response =
        await fetch(apiURL, {
          method: "GET",

          headers: {
            Accept:
              "application/json"
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


      if (!data) {

        return res.status(400).json({
          success: false,
          message:
            "API TikTok tidak memberikan response."
        });

      }


      // =========================================
      // RESULT
      // =========================================

      const result =
        data.result || {};


      /*
       * API bisa mempunyai struktur
       * berbeda tergantung provider.
       *
       * Kita coba beberapa kemungkinan
       * nama field video.
       */

      let videoUrl =
        result.video ||
        result.videoUrl ||
        result.downloadUrl ||
        result.download_url ||
        result.url ||
        null;


      // Kalau berupa array
      if (
        Array.isArray(videoUrl)
      ) {

        videoUrl =
          videoUrl[0] || null;

      }


      // =========================================
      // THUMBNAIL
      // =========================================

      const thumbnail =
        result.thumbnail ||
        result.thumb ||
        result.cover ||
        "";


      // =========================================
      // TITLE
      // =========================================

      const title =
        result.title ||
        result.desc ||
        result.description ||
        "TikTok Video";


      // =========================================
      // AUTHOR
      // =========================================

      const author =
        result.author ||
        result.username ||
        result.nickname ||
        "-";


      // =========================================
      // VIDEO CHECK
      // =========================================

      if (!videoUrl) {

        return res.status(404).json({
          success: false,
          message:
            "URL video TikTok tidak ditemukan dari API."
        });

      }


      // =========================================
      // RESPONSE TIKTOK
      // =========================================

      return res.status(200).json({

        success: true,

        platform: "tiktok",

        title: title,

        author: author,

        duration:
          result.duration ||
          "-",

        thumbnail:
          thumbnail,

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
    // =========================================

    if (detectedPlatform === "spotify") {

      const apiURL =
        "https://elysian-api.vercel.app/api/downloader/spotify-dl.php?url=" +
        encodeURIComponent(targetURL);


      const response =
        await fetch(apiURL, {
          method: "GET",

          headers: {
            Accept:
              "application/json"
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


      // =========================================
      // METADATA
      // =========================================

      const metadata =
        data.metadata ||
        data.result?.metadata ||
        {};


      // =========================================
      // DOWNLOAD URL
      // =========================================

      const downloadUrl =
        data.download_url ||
        data.downloadUrl ||
        data.result?.download_url ||
        data.result?.downloadUrl ||
        data.result?.url ||
        null;


      if (!downloadUrl) {

        return res.status(404).json({
          success: false,
          message:
            "URL audio Spotify tidak ditemukan."
        });

      }


      // =========================================
      // SONG NAME
      // =========================================

      const songName =
        metadata.name ||
        data.name ||
        data.title ||
        "Spotify Audio";


      // =========================================
      // ARTIST
      // =========================================

      const artist =
        metadata.artist ||
        data.artist ||
        "-";


      // =========================================
      // IMAGE
      // =========================================

      const image =
        metadata.image ||
        data.image ||
        "";


      // =========================================
      // RESPONSE SPOTIFY
      // =========================================

      return res.status(200).json({

        success: true,

        platform: "spotify",

        title:
          songName,

        author:
          artist,

        duration:
          metadata.duration ||
          data.duration ||
          "-",

        thumbnail:
          image,

        downloadUrl:
          downloadUrl,

        audioUrl:
          downloadUrl,

        filename:
          `${songName
            .replace(
              /[\\/:*?"<>|]/g,
              ""
            )
            .trim() || "spotify-audio"}.mp3`

      });

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
