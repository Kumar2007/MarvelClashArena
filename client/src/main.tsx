import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}

import { GameProvider } from "./contexts/gameContext";

createRoot(document.getElementById("root")!).render(
  <GameProvider>
    <App />
  </GameProvider>
);
