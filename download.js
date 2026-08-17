document.addEventListener("DOMContentLoaded", () => {
  const urlInput = document.getElementById("download-url");
  const pasteButton = document.getElementById("paste-button");
  const downloadButton = document.getElementById("download-button");

  const resultBox = document.getElementById("download-result");
  const thumbnail = document.getElementById("result-thumbnail");
  const title = document.getElementById("result-title");
  const author = document.getElementById("result-author");
  const duration = document.getElementById("result-duration");
  const message = document.getElementById("download-message");

  const platformButtons =
    document.querySelectorAll(".platform-button");

  let selectedPlatform = "auto";
  let processing = false;


  /* =========================
     MESSAGE
  ========================= */

  function showMessage(text) {
    if (message) {
      message.textContent = text;
    }
  }


  /* =========================
     DETECT PLATFORM
  ========================= */

  function detectPlatform(url) {
    const value = url.toLowerCase();

    if (
      value.includes("youtube.com") ||
      value.includes("youtu.be")
    ) {
      return "youtube";
    }

    if (
      value.includes("tiktok.com") ||
      value.includes("vm.tiktok.com")
    ) {
      return "tiktok";
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


  /* =========================
     PLATFORM BUTTON
  ========================= */

  platformButtons.forEach(button => {

    button.addEventListener("click", () => {

      platformButtons.forEach(item => {
        item.classList.remove("active");
      });

      button.classList.add("active");

      selectedPlatform =
        button.dataset.platform || "auto";

      showMessage(
        selectedPlatform === "auto"
          ? "Platform otomatis."
          : `Platform: ${selectedPlatform}`
      );

    });

  });


  /* =========================
     PASTE
  ========================= */

  pasteButton?.addEventListener("click", async () => {

    try {

      const text =
        await navigator.clipboard.readText();

      if (!text) {
        showMessage("Clipboard kosong.");
        return;
      }

      urlInput.value = text;

      const platform = detectPlatform(text);

      if (platform) {
        showMessage(
          `Link ${platform} terdeteksi.`
        );
      } else {
        showMessage("Link berhasil ditempel.");
      }

    } catch (error) {

      console.error(error);

      showMessage(
        "Tidak bisa membaca clipboard. Tempel link secara manual."
      );

    }

  });


  /* =========================
     RESET RESULT
  ========================= */

  function resetResult() {

    if (!resultBox) return;

    resultBox.hidden = true;

    if (thumbnail) {
      thumbnail.src = "";
    }

    if (title) {
      title.textContent = "-";
    }

    if (author) {
      author.textContent = "-";
    }

    if (duration) {
      duration.textContent = "-";
    }

  }


  /* =========================
     SHOW RESULT
  ========================= */

  function showResult(data) {

    if (!resultBox) return;

    if (thumbnail) {
      thumbnail.src =
        data.thumbnail ||
        data.thumb ||
        "";
    }

    if (title) {
      title.textContent =
        data.title ||
        data.name ||
        "Media";
    }

    if (author) {
      author.textContent =
        data.author ||
        data.uploader ||
        data.username ||
        "-";
    }

    if (duration) {
      duration.textContent =
        data.duration ||
        "-";
    }

    resultBox.hidden = false;

  }


  /* =========================
     DOWNLOAD
  ========================= */

  downloadButton?.addEventListener("click", async () => {

    if (processing) return;

    const url =
      urlInput.value.trim();

    if (!url) {

      showMessage(
        "Masukkan link terlebih dahulu."
      );

      urlInput.focus();

      return;
    }


    if (!/^https?:\/\//i.test(url)) {

      showMessage(
        "Link tidak valid."
      );

      return;
    }


    let platform = selectedPlatform;

    if (platform === "auto") {

      platform = detectPlatform(url);

      if (!platform) {

        showMessage(
          "Platform tidak didukung."
        );

        return;
      }

    }


    processing = true;

    resetResult();

    downloadButton.disabled = true;

    downloadButton.innerHTML =
      "<span>⟳</span> Processing...";

    showMessage(
      `Memproses ${platform}...`
    );


    try {

      /*
       * =========================
       * BACKEND
       * =========================
       *
       * Backend inilah yang nanti
       * memanggil API/provider.
       */

      const response = await fetch(
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


      let data = {};

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "Response API bukan JSON."
        );
      }


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


      /* =========================
         RESULT
      ========================= */

      showResult(data);


      showMessage(
        "Media berhasil ditemukan."
      );


      /*
       * =========================
       * DOWNLOAD
       * =========================
       */

      if (data.downloadUrl) {

        const downloadLink =
          document.createElement("a");

        downloadLink.href =
          data.downloadUrl;

        downloadLink.target =
          "_blank";

        downloadLink.rel =
          "noopener noreferrer";

        downloadLink.style.display =
          "none";

        document.body.appendChild(
          downloadLink
        );

        downloadLink.click();

        downloadLink.remove();

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

      downloadButton.disabled = false;

      downloadButton.innerHTML =
        "<span>↓</span> Download";

    }

  });


  /* =========================
     ENTER
  ========================= */

  urlInput?.addEventListener(
    "keydown",
    event => {

      if (event.key === "Enter") {

        event.preventDefault();

        downloadButton?.click();

      }

    }
  );

});