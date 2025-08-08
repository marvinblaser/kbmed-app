import { auth, storage } from "./firebase-config.js";
import {
  ref,
  uploadBytes,
  listAll,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

let currentPath = "mediatheque/";
let selectedItems = [];

// SVG dossier
const folderSVG = `
<svg xmlns="http://www.w3.org/2000/svg" fill="#f4b400" viewBox="0 0 24 24" width="100%" height="150px">
  <path d="M10 4H2v16h20V6H12l-2-2z"/>
</svg>
`;

// Vérification connexion
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "/pages/login.html";
  } else {
    loadGallery();
  }
});

// Sécurité : attendre que le DOM soit prêt
document.addEventListener("DOMContentLoaded", () => {
  const uploadChoiceBtn = document.getElementById("uploadChoiceBtn");
  const createFolderBtn = document.getElementById("createFolderBtn");
  const goBackBtn = document.getElementById("goBackBtn");
  const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");
  const selectAllBtn = document.getElementById("selectAllBtn");
  const uploadPopup = document.getElementById("uploadPopup");
  const closePopup = document.getElementById("closePopup");
  const uploadFromDevice = document.getElementById("uploadFromDevice");
  const uploadFromCamera = document.getElementById("uploadFromCamera");
  const fileInput = document.getElementById("fileInput");
  const cameraInput = document.getElementById("cameraInput");

if (uploadChoiceBtn) {
  uploadChoiceBtn.addEventListener("click", () => {
    uploadPopup.style.display = "block";
  });
}

if (closePopup) {
  closePopup.addEventListener("click", () => {
    uploadPopup.style.display = "none";
  });
}

// Fermer le popup si on clique en dehors
window.addEventListener("click", (e) => {
  if (e.target === uploadPopup) {
    uploadPopup.style.display = "none";
  }
});

  if (uploadFromDevice) {
    uploadFromDevice.addEventListener("click", () => {
      fileInput.click();
      uploadPopup.style.display = "none";
    });
  }

  if (uploadFromCamera) {
    uploadFromCamera.addEventListener("click", () => {
      cameraInput.click();
      uploadPopup.style.display = "none";
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const files = e.target.files;
      if (!files.length) return;
      Array.from(files).forEach((file) => {
        const storageRef = ref(storage, currentPath + file.name);
        uploadBytes(storageRef, file).then(() => loadGallery());
      });
    });
  }

  if (cameraInput) {
    cameraInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const storageRef = ref(storage, currentPath + file.name);
      uploadBytes(storageRef, file).then(() => loadGallery());
    });
  }

  if (createFolderBtn) {
    createFolderBtn.addEventListener("click", () => {
      const folderName = prompt("Nom du dossier :");
      if (!folderName) return;
      const folderRef = ref(storage, currentPath + folderName + "/.keep");
      uploadBytes(folderRef, new Blob([])).then(() => loadGallery());
    });
  }

  if (goBackBtn) {
    goBackBtn.addEventListener("click", () => {
      if (currentPath !== "mediatheque/") {
        currentPath = currentPath.split("/").slice(0, -2).join("/") + "/";
        loadGallery();
      }
    });
  }

  if (deleteSelectedBtn) {
    deleteSelectedBtn.addEventListener("click", () => {
      if (!confirm("Supprimer tous les éléments sélectionnés ?")) return;
      const deletions = selectedItems.map(item => {
        if (item.type === "file") {
          return deleteObject(ref(storage, item.path));
        } else if (item.type === "folder") {
          return deleteFolder(item.path);
        }
      });
      Promise.all(deletions).then(() => {
        selectedItems = [];
        updateSelectionButtons();
        loadGallery();
      });
    });
  }

  if (selectAllBtn) {
    selectAllBtn.addEventListener("click", () => {
      const checkboxes = document.querySelectorAll(".select-checkbox");
      const allSelected = selectedItems.length === checkboxes.length;
      selectedItems = [];
      checkboxes.forEach((cb) => {
        cb.checked = !allSelected;
        if (!allSelected) {
          selectedItems.push({ path: cb.dataset.path, type: cb.dataset.type });
        }
      });
      updateSelectionButtons();
    });
  }

  document.addEventListener("change", (e) => {
    if (e.target.classList.contains("select-checkbox")) {
      const path = e.target.dataset.path;
      const type = e.target.dataset.type;
      if (e.target.checked) {
        selectedItems.push({ path, type });
      } else {
        selectedItems = selectedItems.filter(item => item.path !== path);
      }
      updateSelectionButtons();
    }
  });
});

// Met à jour les boutons et compteur
function updateSelectionButtons() {
  const hasSelection = selectedItems.length > 0;
  const totalItems = document.querySelectorAll(".select-checkbox").length;
  document.getElementById("deleteSelectedBtn").style.display = hasSelection ? "inline-block" : "none";
  document.getElementById("selectAllBtn").style.display = totalItems > 0 ? "inline-block" : "none";
  const selectionCount = document.getElementById("selectionCount");
  if (selectionCount) {
    if (hasSelection) {
      selectionCount.textContent = `${selectedItems.length} élément${selectedItems.length > 1 ? "s" : ""} sélectionné${selectedItems.length > 1 ? "s" : ""}`;
      selectionCount.style.display = "inline-block";
    } else {
      selectionCount.style.display = "none";
    }
  }
}

// Breadcrumb
function updateBreadcrumb() {
  const breadcrumb = document.getElementById("breadcrumb");
  breadcrumb.innerHTML = "";
  let pathParts = currentPath.replace(/\/$/, "").split("/");
  let pathSoFar = "";
  pathParts.forEach((part, index) => {
    if (part === "mediatheque") {
      breadcrumb.innerHTML += `<span data-path="mediatheque/">Médiathèque</span>`;
      pathSoFar = "mediatheque/";
    } else if (part) {
      pathSoFar += part + "/";
      breadcrumb.innerHTML += `<span data-path="${pathSoFar}">${part}</span>`;
    }
    if (index < pathParts.length - 1) {
      breadcrumb.innerHTML += `<span class="separator">/</span>`;
    }
  });
  breadcrumb.querySelectorAll("span[data-path]").forEach((el) => {
    el.addEventListener("click", () => {
      currentPath = el.getAttribute("data-path");
      loadGallery();
    });
  });
}

// Charger la galerie
function loadGallery() {
  updateBreadcrumb();
  const galleryRef = ref(storage, currentPath);
  listAll(galleryRef).then((res) => {
    const gallery = document.getElementById("gallery");
    gallery.innerHTML = "";
    document.getElementById("goBackBtn").style.display = currentPath !== "mediatheque/" ? "inline-block" : "none";

    // Dossiers
    res.prefixes.forEach((folderRef) => {
      const div = document.createElement("div");
      div.classList.add("gallery-item");
      div.innerHTML = `
        <input type="checkbox" class="select-checkbox" data-type="folder" data-path="${folderRef.fullPath}">
        ${folderSVG}
        <p contenteditable="true">${folderRef.name}</p>
        <button class="openBtn">Ouvrir</button>
      `;
      div.querySelector(".openBtn").addEventListener("click", () => {
        currentPath = folderRef.fullPath + "/";
        loadGallery();
      });
      div.querySelector("p").addEventListener("blur", (e) => {
        renameFolder(folderRef.fullPath, e.target.textContent);
      });
      gallery.appendChild(div);
    });

    // Fichiers
    res.items.forEach((itemRef) => {
      if (itemRef.name === ".keep") return;
      getDownloadURL(itemRef).then((url) => {
        const div = document.createElement("div");
        div.classList.add("gallery-item");
        div.innerHTML = `
          <input type="checkbox" class="select-checkbox" data-type="file" data-path="${itemRef.fullPath}">
          <img src="${url}" alt="${itemRef.name}">
          <p contenteditable="true">${itemRef.name}</p>
          <button onclick="window.location.href='/pages/editeur.html?path=${encodeURIComponent(itemRef.fullPath)}'">Modifier</button>
        `;
        div.querySelector("p").addEventListener("blur", (e) => {
          renameFile(itemRef, e.target.textContent);
        });
        gallery.appendChild(div);
      });
    });

    updateSelectionButtons();
  });
}

// Supprimer un dossier et son contenu
function deleteFolder(path) {
  const folderRef = ref(storage, path);
  return listAll(folderRef).then((res) => {
    const deletions = [];
    res.items.forEach((item) => {
      deletions.push(deleteObject(item));
    });
    res.prefixes.forEach((subFolder) => {
      deletions.push(deleteFolder(subFolder.fullPath));
    });
    return Promise.all(deletions);
  });
}

// Renommer un fichier
function renameFile(fileRef, newName) {
  getDownloadURL(fileRef).then((url) => {
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        const newRef = ref(storage, currentPath + newName);
        uploadBytes(newRef, blob).then(() => {
          deleteObject(fileRef).then(() => loadGallery());
        });
      });
  });
}

// Renommer un dossier
function renameFolder(oldPath, newName) {
  const parts = oldPath.split("/");
  parts[parts.length - 2] = newName;
  const newPath = parts.join("/");
  const folderRef = ref(storage, oldPath);
  listAll(folderRef).then((res) => {
    const moves = [];
    res.items.forEach((item) => {
      getDownloadURL(item).then((url) => {
        fetch(url)
          .then((res) => res.blob())
          .then((blob) => {
            const newRef = ref(storage, newPath + item.name);
            moves.push(uploadBytes(newRef, blob).then(() => deleteObject(item)));
          });
      });
    });
    Promise.all(moves).then(() => {
      deleteFolder(oldPath).then(() => loadGallery());
    });
  });
}