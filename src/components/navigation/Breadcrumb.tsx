import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { motion } from "framer-motion";

// Route to label mapping
const routeLabels: Record<string, string> = {
  "": "Início",
  "dashboard": "Dashboard",
  "catalogo": "Catálogo",
  "trilhas": "Trilhas",
  "trilha": "Trilha",
  "curso": "Curso",
  "aula": "Aula",
  "perfil": "Perfil",
  "ranking": "Ranking",
  "admin": "Administração",
  "auth": "Autenticação",
  "seguranca": "Segurança",
  "verificar-certificado": "Verificar Certificado",
};

interface BreadcrumbProps {
  customItems?: { label: string; href?: string }[];
  className?: string;
}

const Breadcrumb = ({ customItems, className = "" }: BreadcrumbProps) => {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  // Generate breadcrumb items from path
  const generateBreadcrumbItems = () => {
    const items: { label: string; href: string; isCurrent: boolean }[] = [
      { label: "Início", href: "/", isCurrent: pathSegments.length === 0 }
    ];

    let currentPath = "";
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      // Check if it's a dynamic segment (like UUID or slug)
      const isDynamicSegment = segment.match(/^[a-f0-9-]{36}$/i) || 
                                (index > 0 && !routeLabels[segment]);
      
      if (isDynamicSegment) {
        // For dynamic segments, use a generic label or skip
        if (customItems && customItems[index]) {
          items.push({
            label: customItems[index].label,
            href: customItems[index].href || currentPath,
            isCurrent: isLast
          });
        }
      } else {
        items.push({
          label: routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
          href: currentPath,
          isCurrent: isLast
        });
      }
    });

    return items;
  };

  const items = customItems 
    ? [{ label: "Início", href: "/", isCurrent: false }, ...customItems.map((item, i) => ({ 
        ...item, 
        href: item.href || "#", 
        isCurrent: i === customItems.length - 1 
      }))]
    : generateBreadcrumbItems();

  // Don't show breadcrumb on home page or if only one item
  if (items.length <= 1) return null;

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={`flex items-center gap-1 text-sm ${className}`}
    >
      {items.map((item, index) => (
        <motion.div 
          key={item.href + index}
          className="flex items-center gap-1"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          {index > 0 && (
            <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
          )}
          {item.isCurrent ? (
            <span className="text-foreground font-medium truncate max-w-[200px]">
              {index === 0 ? <Home className="w-4 h-4" /> : item.label}
            </span>
          ) : (
            <Link
              to={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px] flex items-center gap-1"
            >
              {index === 0 ? (
                <Home className="w-4 h-4" />
              ) : (
                item.label
              )}
            </Link>
          )}
        </motion.div>
      ))}
    </nav>
  );
};

export default Breadcrumb;