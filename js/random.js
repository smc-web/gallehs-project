/* =========================================
   GALLEHS ANIME — RANDOM SFW
   Source found in Gallehs bot:
   https://api.nexray.eu.cc/random/anime?type=...

   Web version intentionally uses SFW-only
   "waifu" type.
========================================= */

const RANDOM_API = "https://api.nexray.eu.cc/random/anime?type=waifu";
const randomBtn = document.getElementById("random-btn");
const randomResult = document.getElementById("random-result");
const randomMessage = document.getElementById("random-message");

function escRandom(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function randomLoading() {
  randomMessage.textContent = "Mengambil gambar random...";
  randomResult.innerHTML = `<div class="random-placeholder">🌸<p>Loading...</p></div>`;
}

async function loadRandomAnime() {
  randomLoading();
  randomBtn.disabled = true;

  try {
    const response = await fetch(RANDOM_API, {
      headers: { "Accept": "image/*,*/*" }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const contentType = response.headers.get("content-type") || "";

    // Nexray's bot consumes this endpoint as binary media.
    if (!contentType.startsWith("image/") && !contentType.includes("gif")) {
      throw new Error("API tidak mengembalikan gambar.");
    }

    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);

    randomResult.innerHTML = `
      <img src="${imageUrl}" alt="Random anime" loading="eager"
        onerror="this.parentElement.innerHTML='<div class=&quot;random-placeholder&quot;>Gambar gagal dimuat.</div>'">`;

    randomMessage.textContent = "Random anime berhasil dimuat.";
  } catch (err) {
    console.error("[GALLEHS] Random anime error:", err);
    randomMessage.textContent = "Gagal mengambil random anime.";
    randomResult.innerHTML = `
      <div class="random-placeholder">
        <div>⚠️</div>
        <p>${escRandom(err.message)}</p>
        <small>Jika browser menunjukkan CORS, endpoint perlu dipanggil melalui proxy.</small>
      </div>`;
  } finally {
    randomBtn.disabled = false;
  }
}

randomBtn?.addEventListener("click", loadRandomAnime);

// First random image when the Random tab is opened.
document.querySelector('[data-panel="random-panel"]')?.addEventListener("click", () => {
  if (!randomResult.dataset.loaded) {
    randomResult.dataset.loaded = "1";
    loadRandomAnime();
  }
});
