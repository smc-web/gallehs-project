document.addEventListener("DOMContentLoaded", () => {

  const pages = [
    {
      name: "Home",
      icon: "⌂",
      file: "index.html",
      paths: ["", "index.html"]
    },
    {
      name: "Service",
      icon: "⚙",
      file: "service.html",
      paths: ["service.html"]
    },
    {
      name: "Status",
      icon: "●",
      file: "status.html",
      paths: ["status.html"]
    }
  ];

  const currentPage =
    window.location.pathname
      .split("/")
      .pop()
      .toLowerCase();

  const nav = document.createElement("nav");
  nav.className = "bottom-nav";

  const slider = document.createElement("div");
  slider.className = "nav-slider";

  nav.appendChild(slider);

  let activeIndex = 0;

  pages.forEach((page, index) => {

    const link = document.createElement("a");

    link.href = page.file;
    link.className = "nav-item";

    link.innerHTML = `
      <span class="nav-icon">${page.icon}</span>
      <span>${page.name}</span>
    `;

    if (
      page.paths.includes(currentPage) ||
      (currentPage === "" && index === 0)
    ) {
      link.classList.add("active");
      activeIndex = index;
    }

    link.addEventListener("click", (event) => {

      if (index === activeIndex) {
        event.preventDefault();
        return;
      }

      activeIndex = index;

      slider.style.transform =
        `translate3d(${index * 100}%, 0, 0)`;
    });

    nav.appendChild(link);

  });

  document.body.appendChild(nav);

  /* Posisi awal selalu benar */
  slider.style.transform =
    `translate3d(${activeIndex * 100}%, 0, 0)`;

});
