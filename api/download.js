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

    const {
      url,
      platform
    } = req.body || {};


    // =========================================
    // CHECK URL
    // =========================================

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

    let selected =
      platform || "auto";


    if (selected === "auto") {

      if (
        hostname.includes("tiktok.com")
      ) {

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
        message:
          "Platform tidak didukung."
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
    // KYZZNEKOO
    // =========================================

    if (selected === "tiktok") {

      const apiURL =
        "https://api.kyzznekoo.my.id/api/downloader/v2/tiktok?url=" +
        encodeURIComponent(targetURL);


      const response =
        await fetch(apiURL, {

          method: "GET",

          headers: {

            "User-Agent":
              "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/151.0.0.0 Safari/537.36",

            "Accept":
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


      // =========================================
      // CHECK RESPONSE
      // =========================================

      if (
        data?.status !== true ||
        !data?.data
      ) {

        return res.status(400).json({

          success: false,

          message:
            "TikTok gagal diproses oleh API."

        });

      }


      const result =
        data.data;


      // =========================================
      // VIDEO NO WM
      // =========================================

      const videoUrl =
        result.play;


      if (!videoUrl) {

        return res.status(404).json({

          success: false,

          message:
            "URL video TikTok tanpa WM tidak ditemukan."

        });

      }


      // =========================================
      // RESPONSE
      // =========================================

      return res.status(200).json({

        success: true,

        platform: "tiktok",

        title:
          result.title ||
          "TikTok Video",

        author:
          result.author?.nickname ||
          result.author?.unique_id ||
          "-",

        duration:
          result.duration ||
          "-",

        thumbnail:
          result.cover ||
          "",

        downloadUrl:
          videoUrl,

        videoUrl:
          videoUrl,

        filename:
          "tiktok-video-no-wm.mp4"

      });

    }


    // =========================================
    // SPOTIFY
    // KYZZNEKOO
    // =========================================

    if (selected === "spotify") {

      const apiURL =
        "https://api.kyzznekoo.my.id/api/downloader/spotify?url=" +
        encodeURIComponent(targetURL);


      const response =
        await fetch(apiURL, {

          method: "GET",

          headers: {

            "User-Agent":
              "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/151.0.0.0 Safari/537.36",

            "Accept":
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
      // CHECK RESPONSE
      // =========================================

      if (
        data?.status !== true ||
        !data?.data
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Spotify gagal diproses oleh API."

        });

      }


      const result =
        data.data;


      const metadata =
        result.metadata || {};


      // =========================================
      // MP3 URL
      // =========================================

      const audioUrl =
        result.url;


      if (!audioUrl) {

        return res.status(404).json({

          success: false,

          message:
            "URL audio Spotify tidak ditemukan."

        });

      }


      // =========================================
      // FILE NAME
      // =========================================

      const song =
        metadata.name ||
        "Spotify Audio";

      const artist =
        metadata.artist ||
        "Unknown Artist";


      const filename =
        `${song} - ${artist}`
          .replace(
            /[\\/:*?"<>|]/g,
            ""
          )
          .trim() +
        ".mp3";


      // =========================================
      // RESPONSE
      // =========================================

      return res.status(200).json({

        success: true,

        platform: "spotify",

        title:
          song,

        author:
          artist,

        duration:
          metadata.duration ||
          "-",

        thumbnail:
          metadata.image ||
          "",

        downloadUrl:
          audioUrl,

        audioUrl:
          audioUrl,

        filename:
          filename

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
