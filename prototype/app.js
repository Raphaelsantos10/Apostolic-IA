const titles = {
  home: "Boa leitura",
  courses: "Explore os cursos",
  bible: "Recursos bíblicos",
  progress: "O seu progresso",
  more: "Preferências e ajuda"
};

const themeSelect = document.querySelector("#theme-select");
const statusMessage = document.querySelector("#status-message");
const viewTitle = document.querySelector("#view-title");
const mainContent = document.querySelector("#main-content");
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

function applyTheme(value) {
  const resolved = value === "system" ? (systemTheme.matches ? "dark" : "light") : value;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved === "dark" ? "dark" : "light";
}

function setView(name, moveFocus = true) {
  document.querySelectorAll("[data-view-panel]").forEach((panel) => {
    const active = panel.dataset.viewPanel === name;
    panel.hidden = !active;
    panel.classList.toggle("is-visible", active);
  });

  document.querySelectorAll("[data-view]").forEach((control) => {
    const active = control.dataset.view === name;
    control.classList.toggle("is-active", active);
    if (active) control.setAttribute("aria-current", "page");
    else control.removeAttribute("aria-current");
  });

  viewTitle.textContent = titles[name];
  document.title = `${titles[name]} — Apostolic IA`;
  if (moveFocus) mainContent.focus();
}

const storedTheme = localStorage.getItem("apostolic-theme") || "system";
themeSelect.value = storedTheme;
applyTheme(storedTheme);

themeSelect.addEventListener("change", () => {
  localStorage.setItem("apostolic-theme", themeSelect.value);
  applyTheme(themeSelect.value);
  statusMessage.textContent = `Tema ${themeSelect.options[themeSelect.selectedIndex].text.toLowerCase()} aplicado.`;
});

systemTheme.addEventListener("change", () => {
  if (themeSelect.value === "system") applyTheme("system");
});

document.addEventListener("click", (event) => {
  const viewControl = event.target.closest("[data-view]");
  if (viewControl) {
    setView(viewControl.dataset.view);
    return;
  }

  const demoControl = event.target.closest("[data-demo-message]");
  if (demoControl) {
    statusMessage.textContent = demoControl.dataset.demoMessage;
  }
});

setView("home", false);
