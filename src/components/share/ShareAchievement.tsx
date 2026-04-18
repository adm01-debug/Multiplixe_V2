import { useState } from "react";
import { motion } from "framer-motion";
import { Share2, Copy, Check, Twitter, Linkedin, MessageCircle, Download } from "lucide-react";
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
import { useTelemetry } from "@/hooks/useTelemetry";
import { generateShareImage, blobToFile, downloadBlob, slugify } from "@/lib/shareImage";

interface ShareAchievementProps {
  title: string;
  description: string;
  type: "achievement" | "certificate" | "level" | "streak";
  value?: number;
  icon?: string;
  trigger?: React.ReactNode;
}

const TYPE_LABEL: Record<ShareAchievementProps["type"], string> = {
  achievement: "conquista",
  certificate: "certificado",
  level: "novo nível",
  streak: "ofensiva",
};

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
  const [busy, setBusy] = useState(false);
  const { trackFeature } = useTelemetry();

  const shareUrl = typeof window !== "undefined" ? window.location.origin : "";

  const buildShareText = (): string => {
    const xpLine = value ? ` +${value} XP somados à minha jornada de aprendizado contínuo.` : "";
    return `🏆 Acabei de conquistar "${title}" na Promo Brindes Academy!${xpLine}\n\n${description}\n\n#vendas #aprendizadocontinuo #promobrindes`;
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(buildShareText());
      setCopied(true);
      toast.success("Texto copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const handleDownloadImage = async () => {
    setBusy(true);
    try {
      const blob = await generateShareImage({ title, description, icon, value, type });
      if (!blob) {
        toast.error("Não foi possível gerar a imagem");
        return;
      }
      downloadBlob(blob, `${slugify(title) || "conquista"}.png`);
      toast.success("Imagem baixada!");
      trackFeature("share_image_downloaded", { type });
    } finally {
      setBusy(false);
    }
  };

  const handleNativeShare = async () => {
    setBusy(true);
    trackFeature("share_attempt", { type, hasNativeShare: typeof navigator !== "undefined" && !!navigator.share });
    try {
      const blob = await generateShareImage({ title, description, icon, value, type });
      const text = buildShareText();
      const file = blob ? blobToFile(blob, `${slugify(title) || "conquista"}.png`) : null;

      const canShareFiles =
        typeof navigator !== "undefined" &&
        !!navigator.canShare &&
        !!file &&
        navigator.canShare({ files: [file] });

      if (canShareFiles && navigator.share) {
        try {
          await navigator.share({ title, text, url: shareUrl, files: [file!] });
          toast.success("Compartilhado com sucesso!", {
            action: { label: "Compartilhar outra", onClick: () => setOpen(true) },
          });
          trackFeature("share_success", { type, mode: "native_files" });
          setOpen(false);
          return;
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") return;
          // segue para fallback
        }
      }

      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({ title, text, url: shareUrl });
          toast.success("Compartilhado com sucesso!", {
            action: { label: "Compartilhar outra", onClick: () => setOpen(true) },
          });
          trackFeature("share_success", { type, mode: "native_text" });
          setOpen(false);
          return;
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") return;
        }
      }

      // Fallback final: baixa imagem + copia texto
      if (blob) downloadBlob(blob, `${slugify(title) || "conquista"}.png`);
      try {
        await navigator.clipboard.writeText(text);
        toast.success("Imagem baixada e texto copiado para colar onde quiser!");
      } catch {
        toast.success("Imagem baixada!");
      }
      trackFeature("share_fallback", { type });
    } catch {
      toast.error("Erro ao compartilhar");
    } finally {
      setBusy(false);
    }
  };

  const shareText = buildShareText();
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

  const ariaLabel = `Compartilhar ${TYPE_LABEL[type]} ${title}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2" aria-label={ariaLabel}>
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

        <div className="space-y-4">
          {/* Primary share — sempre visível, decide nativo vs fallback automaticamente */}
          <Button
            onClick={handleNativeShare}
            className="w-full gap-2"
            disabled={busy}
            aria-label={ariaLabel}
          >
            <Share2 className="h-4 w-4" />
            {busy ? "Preparando..." : "Compartilhar com imagem"}
          </Button>

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
                onClick={() => trackFeature("share_social_click", { network: link.name, type })}
              >
                <link.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{link.name}</span>
              </motion.a>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={handleCopyText}
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
                  Copiar texto
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadImage}
              className="w-full gap-2"
              disabled={busy}
            >
              <Download className="h-4 w-4" />
              Baixar imagem
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareAchievement;
