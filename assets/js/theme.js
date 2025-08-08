if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
}

function updateThemeButton() {
  const btn = document.getElementById("themeToggleBtn");
  if (!btn) return;
  const icon = btn.querySelector(".theme-icon");
  const text = btn.querySelector(".theme-text");
  if (document.body.classList.contains("dark-mode")) {
    icon.textContent = "☀";
    text.textContent = "Mode clair";
  } else {
    icon.textContent = "🌙";
    text.textContent = "Mode sombre";
  }
}

document.addEventListener("click", (e) => {
  if (e.target.id === "themeToggleBtn" || e.target.closest("#themeToggleBtn")) {
    const btn = document.getElementById("themeToggleBtn");
    const icon = btn.querySelector(".theme-icon");
    icon.classList.add("rotate");
    setTimeout(() => icon.classList.remove("rotate"), 400);
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
    updateThemeButton();
  }
});

document.addEventListener("DOMContentLoaded", updateThemeButton);