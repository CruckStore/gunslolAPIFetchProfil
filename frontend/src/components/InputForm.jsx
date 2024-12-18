import { useState } from "react";

const InputForm = ({ onSubmit }) => {
  const [username, setUsername] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username) onSubmit(username);
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
      <input
        type="text"
        placeholder="eeEnter username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <button type="submit">Check Profile</button>
    </form>
  );
};

export default InputForm;
