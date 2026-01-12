import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function useAvatarUpload() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user) {
      toast.error("Você precisa estar logado");
      return null;
    }

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return null;
    }

    if (file.size > 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 1MB");
      return null;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      // Create unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      setProgress(30);

      // Delete old avatar if exists
      const { data: existingFiles } = await supabase.storage
        .from("avatars")
        .list(user.id);

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map((f) => `${user.id}/${f.name}`);
        await supabase.storage.from("avatars").remove(filesToDelete);
      }

      setProgress(50);

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      setProgress(70);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setProgress(100);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });

      toast.success("Avatar atualizado com sucesso! 📸");
      return publicUrl;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Erro ao fazer upload do avatar");
      return null;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const deleteAvatar = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      // Delete from storage
      const { data: existingFiles } = await supabase.storage
        .from("avatars")
        .list(user.id);

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map((f) => `${user.id}/${f.name}`);
        await supabase.storage.from("avatars").remove(filesToDelete);
      }

      // Update profile
      await supabase
        .from("profiles")
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });

      toast.success("Avatar removido");
      return true;
    } catch (error) {
      console.error("Error deleting avatar:", error);
      toast.error("Erro ao remover avatar");
      return false;
    }
  };

  return {
    uploadAvatar,
    deleteAvatar,
    isUploading,
    progress,
  };
}
