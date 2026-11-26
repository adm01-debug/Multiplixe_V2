import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Compass, Home, LayoutDashboard, Search } from "lucide-react";
import DynamicSEO from "@/components/seo/DynamicSEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const NotFound = () => {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = term.trim();
    navigate(query ? `/catalogo?q=${encodeURIComponent(query)}` : "/catalogo");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <DynamicSEO
        title="Página não encontrada (404)"
        description="A página que você tentou acessar não existe ou foi movida. Busque o curso que procura ou volte para o catálogo da MULTIPLIXE."
        noIndex
      />

      <motion.div
        className="w-full max-w-xl text-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 to-accent/15">
          <Compass className="h-10 w-10 text-primary" aria-hidden="true" />
        </div>

        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Erro 404</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-foreground md:text-4xl">
          Não encontramos esta página
        </h1>
        <p className="mt-3 text-muted-foreground">
          O endereço pode ter mudado ou o conteúdo saiu do ar. Busque pelo que você precisa:
        </p>

        <form onSubmit={handleSearch} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <label htmlFor="notfound-search" className="sr-only">
            Buscar cursos
          </label>
          <Input
            id="notfound-search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Buscar cursos, instrutores..."
            className="h-11 rounded-xl"
          />
          <Button type="submit" className="h-11 gap-2 rounded-xl">
            <Search className="h-4 w-4" aria-hidden="true" />
            Buscar
          </Button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="outline" className="gap-2 rounded-xl">
            <Link to="/">
              <Home className="h-4 w-4" aria-hidden="true" />
              Ir para o início
            </Link>
          </Button>
          <Button asChild variant="ghost" className="gap-2 rounded-xl">
            <Link to="/dashboard">
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              Meu dashboard
            </Link>
          </Button>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Talvez você procure:{" "}
          <Link to="/catalogo" className="text-primary underline hover:text-primary/90">catálogo de cursos</Link>,{" "}
          <Link to="/trilhas" className="text-primary underline hover:text-primary/90">trilhas</Link>,{" "}
          <Link to="/playbooks" className="text-primary underline hover:text-primary/90">playbooks</Link> ou{" "}
          <Link to="/biblioteca-videos" className="text-primary underline hover:text-primary/90">biblioteca de vídeos</Link>.
        </p>
      </motion.div>
    </div>
  );
};

export default NotFound;