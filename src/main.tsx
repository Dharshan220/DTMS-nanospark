import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId="1051073717384-k6hquu1909ac7ec3fvlg2dd9u0ittq91.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
);
