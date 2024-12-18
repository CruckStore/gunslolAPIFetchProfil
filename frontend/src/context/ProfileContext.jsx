import { createContext, useState } from "react";
import { checkProfile, getProfileHistory } from "../services/api";

export const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProfileHistory = async (username) => {
    setLoading(true);
    try {
      await checkProfile(username);
      const data = await getProfileHistory(username);
      setHistory(data);
    } catch (error) {
      console.error("Error fetching profile history:", error);
    }
    setLoading(false);
  };

  return (
    <ProfileContext.Provider value={{ history, loading, fetchProfileHistory }}>
      {children}
    </ProfileContext.Provider>
  );
};
