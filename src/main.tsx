import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ReducedMotionProvider } from "./components/accessibility/ReducedMotionProvider";
import { LiveAnnouncerProvider } from "./components/accessibility/LiveAnnouncer";
import "./index.css";
import { aplicarPaletaSalva } from "@/lib/themePresets";

// A paleta escolhida vale em qualquer rota, inclusive antes do React montar.
aplicarPaletaSalva();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ReducedMotionProvider>
      <LiveAnnouncerProvider>
        <App />
      </LiveAnnouncerProvider>
    </ReducedMotionProvider>
  </StrictMode>
);
