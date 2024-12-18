const ProfileHistory = ({ history, username }) => {
    return (
      <section>
        <h2>History for {username}</h2>
        {history.length > 0 ? (
          <ul>
            {history.map((entry, index) => (
              <li key={index}>
                <strong>Date:</strong> {entry.timestamp} <br />
                <strong>Views:</strong> {entry.data.views} <br />
                <strong>Join Date:</strong> {entry.data.joinDate}
              </li>
            ))}
          </ul>
        ) : (
          <p>No data found.</p>
        )}
      </section>
    );
  };
  
  export default ProfileHistory;
  