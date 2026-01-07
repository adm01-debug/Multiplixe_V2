import { useState, useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Smartphone, Zap, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PWAInstallPrompt = () => {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if user dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        setIsDismissed(true);
        return;
      }
    }

    // Show prompt after 10 seconds if installable
    if (isInstallable && !isInstalled) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  if (isInstalled || isDismissed || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-sm"
      >
        <Card className="relative overflow-hidden border-primary/20 shadow-2xl">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent" />
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 hover:bg-destructive/10"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>

          <CardContent className="relative p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shrink-0">
                <Download className="h-6 w-6 text-white" />
              </div>

              <div className="flex-1 min-w-0">
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
