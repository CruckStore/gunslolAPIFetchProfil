import { useState, useContext } from "react";
import { ProfileContext } from "../context/ProfileContext";
import Header from "../components/Header";

const Home = () => {
  const [username, setUsername] = useState("");
  const { fetchProfileHistory } = useContext(ProfileContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchProfileHistory(username);
  };

  return (
    <div>
      <Header />
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button type="submit">Check Profile</button>
      </form>
    </div>
  );
};

export default Home;
