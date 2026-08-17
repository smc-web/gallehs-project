document.addEventListener("DOMContentLoaded", () => {

  const urlInput =
    document.getElementById("download-url");

  const pasteButton =
    document.getElementById("paste-button");

  const downloadButton =
    document.getElementById("download-button");

  const resultBox =
    document.getElementById("download-result");

  const message =
    document.getElementById("download-message");

  const platformButtons =
    document.querySelectorAll(".platform-button");

  let selectedPlatform = "auto";
  let processing = false;


  // =================================
  // MESSAGE
  // =================================

  function showMessage(text) {
    if (message) {
      message.textContent = text;
    }
  }


  // =================================
  // DETECT PLATFORM
  // =================================

  function detectPlatform(url) {

    const value =
      url.toLowerCase();

    if (
      value.includes("tiktok.com") ||
      value.includes("vt.tiktok.com")
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


  // =================================
  // PLATFORM BUTTON
  // =================================

  platformButtons.forEach(button => {

    button.addEventListener("click", () => {

      if (button.disabled) {
        return;
      }

      platformButtons.forEach(item => {
        item.classList.remove("active");
      });

      button.classList.add("active");

      selectedPlatform =
        button.dataset.platform || "auto";

      if (selectedPlatform === "auto") {

        showMessage(
          "Platform otomatis."
        );

      } else {

        showMessage(
          `Platform: ${selectedPlatform}`
        );

      }

    });

  });


  // =================================
  // PASTE
  // =================================

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

        urlInput.value = text;

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


  // =================================
  // HIDE RESULT
  // =================================

  function hideResult() {

    if (resultBox) {
      resultBox.hidden = true;
      resultBox.style.display = "none";
    }

  }


  // =================================
  // DOWNLOAD FILE
  // =================================

  async function downloadFile(
    downloadUrl,
    filename
  ) {

    if (!downloadUrl) {
      throw new Error(
        "URL download tidak ditemukan."
      );
    }


    /*
     * Coba download langsung
     */

    const link =
      document.createElement("a");

    link.href =
      downloadUrl;

    link.download =
      filename || "download";

    link.rel =
      "noopener noreferrer";

    link.style.display =
      "none";

    document.body.appendChild(link);

    link.click();

    link.remove();

  }


  // =================================
  // DOWNLOAD BUTTON
  // =================================

  downloadButton?.addEventListener(
    "click",
    async () => {

      if (processing) {
        return;
      }


      const url =
        urlInput.value.trim();


      // =================================
      // EMPTY
      // =================================

      if (!url) {

        showMessage(
          "Masukkan link terlebih dahulu."
        );

        urlInput.focus();

        return;
      }


      // =================================
      // VALID URL
      // =================================

      if (
        !/^https?:\/\//i.test(url)
      ) {

        showMessage(
          "Link tidak valid."
        );

        return;
      }


      // =================================
      // PLATFORM
      // =================================

      let platform =
        selectedPlatform;


      if (platform === "auto") {

        platform =
          detectPlatform(url);

        if (!platform) {

          showMessage(
            "Platform tidak didukung."
          );

          return;
        }

      }


      // =================================
      // COMING SOON
      // =================================

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


      // =================================
      // PROCESSING
      // =================================

      processing = true;

      hideResult();

      downloadButton.disabled =
        true;

      downloadButton.innerHTML =
        "<span>⟳</span> Processing...";


      showMessage(
        `Memproses ${platform}...`
      );


      try {

        // =================================
        // BACKEND
        // =================================

        const response =
          await fetch(
            "/api/download",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                url: url,
                platform: platform
              })
            }
          );


        // =================================
        // JSON
        // =================================

        let data = {};

        try {

          data =
            await response.json();

        } catch {

          throw new Error(
            "Response server bukan JSON."
          );

        }


        // =================================
        // SERVER ERROR
        // =================================

        if (!response.ok) {

          throw new Error(
            data.message ||
            data.error ||
            `Server error (${response.status})`
          );

        }


        if (!data.success) {

          throw new Error(
            data.message ||
            "Media gagal diproses."
          );

        }


        // =================================
        // DOWNLOAD URL
        // =================================

        const downloadUrl =
          data.downloadUrl ||
          data.videoUrl ||
          data.audioUrl;


        if (!downloadUrl) {

          throw new Error(
            "URL media tidak ditemukan."
          );

        }


        // =================================
        // TIKTOK
        // =================================

        if (
          data.platform === "tiktok" ||
          platform === "tiktok"
        ) {

          await downloadFile(
            downloadUrl,
            data.filename ||
            "tiktok-video.mp4"
          );


          showMessage(
            "Berhasil! Download Video Tanpa WM"
          );

        }


        // =================================
        // SPOTIFY
        // =================================

        else if (
          data.platform === "spotify" ||
          platform === "spotify"
        ) {

          await downloadFile(
            downloadUrl,
            data.filename ||
            "spotify-audio.mp3"
          );


          showMessage(
            "Berhasil! Download Audio Spotify"
          );

        }


        // =================================
        // OTHER
        // =================================

        else {

          await downloadFile(
            downloadUrl,
            data.filename ||
            "download"
          );


          showMessage(
            "Berhasil! Download selesai."
          );

        }


      } catch (error) {

        console.error(
          "Downloader error:",
          error
        );

        showMessage(
          error.message ||
          "Gagal menghubungi server."
        );

      } finally {

        processing = false;

        downloadButton.disabled =
          false;

        downloadButton.innerHTML =
          "<span>↓</span> Download";

      }

    }
  );


  // =================================
  // ENTER
  // =================================

  urlInput?.addEventListener(
    "keydown",
    event => {

      if (event.key === "Enter") {

        event.preventDefault();

        downloadButton?.click();

      }

    }
  );


  // =================================
  // INITIAL STATE
  // =================================

  hideResult();

  showMessage(
    "Siap digunakan."
  );

});
