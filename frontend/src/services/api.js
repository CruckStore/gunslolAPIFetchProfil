import axios from "axios";

const API_BASE_URL = "http://localhost:5050"; // Base URL de votre API

// Récupère l'historique complet du profil
export const getProfileHistory = async (username) => {
  const response = await axios.get(`${API_BASE_URL}/profile-history/${username}`);
  return response.data; // Retourne directement les données de l'API
};
