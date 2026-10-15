/* =========================================================
   LILIW: shared interactions for every page
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");

  /* ---- 1. Hamburger menu (phones) ---- */
  const burger = document.querySelector(".nav__burger");
  if (burger && header) {
    burger.addEventListener("click", () => {
      const open = header.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", open);
    });
  }

  /* ---- 2. MSMEs dropdown ---- */
  const dropdown = document.querySelector(".nav__dropdown");
  if (dropdown) {
    const toggle = dropdown.querySelector(".nav__dropdown-toggle");
    const isDesktop = () => window.matchMedia("(min-width: 901px)").matches;

    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      // On desktop, hovering already opened the menu, so a click just keeps it open.
      // (This fixes the "flicker closed on first click" glitch.)
      if (isDesktop()) { dropdown.classList.add("is-open"); toggle.setAttribute("aria-expanded", true); return; }
      const open = dropdown.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open);
    });
    // On desktop, hovering also opens it
    dropdown.addEventListener("mouseenter", () => { if (isDesktop()) dropdown.classList.add("is-open"); });
    dropdown.addEventListener("mouseleave", () => { if (isDesktop()) dropdown.classList.remove("is-open"); });
    // Clicking anywhere else closes it
    document.addEventListener("click", () => dropdown.classList.remove("is-open"));
    // Escape key closes it
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") dropdown.classList.remove("is-open"); });
  }

  /* ---- 3. FAQ accordions (business pages) ---- */
  document.querySelectorAll(".faq__q").forEach((btn) => {
    btn.addEventListener("click", () => {
      const faq = btn.closest(".faq");
      const open = faq.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open);
    });
  });

  /* ---- 4. Photo gallery: drag with the mouse to scroll (touch scrolling works by default) ---- */
  document.querySelectorAll(".gallery__track").forEach((track) => {
    let down = false, startX = 0, startScroll = 0, moved = false;
    track.addEventListener("mousedown", (e) => {
      down = true; moved = false; startX = e.pageX; startScroll = track.scrollLeft;
      track.classList.add("is-dragging");
    });
    window.addEventListener("mouseup", () => { down = false; track.classList.remove("is-dragging"); });
    track.addEventListener("mousemove", (e) => {
      if (!down) return;
      const dx = e.pageX - startX;
      if (Math.abs(dx) > 3) moved = true;
      track.scrollLeft = startScroll - dx;
    });
  });

  /* ---- 5. Search bar (works on every page) ---- */
  document.querySelectorAll(".search").forEach((form) => {
    const input = form.querySelector(".search__input");
    const list = form.querySelector(".search__results");
    const clear = form.querySelector(".search__clear");
    const data = window.SEARCH_INDEX || [];
    let results = [];
    let picked = -1;

    const norm = (t) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’']/g, "");

    function search(q) {
      const words = norm(q).split(/\s+/).filter(Boolean);
      if (!words.length) return [];
      return data
        .map((item) => {
          const title = norm(item.title), type = norm(item.type), text = norm(item.text);
          let score = 0;
          for (const w of words) {
            if (title.startsWith(w)) score += 6;
            else if (title.includes(w)) score += 4;
            else if (type.includes(w)) score += 3;
            else if (text.includes(w)) score += 1;
            else return null; // every word must match somewhere
          }
          return { item, score };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map((r) => r.item);
    }

    function render() {
      list.innerHTML = "";
      if (!input.value.trim()) { list.hidden = true; return; }
      if (!results.length) {
        list.innerHTML = '<li class="search__empty">No results found</li>';
      } else {
        results.forEach((r, i) => {
          const li = document.createElement("li");
          li.setAttribute("role", "option");
          li.className = i === picked ? "is-picked" : "";
          li.innerHTML = `<a href="${r.url}"><span class="search__title"></span><span class="search__type"></span></a>`;
          li.querySelector(".search__title").textContent = r.title;
          li.querySelector(".search__type").textContent = r.type;
          list.appendChild(li);
        });
      }
      list.hidden = false;
    }

    input.addEventListener("input", () => { results = search(input.value); picked = -1; render(); });
    input.addEventListener("focus", () => { if (input.value.trim()) render(); });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" && results.length) { e.preventDefault(); picked = (picked + 1) % results.length; render(); }
      if (e.key === "ArrowUp" && results.length) { e.preventDefault(); picked = (picked - 1 + results.length) % results.length; render(); }
      if (e.key === "Escape") { list.hidden = true; input.blur(); }
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const target = results[picked >= 0 ? picked : 0];
      if (target) window.location.href = target.url;
    });
    clear.addEventListener("click", () => { input.value = ""; results = []; render(); input.focus(); });
    document.addEventListener("click", (e) => { if (!form.contains(e.target)) list.hidden = true; });
  });

  /* ---- 6. Back to top: shows only when you reach the bottom of the page ---- */
  const toTop = document.querySelector(".back-to-top");
  if (toTop) {
    const check = () => {
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 160;
      const scrollable = document.documentElement.scrollHeight > window.innerHeight + 200;
      toTop.classList.toggle("is-visible", atBottom && scrollable);
    };
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    check();
    toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }
});
