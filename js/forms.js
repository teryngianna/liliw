/* =========================================================
   LILIW: forms (Apply page steps + About page contact form)
   ========================================================= */

/* ---------------------------------------------------------
   GOOGLE SHEETS CONNECTION
   Paste your Google Apps Script "Web app URL" between the quotes.
   While this is empty, the forms still work for testing:
   they check the fields and show the success screen,
   but nothing is saved anywhere.
   --------------------------------------------------------- */
const SHEET_URL = "https://script.google.com/macros/s/AKfycby5vKxTJihxEKuO6fvNEGd3W9ExbPK5yHxjM7u-r6jgCDcMzj7Bfol2Ro9phKlAGCow0w/exec";

const MAX_FILE_MB = 10;
const ALLOWED_FILES = ["jpg", "jpeg", "png", "pdf", "docx"];

/* ---------- Small helpers ---------- */
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const isPhone = (v) => v.replace(/[^\d]/g, "").length >= 7;

function showError(field, message) {
  const wrap = field.closest(".field") || field.closest(".line-field");
  if (!wrap) return;
  wrap.classList.add("has-error");
  let msg = wrap.querySelector(".field-error");
  if (!msg) {
    msg = document.createElement("p");
    msg.className = "field-error";
    wrap.appendChild(msg);
  }
  msg.textContent = message;
}
function clearError(field) {
  const wrap = field.closest(".field") || field.closest(".line-field");
  if (!wrap) return;
  wrap.classList.remove("has-error");
  const msg = wrap.querySelector(".field-error");
  if (msg) msg.remove();
}

/* Checks every field inside "area". Returns true if all good. */
function validateArea(area) {
  let ok = true;
  let firstBad = null;
  const fail = (el, msg) => { showError(el, msg); ok = false; if (!firstBad) firstBad = el; };

  // Text, email, phone, textarea, file
  area.querySelectorAll("input:not([type=radio]):not([type=checkbox]):not([type=hidden]), textarea").forEach((el) => {
    if (el.classList.contains("other-input")) return;
    clearError(el);
    const v = el.type === "file" ? "" : el.value.trim();

    if (el.type === "file") {
      const file = el.files[0];
      if (el.required && !file) return fail(el, "Please upload your proof of registration.");
      if (file) {
        const ext = file.name.split(".").pop().toLowerCase();
        if (!ALLOWED_FILES.includes(ext)) return fail(el, "Please upload a JPG, PNG, DOCX, or PDF file.");
        if (file.size > MAX_FILE_MB * 1024 * 1024) return fail(el, `The file is larger than ${MAX_FILE_MB}MB.`);
      }
      return;
    }
    if (el.required && !v) return fail(el, "This field is required.");
    if (v && el.type === "email" && !isEmail(v)) return fail(el, "Please enter a valid email address.");
    if (v && el.hasAttribute("data-phone") && !isPhone(v)) return fail(el, "Please enter a valid contact number.");
    if (v && el.hasAttribute("data-year")) {
      const y = Number(v), now = new Date().getFullYear();
      if (!/^\d{4}$/.test(v) || y < 1500 || y > now) return fail(el, `Please enter a year between 1500 and ${now}.`);
    }
  });

  // Business category (pick one; "Other" needs text)
  area.querySelectorAll('[data-required-group="category"]').forEach((group) => {
    clearError(group);
    const picked = group.querySelector("input[type=radio]:checked");
    if (!picked) return fail(group, "Please choose a business category.");
    if (picked.value === "Other" && !group.querySelector(".other-input").value.trim()) {
      fail(group, "Please type your business category.");
    }
  });

  // Consent (all three must be ticked)
  area.querySelectorAll('[data-required-group="consent"]').forEach((group) => {
    clearError(group);
    const boxes = group.querySelectorAll("input[type=checkbox]");
    const allTicked = [...boxes].every((b) => b.checked);
    if (!allTicked) fail(group, "Please tick all three boxes to continue.");
  });

  if (firstBad) {
    const target = firstBad.matches("fieldset") ? firstBad.querySelector("input") : firstBad;
    target.focus({ preventScroll: true });
    firstBad.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  return ok;
}

/* Turns a file into text so it can be sent to Google */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* Sends the data to the Google Sheet (skipped while SHEET_URL is empty) */
async function sendToSheet(data) {
  if (!SHEET_URL) {
    await new Promise((r) => setTimeout(r, 600)); // short pause so it feels real
    return;
  }
  await fetch(SHEET_URL, {
    method: "POST",
    mode: "no-cors",
    body: new URLSearchParams(data),
  });
}

/* =========================================================
   APPLY PAGE
   ========================================================= */
const applyForm = document.getElementById("apply-form");
if (applyForm) {
  const steps = [...applyForm.querySelectorAll(".apply-step")];
  const dots = [...document.querySelectorAll(".stepper li")];
  const note = document.getElementById("apply-note");
  let current = 1;
  let furthest = 1;

  function goTo(n) {
    current = n;
    furthest = Math.max(furthest, n);
    steps.forEach((s) => (s.hidden = Number(s.dataset.step) !== n));
    dots.forEach((d, i) => {
      d.classList.toggle("is-current", i + 1 === n);
      d.classList.toggle("is-done", i + 1 < furthest || (i + 1 <= furthest && i + 1 !== n));
    });
    note.textContent = "";
    document.querySelector(".stepper-bar").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  applyForm.querySelectorAll("[data-next]").forEach((btn) =>
    btn.addEventListener("click", () => {
      if (validateArea(steps[current - 1])) goTo(current + 1);
    })
  );
  applyForm.querySelectorAll("[data-back]").forEach((btn) =>
    btn.addEventListener("click", () => goTo(current - 1))
  );
  // Clicking a step circle you've already reached jumps back to it
  document.querySelectorAll(".stepper [data-goto]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const n = Number(btn.dataset.goto);
      if (n < current || (n <= furthest && validateArea(steps[current - 1]))) goTo(n);
    })
  );

  // Clear an error as soon as the person fixes the field
  applyForm.addEventListener("input", (e) => {
    const t = e.target;
    if (t.type === "radio" || t.type === "checkbox" || t.classList.contains("other-input")) {
      const group = t.closest("[data-required-group]");
      if (group) clearError(group);
    } else clearError(t);
  });

  // Choosing "Other" puts the cursor in the Other box; typing in it selects "Other"
  const otherRadio = applyForm.querySelector('input[value="Other"]');
  const otherInput = applyForm.querySelector(".other-input");
  otherRadio.addEventListener("change", () => otherInput.focus());
  otherInput.addEventListener("input", () => { if (otherInput.value) otherRadio.checked = true; });

  // Upload box: show the chosen file name, support drag and drop
  const fileInput = document.getElementById("a-proof");
  const fileLabel = document.getElementById("upload-file");
  const uploadBox = document.getElementById("upload-box");
  fileInput.addEventListener("change", () => {
    fileLabel.textContent = fileInput.files[0] ? `Selected: ${fileInput.files[0].name}` : "";
    clearError(fileInput);
  });
  ["dragenter", "dragover"].forEach((ev) => uploadBox.addEventListener(ev, () => uploadBox.classList.add("is-dragover")));
  ["dragleave", "drop"].forEach((ev) => uploadBox.addEventListener(ev, () => uploadBox.classList.remove("is-dragover")));

  // Final submit
  applyForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateArea(steps[3])) return;

    const submitBtn = document.getElementById("apply-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    note.textContent = "";

    try {
      const fd = new FormData(applyForm);
      const data = {};
      fd.forEach((v, k) => { if (k !== "proof") data[k] = v; });
      if (data.category === "Other") data.category = `Other: ${data.categoryOther || ""}`;
      delete data.categoryOther;

      const file = fileInput.files[0];
      if (file && SHEET_URL) {
        data.fileName = file.name;
        data.fileType = file.type || "application/octet-stream";
        data.fileData = await fileToBase64(file);
      }

      await sendToSheet(data);
      window.location.href = "submitted.html";
    } catch (err) {
      console.error(err);
      note.textContent = "Something went wrong while sending. Please check your internet connection and try again.";
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit";
    }
  });
}

/* =========================================================
   ABOUT PAGE: "Get in Touch"
   ========================================================= */
const contactForm = document.getElementById("contact-form");
if (contactForm) {
  const status = contactForm.querySelector(".form-status");
  const btn = contactForm.querySelector("button[type=submit]");

  contactForm.addEventListener("input", (e) => clearError(e.target));
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "";
    status.className = "form-status";
    if (!validateArea(contactForm)) return;

    btn.disabled = true;
    btn.textContent = "Sending...";
    try {
      await sendToSheet(Object.fromEntries(new FormData(contactForm)));
      contactForm.reset();
      status.textContent = "Thank you! Your message has been sent.";
      status.classList.add("is-success");
    } catch (err) {
      status.textContent = "Something went wrong. Please try again.";
      status.classList.add("is-error");
    }
    btn.disabled = false;
    btn.textContent = "Send";
  });
}
