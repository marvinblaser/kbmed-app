import fs from "fs";
import path from "path";

// Extensions de fichiers à traiter
const extensions = [".html", ".js"];

// Dossier racine du projet
const rootDir = process.cwd();

// Fonction pour traiter un fichier
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  // Remplacer les chemins absolus par relatifs
  content = content.replace(/"\/assets\//g, '"assets/');
  content = content.replace(/'\/assets\//g, "'assets/");
  content = content.replace(/"\/components\//g, '"components/');
  content = content.replace(/'\/components\//g, "'components/");

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`✅ Corrigé : ${filePath}`);
}

// Fonction pour parcourir les dossiers
function walkDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (extensions.includes(path.extname(file))) {
      fixFile(filePath);
    }
  });
}

// Lancer la correction
walkDir(rootDir);
console.log("🚀 Correction terminée !");