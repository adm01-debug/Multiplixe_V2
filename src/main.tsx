import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ReducedMotionProvider } from "./components/accessibility/ReducedMotionProvider";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ReducedMotionProvider>
      <App />
    </ReducedMotionProvider>
  </StrictMode>
);
