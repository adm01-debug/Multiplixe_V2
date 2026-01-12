import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface UserPreferences {
  theme: "light" | "dark" | "system";
  accentColor: string;
  fontSize: "small" | "normal" | "large";
  reducedMotion: boolean;
  catalogView: "grid" | "list";
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEffects: boolean;
  language: string;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "system",
  accentColor: "violet",
  fontSize: "normal",
  reducedMotion: false,
  catalogView: "grid",
  emailNotifications: true,
  pushNotifications: true,
  soundEffects: true,
  language: "pt-BR",
};

export const useUserPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    // Load from localStorage first for immediate access
    const stored = localStorage.getItem("user-preferences");
    if (stored) {
      try {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_PREFERENCES;
      }
    }
    return DEFAULT_PREFERENCES;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync with server when user is logged in
  useEffect(() => {
    const loadServerPreferences = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          // Server preferences would be stored in a jsonb column
          // For now, we'll use localStorage
        }
      } catch (error) {
        console.error("Failed to load preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadServerPreferences();
  }, [user?.id]);

  const updatePreference = useCallback(
    async <K extends keyof UserPreferences>(
      key: K,
      value: UserPreferences[K]
    ) => {
      const newPreferences = { ...preferences, [key]: value };
      setPreferences(newPreferences);
      localStorage.setItem("user-preferences", JSON.stringify(newPreferences));

      // Apply preference immediately
      applyPreference(key, value);

      // Optionally sync to server
      if (user?.id) {
        setIsSaving(true);
        try {
          // Save to server if needed
        } catch (error) {
          console.error("Failed to save preference:", error);
        } finally {
          setIsSaving(false);
        }
      }
    },
    [preferences, user?.id]
  );

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    localStorage.setItem("user-preferences", JSON.stringify(DEFAULT_PREFERENCES));
    Object.entries(DEFAULT_PREFERENCES).forEach(([key, value]) => {
      applyPreference(key as keyof UserPreferences, value);
    });
  }, []);

  return {
    preferences,
    updatePreference,
    resetPreferences,
    isLoading,
    isSaving,
  };
};

// Apply preference to DOM/app state
function applyPreference<K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K]
) {
  switch (key) {
    case "fontSize":
      document.documentElement.classList.remove("text-sm", "text-base", "text-lg");
      if (value === "small") document.documentElement.classList.add("text-sm");
      else if (value === "large") document.documentElement.classList.add("text-lg");
      else document.documentElement.classList.add("text-base");
      break;

    case "reducedMotion":
      if (value) {
        document.documentElement.classList.add("reduce-motion");
      } else {
        document.documentElement.classList.remove("reduce-motion");
      }
      break;

    case "accentColor":
      document.documentElement.setAttribute("data-accent", value as string);
      break;
  }
}
