/* =========================================
   GALLEHS ANIME — SCREENSHOT CHECKER
   Endpoint found in Gallehs bot:
   https://my.izuka-api.xyz/api/anime/anime-checker

   Uses FormData field: image
========================================= */

const checkerInput = document.getElementById("anime-image-input");
const dropZone = document.getElementById("drop-zone");
const chooseImageBtn = document.getElementById("choose-image-btn");
const previewWrap = document.getElementById("image-preview-wrap");
const preview = document.getElementById("image-preview");
const checkBtn = document.getElementById("check-image-btn");
const clearBtn = document.getElementById("clear-image-btn");
const checkerMessage = document.getElementById("screenshot-message");
const checkerResult = document.getElementById("screenshot-result");

const CHECKER_API = "https://my.izuka-api.xyz/api/anime/anime-checker";
let selectedFile = null;

function escCheck(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    checkerMessage.textContent = "Pilih file gambar yang valid.";
    return;
  }

  selectedFile = file;
  preview.src = URL.createObjectURL(file);
  previewWrap.classList.remove("hidden");
  checkerMessage.textContent = `Gambar siap: ${file.name}`;
  checkerResult.innerHTML = "";
}

chooseImageBtn?.addEventListener("click", () => checkerInput.click());
dropZone?.addEventListener("click", e => {
  if (!e.target.closest("button")) checkerInput.click();
});

checkerInput?.addEventListener("change", () => {
  setFile(checkerInput.files?.[0]);
});

["dragenter", "dragover"].forEach(type => {
  dropZone?.addEventListener(type, e => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });
});

["dragleave", "drop"].forEach(type => {
  dropZone?.addEventListener(type, e => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
  });
});

dropZone?.addEventListener("drop", e => {
  setFile(e.dataTransfer.files?.[0]);
});

clearBtn?.addEventListener("click", () => {
  selectedFile = null;
  checkerInput.value = "";
  preview.src = "";
  previewWrap.classList.add("hidden");
  checkerResult.innerHTML = "";
  checkerMessage.textContent = "";
});

function renderChecker(data) {
  const result = data?.result;
  const match = result?.full_matches?.[0];

  if (!result || !match) {
    checkerResult.innerHTML = `<div class="anime-error">Anime tidak ditemukan. Coba screenshot yang lebih jelas.</div>`;
    return;
  }

  const titleRomaji = result.title_romaji || match?.anilist?.title?.romaji || "Tidak tersedia";
  const titleNative = result.title_native || match?.anilist?.title?.native || "Tidak tersedia";
  const episode = result.episode ?? match.episode ?? "Tidak diketahui";

  let similarity = result.similarity;
  if (similarity == null && match.similarity != null) {
    similarity = Number(match.similarity) * 100;
  }
  if (similarity != null && !Number.isNaN(Number(similarity))) {
    similarity = Number(similarity).toFixed(2) + "%";
  } else {
    similarity = "Tidak tersedia";
  }

  const image = result.image_preview || match.image || "";
  const siteUrl = match?.anilist?.siteUrl || (match?.anilist?.id
    ? `https://anilist.co/anime/${match.anilist.id}`
    : "");

  checkerResult.innerHTML = `
    <div class="checker-card">
      ${image ? `<img src="${escCheck(image)}" alt="${escCheck(titleRomaji)}">` : ""}
      <div class="checker-info">
        <h4>${escCheck(titleRomaji)}</h4>
        <div class="info-line"><b>Judul asli:</b> ${escCheck(titleNative)}</div>
        <div class="info-line"><b>Episode:</b> ${escCheck(episode)}</div>
        <div class="info-line"><b>Kemiripan:</b> ${escCheck(similarity)}</div>
        ${siteUrl ? `<div class="info-line"><a href="${escCheck(siteUrl)}" target="_blank" rel="noopener noreferrer">Buka AniList ↗</a></div>` : ""}
      </div>
    </div>`;
}

checkBtn?.addEventListener("click", async () => {
  if (!selectedFile) {
    checkerMessage.textContent = "Pilih screenshot terlebih dahulu.";
    return;
  }

  checkBtn.disabled = true;
  checkBtn.textContent = "Checking...";
  checkerMessage.textContent = "Menganalisis screenshot...";
  checkerResult.innerHTML = "";

  try {
    const form = new FormData();
    form.append("image", selectedFile, selectedFile.name || "image.jpg");

    const response = await fetch(CHECKER_API, {
      method: "POST",
      body: form
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    console.log("[GALLEHS] Anime checker response:", data);

    if (!data?.status) {
      throw new Error("API tidak menemukan anime.");
    }

    renderChecker(data);
    checkerMessage.textContent = "Selesai.";
  } catch (err) {
    console.error("[GALLEHS] Checker error:", err);
    checkerMessage.textContent = "Gagal mengecek screenshot.";
    checkerResult.innerHTML = `
      <div class="anime-error">
        <strong>${escCheck(err.message)}</strong>
        <p>Jika browser melaporkan CORS, endpoint ini perlu dipanggil melalui proxy/server.</p>
      </div>`;
  } finally {
    checkBtn.disabled = false;
    checkBtn.textContent = "🔍 Cek Anime";
  }
});
