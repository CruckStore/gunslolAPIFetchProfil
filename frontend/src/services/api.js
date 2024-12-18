import axios from "axios";

const API_URL = "http://localhost:5050";

export const checkProfile = async (username) => {
  return await axios.post(`${API_URL}/check-profile`, { username });
};

export const getProfileHistory = async (username) => {
  const response = await axios.get(`${API_URL}/profile-history/${username}`);
  return response.data;
};
