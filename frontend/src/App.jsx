import AppRoutes from "./routes/AppRoutes";
import { ProfileProvider } from "./context/ProfileContext";

function App() {
  return (
    <ProfileProvider>
      <AppRoutes />
    </ProfileProvider>
  );
}

export default App;
