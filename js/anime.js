/* =========================================
   GALLEHS PROJECT — ANIME FINDER
========================================= */

const ANIME_API =
  "https://sylvatica.my.id/api/anime/otakotaku";

const API_KEY = "sylva-FwU0ERyW";


const searchInput =
  document.getElementById("anime-search");

const searchButton =
  document.getElementById("anime-search-btn");

const resultsContainer =
  document.getElementById("anime-results");

const message =
  document.getElementById("anime-message");


/* =========================================
   HELPERS
========================================= */

function escapeHTML(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function getTitle(item) {

  return (
    item.title ||
    item.judul ||
    item.name ||
    item.nama ||
    "Anime tanpa judul"
  );
}


function getImage(item) {

  return (
    item.thumbnail ||
    item.thumb ||
    item.image ||
    item.img ||
    item.cover ||
    item.poster ||
    item.posterUrl ||
    ""
  );
}


function getUrl(item) {

  return (
    item.url ||
    item.link ||
    item.href ||
    item.detail ||
    "#"
  );
}


/* =========================================
   MESSAGE
========================================= */

function setMessage(text) {

  if (message) {
    message.textContent = text;
  }

}


/* =========================================
   LOADING
========================================= */

function showLoading() {

  resultsContainer.innerHTML = `

    <div class="anime-empty">

      <div class="anime-empty-icon">
        ✦
      </div>

      <h3>
        Mencari anime...
      </h3>

      <p>
        Tunggu sebentar.
      </p>

    </div>

  `;

}


/* =========================================
   EMPTY
========================================= */

function showEmpty(text = "Anime tidak ditemukan.") {

  resultsContainer.innerHTML = `

    <div class="anime-empty">

      <div class="anime-empty-icon">
        ✦
      </div>

      <h3>
        ${escapeHTML(text)}
      </h3>

      <p>
        Coba gunakan judul anime lainnya.
      </p>

    </div>

  `;

}


/* =========================================
   ERROR
========================================= */

function showError(error) {

  resultsContainer.innerHTML = `

    <div class="anime-error">

      Gagal mengambil data anime.

      <small>
        ${escapeHTML(error)}
      </small>

    </div>

  `;

}


/* =========================================
   GET RESULTS
========================================= */

function extractResults(response) {

  if (Array.isArray(response)) {
    return response;
  }


  if (
    response &&
    Array.isArray(response.data)
  ) {
    return response.data;
  }


  if (
    response &&
    Array.isArray(response.results)
  ) {
    return response.results;
  }


  if (
    response &&
    Array.isArray(response.result)
  ) {
    return response.result;
  }


  return [];

}


/* =========================================
   RENDER
========================================= */

function renderAnime(results) {

  if (!results.length) {

    showEmpty();

    return;
  }


  resultsContainer.innerHTML =
    results.map((item) => {

      const title =
        escapeHTML(getTitle(item));

      const image =
        escapeHTML(getImage(item));

      const url =
        escapeHTML(getUrl(item));


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
                    onerror="
                      this.style.display='none';
                    "
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


/* =========================================
   SEARCH ANIME
========================================= */

async function searchAnime() {

  const query =
    searchInput.value.trim();


  if (!query) {

    setMessage(
      "Masukkan judul anime terlebih dahulu."
    );

    searchInput.focus();

    return;
  }


  if (!API_KEY ||
      API_KEY === "MASUKKAN_API_KEY_DI_SINI") {

    setMessage(
      "API key belum dipasang."
    );

    return;
  }


  searchButton.disabled = true;

  searchButton.textContent =
    "Searching...";


  setMessage(
    "Mencari anime..."
  );


  showLoading();


  try {

    const url =
      `${ANIME_API}` +
      `?q=${encodeURIComponent(query)}` +
      `&apikey=${encodeURIComponent(API_KEY)}`;


    const response =
      await fetch(url);


    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    const data =
      await response.json();


    console.log(
      "Anime API Response:",
      data
    );


    const results =
      extractResults(data);


    renderAnime(results);


    if (results.length) {

      setMessage(
        `${results.length} hasil ditemukan.`
      );

    } else {

      setMessage(
        "Tidak ada hasil."
      );

    }


  } catch (error) {

    console.error(
      "Anime API Error:",
      error
    );


    showError(
      error.message ||
      "Unknown error"
    );


    setMessage(
      "Terjadi kesalahan saat mencari anime."
    );


  } finally {

    searchButton.disabled = false;

    searchButton.textContent =
      "Search";

  }

}


/* =========================================
   SEARCH BUTTON
========================================= */

if (searchButton) {

  searchButton.addEventListener(
    "click",
    searchAnime
  );

}


/* =========================================
   ENTER KEY
========================================= */

if (searchInput) {

  searchInput.addEventListener(
    "keydown",
    function(event) {

      if (event.key === "Enter") {

        event.preventDefault();

        searchAnime();

      }

    }
  );

}


/* =========================================
   INITIAL STATE
========================================= */

setMessage(
  "Masukkan judul anime untuk mulai mencari."
);
