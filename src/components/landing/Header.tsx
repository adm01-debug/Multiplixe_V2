import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, GraduationCap, Sparkles, Route } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Header = () => {
  const navLinks = [
    { label: "Recursos", href: "#recursos" },
    { label: "Trilhas", href: "/trilhas", isRoute: true },
    { label: "Como Funciona", href: "#como-funciona" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container-app">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg shadow-primary/25">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent flex items-center justify-center animate-pulse">
                <Sparkles className="w-2.5 h-2.5 text-accent-foreground" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-xl text-foreground leading-tight tracking-tight">
                MULTIPLI<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">XE</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase">
                by Promo Brindes
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              link.isRoute ? (
                <Link
                  key={link.label}
                  to={link.href}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors font-medium rounded-xl hover:bg-muted/50 flex items-center gap-1.5"
                >
                  <Route className="h-4 w-4" />
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors font-medium rounded-xl hover:bg-muted/50"
                >
                  {link.label}
                </a>
              )
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Link to="/auth">
              <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5">
                <Sparkles className="w-4 h-4 mr-2" />
                Acessar Plataforma
              </Button>
            </Link>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl"
                  aria-label="Abrir menu"
                >
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="font-display font-bold text-lg">
                      MULTIPLI<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">XE</span>
                    </span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 mt-8">
                  {navLinks.map((link) => (
                    link.isRoute ? (
                      <Link
                        key={link.label}
                        to={link.href}
                        className="text-muted-foreground hover:text-foreground transition-colors font-medium py-3 px-4 rounded-xl hover:bg-muted/50 flex items-center gap-2"
                      >
                        <Route className="h-4 w-4" />
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        key={link.label}
                        href={link.href}
                        className="text-muted-foreground hover:text-foreground transition-colors font-medium py-3 px-4 rounded-xl hover:bg-muted/50"
                      >
                        {link.label}
                      </a>
                    )
                  ))}
                </nav>
                <div className="flex items-center justify-between pt-6 mt-6 border-t border-border/50">
                  <span className="text-sm text-muted-foreground">Tema</span>
                  <ThemeToggle />
                </div>
                <div className="pt-6">
                  <Link to="/auth">
                    <Button className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold h-12">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Acessar Plataforma
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
