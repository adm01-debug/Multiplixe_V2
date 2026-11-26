import { useState, useEffect, createContext, useContext, useCallback } from "react";

interface LiveAnnouncerContextType {
  announce: (message: string, priority?: "polite" | "assertive") => void;
}

const LiveAnnouncerContext = createContext<LiveAnnouncerContextType | null>(null);

const noopAnnouncer: LiveAnnouncerContextType = { announce: () => {} };

export const useLiveAnnouncer = () => {
  // Fora do provider devolve no-op: telas isoladas (testes, modais) não quebram.
  return useContext(LiveAnnouncerContext) ?? noopAnnouncer;
};

interface LiveAnnouncerProviderProps {
  children: React.ReactNode;
}

export const LiveAnnouncerProvider = ({ children }: LiveAnnouncerProviderProps) => {
  const [politeMessage, setPoliteMessage] = useState("");
  const [assertiveMessage, setAssertiveMessage] = useState("");

  const announce = useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
    // Clear previous message first to ensure screen reader announces the new one
    if (priority === "assertive") {
      setAssertiveMessage("");
      setTimeout(() => setAssertiveMessage(message), 50);
    } else {
      setPoliteMessage("");
      setTimeout(() => setPoliteMessage(message), 50);
    }

    // Clear after announcement
    setTimeout(() => {
      if (priority === "assertive") {
        setAssertiveMessage("");
      } else {
        setPoliteMessage("");
      }
    }, 3000);
  }, []);

  return (
    <LiveAnnouncerContext.Provider value={{ announce }}>
      {children}
      
      {/* Polite announcements (wait for user to finish current action) */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>

      {/* Assertive announcements (interrupt user immediately) */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </LiveAnnouncerContext.Provider>
  );
};

// Hook for common announcements
export const useAnnouncements = () => {
  const { announce } = useLiveAnnouncer();

  const announceLoading = useCallback((what: string) => {
    announce(`Carregando ${what}...`);
  }, [announce]);

  const announceLoaded = useCallback((what: string) => {
    announce(`${what} carregado com sucesso`);
  }, [announce]);

  const announceError = useCallback((message: string) => {
    announce(`Erro: ${message}`, "assertive");
  }, [announce]);

  const announceSuccess = useCallback((message: string) => {
    announce(message);
  }, [announce]);

  const announceProgress = useCallback((current: number, total: number, label: string) => {
    announce(`${label}: ${current} de ${total}`);
  }, [announce]);

  const announceNavigation = useCallback((pageName: string) => {
    announce(`Navegando para ${pageName}`);
  }, [announce]);

  return {
    announce,
    announceLoading,
    announceLoaded,
    announceError,
    announceSuccess,
    announceProgress,
    announceNavigation,
  };
};

export default LiveAnnouncerProvider;
