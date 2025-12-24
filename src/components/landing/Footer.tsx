import { GraduationCap, Mail, Phone, MapPin, HelpCircle, BookOpen, MessageCircle, Sparkles, ArrowUpRight, Heart } from "lucide-react";

const Footer = () => {
  const footerLinks = {
    plataforma: [
      { label: "Meus Cursos", href: "#" },
      { label: "Trilhas", href: "#trilhas" },
      { label: "Certificados", href: "#" },
      { label: "Ranking", href: "#" },
    ],
    ajuda: [
      { label: "Como usar", href: "#como-funciona" },
      { label: "Perguntas frequentes", href: "#" },
      { label: "Suporte técnico", href: "#" },
      { label: "Reportar problema", href: "#" },
    ],
    empresa: [
      { label: "Sobre a Promo Brindes", href: "#" },
      { label: "Portal do Colaborador", href: "#" },
      { label: "RH Online", href: "#" },
    ],
  };

  const quickLinks = [
    { icon: BookOpen, label: "Acessar Cursos", href: "#", gradient: "from-primary to-accent" },
    { icon: HelpCircle, label: "Central de Ajuda", href: "#", gradient: "from-accent to-warning" },
    { icon: MessageCircle, label: "Falar com RH", href: "#", gradient: "from-warning to-primary" },
  ];

  return (
    <footer className="relative bg-foreground text-background overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-[150px]" />
      
      <div className="container-app py-20 relative">
        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 pb-16 border-b border-background/10">
          {quickLinks.map((link) => (
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
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">
          {/* Brand Column */}
          <div className="col-span-2 space-y-8">
            <a href="/" className="flex items-center gap-3 group">
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
            </a>
            <p className="text-background/60 leading-relaxed max-w-sm">
              Plataforma de desenvolvimento profissional exclusiva para 
              colaboradores da Promo Brindes. Transforme sua carreira com nossos cursos.
            </p>
            <div className="space-y-4">
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
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-bold text-background text-lg mb-6">Plataforma</h4>
            <ul className="space-y-4">
              {footerLinks.plataforma.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-background/60 hover:text-background transition-colors flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-background text-lg mb-6">Ajuda</h4>
            <ul className="space-y-4">
              {footerLinks.ajuda.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-background/60 hover:text-background transition-colors flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent/50 group-hover:bg-accent transition-colors" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-background text-lg mb-6">Empresa</h4>
            <ul className="space-y-4">
              {footerLinks.empresa.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-background/60 hover:text-background transition-colors flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-warning/50 group-hover:bg-warning transition-colors" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-background/50 text-sm">
            © 2024 MULTIPLIXE by Promo Brindes. Uso interno.
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
