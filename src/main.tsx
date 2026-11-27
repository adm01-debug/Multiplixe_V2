import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ReducedMotionProvider } from "./components/accessibility/ReducedMotionProvider";
import { LiveAnnouncerProvider } from "./components/accessibility/LiveAnnouncer";
import "./index.css";
import { aplicarPaletaSalva } from "@/lib/themePresets";
import { registrarServiceWorker } from "@/lib/pushSubscription";

// A paleta escolhida vale em qualquer rota, inclusive antes do React montar.
aplicarPaletaSalva();

// O service worker entrega push e cache offline; registrar cedo nao bloqueia a montagem.
void registrarServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ReducedMotionProvider>
      <LiveAnnouncerProvider>
        <App />
      </LiveAnnouncerProvider>
    </ReducedMotionProvider>
  </StrictMode>
);
