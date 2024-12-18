import { createContext, useState } from "react";
import { getProfileHistory } from "../services/api";

export const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(null); // Stocke le dernier profil recherché
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fonction pour récupérer l'historique d'un profil
  const fetchProfileHistory = async (username) => {
    if (!username || username.trim() === "") {
      setError("Invalid username. Please enter a valid name.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Appel API pour récupérer l'historique
      const data = await getProfileHistory(username);

      // Mettre à jour l'état avec le dernier profil
      setProfile({ username, history: data, lastChecked: new Date() });
    } catch (error) {
      console.error(`Error fetching history for "${username}":`, error);
      if (error.response?.status === 404) {
        setError(`Profile "${username}" not found.`);
      } else {
        setError("An unexpected error occurred. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProfileContext.Provider value={{ profile, loading, error, fetchProfileHistory }}>
      {children}
    </ProfileContext.Provider>
  );
};
