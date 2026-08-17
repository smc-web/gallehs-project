document.addEventListener("DOMContentLoaded", () => {

  const urlInput =
    document.getElementById("download-url");

  const pasteButton =
    document.getElementById("paste-button");

  const downloadButton =
    document.getElementById("download-button");

  const message =
    document.getElementById("download-message");

  const platformButtons =
    document.querySelectorAll(
      ".platform-button"
    );

  let selectedPlatform = "auto";
  let processing = false;


  /* ================================
     MESSAGE
  ================================ */

  function showMessage(text) {

    if (message) {
      message.textContent = text;
    }

  }


  /* ================================
     DETECT PLATFORM
  ================================ */

  function detectPlatform(url) {

    const value =
      String(url).toLowerCase();

    if (
      value.includes("tiktok.com") ||
      value.includes("vt.tiktok.com")
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
      value.includes("fb.watch") ||
      value.includes("fb.com")
    ) {
      return "facebook";
    }

    return null;
  }


  /* ================================
     PLATFORM BUTTON
  ================================ */

  platformButtons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        if (button.disabled) return;

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


  /* ================================
     PASTE
  ================================ */

  pasteButton?.addEventListener(
    "click",
    async () => {

      try {

        const text =
          await navigator.clipboard
            .readText();

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
            `${capitalize(platform)} terdeteksi.`
          );

        } else {

          showMessage(
            "Link berhasil ditempel."
          );

        }

      } catch {

        showMessage(
          "Tidak bisa membaca clipboard. Tempel link manual."
        );

      }

    }
  );


  /* ================================
     DOWNLOAD
  ================================ */

  downloadButton?.addEventListener(
    "click",
    async () => {

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

      if (
        !/^https?:\/\//i.test(url)
      ) {

        showMessage(
          "Link tidak valid."
        );

        return;
      }


      /* PLATFORM */

      let platform =
        selectedPlatform;

      if (
        platform === "auto"
      ) {

        platform =
          detectPlatform(url);

        if (!platform) {

          showMessage(
            "Platform belum didukung."
          );

          return;
        }

      }


      /* START */

      processing = true;

      downloadButton.disabled =
        true;

      downloadButton.innerHTML =
        "<span>⟳</span> Processing...";

      showMessage(
        `Memproses ${capitalize(platform)}...`
      );


      try {

        /* ============================
           BACKEND
        ============================ */

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
                url,
                platform
              })
            }
          );


        /* ============================
           ERROR
        ============================ */

        if (!response.ok) {

          let errorMessage =
            "Download gagal.";

          const contentType =
            response.headers.get(
              "content-type"
            ) || "";

          if (
            contentType.includes(
              "application/json"
            )
          ) {

            try {

              const data =
                await response.json();

              errorMessage =
                data.message ||
                errorMessage;

            } catch {}

          }

          throw new Error(
            errorMessage
          );
        }


        /* ============================
           CHECK FILE
        ============================ */

        const blob =
          await response.blob();

        if (
          !blob ||
          blob.size <= 0
        ) {

          throw new Error(
            "File yang diterima kosong."
          );

        }


        /* ============================
           EXTENSION
        ============================ */

        const contentType =
          response.headers.get(
            "content-type"
          ) || "";

        const isAudio =
          contentType.includes(
            "audio"
          );

        const extension =
          isAudio
            ? "mp3"
            : "mp4";


        /* ============================
           DOWNLOAD
        ============================ */

        const blobUrl =
          URL.createObjectURL(
            blob
          );

        const link =
          document.createElement(
            "a"
          );

        link.href =
          blobUrl;

        link.download =
          `gallehs-${platform}.${extension}`;

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


        /* ============================
           SUCCESS
        ============================ */

        showMessage(
          "✅ Berhasil! Download video tanpa WM"
        );

      } catch (error) {

        console.error(
          "[GALLEHS]",
          error
        );

        showMessage(
          `❌ ${error.message || "Download gagal."}`
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


  /* ================================
     ENTER
  ================================ */

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


  /* ================================
     HELPER
  ================================ */

  function capitalize(text) {

    return String(text)
      .charAt(0)
      .toUpperCase() +
      String(text)
        .slice(1);

  }

});
