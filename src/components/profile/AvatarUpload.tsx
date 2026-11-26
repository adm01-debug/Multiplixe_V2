import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Camera, Upload, Trash2, Loader2, User, CheckCircle } from "lucide-react";

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userName: string;
  size?: "sm" | "md" | "lg";
  onAvatarChange?: (url: string | null) => void;
}

const sizeClasses = {
  sm: { container: "w-16 h-16", text: "text-xl", icon: "h-3 w-3" },
  md: { container: "w-24 h-24", text: "text-3xl", icon: "h-4 w-4" },
  lg: { container: "w-32 h-32", text: "text-5xl", icon: "h-5 w-5" },
};

const AvatarUpload = ({ 
  currentAvatarUrl, 
  userName, 
  size = "md",
  onAvatarChange 
}: AvatarUploadProps) => {
  const { uploadAvatar, deleteAvatar, isUploading, progress } = useAvatarUpload();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sizeClass = sizeClasses[size];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Preview
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (file) {
      const url = await uploadAvatar(file);
      if (url) {
        onAvatarChange?.(url);
        setPreviewUrl(null);
        setIsDialogOpen(false);
      }
    }
  };

  const handleDelete = async () => {
    const success = await deleteAvatar();
    if (success) {
      onAvatarChange?.(null);
      setIsDialogOpen(false);
    }
  };

  const handleCancel = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <button className="relative group cursor-pointer" aria-label={`Alterar foto de perfil de ${userName}`}>
          <div className={`${sizeClass.container} rounded-full overflow-hidden ring-4 ring-primary/20 group-hover:ring-primary/40 transition-all`}>
            {currentAvatarUrl ? (
              <img
                src={currentAvatarUrl}
                alt={userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white">
                <span className={`font-bold ${sizeClass.text}`}>
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          
          {/* Camera overlay */}
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className={`${sizeClass.icon === "h-3 w-3" ? "h-5 w-5" : "h-6 w-6"} text-white`} />
          </div>
          
          {/* Edit badge */}
          <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary text-white shadow-lg">
            <Camera className={sizeClass.icon} />
          </div>
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Foto de Perfil
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Preview */}
          <div className="flex justify-center">
            <div className="relative w-32 h-32 rounded-full overflow-hidden ring-4 ring-primary/20">
              <AnimatePresence mode="wait">
                {previewUrl ? (
                  <motion.img
                    key="preview"
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  />
                ) : currentAvatarUrl ? (
                  <motion.img
                    key="current"
                    src={currentAvatarUrl}
                    alt={userName}
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                ) : (
                  <motion.div
                    key="placeholder"
                    className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <span className="text-4xl font-bold">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Upload progress */}
          {isUploading && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                Enviando... {progress}%
              </p>
            </div>
          )}

          {/* File input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Actions */}
          <div className="space-y-2">
            {previewUrl ? (
              <div className="flex gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1 gap-2"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Salvar
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isUploading}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex-1 gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Escolher Foto
                </Button>
                {currentAvatarUrl && (
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    disabled={isUploading}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Formatos: JPG, PNG, WebP, GIF (máx. 1MB)
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarUpload;
