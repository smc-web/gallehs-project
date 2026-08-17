/* =========================================
   GALLEHS PROJECT — ANIME FINDER
   Otakotaku API
========================================= */

const ANIME_API =
  "https://sylvatica.my.id/api/anime/otakotaku";

const API_KEY =
  "sylva-FwU0ERy";


/* =========================================
   ELEMENTS
========================================= */

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


/* =========================================
   GET TITLE
========================================= */

function getTitle(item) {

  return (
    item.title ||
    item.judul ||
    item.name ||
    item.nama ||
    "Anime tanpa judul"
  );
}


/* =========================================
   GET IMAGE
========================================= */

function getImage(item) {

  return (
    item.imageUrl ||
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


/* =========================================
   GET URL
========================================= */

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

  if (!resultsContainer) {
    return;
  }

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

function showEmpty(
  text = "Anime tidak ditemukan."
) {

  if (!resultsContainer) {
    return;
  }

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

  if (!resultsContainer) {
    return;
  }

  resultsContainer.innerHTML = `

    <div class="anime-error">

      <strong>
        Gagal mengambil data anime.
      </strong>

      <small>
        ${escapeHTML(error)}
      </small>

    </div>

  `;

}


/* =========================================
   EXTRACT ANIME RESULTS
========================================= */

function extractResults(response) {

  /*
    Response API:

    {
      "result": {
        "anime": [...]
      }
    }
  */

  if (
    response &&
    response.result &&
    Array.isArray(response.result.anime)
  ) {

    return response.result.anime;

  }


  /* Fallback */

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
   RENDER ANIME
========================================= */

function renderAnime(results) {

  if (!resultsContainer) {
    return;
  }


  if (!results.length) {

    showEmpty();

    return;

  }


  resultsContainer.innerHTML =
    results.map((item) => {

      const title =
        escapeHTML(
          getTitle(item)
        );


      const image =
        escapeHTML(
          getImage(item)
        );


      const url =
        escapeHTML(
          getUrl(item)
        );


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
                      this.parentElement.classList.add('image-error');
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
              url &&
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

                : `

                  <span class="anime-detail disabled">
                    Detail tidak tersedia
                  </span>

                `
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

  if (!searchInput) {
    console.error(
      "Element #anime-search tidak ditemukan."
    );

    return;
  }


  const query =
    searchInput.value.trim();


  /* Empty query */

  if (!query) {

    setMessage(
      "Masukkan judul anime terlebih dahulu."
    );

    showEmpty(
      "Masukkan judul anime."
    );

    searchInput.focus();

    return;

  }


  /* API key check */

  if (
    !API_KEY ||
    API_KEY === "MASUKKAN_API_KEY_DI_SINI"
  ) {

    setMessage(
      "API key belum dipasang."
    );

    return;

  }


  /* Disable button */

  if (searchButton) {

    searchButton.disabled = true;

    searchButton.textContent =
      "Searching...";

  }


  setMessage(
    `Mencari "${query}"...`
  );


  showLoading();


  try {

    /*
      Build API URL
    */

    const url =
      `${ANIME_API}` +
      `?q=${encodeURIComponent(query)}` +
      `&apikey=${encodeURIComponent(API_KEY)}`;


    console.log(
      "Anime API Request:",
      url
    );


    const response =
      await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      });


    /* HTTP error */

    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    /* JSON */

    const data =
      await response.json();


    console.log(
      "Anime API Response:",
      data
    );


    /* API status */

    if (
      data &&
      data.status === false
    ) {

      throw new Error(
        "API mengembalikan status false."
      );

    }


    /* Extract anime */

    const results =
      extractResults(data);


    console.log(
      "Anime Results:",
      results
    );


    /* Render */

    renderAnime(results);


    /* Message */

    if (results.length) {

      setMessage(
        `${results.length} anime ditemukan untuk "${query}".`
      );

    } else {

      setMessage(
        `Anime "${query}" tidak ditemukan.`
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

    /* Enable button */

    if (searchButton) {

      searchButton.disabled = false;

      searchButton.textContent =
        "Search";

    }

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


/* =========================================
   DEBUG
========================================= */

console.log(
  "Gallehs Anime Finder berhasil dimuat."
);
