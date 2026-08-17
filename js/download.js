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
      value.includes("tiktok.com") ||
      value.includes("vm.tiktok.com")
    ) {
      return "tiktok";
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

    if (
      value.includes("twitter.com") ||
      value.includes("x.com")
    ) {
      return "twitter";
    }

    if (
      value.includes("reddit.com") ||
      value.includes("redd.it")
    ) {
      return "reddit";
    }

    if (
      value.includes("capcut.com")
    ) {
      return "capcut";
    }

    if (
      value.includes("snapchat.com")
    ) {
      return "snapchat";
    }

    if (
      value.includes("soundcloud.com")
    ) {
      return "soundcloud";
    }

    if (
      value.includes("snackvideo.com")
    ) {
      return "snackvideo";
    }

    if (
      value.includes("douyin.com") ||
      value.includes("v.douyin.com")
    ) {
      return "douyin";
    }

    return null;
  }


  // =========================================
  // PLATFORM BUTTON
  // =========================================

  platformButtons.forEach(button => {

    button.addEventListener("click", () => {

      platformButtons.forEach(item => {
        item.classList.remove("active");
      });

      button.classList.add("active");

      selectedPlatform =
        button.dataset.platform || "auto";

      if (selectedPlatform === "auto") {
        showMessage("Platform otomatis.");
      } else {
        showMessage(
          `Platform: ${selectedPlatform}`
        );
      }

    });

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
          showMessage("Clipboard kosong.");
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
          "Tidak bisa membaca clipboard. Tempel link manual."
        );

      }

    }
  );


  // =========================================
  // RESET
  // =========================================

  function resetResult() {

    if (resultBox) {
      resultBox.hidden = true;
    }

  }


  // =========================================
  // DOWNLOAD
  // =========================================

  downloadButton?.addEventListener(
    "click",
    async () => {

      if (processing) return;

      const url =
        urlInput.value.trim();

      // =====================================
      // CHECK URL
      // =====================================

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


      // =====================================
      // DETECT
      // =====================================

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


      // =====================================
      // START
      // =====================================

      processing = true;

      resetResult();

      downloadButton.disabled =
        true;

      downloadButton.innerHTML =
        "<span>⟳</span> Processing...";

      showMessage(
        `Memproses ${platform}...`
      );


      try {

        // ===================================
        // REQUEST BACKEND
        // ===================================

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
                url: url
              })
            }
          );


        // ===================================
        // CHECK CONTENT TYPE
        // ===================================

        const contentType =
          response.headers.get(
            "content-type"
          ) || "";


        // ===================================
        // ERROR JSON
        // ===================================

        if (
          !response.ok
        ) {

          let errorMessage =
            "Download gagal.";

          if (
            contentType.includes(
              "application/json"
            )
          ) {

            try {

              const errorData =
                await response.json();

              errorMessage =
                errorData.message ||
                errorMessage;

            } catch {}

          }

          throw new Error(
            errorMessage
          );

        }


        // ===================================
        // FILE
        // ===================================

        const blob =
          await response.blob();


        if (!blob || blob.size === 0) {
          throw new Error(
            "File yang diterima kosong."
          );
        }


        // ===================================
        // CREATE DOWNLOAD
        // ===================================

        const blobUrl =
          URL.createObjectURL(blob);

        const link =
          document.createElement("a");

        link.href =
          blobUrl;

        link.download =
          platform === "soundcloud"
            ? "gallehs-audio.mp3"
            : "gallehs-video.mp4";

        link.style.display =
          "none";

        document.body.appendChild(
          link
        );

        link.click();

        link.remove();

        setTimeout(() => {
          URL.revokeObjectURL(
            blobUrl
          );
        }, 5000);


        // ===================================
        // SUCCESS
        // ===================================

        if (
          platform === "soundcloud"
        ) {

          showMessage(
            "Berhasil! Download Audio"
          );

        } else {

          showMessage(
            "Berhasil! Download Video Tanpa WM"
          );

        }


      } catch (error) {

        console.error(
          "Downloader error:",
          error
        );

        showMessage(
          error.message ||
          "Gagal mendownload media."
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


  // =========================================
  // ENTER
  // =========================================

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