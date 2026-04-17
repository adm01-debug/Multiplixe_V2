import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSmartRecommendations } from "@/hooks/useSmartRecommendations";

const SmartRecommendations = () => {
  const { data: recs = [], isLoading } = useSmartRecommendations(3);

  if (isLoading) {
    return (
      <section aria-label="Recomendações inteligentes" className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </section>
    );
  }

  if (recs.length === 0) return null;

  return (
    <section aria-labelledby="smart-recs-heading" className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 id="smart-recs-heading" className="text-lg font-semibold">
          Recomendado para você
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {recs.map((r) => (
          <Link key={r.id} to={`/curso/${r.slug}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
            <Card className="h-full hover:border-primary/50 transition-colors group">
              <CardContent className="p-4 space-y-2">
                <Badge variant="secondary" className="text-[10px]">
                  {r.recommendation_reason}
                </Badge>
                <h3 className="font-semibold leading-tight line-clamp-2">{r.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>
                <div className="flex items-center text-xs text-primary group-hover:gap-2 transition-all">
                  Acessar <ArrowRight className="h-3 w-3 ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default SmartRecommendations;
