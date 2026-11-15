
/*
  IMPORTANT:
  Replace the URL below with your deployed Google Apps Script URL.
*/

const GOOGLE_SCRIPT_URL =
  "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";

const $ = selector => document.querySelector(selector);

// =================================
// 1. LIGHT AND DARK THEME
// =================================

const themeToggle = $("#themeToggle");

function applyTheme(theme) {
  document.body.classList.toggle(
    "light-theme",
    theme === "light"
  );

  $("#themeIcon").textContent =
    theme === "light" ? "☾" : "☼";

  $(".theme-label").textContent =
    theme === "light" ? "Dark mode" : "Light mode";

  localStorage.setItem("portfolio-theme", theme);
}

applyTheme(localStorage.getItem("portfolio-theme") || "dark");

themeToggle.addEventListener("click", () => {
  const nextTheme =
    document.body.classList.contains("light-theme")
      ? "dark"
      : "light";

  applyTheme(nextTheme);
});

// =================================
// 2. MOBILE NAVIGATION
// =================================

const menuToggle = $("#menuToggle");
const navLinks = $("#navLinks");

menuToggle.addEventListener("click", () => {
  navLinks.classList.toggle("open");
});

navLinks.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
  });
});

// =================================
// 3. FOOTER YEAR
// =================================

$("#year").textContent = new Date().getFullYear();

// =================================
// 4. GOOGLE APPS SCRIPT URL CHECK
// =================================

function scriptIsConfigured() {
  return (
    GOOGLE_SCRIPT_URL.startsWith(
      "https://script.google.com/macros/s/"
    ) &&
    GOOGLE_SCRIPT_URL.endsWith("/exec")
  );
}

function showStatus(element, message, type = "") {
  element.textContent = message;
  element.className = `form-status ${type}`;
}

// =================================
// 5. CONTACT FORM
// =================================

$("#contactForm").addEventListener("submit", async event => {
  event.preventDefault();

  const form = event.currentTarget;
  const status = $("#formStatus");
  const button = form.querySelector("button[type='submit']");

  if (!form.reportValidity()) return;

  if (!scriptIsConfigured()) {
    showStatus(
      status,
      "Please configure your Google Apps Script URL first.",
      "error"
    );
    return;
  }

  const payload = {
    action: "submit",
    name: form.elements.namedItem("name").value.trim(),
    email: form.elements.namedItem("email").value.trim(),
    subject: form.elements.namedItem("subject").value.trim(),
    message: form.elements.namedItem("message").value.trim()
  };

  button.disabled = true;
  button.querySelector("span").textContent = "Sending...";

  showStatus(status, "Sending your message...");

  try {
    /*
      no-cors sends the request to Apps Script.
      Browser JavaScript cannot inspect its response.
    */

    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    form.reset();

    showStatus(
      status,
      "Thank you! Your message has been sent.",
      "success"
    );

  } catch (error) {
    console.error(error);

    showStatus(
      status,
      "Message could not be sent. Please try again.",
      "error"
    );

  } finally {
    button.disabled = false;
    button.querySelector("span").textContent = "Send message";
  }
});

// =================================
// 6. ADMIN PANEL SHOW / HIDE
// =================================

const adminPanel = $("#adminPanel");
const responsesView = $("#responsesView");

let adminPassword = "";
let jsonpCounter = 0;

$("#adminToggle").addEventListener("click", () => {
  adminPanel.classList.toggle("hidden");

  if (!adminPanel.classList.contains("hidden")) {
    adminPanel.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
});

// =================================
// 7. GOOGLE APPS SCRIPT JSONP
// =================================

function requestJsonp(params) {
  return new Promise((resolve, reject) => {

    const callbackName =
      `portfolioCallback${Date.now()}${jsonpCounter++}`;

    const script = document.createElement("script");

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Request timed out. Check Apps Script."));
    }, 15000);

    function cleanup() {
      clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = data => {
      cleanup();
      resolve(data);
    };

    const query = new URLSearchParams({
      ...params,
      callback: callbackName
    });

    script.src =
      `${GOOGLE_SCRIPT_URL}?${query.toString()}`;

    script.onerror = () => {
      cleanup();
      reject(new Error("Could not connect to Google Sheets."));
    };

    document.body.appendChild(script);
  });
}

// =================================
// 8. ADMIN LOGIN
// =================================

$("#adminLoginForm").addEventListener("submit", async event => {
  event.preventDefault();

  const password = $("#adminPassword").value;
  const status = $("#adminStatus");

  if (!scriptIsConfigured()) {
    showStatus(
      status,
      "Configure the Apps Script URL first.",
      "error"
    );
    return;
  }

  showStatus(status, "Checking password...");

  try {
    const result = await requestJsonp({
      action: "admin",
      password: password
    });

    if (!result.ok) {
      throw new Error(result.error || "Incorrect password.");
    }

    adminPassword = password;

    $("#adminPassword").value = "";

    $("#adminLoginForm").classList.add("hidden");
    responsesView.classList.remove("hidden");

    await loadResponses();

  } catch (error) {
    showStatus(status, error.message, "error");
  }
});

// =================================
// 9. RETRIEVE USER RESPONSES
// =================================

async function loadResponses() {

  const list = $("#responsesList");

  list.innerHTML =
    '<div class="empty-state">Loading messages...</div>';

  try {

    const result = await requestJsonp({
      action: "responses",
      password: adminPassword
    });

    if (!result.ok) {
      throw new Error(result.error || "Unable to load messages.");
    }

    const responses = Array.isArray(result.responses)
      ? result.responses
      : [];

    $("#responseCount").textContent =
      `${responses.length} messages`;

    if (responses.length === 0) {
      list.innerHTML =
        '<div class="empty-state">No messages received yet.</div>';
      return;
    }

    list.replaceChildren();

    responses.slice().reverse().forEach(item => {

      const card = document.createElement("article");
      card.className = "response-card";

      const top = document.createElement("div");
      top.className = "response-card-top";

      const identity = document.createElement("div");

      const name = document.createElement("strong");
      name.textContent = item.name || "Visitor";

      const email = document.createElement("div");
      email.className = "response-email";
      email.textContent = item.email || "";

      identity.append(name, email);

      const time = document.createElement("time");
      time.textContent = item.timestamp || "";

      top.append(identity, time);

      const subject = document.createElement("h4");
      subject.textContent = item.subject || "No subject";

      const message = document.createElement("p");
      message.textContent = item.message || "";

      card.append(top, subject, message);

      list.append(card);
    });

  } catch (error) {

    list.innerHTML = "";

    const errorBox = document.createElement("div");
    errorBox.className = "empty-state";
    errorBox.textContent = error.message;

    list.append(errorBox);
  }
}

// =================================
// 10. REFRESH RESPONSES
// =================================

$("#refreshResponses").addEventListener(
  "click",
  loadResponses
);

// =================================
// 11. ADMIN LOGOUT
// =================================

$("#logoutAdmin").addEventListener("click", () => {

  adminPassword = "";

  responsesView.classList.add("hidden");

  $("#adminLoginForm").classList.remove("hidden");

  showStatus($("#adminStatus"), "Signed out.");
});
