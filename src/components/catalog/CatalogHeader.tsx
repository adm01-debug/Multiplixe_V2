import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GraduationCap, LogOut, Sparkles } from 'lucide-react';

interface CatalogHeaderProps {
  userName: string;
  onSignOut: () => void;
}

const CatalogHeader = ({ userName, onSignOut }: CatalogHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 glass neon-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity dark:opacity-70 dark:group-hover:opacity-100" />
              <div className="relative p-2.5 bg-gradient-to-r from-primary to-accent rounded-2xl shadow-lg neon-button">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent flex items-center justify-center pulse-glow">
                <Sparkles className="w-2.5 h-2.5 text-accent-foreground" />
              </div>
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-foreground tracking-tight">
                MULTIPLI<span className="text-gradient neon-text">XE</span>
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">by Promo Brindes</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 p-1 bg-muted/50 rounded-2xl neon-border">
            <Link to="/dashboard" className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl transition-colors">
              Dashboard
            </Link>
            <Link to="/catalogo" className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-primary to-accent text-white rounded-xl shadow-lg neon-button">
              Catálogo
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/perfil" className="hidden sm:flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-2xl neon-border hover:bg-muted transition-colors">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm neon-button">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-foreground">{userName}</span>
            </Link>
            <Button
              variant="outline"
              size="icon"
              onClick={onSignOut}
              className="rounded-xl border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 h-11 w-11 neon-border"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default CatalogHeader;
