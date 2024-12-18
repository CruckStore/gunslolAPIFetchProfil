import { useContext } from "react";
import { ProfileContext } from "../context/ProfileContext";
import Loader from "../components/Loader";

const Profile = () => {
  const { history, loading } = useContext(ProfileContext);

  return (
    <div>
      <h2>Profile History</h2>
      {loading ? (
        <Loader />
      ) : (
        <ul>
          {history.map((entry, index) => (
            <li key={index}>
              <strong>Date:</strong> {entry.timestamp} <br />
              <strong>Views:</strong> {entry.data.views} <br />
              <strong>Join Date:</strong> {entry.data.joinDate}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Profile;
