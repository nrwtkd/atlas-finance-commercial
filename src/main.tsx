import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import LearningExperienceUpgrade from "./components/LearningExperienceUpgrade";
import "./styles.css";
import "./login-fit.css";
import "./experience.css";
import "./learning.css";
import "./universal-v3.css";
import "./learning-rich-v5.css";
import "./learning-depth-v6.css";
import "./onboarding-v7.css";
import "./ui-polish-v7.css";

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("Service worker gagal didaftarkan:", error);
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <LearningExperienceUpgrade />
  </StrictMode>
);
