/* =========================================
   GALLEHS ANIME — SEARCH
   Jikan API v4
========================================= */

const ANIME_SEARCH_API =
  "https://api.jikan.moe/v4/anime";

const searchInput =
  document.getElementById("anime-search");

const searchForm =
  document.getElementById("anime-search-form");

const searchButton =
  document.getElementById("anime-search-btn");

const searchResults =
  document.getElementById("anime-results");

const searchMessage =
  document.getElementById("anime-message");


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
    </div>
  `;

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
      </div>
    `;

    return;
  }


  searchResults.innerHTML =
    items.map(item => {

      const title =
        esc(
          item.title ||
          item.title_english ||
          item.title_japanese ||
          "Anime tanpa judul"
        );


      const image =
        esc(
          item.images?.jpg?.large_image_url ||
          item.images?.jpg?.image_url ||
          item.images?.webp?.large_image_url ||
          ""
        );


      const url =
        esc(
          item.url ||
          "#"
        );


      const score =
        item.score ??
        "N/A";


      const episodes =
        item.episodes ??
        "?";


      const status =
        item.status ||
        "Unknown";


      return `

        <article class="anime-card">

          <div class="anime-cover">

            ${
              image

                ? `
                  <img
                    src="${image}"
                    alt="${title}"
                    loading="lazy"
                  >
                `

                : `
                  <div class="anime-no-image">
                    ANIME
                  </div>
                `
            }

          </div>


          <div class="anime-card-content">

            <h3>
              ${title}
            </h3>


            <p style="
              color:#aaa1b8;
              font-size:8px;
              margin:0 0 10px;
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
              ${esc(status)}
            </p>


            ${
              url !== "#"

                ? `
                  <a
                    class="anime-detail"
                    href="${url}"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Lihat Detail
                  </a>
                `

                : ""
            }

          </div>

        </article>

      `;

    }).join("");

}


async function searchAnime() {

  const query =
    searchInput?.value.trim();


  if (!query) {

    searchMessage.textContent =
      "Masukkan judul anime terlebih dahulu.";

    searchInput?.focus();

    return;
  }


  searchButton.disabled = true;

  searchButton.textContent =
    "Searching...";

  searchMessage.textContent =
    `Mencari "${query}"...`;

  showLoading();


  try {

    const url =
      `${ANIME_SEARCH_API}` +
      `?q=${encodeURIComponent(query)}` +
      `&limit=12` +
      `&sfw=true`;


    console.log(
      "[GALLEHS] Jikan request:",
      url
    );


    const response =
      await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      });


    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    const data =
      await response.json();


    console.log(
      "[GALLEHS] Jikan response:",
      data
    );


    const items =
      Array.isArray(data?.data)
        ? data.data
        : [];


    renderAnime(items);


    searchMessage.textContent =
      items.length
        ? `${items.length} anime ditemukan.`
        : `Anime "${query}" tidak ditemukan.`;


  } catch (error) {

    console.error(
      "[GALLEHS] Anime search error:",
      error
    );


    searchResults.innerHTML = `

      <div class="anime-error">

        <div>

          <strong>
            Gagal mengambil data anime.
          </strong>

          <p>
            ${esc(error.message)}
          </p>

        </div>

      </div>

    `;


    searchMessage.textContent =
      "Pencarian gagal.";


  } finally {

    searchButton.disabled = false;

    searchButton.textContent =
      "Search";

  }

}


searchForm?.addEventListener(
  "submit",
  function(event) {

    event.preventDefault();

    searchAnime();

  }
);
