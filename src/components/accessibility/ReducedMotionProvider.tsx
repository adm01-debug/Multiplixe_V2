import { createContext, useContext, useState, useEffect } from "react";

interface ReducedMotionContextType {
  prefersReducedMotion: boolean;
  reducedMotionEnabled: boolean;
  setReducedMotionEnabled: (enabled: boolean) => void;
  shouldAnimate: boolean;
}

const ReducedMotionContext = createContext<ReducedMotionContextType>({
  prefersReducedMotion: false,
  reducedMotionEnabled: false,
  setReducedMotionEnabled: () => {},
  shouldAnimate: true,
});

export const useReducedMotion = () => useContext(ReducedMotionContext);

interface ReducedMotionProviderProps {
  children: React.ReactNode;
}

export const ReducedMotionProvider = ({ children }: ReducedMotionProviderProps) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [reducedMotionEnabled, setReducedMotionEnabled] = useState(false);

  // Check system preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Check user preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("reduced-motion");
    if (saved !== null) {
      setReducedMotionEnabled(saved === "true");
    }
  }, []);

  // Save user preference
  const handleSetReducedMotion = (enabled: boolean) => {
    setReducedMotionEnabled(enabled);
    localStorage.setItem("reduced-motion", String(enabled));
  };

  // Apply CSS class for reduced motion
  useEffect(() => {
    const shouldReduce = prefersReducedMotion || reducedMotionEnabled;
    if (shouldReduce) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }
  }, [prefersReducedMotion, reducedMotionEnabled]);

  const shouldAnimate = !prefersReducedMotion && !reducedMotionEnabled;

  return (
    <ReducedMotionContext.Provider
      value={{
        prefersReducedMotion,
        reducedMotionEnabled,
        setReducedMotionEnabled: handleSetReducedMotion,
        shouldAnimate,
      }}
    >
      {children}
    </ReducedMotionContext.Provider>
  );
};

// Motion wrapper that respects reduced motion preferences
interface SafeMotionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const SafeMotion = ({ children, fallback }: SafeMotionProps) => {
  const { shouldAnimate } = useReducedMotion();

  if (!shouldAnimate && fallback) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default ReducedMotionProvider;
