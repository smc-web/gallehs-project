/* =========================================
   GALLEHS ANIME — SEARCH
   Calls YOUR Vercel API:
   /api/anime-search?q=...
========================================= */

const ANIME_SEARCH_API = "/api/anime-search";

const searchInput = document.getElementById("anime-search");
const searchForm = document.getElementById("anime-search-form");
const searchButton = document.getElementById("anime-search-btn");
const searchResults = document.getElementById("anime-results");
const searchMessage = document.getElementById("anime-message");

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showLoading() {
  searchResults.innerHTML = `
    <div class="anime-empty">
      <div>
        <div class="anime-empty-icon">✦</div>
        <h3>Mencari anime...</h3>
        <p>Tunggu sebentar.</p>
      </div>
    </div>`;
}

function renderAnime(items) {
  if (!items.length) {
    searchResults.innerHTML = `
      <div class="anime-empty">
        <div>
          <div class="anime-empty-icon">✦</div>
          <h3>Anime tidak ditemukan</h3>
          <p>Coba gunakan judul anime lainnya.</p>
        </div>
      </div>`;
    return;
  }

  searchResults.innerHTML = items.map(item => {
    const title = esc(item.title || "Anime tanpa judul");
    const image = esc(item.image || "");
    const url = esc(item.url || "#");
    const score =
      item.score === null || item.score === undefined
        ? "N/A"
        : Number(item.score).toFixed(2);

    const episodes = item.episodes ?? "?";
    const type = esc(item.type || "Unknown");
    const status = esc(item.status || "Unknown");

    return `
      <article class="anime-card">
        <div class="anime-cover">
          ${
            image
              ? `<img src="${image}" alt="${title}" loading="lazy"
                   onerror="this.style.display='none'">`
              : `<div class="anime-no-image">ANIME</div>`
          }
        </div>

        <div class="anime-card-content">
          <h3>${title}</h3>

          <p style="
            color:#aaa1b8;
            font-size:8px;
            margin:0 0 8px;
            line-height:1.6;
          ">
            ⭐ ${esc(score)}
            &nbsp; • &nbsp;
            EP ${esc(episodes)}
          </p>

          <p style="
            color:#aaa1b8;
            font-size:8px;
            margin:0 0 10px;
            line-height:1.6;
          ">
            ${type} • ${status}
          </p>

          ${
            url !== "#"
              ? `<a class="anime-detail"
                    href="${url}"
                    target="_blank"
                    rel="noopener noreferrer">
                    Lihat Detail
                 </a>`
              : ""
          }
        </div>
      </article>`;
  }).join("");
}

async function searchAnime() {
  const query = searchInput?.value.trim();

  if (!query) {
    searchMessage.textContent =
      "Masukkan judul anime terlebih dahulu.";
    searchInput?.focus();
    return;
  }

  searchButton.disabled = true;
  searchButton.textContent = "Searching...";
  searchMessage.textContent = `Mencari "${query}"...`;
  showLoading();

  try {
    const response = await fetch(
      `${ANIME_SEARCH_API}?q=${encodeURIComponent(query)}&limit=12`,
      {
        method: "GET",
        headers: {
          Accept: "application/json"
        },
        cache: "no-store"
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        data?.message || `HTTP ${response.status}`
      );
    }

    console.log("[GALLEHS] Anime search:", data);

    const items =
      Array.isArray(data?.results)
        ? data.results
        : [];

    renderAnime(items);

    if (items.length) {
      searchMessage.textContent =
        `${items.length} anime ditemukan • sumber: ${data.source || "API"}`;
    } else {
      searchMessage.textContent =
        `Anime "${query}" tidak ditemukan.`;
    }

  } catch (error) {
    console.error("[GALLEHS] Anime search error:", error);

    searchResults.innerHTML = `
      <div class="anime-error">
        <div>
          <strong>Gagal mengambil data anime.</strong>
          <p>${esc(error.message)}</p>
          <small>
            Coba lagi beberapa saat.
          </small>
        </div>
      </div>`;

    searchMessage.textContent = "Pencarian gagal.";
  } finally {
    searchButton.disabled = false;
    searchButton.textContent = "Search";
  }
}

searchForm?.addEventListener("submit", event => {
  event.preventDefault();
  searchAnime();
});
