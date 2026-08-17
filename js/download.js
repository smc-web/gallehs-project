document.addEventListener("DOMContentLoaded", () => {

  const input =
    document.getElementById("download-url");

  const paste =
    document.getElementById("paste-button");

  const button =
    document.getElementById("download-button");

  const message =
    document.getElementById("download-message");

  const result =
    document.getElementById("download-result");

  const platforms =
    document.querySelectorAll(".platform-button");

  let selected = "auto";
  let loading = false;


  function msg(text) {
    if (message) {
      message.textContent = text;
    }
  }


  function detect(url) {

    const u = url.toLowerCase();

    if (u.includes("tiktok.com"))
      return "tiktok";

    if (
      u.includes("spotify.com") ||
      u.includes("spotify.link")
    )
      return "spotify";

    if (
      u.includes("youtube.com") ||
      u.includes("youtu.be")
    )
      return "youtube";

    if (
      u.includes("instagram.com") ||
      u.includes("instagr.am")
    )
      return "instagram";

    if (
      u.includes("facebook.com") ||
      u.includes("fb.watch")
    )
      return "facebook";

    return null;
  }


  platforms.forEach(btn => {

    btn.addEventListener("click", () => {

      platforms.forEach(x =>
        x.classList.remove("active")
      );

      btn.classList.add("active");

      selected =
        btn.dataset.platform || "auto";

      msg(
        selected === "auto"
          ? "Platform otomatis."
          : `Platform: ${selected}`
      );

    });

  });


  paste?.addEventListener(
    "click",
    async () => {

      try {

        const text =
          await navigator.clipboard.readText();

        if (!text) {
          msg("Clipboard kosong.");
          return;
        }

        input.value = text;

        const platform =
          detect(text);

        msg(
          platform
            ? `Link ${platform} terdeteksi.`
            : "Link berhasil ditempel."
        );

      } catch {

        msg(
          "Gagal membaca clipboard."
        );

      }

    }
  );


  button?.addEventListener(
    "click",
    async () => {

      if (loading) return;

      const url =
        input.value.trim();

      if (!url) {
        msg(
          "Masukkan link terlebih dahulu."
        );
        return;
      }

      if (!/^https?:\/\//i.test(url)) {
        msg("Link tidak valid.");
        return;
      }

      let platform = selected;

      if (platform === "auto") {
        platform = detect(url);
      }

      if (!platform) {
        msg(
          "Platform tidak didukung."
        );
        return;
      }

      if (
        platform === "youtube" ||
        platform === "instagram" ||
        platform === "facebook"
      ) {
        msg(
          `${platform} masih Coming Soon.`
        );
        return;
      }

      loading = true;

      if (result) {
        result.hidden = true;
      }

      button.disabled = true;

      button.innerHTML =
        "<span>⟳</span> Processing...";

      msg(
        `Memproses ${platform}...`
      );

      try {

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

        const data =
          await response.json();

        console.log(
          "DOWNLOAD RESPONSE:",
          data
        );

        if (!response.ok ||
            !data.success) {

          throw new Error(
            data.message ||
            "Download gagal."
          );
        }

        if (!data.downloadUrl) {
          throw new Error(
            "URL media tidak ditemukan."
          );
        }


        // ==========================
        // DOWNLOAD
        // ==========================

        const a =
          document.createElement("a");

        a.href =
          data.downloadUrl;

        a.download =
          data.filename ||
          (
            platform === "spotify"
              ? "spotify-audio.mp3"
              : "tiktok-video.mp4"
          );

        a.target = "_blank";

        a.rel =
          "noopener noreferrer";

        a.style.display = "none";

        document.body.appendChild(a);

        a.click();

        a.remove();


        // ==========================
        // SUCCESS
        // ==========================

        if (platform === "tiktok") {

          msg(
            "Berhasil! Download Video Tanpa WM"
          );

        } else {

          msg(
            "Berhasil! Download Audio Spotify"
          );

        }

      } catch (error) {

        console.error(
          "DOWNLOAD ERROR:",
          error
        );

        msg(
          error.message ||
          "Gagal mengunduh media."
        );

      } finally {

        loading = false;

        button.disabled = false;

        button.innerHTML =
          "<span>↓</span> Download";

      }

    }
  );


  input?.addEventListener(
    "keydown",
    e => {

      if (e.key === "Enter") {
        e.preventDefault();
        button?.click();
      }

    }
  );

});
