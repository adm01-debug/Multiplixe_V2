import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useT, type Locale } from "@/lib/i18n";

const LanguageToggle = () => {
  const { locale, setLocale, t } = useT();

  const change = (l: Locale) => setLocale(l);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={t("common.language")}>
          <Languages className="h-4 w-4 mr-2" />
          {locale === "pt-BR" ? "PT" : locale === "en" ? "EN" : "ES"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => change("pt-BR")} aria-current={locale === "pt-BR"}>
          🇧🇷 Português
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => change("en")} aria-current={locale === "en"}>
          🇺🇸 English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => change("es")} aria-current={locale === "es"}>
          🇪🇸 Español
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageToggle;
