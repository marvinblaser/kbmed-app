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

      // Si on charge la sidebar
      if (file.includes("sidebar.html")) {
        const currentPath = window.location.pathname;
        container.querySelectorAll(".nav-link").forEach(link => {
          if (link.getAttribute("href") === currentPath) {
            link.classList.add("active");
          }
        });

        // Gestion du menu burger
        const burgerBtn = document.getElementById("burgerBtn");
        const sidebar = document.querySelector(".sidebar");
        const overlay = document.getElementById("sidebarOverlay");

        if (burgerBtn && sidebar && overlay) {
          // Ouvrir/fermer la sidebar
          burgerBtn.addEventListener("click", () => {
            sidebar.classList.toggle("active");
            overlay.classList.toggle("active");
          });

          // Fermer la sidebar en cliquant sur l’overlay
          overlay.addEventListener("click", () => {
            sidebar.classList.remove("active");
            overlay.classList.remove("active");
          });
        }
      }
    })
    .catch(err => console.error(err));
}