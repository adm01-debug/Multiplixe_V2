import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Copy, Check, Twitter, Linkedin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ShareAchievementProps {
  title: string;
  description: string;
  type: "achievement" | "certificate" | "level" | "streak";
  value?: number;
  icon?: string;
  trigger?: React.ReactNode;
}

const ShareAchievement = ({
  title,
  description,
  type,
  value,
  icon = "🏆",
  trigger,
}: ShareAchievementProps) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareText = `${icon} ${title}\n\n${description}${value ? `\n\n🎯 ${value} XP conquistados!` : ""}\n\n#MULTIPLIXE #AprendizadoContinuo`;
  
  const shareUrl = typeof window !== "undefined" ? window.location.origin : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast.success("Texto copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: shareUrl,
        });
        toast.success("Compartilhado com sucesso!");
        setOpen(false);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          toast.error("Erro ao compartilhar");
        }
      }
    }
  };

  const shareLinks = [
    {
      name: "Twitter / X",
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      color: "hover:bg-sky-500/10 hover:text-sky-500",
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(shareText)}`,
      color: "hover:bg-blue-600/10 hover:text-blue-600",
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      url: `https://wa.me/?text=${encodeURIComponent(shareText + "\n" + shareUrl)}`,
      color: "hover:bg-green-500/10 hover:text-green-500",
    },
  ];

  const getTypeGradient = () => {
    switch (type) {
      case "achievement":
        return "from-amber-500 to-orange-500";
      case "certificate":
        return "from-emerald-500 to-teal-500";
      case "level":
        return "from-primary to-accent";
      case "streak":
        return "from-rose-500 to-pink-500";
      default:
        return "from-primary to-accent";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            Compartilhar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Compartilhar Conquista
          </DialogTitle>
          <DialogDescription>
            Mostre sua conquista para sua rede!
          </DialogDescription>
        </DialogHeader>

        {/* Preview Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-6 rounded-2xl bg-gradient-to-br ${getTypeGradient()} text-white relative overflow-hidden`}
        >
          {/* Decorative Elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          </div>

          <div className="relative z-10">
            <div className="text-4xl mb-3">{icon}</div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-white/80 text-sm">{description}</p>
            {value && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
                <span className="text-sm font-semibold">+{value} XP</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Share Options */}
        <div className="space-y-4">
          {/* Native Share (if supported) */}
          {typeof navigator !== "undefined" && navigator.share && (
            <Button onClick={handleNativeShare} className="w-full gap-2">
              <Share2 className="h-4 w-4" />
              Compartilhar
            </Button>
          )}

          {/* Social Links */}
          <div className="grid grid-cols-3 gap-2">
            {shareLinks.map((link) => (
              <motion.a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 transition-colors ${link.color}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <link.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{link.name}</span>
              </motion.a>
            ))}
          </div>

          {/* Copy Button */}
          <Button
            variant="outline"
            onClick={handleCopy}
            className="w-full gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar Texto
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareAchievement;
