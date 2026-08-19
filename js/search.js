/* =========================================
   GALLEHS ANIME — SEARCH
   Source: Otakotaku API used by previous UI.
   NOTE: If browser CORS blocks this endpoint,
   route it through your Vercel API proxy.
========================================= */

const ANIME_SEARCH_API = "https://sylvatica.my.id/api/anime/otakotaku";
const ANIME_SEARCH_KEY = "sylva-FwU0ERy";

const searchInput = document.getElementById("anime-search");
const searchForm = document.getElementById("anime-search-form");
const searchButton = document.getElementById("anime-search-btn");
const searchResults = document.getElementById("anime-results");
const searchMessage = document.getElementById("anime-message");

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showSearchLoading() {
  searchResults.innerHTML = `
    <div class="anime-empty">
      <div><div class="anime-empty-icon">✦</div><h3>Mencari anime...</h3><p>Tunggu sebentar.</p></div>
    </div>`;
}

function renderSearch(items) {
  if (!items.length) {
    searchResults.innerHTML = `
      <div class="anime-empty">
        <div><div class="anime-empty-icon">✦</div><h3>Anime tidak ditemukan</h3><p>Coba judul lainnya.</p></div>
      </div>`;
    return;
  }

  searchResults.innerHTML = items.map(item => {
    const title = esc(item.title || "Anime tanpa judul");
    const image = esc(item.imageUrl || "");
    const url = esc(item.url || "#");

    return `
      <article class="anime-card">
        <div class="anime-cover">
          ${image
            ? `<img src="${image}" alt="${title}" loading="lazy"
                onerror="this.style.display='none'">`
            : `<div class="anime-no-image">ANIME</div>`}
        </div>
        <div class="anime-card-content">
          <h3>${title}</h3>
          ${url !== "#"
            ? `<a class="anime-detail" href="${url}" target="_blank" rel="noopener noreferrer">Lihat Detail</a>`
            : ""}
        </div>
      </article>`;
  }).join("");
}

async function searchAnime() {
  const q = searchInput?.value.trim();

  if (!q) {
    searchMessage.textContent = "Masukkan judul anime terlebih dahulu.";
    searchInput?.focus();
    return;
  }

  searchButton.disabled = true;
  searchButton.textContent = "Searching...";
  searchMessage.textContent = `Mencari "${q}"...`;
  showSearchLoading();

  try {
    const url = `${ANIME_SEARCH_API}?q=${encodeURIComponent(q)}&apikey=${encodeURIComponent(ANIME_SEARCH_KEY)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    console.log("[GALLEHS] Search response:", data);

    const items = data?.result?.anime;
    if (!Array.isArray(items)) throw new Error("Format response API berubah.");

    renderSearch(items);
    searchMessage.textContent = items.length
      ? `${items.length} anime ditemukan.`
      : `Anime "${q}" tidak ditemukan.`;

  } catch (err) {
    console.error("[GALLEHS] Search error:", err);

    searchResults.innerHTML = `
      <div class="anime-error">
        <div>
          <strong>Gagal mengambil data anime.</strong>
          <p>${esc(err.message)}</p>
          <small>Jika console menunjukkan CORS, gunakan proxy Vercel untuk endpoint ini.</small>
        </div>
      </div>`;

    searchMessage.textContent = "Pencarian gagal.";
  } finally {
    searchButton.disabled = false;
    searchButton.textContent = "Search";
  }
}

searchForm?.addEventListener("submit", e => {
  e.preventDefault();
  searchAnime();
});
