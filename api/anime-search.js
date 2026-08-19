// Vercel Serverless Function
// File: api/anime-search.js

const KITSU_URL = "https://kitsu.io/api/edge/anime";
const JIKAN_URL = "https://api.jikan.moe/v4/anime";

function withTimeout(ms = 6500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { controller, timer };
}

async function fetchJSON(url, options = {}, timeoutMs = 6500) {
  const { controller, timer } = withTimeout(timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(options.headers || {})
      }
    });

    const text = await response.text();

    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return data;
  } finally {
    clearTimeout(timer);
  }
}

function mapKitsu(data) {
  const rows = Array.isArray(data?.data) ? data.data : [];

  return rows.map(item => {
    const a = item?.attributes || {};
    const titles = a.titles || {};

    return {
      id: item?.id || "",
      title:
        a.canonicalTitle ||
        titles.en ||
        titles.en_jp ||
        titles.ja_jp ||
        "Anime tanpa judul",
      image:
        a.posterImage?.large ||
        a.posterImage?.medium ||
        a.posterImage?.small ||
        "",
      url: item?.id
        ? `https://kitsu.io/anime/${encodeURIComponent(item.id)}`
        : "",
      score: a.averageRating ? Number(a.averageRating) / 10 : null,
      episodes: a.episodeCount ?? null,
      status: a.status || "Unknown",
      type: a.subtype || "Unknown",
      synopsis: a.synopsis || ""
    };
  });
}

function mapJikan(data) {
  const rows = Array.isArray(data?.data) ? data.data : [];

  return rows.map(item => ({
    id: item?.mal_id ?? "",
    title:
      item?.title ||
      item?.title_english ||
      item?.title_japanese ||
      "Anime tanpa judul",
    image:
      item?.images?.jpg?.large_image_url ||
      item?.images?.jpg?.image_url ||
      item?.images?.webp?.large_image_url ||
      "",
    url: item?.url || "",
    score: item?.score ?? null,
    episodes: item?.episodes ?? null,
    status: item?.status || "Unknown",
    type: item?.type || "Unknown",
    synopsis: item?.synopsis || ""
  }));
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      status: false,
      message: "Method Not Allowed"
    });
  }

  const rawQuery = Array.isArray(req.query?.q)
    ? req.query.q[0]
    : req.query?.q;

  const q = String(rawQuery || "").trim();

  if (!q) {
    return res.status(400).json({
      status: false,
      message: "Parameter q wajib diisi."
    });
  }

  if (q.length > 100) {
    return res.status(400).json({
      status: false,
      message: "Query terlalu panjang."
    });
  }

  const limitRaw = Number(req.query?.limit || 12);
  const limit = Math.min(
    Math.max(Number.isFinite(limitRaw) ? Math.floor(limitRaw) : 12, 1),
    20
  );

  // Same-origin endpoint: no browser-to-third-party CORS problem.
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");

  // Primary: Kitsu
  try {
    const url =
      `${KITSU_URL}` +
      `?filter[text]=${encodeURIComponent(q)}` +
      `&page[limit]=${limit}`;

    const data = await fetchJSON(url, {}, 6500);
    const results = mapKitsu(data);

    return res.status(200).json({
      status: true,
      source: "kitsu",
      query: q,
      count: results.length,
      results
    });
  } catch (kitsuError) {
    console.warn("Kitsu search failed:", kitsuError.message);
  }

  // Fallback: Jikan
  try {
    const url =
      `${JIKAN_URL}` +
      `?q=${encodeURIComponent(q)}` +
      `&limit=${limit}` +
      `&sfw=true`;

    const data = await fetchJSON(url, {}, 6500);
    const results = mapJikan(data);

    return res.status(200).json({
      status: true,
      source: "jikan",
      query: q,
      count: results.length,
      results
    });
  } catch (jikanError) {
    console.error("Jikan search failed:", jikanError.message);

    return res.status(502).json({
      status: false,
      message: "Semua sumber anime sedang tidak dapat diakses.",
      details: {
        kitsu: "failed",
        jikan: "failed"
      }
    });
  }
}
