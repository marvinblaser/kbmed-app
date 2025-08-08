import { auth, storage } from "./firebase.js";
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

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    loadGallery();
  }
});

// Boutons
const uploadChoiceBtn = document.getElementById("uploadChoiceBtn");
const createFolderBtn = document.getElementById("createFolderBtn");
const selectAllBtn = document.getElementById("selectAllBtn");
const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");
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

function updateSelectionButtons() {
  const hasSelection = selectedItems.length > 0;
  const totalItems = document.querySelectorAll(".select-checkbox").length;
  deleteSelectedBtn.style.display = hasSelection ? "inline-block" : "none";
  selectAllBtn.style.display = totalItems > 0 ? "inline-block" : "none";
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

function loadGallery() {
  updateBreadcrumb();
  const galleryRef = ref(storage, currentPath);
  listAll(galleryRef).then((res) => {
    const gallery = document.getElementById("gallery");
    gallery.innerHTML = "";
    res.prefixes.forEach((folderRef) => {
      const div = document.createElement("div");
      div.classList.add("gallery-item");
      div.innerHTML = `
        <input type="checkbox" class="select-checkbox" data-type="folder" data-path="${folderRef.fullPath}">
        <img src="../assets/img/folder-icon.svg" alt="Dossier">
        <p contenteditable="true">${folderRef.name}</p>
        <button class="openBtn">Ouvrir</button>
      `;
      div.querySelector(".openBtn").addEventListener("click", () => {
        currentPath = folderRef.fullPath + "/";
        loadGallery();
      });
      gallery.appendChild(div);
    });
    res.items.forEach((itemRef) => {
      if (itemRef.name === ".keep") return;
      getDownloadURL(itemRef).then((url) => {
        const div = document.createElement("div");
        div.classList.add("gallery-item");
        div.innerHTML = `
          <input type="checkbox" class="select-checkbox" data-type="file" data-path="${itemRef.fullPath}">
          <img src="${url}" alt="${itemRef.name}">
          <p contenteditable="true">${itemRef.name}</p>
          <button onclick="window.location.href='editeur.html?path=${encodeURIComponent(itemRef.fullPath)}'">Modifier</button>
        `;
        gallery.appendChild(div);
      });
    });
    updateSelectionButtons();
  });
}

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