import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCMyoqNpOy__jUCteqqVn1zIIPq1YU5gNU",
  authDomain: "kbmed-firebase.firebaseapp.com",
  projectId: "kbmed-firebase",
  storageBucket: "kbmed-firebase.firebasestorage.app",
  messagingSenderId: "1036029885098",
  appId: "1:1036029885098:web:3011cf51cfe0f97ef82ed3",
  measurementId: "G-18Z7YYW6BQ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);