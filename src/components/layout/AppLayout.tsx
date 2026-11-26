import type { ComponentProps, ReactNode } from "react";
import DynamicSEO from "@/components/seo/DynamicSEO";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  seo?: ComponentProps<typeof DynamicSEO>;
  cabecalho?: ReactNode;
  children: ReactNode;
  classeConteudo?: string;
  idConteudo?: string;
}

export function AppLayout({ seo, cabecalho, children, classeConteudo, idConteudo }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {seo ? <DynamicSEO {...seo} /> : null}
      {cabecalho}
      <main id={idConteudo} className={cn("container mx-auto px-4 py-8", classeConteudo)}>
        {children}
      </main>
    </div>
  );
}