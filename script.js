// SevaSathi demo application
// IMPORTANT: This version stores demo accounts and form entries in this browser only.
// Do not use real passwords or sensitive personal information in this demo.

const STORAGE_KEYS = {
  users: "sevasathi_demo_users",
  currentUser: "sevasathi_demo_current_user",
  volunteers: "sevasathi_demo_volunteers",
  feedback: "sevasathi_demo_feedback"
};

const $ = (id) => document.getElementById(id);

function readData(key, fallback = []) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function showMessage(id, message, isError = false) {
  const element = $(id);
  element.textContent = message;
  element.style.color = isError ? "#b42318" : "#08746e";
}

function getCurrentUser() {
  return readData(STORAGE_KEYS.currentUser, null);
}

function setCurrentUser(user) {
  if (user) {
    writeData(STORAGE_KEYS.currentUser, user);
  } else {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
  }
  updateAccountUI();
}

function updateAccountUI() {
  const user = getCurrentUser();
  $("accountStatus").textContent = user
    ? `Logged in as ${user.name} (${user.email})`
    : "You are not logged in.";

  $("registerForm").hidden = Boolean(user);
  $("loginForm").hidden = Boolean(user);
  $("logoutButton").hidden = !user;

  renderMyEntries();
}

function renderMyEntries() {
  const user = getCurrentUser();
  const volunteers = readData(STORAGE_KEYS.volunteers).filter(item => user && item.userEmail === user.email);
  const feedback = readData(STORAGE_KEYS.feedback).filter(item => user && item.userEmail === user.email);

  renderList("myVolunteers", volunteers, item =>
    `<strong>${escapeHTML(item.area)}</strong>${escapeHTML(item.name)}<br><small>${escapeHTML(item.date)}</small>`
  );

  renderList("myFeedback", feedback, item =>
    `<strong>${escapeHTML(item.type)}</strong>${escapeHTML(item.text)}<br><small>${escapeHTML(item.date)}</small>`
  );
}

function renderList(elementId, items, template) {
  const container = $(elementId);
  if (!getCurrentUser()) {
    container.textContent = "Log in to view your entries.";
    return;
  }
  if (items.length === 0) {
    container.textContent = "No submissions yet.";
    return;
  }

  container.replaceChildren();
  items.slice().reverse().forEach(item => {
    const div = document.createElement("div");
    div.className = "saved-item";
    // The template output is escaped before being added to the page.
    div.innerHTML = template(item);
    container.appendChild(div);
  });
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

// Demo registration. Passwords are stored in plain text, so use only fake demo credentials.
$("registerForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = $("registerName").value.trim();
  const email = $("registerEmail").value.trim().toLowerCase();
  const password = $("registerPassword").value;

  if (name.length < 2) {
    showMessage("authMessage", "Please enter your name.", true);
    return;
  }
  if (password.length < 6) {
    showMessage("authMessage", "Password must be at least 6 characters.", true);
    return;
  }

  const users = readData(STORAGE_KEYS.users);
  if (users.some(user => user.email === email)) {
    showMessage("authMessage", "An account with this email already exists. Please log in.", true);
    return;
  }

  users.push({ name, email, password });
  writeData(STORAGE_KEYS.users, users);
  setCurrentUser({ name, email });
  $("registerForm").reset();
  showMessage("authMessage", "Demo account created. You are now logged in.");
});

// Demo login.
$("loginForm").addEventListener("submit", event => {
  event.preventDefault();

  const email = $("loginEmail").value.trim().toLowerCase();
  const password = $("loginPassword").value;
  const user = readData(STORAGE_KEYS.users).find(
    item => item.email === email && item.password === password
  );

  if (!user) {
    showMessage("authMessage", "Email or password is incorrect.", true);
    return;
  }

  setCurrentUser({ name: user.name, email: user.email });
  $("loginForm").reset();
  showMessage("authMessage", "Login successful.");
});

// Demo logout.
$("logoutButton").addEventListener("click", () => {
  setCurrentUser(null);
  showMessage("authMessage", "You have logged out.");
});

// Volunteer form: saves to this browser's localStorage.
$("volunteerForm").addEventListener("submit", event => {
  event.preventDefault();
  const user = getCurrentUser();

  if (!user) {
    showMessage("volunteerMessage", "Please create an account or log in first.", true);
    return;
  }

  const name = $("volunteerName").value.trim();
  const email = $("volunteerEmail").value.trim();
  const area = $("volunteerArea").value;
  const note = $("volunteerNote").value.trim();

  if (!name || !email || !area) {
    showMessage("volunteerMessage", "Please complete all required fields.", true);
    return;
  }

  const entries = readData(STORAGE_KEYS.volunteers);
  entries.push({
    id: Date.now(),
    userEmail: user.email,
    name,
    email,
    area,
    note,
    date: new Date().toLocaleString()
  });
  writeData(STORAGE_KEYS.volunteers, entries);
  $("volunteerForm").reset();
  showMessage("volunteerMessage", "Volunteer form saved in this browser.");
  renderMyEntries();
});

// Feedback form: saves to this browser's localStorage.
$("feedbackForm").addEventListener("submit", event => {
  event.preventDefault();
  const user = getCurrentUser();

  if (!user) {
    showMessage("feedbackMessage", "Please create an account or log in first.", true);
    return;
  }

  const type = $("feedbackType").value;
  const text = $("feedbackText").value.trim();

  if (!type || !text) {
    showMessage("feedbackMessage", "Please complete all required fields.", true);
    return;
  }

  const entries = readData(STORAGE_KEYS.feedback);
  entries.push({
    id: Date.now(),
    userEmail: user.email,
    type,
    text,
    date: new Date().toLocaleString()
  });
  writeData(STORAGE_KEYS.feedback, entries);
  $("feedbackForm").reset();
  showMessage("feedbackMessage", "Thank you! Your feedback is saved in this browser.");
  renderMyEntries();
});

// Mobile navigation toggle.
$("menuToggle").addEventListener("click", () => {
  const nav = $("mainNav");
  const isOpen = nav.classList.toggle("open");
  $("menuToggle").setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll("#mainNav a").forEach(link => {
  link.addEventListener("click", () => {
    $("mainNav").classList.remove("open");
    $("menuToggle").setAttribute("aria-expanded", "false");
  });
});

// Restore demo login state when the page reloads.
updateAccountUI();
