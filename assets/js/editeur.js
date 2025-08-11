import { auth, storage } from "./firebase.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  ref,
  getDownloadURL,
  uploadBytes
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const urlParams = new URLSearchParams(window.location.search);
const filePath = urlParams.get("path");

const canvas = new fabric.Canvas("canvas");
let state = [];
let mods = 0;

// 🔹 Sauvegarder l'état
function saveState() {
  mods = 0;
  state.push(JSON.stringify(canvas));
}

// 🔹 Redimensionner le canvas à l'image
function resizeCanvasToImage(img) {
  canvas.setWidth(img.width);
  canvas.setHeight(img.height);
  img.set({ left: 0, top: 0 });
  canvas.setZoom(1);
}

// 🔹 Charger une image depuis Firebase
function loadImageFromFirebase() {
  const fileRef = ref(storage, filePath);
  getDownloadURL(fileRef).then((url) => {
    fabric.Image.fromURL(url, (img) => {
      img.selectable = false;
      img.evented = false;
      resizeCanvasToImage(img);
      canvas.add(img);
      canvas.sendToBack(img);
      saveState();
    }, { crossOrigin: "anonymous" });
  });
}

// 🔹 Authentification
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else if (filePath) {
    loadImageFromFirebase();
  }
});

// 🔹 Import depuis fichier
document.getElementById("fileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (f) => {
    fabric.Image.fromURL(f.target.result, (img) => {
      img.selectable = false;
      img.evented = false;
      resizeCanvasToImage(img);
      canvas.add(img);
      canvas.sendToBack(img);
      saveState();
    });
  };
  reader.readAsDataURL(file);
});

// 🔹 Import depuis caméra
document.getElementById("cameraInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (f) => {
    fabric.Image.fromURL(f.target.result, (img) => {
      img.selectable = false;
      img.evented = false;
      resizeCanvasToImage(img);
      canvas.add(img);
      canvas.sendToBack(img);
      saveState();
    });
  };
  reader.readAsDataURL(file);
});

// 🔹 Ajouter texte
document.getElementById("addTextBtn").addEventListener("click", () => {
  const bgColor = document.getElementById("bgColorPicker").value;
  const text = new fabric.IText("Texte ici", {
    left: 50,
    top: 50,
    fontSize: 20,
    backgroundColor: bgColor
  });
  canvas.add(text);
  saveState();
});

// 🔹 Annuler
document.getElementById("undoBtn").addEventListener("click", () => {
  if (mods < state.length) {
    canvas.clear();
    canvas.loadFromJSON(state[state.length - 1 - ++mods], () => {
      canvas.renderAll();
    });
  }
});

// 🔹 Rétablir
document.getElementById("redoBtn").addEventListener("click", () => {
  if (mods > 0) {
    canvas.clear();
    canvas.loadFromJSON(state[state.length - 1 - --mods], () => {
      canvas.renderAll();
    });
  }
});

// 🔹 Supprimer élément
document.getElementById("deleteBtn").addEventListener("click", () => {
  const active = canvas.getActiveObjects();
  if (active.length) {
    active.forEach((obj) => canvas.remove(obj));
    canvas.discardActiveObject();
    saveState();
  }
});

// 🔹 Calculer la zone englobante et exporter
function exportCanvas() {
  return new Promise((resolve) => {
    const objects = canvas.getObjects();
    if (objects.length === 0) {
      alert("Aucun contenu à exporter !");
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    objects.forEach((obj) => {
      const bounds = obj.getBoundingRect();
      minX = Math.min(minX, bounds.left);
      minY = Math.min(minY, bounds.top);
      maxX = Math.max(maxX, bounds.left + bounds.width);
      maxY = Math.max(maxY, bounds.top + bounds.height);
    });

    const exportWidth = maxX - minX;
    const exportHeight = maxY - minY;

    const tempCanvas = new fabric.Canvas(null, { width: exportWidth, height: exportHeight });

    const promises = objects.map((obj) => {
      return new Promise((res) => {
        if (obj.type === "image" && obj.getSrc) {
          fabric.Image.fromURL(obj.getSrc(), (img) => {
            img.set({
              left: (obj.left || 0) - minX,
              top: (obj.top || 0) - minY,
              scaleX: obj.scaleX,
              scaleY: obj.scaleY
            });
            tempCanvas.add(img);
            res();
          }, { crossOrigin: "anonymous" });
        } else {
          obj.clone((cloned) => {
            cloned.left = (cloned.left || 0) - minX;
            cloned.top = (cloned.top || 0) - minY;
            tempCanvas.add(cloned);
            res();
          });
        }
      });
    });

    Promise.all(promises).then(() => resolve(tempCanvas));
  });
}

// 🔹 Télécharger
document.getElementById("downloadBtn").addEventListener("click", () => {
  exportCanvas().then((tempCanvas) => {
    const dataURL = tempCanvas.toDataURL({ format: "png" });
    const a = document.createElement("a");
    a.href = dataURL;
    a.download = "image.png";
    a.click();
  });
});

// 🔹 Enregistrer dans Firebase
document.getElementById("saveFirebaseBtn").addEventListener("click", () => {
  exportCanvas()
    .then((tempCanvas) => {
      const dataURL = tempCanvas.toDataURL({ format: "png" });
      return fetch(dataURL).then((res) => res.blob());
    })
    .then((blob) => {
      const fileRef = ref(storage, filePath || `mediatheque/${Date.now()}.png`);
      return uploadBytes(fileRef, blob);
    })
    .then(() => {
      alert("Image enregistrée dans Firebase !");
      window.location.href = "galerie.html";
    });
});