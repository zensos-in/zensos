import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { I18nProvider } from "./context/I18nContext";
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";

// A production-only UI deterrent. This does not secure client-side code,
// because a visitor's browser necessarily receives the application's assets.
if (import.meta.env.PROD) {
  document.addEventListener("contextmenu", (event) => event.preventDefault());
}

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>
);
