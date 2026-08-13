import { useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Mail, Phone, MapPin, HelpCircle, BookOpen, MessageCircle, Sparkles, ArrowUpRight, Heart, Send, CheckCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubscribing(true);
    
    try {
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .insert({ 
          email: email.toLowerCase().trim(),
          source: 'landing_footer'
        });
      
      if (error) {
        if (error.code === '23505') {
          toast.info("Email já cadastrado!", {
            description: "Você já está inscrito para receber atualizações."
          });
        } else {
          throw error;
        }
      } else {
        toast.success("Inscrição realizada!", {
          description: "Você receberá atualizações sobre novos cursos."
        });
      }
      
      setIsSubscribed(true);
      setEmail("");
      setTimeout(() => setIsSubscribed(false), 3000);
    } catch {
      toast.error("Erro ao inscrever", {
        description: "Tente novamente mais tarde."
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const footerLinks = {
    plataforma: [
      { label: "Meus Cursos", href: "/dashboard" },
      { label: "Trilhas", href: "/trilhas" },
      { label: "Certificados", href: "/perfil" },
      { label: "Ranking", href: "/ranking" },
    ],
    ajuda: [
      { label: "Como usar", href: "/catalogo" },
      { label: "Perguntas frequentes", href: "mailto:rh@promobrindes.com.br" },
      { label: "Suporte técnico", href: "mailto:ti@promobrindes.com.br" },
      { label: "Reportar problema", href: "mailto:ti@promobrindes.com.br" },
    ],
    empresa: [
      { label: "Sobre a Promo Brindes", href: "https://www.promobrindes.com.br" },
      { label: "Portal do Colaborador", href: "/dashboard" },
      { label: "RH Online", href: "mailto:rh@promobrindes.com.br" },
    ],
  };

  const quickLinks = [
    { icon: BookOpen, label: "Acessar Cursos", href: "/catalogo", gradient: "from-primary to-accent" },
    { icon: HelpCircle, label: "Central de Ajuda", href: "mailto:rh@promobrindes.com.br", gradient: "from-accent to-warning" },
    { icon: MessageCircle, label: "Falar com RH", href: "mailto:rh@promobrindes.com.br", gradient: "from-warning to-primary" },
  ];

  return (
    <footer className="relative bg-foreground text-background overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-[150px]" />
      
      <div className="container-app py-20 relative">
        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 pb-16 border-b border-background/10">
          {quickLinks.map((link) => {
            const isExternal = link.href.startsWith("mailto:") || link.href.startsWith("http");
            
            if (isExternal) {
              return (
                <a
                  key={link.label}
                  href={link.href}
                  className="group flex items-center gap-5 p-6 rounded-2xl bg-background/5 hover:bg-background/10 border border-background/10 hover:border-background/20 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${link.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <link.icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="font-semibold text-background text-lg">{link.label}</span>
                  <ArrowUpRight className="w-5 h-5 text-background/50 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              );
            }
            
            return (
              <Link
                key={link.label}
                to={link.href}
                className="group flex items-center gap-5 p-6 rounded-2xl bg-background/5 hover:bg-background/10 border border-background/10 hover:border-background/20 transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${link.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  <link.icon className="w-7 h-7 text-white" />
                </div>
                <span className="font-semibold text-background text-lg">{link.label}</span>
                <ArrowUpRight className="w-5 h-5 text-background/50 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 md:gap-12 mb-16">
          {/* Brand Column */}
          <div className="col-span-2 space-y-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-warning flex items-center justify-center">
                  <Sparkles className="w-2.5 h-2.5 text-warning-foreground" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-2xl text-background leading-tight">
                  MULTIPLI<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">XE</span>
                </span>
                <span className="text-xs text-background/50 font-medium tracking-wide uppercase">
                  by Promo Brindes
                </span>
              </div>
            </Link>
            <p className="text-background/60 leading-relaxed max-w-sm">
              Plataforma de desenvolvimento profissional exclusiva para 
              colaboradores da Promo Brindes. Transforme sua carreira com nossos cursos.
            </p>
            <div className="space-y-4 mb-8">
              <a href="mailto:rh@promobrindes.com.br" className="flex items-center gap-3 text-background/60 hover:text-background transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-background/5 flex items-center justify-center group-hover:bg-background/10 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                rh@promobrindes.com.br
              </a>
              <p className="flex items-center gap-3 text-background/60">
                <div className="w-10 h-10 rounded-xl bg-background/5 flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                Ramal: 2001 (TI) | 2002 (RH)
              </p>
              <p className="flex items-center gap-3 text-background/60">
                <div className="w-10 h-10 rounded-xl bg-background/5 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                Goiânia, GO
              </p>
            </div>
            
            {/* Newsletter Section */}
            <div className="bg-background/5 rounded-2xl p-6 border border-background/10">
              <h4 className="font-bold text-background mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-warning" />
                Fique por dentro
              </h4>
              <p className="text-background/50 text-sm mb-4">
                Receba notificações sobre novos cursos e trilhas
              </p>
              <form onSubmit={handleNewsletter} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="seu.email@promobrindes.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/10 border-background/20 text-background placeholder:text-background/40 flex-1"
                  disabled={isSubscribing}
                />
                <button
                  type="submit"
                  disabled={isSubscribing || !email}
                  className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-gradient-to-r from-primary to-accent hover:opacity-90 shrink-0 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-105 active:scale-95"
                >
                  {isSubscribing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isSubscribed ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-bold text-background text-lg mb-6">Plataforma</h4>
            <ul className="space-y-4">
              {footerLinks.plataforma.map((link) => {
                const isExternal = link.href.startsWith("mailto:") || link.href.startsWith("http");
                return (
                  <li key={link.label}>
                    {isExternal ? (
                      <a href={link.href} className="text-background/60 hover:text-background transition-colors flex items-center gap-2 group">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.href} className="text-background/60 hover:text-background transition-colors flex items-center gap-2 group">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
                        {link.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-background text-lg mb-6">Ajuda</h4>
            <ul className="space-y-4">
              {footerLinks.ajuda.map((link) => {
                const isExternal = link.href.startsWith("mailto:") || link.href.startsWith("http");
                return (
                  <li key={link.label}>
                    {isExternal ? (
                      <a href={link.href} className="text-background/60 hover:text-background transition-colors flex items-center gap-2 group">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent/50 group-hover:bg-accent transition-colors" />
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.href} className="text-background/60 hover:text-background transition-colors flex items-center gap-2 group">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent/50 group-hover:bg-accent transition-colors" />
                        {link.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-background text-lg mb-6">Empresa</h4>
            <ul className="space-y-4">
              {footerLinks.empresa.map((link) => {
                const isExternal = link.href.startsWith("mailto:") || link.href.startsWith("http");
                return (
                  <li key={link.label}>
                    {isExternal ? (
                      <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-background/60 hover:text-background transition-colors flex items-center gap-2 group">
                        <span className="w-1.5 h-1.5 rounded-full bg-warning/50 group-hover:bg-warning transition-colors" />
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.href} className="text-background/60 hover:text-background transition-colors flex items-center gap-2 group">
                        <span className="w-1.5 h-1.5 rounded-full bg-warning/50 group-hover:bg-warning transition-colors" />
                        {link.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-background/50 text-sm">
            © {new Date().getFullYear()} MULTIPLIXE by Promo Brindes. Uso interno.
          </p>
          <p className="text-background/40 text-sm flex items-center gap-2">
            Desenvolvido com <Heart className="w-4 h-4 text-primary fill-primary animate-pulse" /> para nossos colaboradores
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
