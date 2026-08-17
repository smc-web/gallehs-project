import { Readable } from "stream";

/*
  GALLEHS PROJECT
  /api/download
  Provider diadaptasi dari downloader bot Gallehs.
*/

export default async function handler(req, res) {

  // ================================
  // CORS
  // ================================

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

    const { url, platform: requestedPlatform } =
      req.body || {};

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "Masukkan link terlebih dahulu."
      });
    }

    let target;

    try {
      target = new URL(url).href;
    } catch {
      return res.status(400).json({
        success: false,
        message: "URL tidak valid."
      });
    }

    const platform =
      requestedPlatform === "auto" ||
      !requestedPlatform
        ? detectPlatform(target)
        : requestedPlatform;

    if (!platform) {
      return res.status(400).json({
        success: false,
        message: "Platform belum didukung."
      });
    }

    // ================================
    // GET MEDIA URL
    // ================================

    let media;

    if (platform === "tiktok") {
      media = await getTikTok(target);
    }

    else if (platform === "youtube") {
      media = await getYouTube(target);
    }

    else if (platform === "instagram") {
      media = await getInstagram(target);
    }

    else if (platform === "facebook") {
      media = await getFacebook(target);
    }

    else {
      return res.status(400).json({
        success: false,
        message:
          `${platform} belum tersedia.`
      });
    }

    if (!media?.url) {
      return res.status(404).json({
        success: false,
        message:
          "Media tidak ditemukan."
      });
    }

    // ================================
    // FETCH FINAL FILE
    // ================================

    const fileResponse = await fetch(
      media.url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/130 Safari/537.36",
          "Accept": "*/*"
        }
      }
    );

    if (!fileResponse.ok) {
      return res.status(502).json({
        success: false,
        message:
          `Gagal mengambil file (${fileResponse.status}).`
      });
    }

    // ================================
    // CONTENT TYPE
    // ================================

    let contentType =
      fileResponse.headers.get(
        "content-type"
      ) || "";

    if (
      !contentType ||
      contentType.includes("text/html")
    ) {
      contentType =
        media.type === "audio"
          ? "audio/mpeg"
          : "video/mp4";
    }

    // ================================
    // FILENAME
    // ================================

    let title =
      String(
        media.title ||
        `gallehs-${platform}`
      )
        .replace(/[\\/:*?"<>|]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80);

    if (!title) {
      title = `gallehs-${platform}`;
    }

    const extension =
      media.type === "audio" ||
      contentType.includes("audio")
        ? "mp3"
        : "mp4";

    // ================================
    // FORCE DOWNLOAD
    // ================================

    res.setHeader(
      "Content-Type",
      contentType
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${title}.${extension}"`
    );

    res.setHeader(
      "Cache-Control",
      "no-store"
    );

    // ================================
    // SEND FILE
    // ================================

    if (fileResponse.body) {
      const stream =
        Readable.fromWeb(
          fileResponse.body
        );

      return stream.pipe(res);
    }

    const buffer =
      Buffer.from(
        await fileResponse.arrayBuffer()
      );

    return res.status(200).send(buffer);

  } catch (error) {

    console.error(
      "[GALLEHS DOWNLOAD]",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Download gagal."
    });
  }
}


/* =================================
   PLATFORM DETECTION
================================= */

function detectPlatform(url) {

  const value =
    String(url).toLowerCase();

  if (
    value.includes("tiktok.com") ||
    value.includes("vt.tiktok.com")
  ) {
    return "tiktok";
  }

  if (
    value.includes("youtube.com") ||
    value.includes("youtu.be")
  ) {
    return "youtube";
  }

  if (
    value.includes("instagram.com") ||
    value.includes("instagr.am")
  ) {
    return "instagram";
  }

  if (
    value.includes("facebook.com") ||
    value.includes("fb.watch") ||
    value.includes("fb.com")
  ) {
    return "facebook";
  }

  return null;
}


/* =================================
   TIKTOK
   Source: TikWM
================================= */

async function getTikTok(url) {

  const response =
    await fetch(
      "https://www.tikwm.com/api/",
      {
        method: "POST",

        headers: {
          Accept:
            "application/json, text/javascript, */*; q=0.01",

          "Content-Type":
            "application/x-www-form-urlencoded; charset=UTF-8",

          Origin:
            "https://www.tikwm.com",

          Referer:
            "https://www.tikwm.com/",

          "User-Agent":
            "Mozilla/5.0"
        },

        body:
          new URLSearchParams({
            url,
            count: "12",
            cursor: "0",
            web: "1",
            hd: "1"
          })
      }
    );

  if (!response.ok) {
    throw new Error(
      `TikTok API error (${response.status})`
    );
  }

  const json =
    await response.json();

  const data =
    json?.data;

  if (!data) {
    throw new Error(
      "TikTok tidak mengembalikan media."
    );
  }

  // Prioritas HD tanpa watermark
  let mediaUrl = null;

  if (data.hdplay) {
    mediaUrl =
      "https://www.tikwm.com" +
      data.hdplay;
  }

  else if (data.play) {
    mediaUrl =
      "https://www.tikwm.com" +
      data.play;
  }

  if (!mediaUrl) {
    throw new Error(
      "Video TikTok tanpa watermark tidak ditemukan."
    );
  }

  return {
    url: mediaUrl,
    type: "video",
    title:
      data.title ||
      "TikTok Video"
  };
}


/* =================================
   YOUTUBE
   Source: YMCDN
================================= */

async function getYouTube(url) {

  const videoId =
    extractYouTubeId(url);

  if (!videoId) {
    throw new Error(
      "URL YouTube tidak valid."
    );
  }

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/130 Safari/537.36",

    Referer:
      "https://id.ytmp3.mobi/"
  };

  // INIT

  const initResponse =
    await fetch(
      "https://d.ymcdn.org/api/v1/init?p=y&23=1llum1n471&_=" +
      Math.random(),
      {
        headers
      }
    );

  if (!initResponse.ok) {
    throw new Error(
      "Server YouTube gagal diakses."
    );
  }

  const init =
    await initResponse.json();

  if (!init?.convertURL) {
    throw new Error(
      "Gagal menginisialisasi YouTube."
    );
  }

  // CONVERT MP4

  const convertURL =
    new URL(init.convertURL);

  convertURL.searchParams.set(
    "v",
    videoId
  );

  convertURL.searchParams.set(
    "f",
    "mp4"
  );

  convertURL.searchParams.set(
    "_",
    Math.random()
  );

  const convertResponse =
    await fetch(
      convertURL.href,
      { headers }
    );

  const convert =
    await convertResponse.json();

  if (
    !convert?.progressURL ||
    !convert?.downloadURL
  ) {
    throw new Error(
      "YouTube gagal mendapatkan URL download."
    );
  }

  // PROGRESS

  let progress = 0;
  let title =
    convert.title ||
    "YouTube Video";

  for (
    let attempt = 0;
    attempt < 20 && progress < 3;
    attempt++
  ) {

    const progressResponse =
      await fetch(
        convert.progressURL,
        { headers }
      );

    const data =
      await progressResponse.json();

    if (Number(data?.error || 0) > 0) {
      throw new Error(
        "Server YouTube gagal memproses video."
      );
    }

    progress =
      Number(data?.progress || 0);

    title =
      data?.title ||
      title;

    if (progress < 3) {
      await sleep(300);
    }
  }

  if (progress < 3) {
    throw new Error(
      "Proses YouTube timeout."
    );
  }

  return {
    url: convert.downloadURL,
    type: "video",
    title
  };
}


/* =================================
   INSTAGRAM
   Source: AZBRY
================================= */

async function getInstagram(url) {

  const endpoint =
    "https://api.azbry.com/api/download/instagramv2?url=" +
    encodeURIComponent(url);

  const response =
    await fetch(endpoint, {
      headers: {
        "User-Agent":
          "Mozilla/5.0"
      }
    });

  if (!response.ok) {
    throw new Error(
      `Instagram API error (${response.status})`
    );
  }

  const data =
    await response.json();

  if (
    !data?.status ||
    !Array.isArray(data.links) ||
    !data.links.length
  ) {
    throw new Error(
      "Instagram tidak mengembalikan media."
    );
  }

  // Cari video terlebih dahulu
  const video =
    data.links.find(item => {

      const type =
        String(
          item?.type || ""
        ).toLowerCase();

      const itemUrl =
        String(
          item?.url || ""
        ).toLowerCase();

      return (
        type === "video" ||
        type === "mp4" ||
        itemUrl.includes(".mp4")
      );
    });

  const media =
    video ||
    data.links[0];

  if (!media?.url) {
    throw new Error(
      "URL media Instagram tidak ditemukan."
    );
  }

  return {
    url: media.url,
    type:
      String(media.type)
        .toLowerCase()
        .includes("video")
        ? "video"
        : "image",
    title:
      data.author ||
      "Instagram Media"
  };
}


/* =================================
   FACEBOOK
   Source: AZBRY
================================= */

async function getFacebook(url) {

  const endpoint =
    "https://api.azbry.com/api/download/facebook?url=" +
    encodeURIComponent(url);

  const response =
    await fetch(endpoint, {
      headers: {
        "User-Agent":
          "Mozilla/5.0"
      }
    });

  if (!response.ok) {
    throw new Error(
      `Facebook API error (${response.status})`
    );
  }

  const data =
    await response.json();

  if (
    !data?.status ||
    !data?.result
  ) {
    throw new Error(
      "Facebook tidak mengembalikan media."
    );
  }

  const medias =
    data.result.medias || [];

  const video =
    medias.find(
      item =>
        item?.quality === "hd"
    ) ||
    medias.find(
      item =>
        item?.quality === "sd"
    ) ||
    medias[0];

  if (!video?.url) {
    throw new Error(
      "Video Facebook tidak ditemukan."
    );
  }

  return {
    url: video.url,
    type: "video",
    title:
      data.result.title ||
      "Facebook Video"
  };
}


/* =================================
   YOUTUBE ID
================================= */

function extractYouTubeId(url) {

  const match =
    String(url).match(
      /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([^"&?\/\s]{11})/i
    );

  return match?.[1] || null;
}


/* =================================
   SLEEP
================================= */

function sleep(ms) {
  return new Promise(
    resolve => setTimeout(resolve, ms)
  );
}
