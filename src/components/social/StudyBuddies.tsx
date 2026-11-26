import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, ChevronRight, Crown, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface StudyBuddy {
  id: string;
  name: string;
  avatar_url: string | null;
  current_level: number;
  total_xp: number;
}

const StudyBuddies = () => {
  const { user } = useAuth();
  const [buddies, setBuddies] = useState<StudyBuddy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchBuddies = async () => {
      setLoading(true);

      try {
        // Mesma fonte do ranking: get_leaderboard e SECURITY DEFINER, entao
        // enxerga o nome e o XP de outros alunos (as tabelas profiles/user_xp
        // tem RLS restrita ao proprio usuario).
        const { data } = await supabase.rpc("get_leaderboard", { p_limit: 20, p_period: "all" });
        const colegas = (data || [])
          .filter((u: { user_id: string }) => u.user_id !== user.id)
          .slice(0, 5);

        setBuddies(
          colegas.map((u: { user_id: string; display_name: string | null; avatar_url: string | null; total_xp: number | null; current_level: number | null }) => ({
            id: u.user_id,
            name: u.display_name || "Colega",
            avatar_url: u.avatar_url,
            current_level: u.current_level || 1,
            total_xp: u.total_xp || 0,
          })),
        );
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };

    fetchBuddies();
  }, [user]);

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Colegas de Estudo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            Colegas de Estudo
          </CardTitle>
          <Link to="/ranking">
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-primary">
              Ver todos
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {buddies.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Nenhum colega encontrado ainda.
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Assim que outros alunos aparecerem no ranking, eles ficam listados aqui.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {buddies.map((buddy, index) => (
              <motion.div
                key={buddy.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className="h-12 w-12 border-2 border-border/50">
                      <AvatarImage src={buddy.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">
                        {buddy.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {/* Level badge */}
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-primary to-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {buddy.current_level}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground truncate">
                        {buddy.name}
                      </span>
                      {index === 0 && (
                        <Crown className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-amber-500" />
                        {buddy.total_xp.toLocaleString()} XP
                      </span>

                    </div>
                  </div>


                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudyBuddies;
