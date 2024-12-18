import { useContext, useState, useEffect } from "react";
import { ProfileContext } from "../context/ProfileContext";
import Loader from "../components/Loader";
import { Line } from "react-chartjs-2";
import "chart.js/auto"; // Importation automatique de Chart.js
import "chartjs-adapter-date-fns"; // Importation de l'adaptateur date-fns
import { format } from "date-fns"; // Pour formater les dates si nécessaire

const Profile = () => {
  const { profile, loading, error, fetchProfileHistory } = useContext(ProfileContext);
  const [username, setUsername] = useState("");
  const [chartData, setChartData] = useState(null);
  const [options, setOptions] = useState({});

  const handleFetchProfile = () => {
    if (username.trim()) {
      fetchProfileHistory(username.trim());
      setUsername("");
    }
  };

  useEffect(() => {
    if (profile && profile.history) {
      // Nettoyer les valeurs pour s'assurer qu'elles soient numériques
      const timestamps = profile.history.map((entry) => new Date(entry.timestamp));
      const views = profile.history.map((entry) => {
        const cleanValue = String(entry.data.views).replace(/[,\.]/g, ""); // Retire les virgules et points
        return parseInt(cleanValue, 10) || 0; // Convertit en entier ou 0 si invalide
      });
  
      setChartData({
        labels: timestamps,
        datasets: [
          {
            label: "Views Over Time",
            data: views,
            borderColor: "blue",
            backgroundColor: "rgba(0, 0, 255, 0.2)",
            tension: 0.3,
          },
        ],
      });
  
      setOptions({
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Views Over Time for ${profile.username}`,
          },
        },
        scales: {
          x: {
            type: "time",
            time: {
              unit: determineTimeUnit(timestamps),
              tooltipFormat: "dd/MM/yyyy HH:mm",
            },
            title: {
              display: true,
              text: "Time",
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Views",
            },
          },
        },
      });
    }
  }, [profile]);
  

  // Fonction pour déterminer l'unité de temps
  const determineTimeUnit = (timestamps) => {
    const first = timestamps[0];
    const last = timestamps[timestamps.length - 1];
    const diff = (last - first) / (1000 * 60 * 60); // Différence en heures

    if (diff < 24) return "hour";
    if (diff < 720) return "day";
    return "month";
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Profile Manager</h1>

      {/* Input utilisateur */}
      <div>
        <input
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ marginRight: "10px", padding: "8px" }}
        />
        <button onClick={handleFetchProfile} disabled={loading} style={{ padding: "8px" }}>
          {loading ? "Loading..." : "Fetch Profile"}
        </button>
      </div>

      {/* Gestion des erreurs */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Loader */}
      {loading && <Loader />}

      {/* Graphique dynamique */}
      {profile && chartData && (
        <div style={{ width: "80%", margin: "20px auto" }}>
          <Line data={chartData} options={options} />
        </div>
      )}
    </div>
  );
};

export default Profile;
