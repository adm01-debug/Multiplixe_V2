import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Menu, 
  GraduationCap, 
  Sparkles, 
  Route, 
  Search, 
  X,
  BookOpen,
  Trophy,
  Zap,
  Target,
  Users,
  Award,
  ChevronRight,
  Flame
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";

// Mega menu features data
const megaMenuFeatures = [
  {
    icon: BookOpen,
    title: "Cursos Interativos",
    description: "Vídeo-aulas com quizzes e certificados",
    color: "from-primary to-accent",
    href: "#recursos"
  },
  {
    icon: Trophy,
    title: "Gamificação",
    description: "XP, conquistas e rankings motivadores",
    color: "from-accent to-warning",
    href: "#recursos"
  },
  {
    icon: Zap,
    title: "Trilhas de Carreira",
    description: "Caminhos estruturados de aprendizado",
    color: "from-warning to-primary",
    href: "/trilhas"
  },
  {
    icon: Target,
    title: "Desafios Diários",
    description: "Metas diárias para engajamento contínuo",
    color: "from-primary to-secondary",
    href: "#recursos"
  },
  {
    icon: Award,
    title: "Certificados",
    description: "Certificação oficial reconhecida",
    color: "from-secondary to-accent",
    href: "#recursos"
  },
  {
    icon: Users,
    title: "Comunidade",
    description: "Discussões e networking entre equipes",
    color: "from-accent to-primary",
    href: "#recursos"
  },
];

const Header = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalogo?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  // Close search on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const navLinks = [
    { label: "Trilhas", href: "/trilhas", isRoute: true },
    { label: "Como Funciona", href: "#como-funciona" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container-app">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-3 group hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            <div className="relative">
              <motion.div 
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </motion.div>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent flex items-center justify-center animate-pulse" aria-hidden="true">
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
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {/* Mega Menu for Recursos */}
            <HoverCard openDelay={100} closeDelay={200}>
              <HoverCardTrigger asChild>
                <motion.button
                  className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors font-medium rounded-xl hover:bg-muted/50 flex items-center gap-1"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Flame className="w-4 h-4" />
                  Recursos
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </motion.button>
              </HoverCardTrigger>
              <HoverCardContent 
                className="w-[520px] p-4" 
                align="center"
                sideOffset={12}
              >
                <div className="grid grid-cols-2 gap-3">
                  {megaMenuFeatures.map((feature, index) => (
                    <motion.a
                      key={feature.title}
                      href={feature.href}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        <feature.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                          {feature.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {feature.description}
                        </p>
                      </div>
                    </motion.a>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-border/50">
                  <Link 
                    to="/catalogo"
                    className="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Ver todos os recursos
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </HoverCardContent>
            </HoverCard>

            {navLinks.map((link) => (
              link.isRoute ? (
                <motion.div
                  key={link.label}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Link
                    to={link.href}
                    className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors font-medium rounded-xl hover:bg-muted/50 flex items-center gap-1.5"
                  >
                    <Route className="h-4 w-4" />
                    {link.label}
                  </Link>
                </motion.div>
              ) : (
                <motion.a
                  key={link.label}
                  href={link.href}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors font-medium rounded-xl hover:bg-muted/50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  {link.label}
                </motion.a>
              )
            ))}
          </nav>

          {/* Desktop CTA + Search */}
          <div className="hidden md:flex items-center gap-3">
            {/* Global Search Toggle */}
            <motion.button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Buscar cursos"
            >
              <Search className="w-5 h-5" />
            </motion.button>

            <ThemeToggle />
            <Link to="/auth">
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Acessar Plataforma
                </Button>
              </motion.div>
            </Link>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center gap-2">
            <motion.button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Buscar cursos"
            >
              <Search className="w-5 h-5" />
            </motion.button>
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
                  <a
                    href="#recursos"
                    className="text-muted-foreground hover:text-foreground transition-colors font-medium py-3 px-4 rounded-xl hover:bg-muted/50 flex items-center gap-2"
                  >
                    <Flame className="h-4 w-4" />
                    Recursos
                  </a>
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

      {/* Global Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Buscar cursos"
            onClick={() => setIsSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="container-app pt-20 md:pt-32"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar cursos, trilhas, temas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-16 pl-14 pr-14 text-lg rounded-2xl border-2 border-border/50 focus:border-primary bg-card shadow-2xl"
                />
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-6 h-6 text-muted-foreground" />
                </button>
              </form>

              {/* Search suggestions */}
              <div className="max-w-2xl mx-auto mt-6">
                <p className="text-sm text-muted-foreground mb-3">Pesquisas populares:</p>
                <div className="flex flex-wrap gap-2">
                  {["Atendimento", "Excel", "Liderança", "Comunicação", "Vendas"].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSearchQuery(tag);
                        navigate(`/catalogo?q=${encodeURIComponent(tag)}`);
                        setIsSearchOpen(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-muted/50 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;