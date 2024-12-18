import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Profile from "../pages/Profile";
import axios from "axios";

export const checkProfile = async (username) => {
  return await axios.get(`/api/profile-history/${username}`);
};

export const getProfileHistory = async (username) => {
  return await axios.get(`/api/get-profile-history/${username}`);
};


const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
