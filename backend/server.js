const express = require("express");
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 5050;

app.use(cors());
app.use(express.json());

// Chemins des dossiers et fichiers
const DATA_DIR = path.join(__dirname, "data", "users");
const LOGS_DIR = path.join(__dirname, "data", "logs");
const INVALID_PROFILES_FILE = path.join(__dirname, "data", "invalid_profiles.json");
const LOCK_TIME = 30 * 1000; // 30 secondes en millisecondes
const CHECK_INTERVAL = 30000; // 15 minutes

// Assurez-vous que les dossiers et fichiers nécessaires existent
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });
if (!fs.existsSync(INVALID_PROFILES_FILE)) fs.writeFileSync(INVALID_PROFILES_FILE, JSON.stringify([]));

// Map pour suivre les fetchs en cours et les profils invalides
const fetchInProgress = new Map();
const invalidProfiles = new Map(
  JSON.parse(fs.readFileSync(INVALID_PROFILES_FILE, "utf-8")).map((p) => [p.username, p])
);

// Sauvegarder les profils invalides
const saveInvalidProfiles = () => {
  fs.writeFileSync(INVALID_PROFILES_FILE, JSON.stringify([...invalidProfiles.values()], null, 2));
};

// Fonction pour écrire des logs
const writeLog = (message, data = {}) => {
  const today = new Date().toISOString().split("T")[0]; // Format YYYY-MM-DD
  const logFilePath = path.join(LOGS_DIR, `${today}.json`);

  const logEntry = {
    timestamp: new Date().toISOString(),
    message,
    data,
  };

  if (fs.existsSync(logFilePath)) {
    const logs = JSON.parse(fs.readFileSync(logFilePath, "utf-8"));
    logs.push(logEntry);
    fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2));
  } else {
    fs.writeFileSync(logFilePath, JSON.stringify([logEntry], null, 2));
  }
};

// Fonction pour récupérer les données d'un profil
const fetchProfileData = async (username) => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const url = `https://guns.lol/${username}`;
  const timestamp = new Date().toISOString();

  try {
    writeLog(`Fetching profile data for: ${username}`);
    console.log(`🔍 Fetching data for: ${username}`);
    await page.goto(url, { waitUntil: "networkidle" });

    const data = await page.evaluate(() => ({
      username: document.querySelector("h1.false")?.innerText || "N/A",
      views: document.querySelector(".bVUZwR_599d5ef2ae281840bef2 span")?.innerText || "N/A",
      joinDate: document.querySelector("h2")?.innerText || "N/A",
    }));

    if (data.username === "N/A" && data.views === "N/A" && data.joinDate === "N/A") {
      invalidProfiles.set(username, { username, lastCheck: timestamp });
      saveInvalidProfiles();
      writeLog(`Invalid profile: ${username}`, { username });
      return { error: "Profil inexistant." };
    }

    const result = { timestamp, data };
    const filePath = path.join(DATA_DIR, `${username}.json`);
    let history = [];

    if (fs.existsSync(filePath)) {
      history = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
    history.push(result);

    fs.writeFileSync(filePath, JSON.stringify(history, null, 2));
    writeLog(`Profile data saved: ${username}`, { username, data: result });
    return result;
  } catch (error) {
    writeLog(`Error fetching profile: ${username}`, { username, error: error.message });
    console.error(`❌ Erreur lors du fetch pour '${username}':`, error.message);
    return { error: "Échec de récupération des données du profil." };
  } finally {
    await browser.close();
  }
};

const checkAllProfiles = async () => {
  writeLog("Starting automatic profile checks.");
  console.log("🚀 Début de la vérification automatique des profils...");

  const userFiles = fs.readdirSync(DATA_DIR).filter((file) => file.endsWith(".json"));
  const totalUsers = userFiles.length;

  if (totalUsers === 0) {
    writeLog("No profiles found to check.");
    console.log("⚠️ Aucun profil à vérifier.");
    return;
  }

  console.log(`📊 Total de profils à vérifier : ${totalUsers}`);

  let profilesChecked = 0; // Compteur de profils vérifiés
  let startTime = Date.now(); // Temps de démarrage pour calculer l'average

  const checkGroup = async (group) => {
    for (const file of group) {
      const username = path.basename(file, ".json");
      console.log(`🔄 Vérification du profil : ${username}`);

      const groupStartTime = Date.now();
      await fetchProfileData(username); // Vérification du profil
      const groupEndTime = Date.now();

      profilesChecked++;
      const elapsedTime = (groupEndTime - startTime) / 1000; // Temps écoulé en secondes
      const averageTimePerProfile = elapsedTime / profilesChecked; // Moyenne en secondes par profil
      const profilesRemaining = totalUsers - profilesChecked; // Profils restants
      const estimatedTimeRemaining = Math.ceil(profilesRemaining * averageTimePerProfile); // Temps restant estimé

      console.log(`✅ Profil vérifié : ${username}`);
      console.log(`📈 Temps moyen par profil : ${averageTimePerProfile.toFixed(2)} secondes.`);
      console.log(`⏳ Temps restant estimé : ${estimatedTimeRemaining} secondes.`);
    }
  };

  // Découper les utilisateurs en groupes de 2 profils
  const batchSize = 2;
  for (let i = 0; i < userFiles.length; i += batchSize) {
    const group = userFiles.slice(i, i + batchSize); // Sélectionner un groupe de 2 profils
    await checkGroup(group); // Vérifier ce groupe
  }

  const totalElapsedTime = (Date.now() - startTime) / 1000; // Temps total écoulé en secondes
  console.log("✅ Vérification automatique terminée.");
  console.log(`⏱️ Temps total : ${totalElapsedTime.toFixed(2)} secondes.`);
  writeLog("Automatic profile checks completed.");
};

// Planification de la vérification automatique
setInterval(checkAllProfiles, CHECK_INTERVAL);

// Route pour vérifier ou créer un profil
app.get("/profile-history/:username", async (req, res) => {
  const { username } = req.params;
  const filePath = path.join(DATA_DIR, `${username}.json`);

  // Vérifier si un fetch est déjà en cours
  if (fetchInProgress.has(username)) {
    const timeLeft = Math.ceil((LOCK_TIME - (Date.now() - fetchInProgress.get(username))) / 1000);
    writeLog(`Profile fetch in progress: ${username}`, { username, timeLeft });
    return res.status(423).json({
      message: `Profil en cours de création. Réessayez dans ${timeLeft > 0 ? timeLeft : 1} secondes.`,
    });
  }

  // Re-vérifier un profil marqué comme invalide
  if (invalidProfiles.has(username)) {
    writeLog(`Re-checking invalid profile: ${username}`);
    console.log(`🔄 Re-checking invalid profile '${username}'...`);
    fetchInProgress.set(username, Date.now());

    const result = await fetchProfileData(username);
    fetchInProgress.delete(username);

    if (result.error) {
      writeLog(`Profile still invalid: ${username}`, { username });
      return res.status(404).json({
        error: result.error,
        lastCheck: invalidProfiles.get(username).lastCheck,
      });
    } else {
      invalidProfiles.delete(username);
      saveInvalidProfiles();
      writeLog(`Invalid profile corrected: ${username}`, { username, data: result });
      return res.json([result]);
    }
  }

  // Si le fichier n'existe pas, fetch le profil
  if (!fs.existsSync(filePath)) {
    writeLog(`Profile not found, fetching: ${username}`);
    console.log(`Profil '${username}' introuvable. Création en cours...`);
    fetchInProgress.set(username, Date.now());

    const result = await fetchProfileData(username);
    fetchInProgress.delete(username);

    if (result.error) {
      writeLog(`Error fetching new profile: ${username}`, { username });
      return res.status(404).json({ error: result.error });
    }

    return res.json([result]);
  }

  // Retourner l'historique existant
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  writeLog(`Profile history returned: ${username}`, { username, historyLength: data.length });
  res.json(data);
});

// Middleware pour les routes invalides
app.use((req, res) => {
  writeLog(`Invalid request: ${req.method} ${req.url}`);
  res.status(404).json({
    error: "Requête invalide, essayez autre chose.",
    info: "discord.gg/cruckstore",
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  writeLog(`Server started on port ${PORT}`);
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
  console.log(`🔍 Profils invalides chargés : ${invalidProfiles.size}`);
});
