// Créer l'overlay de transition
const overlay = document.createElement("div");
overlay.classList.add("theme-transition-overlay");
document.body.appendChild(overlay);

// Appliquer le thème sauvegardé au chargement
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
}

// Fonction pour mettre à jour le bouton
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

// Écouteur sur le bouton
document.addEventListener("click", (e) => {
  if (e.target.id === "themeToggleBtn" || e.target.closest("#themeToggleBtn")) {
    const btn = document.getElementById("themeToggleBtn");
    const icon = btn.querySelector(".theme-icon");

    // Animation de rotation de l'icône
    icon.classList.add("rotate");
    setTimeout(() => {
      icon.classList.remove("rotate");
    }, 400);

    // Activer l'overlay
    overlay.classList.add("active");

    // Changer la couleur de l'overlay selon le thème
    if (document.body.classList.contains("dark-mode")) {
      overlay.style.setProperty("--overlay-color", "rgba(255, 255, 255, 0.3)");
    } else {
      overlay.style.setProperty("--overlay-color", "rgba(0, 0, 0, 0.3)");
    }

    // Attendre un peu pour l'effet
    setTimeout(() => {
      // Basculer le thème
      document.body.classList.toggle("dark-mode");

      // Sauvegarder le choix
      if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("theme", "dark");
      } else {
        localStorage.setItem("theme", "light");
      }

      // Mettre à jour le bouton
      updateThemeButton();

      // Retirer l'overlay après la transition
      setTimeout(() => {
        overlay.classList.remove("active");
      }, 300);
    }, 150);
  }
});

// Appliquer le thème sauvegardé au chargement
const themeLink = document.createElement("link");
themeLink.rel = "stylesheet";
themeLink.id = "themeStylesheet";
document.head.appendChild(themeLink);

function setTheme(theme) {
  if (theme === "dark") {
    themeLink.href = "/assets/css/theme-dark.css";
    localStorage.setItem("theme", "dark");
  } else {
    themeLink.href = "/assets/css/theme-light.css";
    localStorage.setItem("theme", "light");
  }
}

// Charger le thème sauvegardé ou clair par défaut
setTheme(localStorage.getItem("theme") || "light");

// Bouton de bascule
document.addEventListener("click", (e) => {
  if (e.target.id === "themeToggleBtn" || e.target.closest("#themeToggleBtn")) {
    const newTheme = localStorage.getItem("theme") === "dark" ? "light" : "dark";
    setTheme(newTheme);
  }
});

// Mettre à jour au chargement
document.addEventListener("DOMContentLoaded", updateThemeButton);

