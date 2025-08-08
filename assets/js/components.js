import { auth } from "./firebase-config.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

export function loadComponent(id, file) {
  fetch(file)
    .then(res => {
      if (!res.ok) throw new Error(`Erreur chargement : ${file}`);
      return res.text();
    })
    .then(html => {
      const container = document.getElementById(id);
      if (!container) return;
      container.innerHTML = html;

      // Si on charge la sidebar → lien actif
      if (file.includes("sidebar.html")) {
        const currentPath = window.location.pathname;
        container.querySelectorAll(".nav-link").forEach(link => {
          if (link.getAttribute("href") === currentPath) {
            link.classList.add("active");
          }
        });
      }

      // Si on charge le header → attacher les événements
      if (file.includes("header.html")) {
        initHeaderEvents();
      }
    })
    .catch(err => console.error(err));
}

function initHeaderEvents() {
  const logoutBtn = document.getElementById("logoutBtn");
  const emailSpan = document.getElementById("userEmail");
  const themeToggleBtn = document.getElementById("themeToggleBtn");

  // Afficher l'email utilisateur
  onAuthStateChanged(auth, (user) => {
    if (user) {
      emailSpan.textContent = user.email;
    }
  });

  // Déconnexion
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      signOut(auth)
        .then(() => {
          window.location.href = "./pages/login.html";
        })
        .catch((error) => {
          console.error("Erreur de déconnexion :", error);
          alert("Impossible de se déconnecter. Réessayez.");
        });
    });
  }

  // Mode sombre
  if (themeToggleBtn) {
    // Appliquer le thème sauvegardé
    if (localStorage.getItem("theme") === "dark") {
      document.body.classList.add("dark-mode");
    }

    const updateThemeButton = () => {
      const icon = themeToggleBtn.querySelector(".theme-icon");
      const text = themeToggleBtn.querySelector(".theme-text");
      if (document.body.classList.contains("dark-mode")) {
        icon.textContent = "☀";
        text.textContent = "Mode clair";
      } else {
        icon.textContent = "🌙";
        text.textContent = "Mode sombre";
      }
    };

    updateThemeButton();

    themeToggleBtn.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      localStorage.setItem(
        "theme",
        document.body.classList.contains("dark-mode") ? "dark" : "light"
      );
      updateThemeButton();
    });
  }
}