/* =========================================
   GALLEHS ANIME — TOP ANIME
   Endpoint found in Gallehs bot:
   https://my.izuka-api.xyz/api/anime/top-anime
========================================= */

const TOP_API = "https://my.izuka-api.xyz/api/anime/top-anime";
const topResults = document.getElementById("top-results");
const topMessage = document.getElementById("top-message");
const topRefreshBtn = document.getElementById("top-refresh-btn");

function escTop(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function topLoading() {
  topMessage.textContent = "Mengambil ranking...";
  topResults.innerHTML = `<div class="anime-empty"><div>🏆<h3>Loading ranking...</h3><p>Tunggu sebentar.</p></div></div>`;
}

function renderTop(list) {
  if (!list.length) {
    topResults.innerHTML = `<div class="anime-empty"><div><h3>Ranking kosong</h3><p>Belum ada data.</p></div></div>`;
    return;
  }

  topResults.innerHTML = list.slice(0, 20).map((item, index) => {
    const rank = item.rank ?? index + 1;
    const image = escTop(item.image || "");
    const name = escTop(item.name || "Unknown");
    const anime = escTop(item.anime || "Unknown");
    const japanese = escTop(item.japanese || "-");
    const favorites = escTop(item.favorites || "0");
    const votes = escTop(item.votes || "0");

    return `
      <article class="top-item">
        <div class="rank">#${escTop(rank)}</div>
        ${image ? `<img src="${image}" alt="${name}" loading="lazy">` : `<div class="anime-no-image">★</div>`}
        <div>
          <h4>${name}</h4>
          <p>Anime: ${anime}</p>
          <p>JP: ${japanese}</p>
          <p>Favorit: ${favorites} • Votes: ${votes}</p>
        </div>
      </article>`;
  }).join("");
}

async function loadTopAnime() {
  topLoading();

  try {
    const response = await fetch(TOP_API, {
      headers: { "Accept": "application/json" }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    console.log("[GALLEHS] Top anime response:", data);

    const list = data?.result?.result;
    if (!Array.isArray(list)) throw new Error("Format Top Anime tidak sesuai.");

    renderTop(list);
    topMessage.textContent = `${Math.min(list.length, 20)} karakter ditampilkan.`;
  } catch (err) {
    console.error("[GALLEHS] Top anime error:", err);
    topMessage.textContent = "Gagal mengambil ranking.";
    topResults.innerHTML = `
      <div class="anime-error">
        <strong>${escTop(err.message)}</strong>
        <p>Jika ini CORS, gunakan proxy Vercel untuk API tersebut.</p>
      </div>`;
  }
}

topRefreshBtn?.addEventListener("click", loadTopAnime);

// Load when the tab is opened, avoiding an unnecessary API call on page load.
document.querySelector('[data-panel="top-panel"]')?.addEventListener("click", () => {
  if (!topResults.dataset.loaded) {
    topResults.dataset.loaded = "1";
    loadTopAnime();
  }
});
