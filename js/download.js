document.addEventListener("DOMContentLoaded", () => {

  const urlInput =
    document.getElementById("download-url");

  const pasteButton =
    document.getElementById("paste-button");

  const downloadButton =
    document.getElementById("download-button");

  const message =
    document.getElementById("download-message");

  const resultBox =
    document.getElementById("download-result");

  const platformButtons =
    document.querySelectorAll(
      ".platform-button"
    );

  let selectedPlatform = "auto";
  let processing = false;


  // =========================================
  // MESSAGE
  // =========================================

  function showMessage(text) {

    if (message) {
      message.textContent = text;
    }

  }


  // =========================================
  // DETECT PLATFORM
  // =========================================

  function detectPlatform(url) {

    const value =
      url.toLowerCase();


    if (
      value.includes("tiktok.com")
    ) {
      return "tiktok";
    }


    if (
      value.includes("spotify.com") ||
      value.includes("spotify.link")
    ) {
      return "spotify";
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
      value.includes("fb.watch")
    ) {
      return "facebook";
    }


    return null;

  }


  // =========================================
  // PLATFORM BUTTON
  // =========================================

  platformButtons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        platformButtons.forEach(item => {

          item.classList.remove(
            "active"
          );

        });


        button.classList.add(
          "active"
        );


        selectedPlatform =
          button.dataset.platform ||
          "auto";


        if (
          selectedPlatform === "auto"
        ) {

          showMessage(
            "Platform otomatis."
          );

        } else {

          showMessage(
            `Platform: ${selectedPlatform}`
          );

        }

      }
    );

  });


  // =========================================
  // PASTE
  // =========================================

  pasteButton?.addEventListener(
    "click",
    async () => {

      try {

        const text =
          await navigator.clipboard.readText();


        if (!text) {

          showMessage(
            "Clipboard kosong."
          );

          return;

        }


        urlInput.value =
          text;


        const platform =
          detectPlatform(text);


        if (platform) {

          showMessage(
            `Link ${platform} terdeteksi.`
          );

        } else {

          showMessage(
            "Link berhasil ditempel."
          );

        }

      } catch (error) {

        console.error(error);

        showMessage(
          "Tidak bisa membaca clipboard. Tempel link secara manual."
        );

      }

    }
  );


  // =========================================
  // DOWNLOAD
  // =========================================

  downloadButton?.addEventListener(
    "click",
    async () => {

      if (processing) {
        return;
      }


      const url =
        urlInput.value.trim();


      if (!url) {

        showMessage(
          "Masukkan link terlebih dahulu."
        );

        urlInput.focus();

        return;

      }


      if (
        !/^https?:\/\//i.test(url)
      ) {

        showMessage(
          "Link tidak valid."
        );

        return;

      }


      let platform =
        selectedPlatform;


      if (
        platform === "auto"
      ) {

        platform =
          detectPlatform(url);


        if (!platform) {

          showMessage(
            "Platform tidak didukung."
          );

          return;

        }

      }


      // =========================================
      // COMING SOON
      // =========================================

      if (
        platform === "youtube" ||
        platform === "instagram" ||
        platform === "facebook"
      ) {

        showMessage(
          `${platform} masih Coming Soon.`
        );

        return;

      }


      processing = true;


      if (resultBox) {
        resultBox.hidden = true;
      }


      downloadButton.disabled =
        true;


      downloadButton.innerHTML =
        "<span>⟳</span> Processing...";


      showMessage(
        `Memproses ${platform}...`
      );


      try {

        // =====================================
        // CALL BACKEND
        // =====================================

        const response =
          await fetch(
            "/api/download",
            {

              method: "POST",

              headers: {

                "Content-Type":
                  "application/json"

              },

              body:
                JSON.stringify({

                  url:
                    url,

                  platform:
                    platform

                })

            }
          );


        let data = {};


        try {

          data =
            await response.json();

        } catch {

          throw new Error(
            "Response server bukan JSON."
          );

        }


        console.log(
          "DOWNLOAD RESPONSE:",
          data
        );


        if (
          !response.ok ||
          !data.success
        ) {

          throw new Error(
            data.message ||
            "Media gagal diproses."
          );

        }


        if (
          !data.downloadUrl
        ) {

          throw new Error(
            "URL media tidak ditemukan."
          );

        }


        // =====================================
        // DIRECT DOWNLOAD
        // =====================================

        const link =
          document.createElement("a");


        link.href =
          data.downloadUrl;


        link.download =
          data.filename ||
          (
            platform === "spotify"
              ? "spotify-audio.mp3"
              : "tiktok-video-no-wm.mp4"
          );


        link.target =
          "_blank";


        link.rel =
          "noopener noreferrer";


        link.style.display =
          "none";


        document.body.appendChild(
          link
        );


        link.click();


        link.remove();


        // =====================================
        // SUCCESS MESSAGE
        // =====================================

        if (
          platform === "tiktok"
        ) {

          showMessage(
            "Berhasil! Download Video Tanpa WM"
          );

        } else if (
          platform === "spotify"
        ) {

          showMessage(
            "Berhasil! Download Audio Spotify"
          );

        }

      } catch (error) {

        console.error(
          "DOWNLOAD ERROR:",
          error
        );


        showMessage(
          error.message ||
          "Gagal mengunduh media."
        );

      } finally {

        processing =
          false;


        downloadButton.disabled =
          false;


        downloadButton.innerHTML =
          "<span>↓</span> Download";

      }

    }
  );


  // =========================================
  // ENTER
  // =========================================

  urlInput?.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter"
      ) {

        event.preventDefault();

        downloadButton?.click();

      }

    }
  );

});
