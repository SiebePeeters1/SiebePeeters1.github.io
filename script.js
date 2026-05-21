/* ============================================================
   STUDIO INDEX — CRIMSON
   Minimal client-side router + UI niceties.
   ============================================================ */

(function () {
  const pages = {
    index: document.getElementById("page-index"),
    work: document.getElementById("page-work"),
    about: document.getElementById("page-about"),
  };
  const navLinks = document.querySelectorAll(".nav-link");

  function showPage(name) {
    if (!pages[name]) name = "index";

    Object.entries(pages).forEach(([key, el]) => {
      el.classList.toggle("is-active", key === name);
    });

    navLinks.forEach((link) => {
      link.classList.toggle("is-active", link.dataset.link === name);
    });

    // Update hash without jumping
    if (history.replaceState) {
      history.replaceState(null, "", "#" + name);
    }

    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  // Intercept clicks on any element with data-link
  document.addEventListener("click", function (e) {
    const target = e.target.closest("[data-link]");
    if (!target) return;
    const page = target.dataset.link;
    if (!page) return;
    e.preventDefault();
    showPage(page);
  });

  // Handle back/forward
  window.addEventListener("hashchange", function () {
    const name = (location.hash || "#index").replace("#", "");
    showPage(name);
  });

  // Initial load — read hash
  const initial = (location.hash || "#index").replace("#", "");
  showPage(initial);

  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
