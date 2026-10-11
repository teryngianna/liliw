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
});
