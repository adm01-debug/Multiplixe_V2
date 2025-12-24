import { GraduationCap, Mail, Phone, MapPin, HelpCircle, BookOpen, MessageCircle } from "lucide-react";

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
    { icon: BookOpen, label: "Acessar Cursos", href: "#" },
    { icon: HelpCircle, label: "Central de Ajuda", href: "#" },
    { icon: MessageCircle, label: "Falar com RH", href: "#" },
  ];

  return (
    <footer className="bg-foreground text-background/80">
      <div className="container-app py-16">
        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 pb-12 border-b border-background/10">
          {quickLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="flex items-center gap-4 p-4 rounded-xl bg-background/5 hover:bg-background/10 transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                <link.icon className="w-6 h-6 text-primary" />
              </div>
              <span className="font-medium text-background">{link.label}</span>
            </a>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 space-y-6">
            <a href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-xl text-background leading-tight">
                  MULTIPLI<span className="text-primary">XE</span>
                </span>
                <span className="text-2xs text-background/60 font-medium">
                  by Promo Brindes
                </span>
              </div>
            </a>
            <p className="text-background/60 leading-relaxed">
              Plataforma de desenvolvimento profissional exclusiva para 
              colaboradores da Promo Brindes.
            </p>
            <div className="space-y-3">
              <a href="mailto:rh@promobrindes.com.br" className="flex items-center gap-2 text-background/60 hover:text-background transition-colors">
                <Mail className="w-4 h-4" />
                rh@promobrindes.com.br
              </a>
              <p className="flex items-center gap-2 text-background/60">
                <Phone className="w-4 h-4" />
                Ramal: 2001 (TI) | 2002 (RH)
              </p>
              <p className="flex items-center gap-2 text-background/60">
                <MapPin className="w-4 h-4" />
                Goiânia, GO
              </p>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-semibold text-background mb-4">Plataforma</h4>
            <ul className="space-y-3">
              {footerLinks.plataforma.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-background/60 hover:text-background transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-background mb-4">Ajuda</h4>
            <ul className="space-y-3">
              {footerLinks.ajuda.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-background/60 hover:text-background transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-background mb-4">Empresa</h4>
            <ul className="space-y-3">
              {footerLinks.empresa.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-background/60 hover:text-background transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-background/60 text-sm">
            © 2024 MULTIPLIXE by Promo Brindes. Uso interno.
          </p>
          <p className="text-background/40 text-sm">
            Desenvolvido com ❤️ para nossos colaboradores
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;