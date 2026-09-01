import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { initAnalytics } from "./lib/analytics.js";
import "./styles/console.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

/* After render, so counting never sits in front of first paint.
   No-op until SITE_CODE is set in lib/analytics.js. */
initAnalytics();
