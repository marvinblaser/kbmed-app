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
let cropRect;
let cropping = false;

// 🔹 Message d'accueil
function drawWelcomeMessage() {
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#888";
  ctx.font = "20px Segoe UI";
  ctx.textAlign = "center";
  ctx.fillText(
    "Glissez-déposez une image ou utilisez les boutons ci-dessus",
    canvas.width / 2,
    canvas.height / 2
  );
}
drawWelcomeMessage();

// 🔹 Redimensionner le canvas à la taille de l'image
function resizeCanvasToImage(img) {
  const imgWidth = img.width;
  const imgHeight = img.height;

  canvas.setWidth(imgWidth);
  canvas.setHeight(imgHeight);

  img.set({ left: 0, top: 0 });

  const maxWidth = document.querySelector(".main-content").offsetWidth - 20;
  const maxHeight =
    window.innerHeight -
    document.querySelector(".main-header").offsetHeight -
    150;

  let zoom = 1;
  if (imgWidth > maxWidth || imgHeight > maxHeight) {
    zoom = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
  }

  canvas.setZoom(zoom);
}

// 🔹 Mettre l'image en arrière-plan
function setImageAsBackground(img) {
  img.selectable = false;
  img.evented = false;
  resizeCanvasToImage(img);
  canvas.add(img);
  canvas.sendToBack(img);
  saveState();
}

// 🔹 Sauvegarder l'état
function saveState() {
  mods = 0;
  state.push(JSON.stringify(canvas));
}

// 🔹 Charger depuis Firebase
function loadImageFromFirebase() {
  const fileRef = ref(storage, filePath);
  getDownloadURL(fileRef).then((url) => {
    fabric.Image.fromURL(
      url,
      (img) => {
        setImageAsBackground(img);
      },
      { crossOrigin: "anonymous" }
    );
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
      setImageAsBackground(img);
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
      setImageAsBackground(img);
    });
  };
  reader.readAsDataURL(file);
});

// 🔹 Ajouter texte
document.getElementById("addTextBtn").addEventListener("click", () => {
  const bgColor = document.getElementById("bgColorPicker").value;
  const text = new fabric.IText("Texte ici", {
    left: 100,
    top: 100,
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

// 🔹 Rogner
document.getElementById("cropBtn").addEventListener("click", () => {
  if (!cropping) {
    cropRect = new fabric.Rect({
      fill: "rgba(0,0,0,0.3)",
      originX: "left",
      originY: "top",
      stroke: "#ccc",
      strokeDashArray: [2, 2],
      opacity: 1,
      width: 200,
      height: 200,
      borderColor: "red",
      cornerColor: "green",
      hasRotatingPoint: false
    });
    canvas.add(cropRect);
    cropping = true;
  } else {
    const left = cropRect.left;
    const top = cropRect.top;
    const width = cropRect.width * cropRect.scaleX;
    const height = cropRect.height * cropRect.scaleY;

    const cropped = canvas.toDataURL({
      left: left,
      top: top,
      width: width,
      height: height
    });

    fabric.Image.fromURL(cropped, (img) => {
      setImageAsBackground(img);
    });

    cropping = false;
  }
});

// 🔹 Exporter sans marges avec Promise.all
function exportWithoutBorders() {
  return new Promise((resolve, reject) => {
    const bgImage = canvas.getObjects()[0];
    if (!bgImage) {
      reject("Aucune image à exporter !");
      return;
    }

    const width = bgImage.width * bgImage.scaleX;
    const height = bgImage.height * bgImage.scaleY;

    const tempCanvas = new fabric.Canvas(null, { width, height });

    const promises = canvas.getObjects().map((obj) => {
      return new Promise((res) => {
        if (obj.type === "image" && obj.getSrc) {
          fabric.Image.fromURL(obj.getSrc(), (img) => {
            img.set({
              left: (obj.left || 0) - (bgImage.left || 0),
              top: (obj.top || 0) - (bgImage.top || 0),
              scaleX: obj.scaleX,
              scaleY: obj.scaleY
            });
            tempCanvas.add(img);
            res();
          }, { crossOrigin: "anonymous" });
        } else {
          obj.clone((cloned) => {
            cloned.left = (cloned.left || 0) - (bgImage.left || 0);
            cloned.top = (cloned.top || 0) - (bgImage.top || 0);
            tempCanvas.add(cloned);
            res();
          });
        }
      });
    });

    Promise.all(promises).then(() => resolve(tempCanvas));
  });
}

// 🔹 Télécharger sans marges
document.getElementById("downloadBtn").addEventListener("click", () => {
  exportWithoutBorders()
    .then((tempCanvas) => {
      const dataURL = tempCanvas.toDataURL({ format: "png" });
      const a = document.createElement("a");
      a.href = dataURL;
      a.download = "image.png";
      a.click();
    })
    .catch((err) => alert(err));
});

// 🔹 Enregistrer dans Firebase sans marges
document.getElementById("saveFirebaseBtn").addEventListener("click", () => {
  exportWithoutBorders()
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
    })
    .catch((err) => alert(err));
});