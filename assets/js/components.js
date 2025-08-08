export function loadComponent(id, file) {
  fetch(`/components/${file}`)
    .then(res => res.text())
    .then(html => {
      const container = document.getElementById(id);
      if (!container) return;
      container.innerHTML = html;

      // Si on charge la sidebar
      if (file === "sidebar.html") {
        const currentPath = window.location.pathname;
        container.querySelectorAll(".nav-link").forEach(link => {
          if (link.getAttribute("href") === currentPath) {
            link.classList.add("active");
          }
        });

        // Gestion du burger menu
        const burgerBtn = document.getElementById("burgerBtn");
        const sidebar = document.querySelector(".sidebar");
        const overlay = document.getElementById("sidebarOverlay");

        if (burgerBtn && sidebar && overlay) {
          burgerBtn.addEventListener("click", () => {
            sidebar.classList.toggle("active");
            overlay.classList.toggle("active");
          });

          overlay.addEventListener("click", () => {
            sidebar.classList.remove("active");
            overlay.classList.remove("active");
          });
        }
      }
    })
    .catch(err => console.error("Erreur chargement composant :", err));
}