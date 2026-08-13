import { useState, useEffect, useCallback } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Smartphone, Zap, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_DAYS = 7;
const SHOW_DELAY_MS = 10000;

const PWAInstallPrompt = () => {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (!dismissed) return false;
    const daysSinceDismissed = (Date.now() - new Date(dismissed).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceDismissed < DISMISS_DAYS;
  });
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (isDismissed) return;
    if (!isInstallable || isInstalled) return;

    const timer = setTimeout(() => setShowPrompt(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled, isDismissed]);

  const handleInstall = useCallback(async () => {
    try {
      const success = await installApp();
      if (success) {
        setShowPrompt(false);
        setIsDismissed(true);
      }
    } catch {
      setShowPrompt(false);
    }
  }, [installApp]);

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
    setShowPrompt(false);
    try {
      localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    } catch {
      // localStorage may be unavailable in private mode
    }
  }, []);

  if (isInstalled || isDismissed || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="pwa-install-prompt"
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-sm pointer-events-none"
      >
        <Card className="relative overflow-hidden border-primary/20 shadow-2xl pointer-events-auto">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent" />

          <button
            type="button"
            aria-label="Fechar"
            onClick={handleDismiss}
            className="absolute top-2 right-2 z-10 h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-destructive/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <CardContent className="relative p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shrink-0">
                <Download className="h-6 w-6 text-white" />
              </div>

              <div className="flex-1 min-w-0 pr-6">
                <h3 className="font-display font-bold text-lg mb-1">
                  Instalar MULTIPLIXE
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Acesse mais rápido direto da sua tela inicial!
                </p>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50">
                    <Smartphone className="h-4 w-4 text-primary" />
                    <span className="text-[10px] text-muted-foreground">App Nativo</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span className="text-[10px] text-muted-foreground">Mais Rápido</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50">
                    <Wifi className="h-4 w-4 text-emerald-500" />
                    <span className="text-[10px] text-muted-foreground">Offline</span>
                  </div>
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={handleInstall}
                >
                  <Download className="h-4 w-4" />
                  Instalar Agora
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
