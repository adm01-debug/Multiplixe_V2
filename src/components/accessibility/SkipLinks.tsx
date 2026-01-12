import { useState } from "react";

const SkipLinks = () => {
  const [isFocused, setIsFocused] = useState(false);

  const skipLinks = [
    { href: "#main-content", label: "Pular para o conteúdo principal" },
    { href: "#navigation", label: "Pular para a navegação" },
    { href: "#footer", label: "Pular para o rodapé" },
  ];

  return (
    <nav 
      aria-label="Links de atalho" 
      className="sr-only focus-within:not-sr-only"
    >
      <ul className="fixed top-0 left-0 z-[100] p-2 flex flex-col gap-1">
        {skipLinks.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="block px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all transform -translate-y-full focus:translate-y-0"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default SkipLinks;
