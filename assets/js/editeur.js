import { auth, storage } from "./firebase.js";
import {
  signOut,
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

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else if (filePath) {
    loadImageFromFirebase();
  }
});

function saveState() {
  mods = 0;
  state.push(JSON.stringify(canvas));
}

function loadImageFromFirebase() {
  const fileRef = ref(storage, filePath);
  getDownloadURL(fileRef).then((url) => {
    fabric.Image.fromURL(url, (img) => {
      img.scaleToWidth(800);
      setImageAsBackground(img);
    }, { crossOrigin: "anonymous" });
  });
}

document.getElementById("fileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (f) => {
    fabric.Image.fromURL(f.target.result, (img) => {
      img.scaleToWidth(800);
      setImageAsBackground(img);
    });
  };
  reader.readAsDataURL(file);
});

document.getElementById("cameraInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (f) => {
    fabric.Image.fromURL(f.target.result, (img) => {
      img.scaleToWidth(800);
      setImageAsBackground(img);
    });
  };
  reader.readAsDataURL(file);
});

document.getElementById("addTextBtn").addEventListener("click", () => {
  const bgColor = document.getElementById("bgColorPicker").value;
  const text = new fabric.IText("Texte ici", {
    left: 100,
    top: 100,
    fontSize: 20,
    backgroundColor: bgColor,
  });
  canvas.add(text);
  saveState();
});

document.getElementById("undoBtn").addEventListener("click", () => {
  if (mods < state.length) {
    canvas.clear();
    canvas.loadFromJSON(state[state.length - 1 - ++mods], () => {
      canvas.renderAll();
    });
  }
});

document.getElementById("redoBtn").addEventListener("click", () => {
  if (mods > 0) {
    canvas.clear();
    canvas.loadFromJSON(state[state.length - 1 - --mods], () => {
      canvas.renderAll();
    });
  }
});

document.getElementById("deleteBtn").addEventListener("click", () => {
  const active = canvas.getActiveObjects();
  if (active.length) {
    active.forEach((obj) => canvas.remove(obj));
    canvas.discardActiveObject();
    saveState();
  }
});

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
      hasRotatingPoint: false,
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
      height: height,
    });

    fabric.Image.fromURL(cropped, (img) => {
      canvas.clear();
      img.scaleToWidth(800);
      canvas.add(img);
      saveState();
    });

    cropping = false;
  }
});

document.getElementById("downloadBtn").addEventListener("click", () => {
  const dataURL = canvas.toDataURL({ format: "png" });
  const a = document.createElement("a");
  a.href = dataURL;
  a.download = "image.png";
  a.click();
});

document.getElementById("saveFirebaseBtn").addEventListener("click", () => {
  const dataURL = canvas.toDataURL({ format: "png" });
  fetch(dataURL)
    .then((res) => res.blob())
    .then((blob) => {
      const fileRef = ref(storage, filePath || `mediatheque/${Date.now()}.png`);
      uploadBytes(fileRef, blob).then(() => {
        alert("Image enregistrée dans Firebase !");
        window.location.href = "galerie.html";
      });
    });
});

// Message d'accueil dans le canvas vide
function drawWelcomeMessage() {
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#888";
  ctx.font = "20px Segoe UI";
  ctx.textAlign = "center";
  ctx.fillText("Glissez-déposez une image ou utilisez les boutons ci-dessus", canvas.width / 2, canvas.height / 2);
}

// Afficher le message au démarrage
drawWelcomeMessage();

function setImageAsBackground(img) {
  img.selectable = false; // Empêche de déplacer l'image
  img.evented = false; // Empêche toute interaction
  canvas.add(img);
  canvas.sendToBack(img); // Envoie l'image derrière tout
  saveState();
}