import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, MessageCircle, Trophy, Flame, ChevronRight, Crown, Zap, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface StudyBuddy {
  id: string;
  name: string;
  avatar_url: string | null;
  department: string | null;
  current_level: number;
  total_xp: number;
  current_streak: number;
  isOnline: boolean;
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
        // Get user's department
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("department")
          .eq("user_id", user.id)
          .single();

        // Fetch colleagues from same department
        const { data: profiles } = await supabase
          .from("profiles")
          .select(`
            user_id,
            full_name,
            avatar_url,
            department
          `)
          .eq("department", userProfile?.department || "")
          .neq("user_id", user.id)
          .limit(5);

        if (!profiles || profiles.length === 0) {
          // If no colleagues, get top performers
          const { data: topUsers } = await supabase
            .from("user_xp")
            .select(`
              user_id,
              current_level,
              total_xp
            `)
            .neq("user_id", user.id)
            .order("total_xp", { ascending: false })
            .limit(5);

          if (topUsers) {
            const userIds = topUsers.map((u) => u.user_id);
            const { data: topProfiles } = await supabase
              .from("profiles")
              .select("user_id, full_name, avatar_url, department")
              .in("user_id", userIds);

            const { data: streaks } = await supabase
              .from("user_streaks")
              .select("user_id, current_streak")
              .in("user_id", userIds);

            const buddiesData: StudyBuddy[] = topUsers.map((xp) => {
              const profile = topProfiles?.find((p) => p.user_id === xp.user_id);
              const streak = streaks?.find((s) => s.user_id === xp.user_id);
              return {
                id: xp.user_id,
                name: profile?.full_name || "Usuário",
                avatar_url: profile?.avatar_url,
                department: profile?.department,
                current_level: xp.current_level,
                total_xp: xp.total_xp,
                current_streak: streak?.current_streak || 0,
                isOnline: Math.random() > 0.5, // Simulate online status
              };
            });

            setBuddies(buddiesData);
          }
        } else {
          // Get XP and streaks for colleagues
          const userIds = profiles.map((p) => p.user_id);

          const { data: xpData } = await supabase
            .from("user_xp")
            .select("user_id, current_level, total_xp")
            .in("user_id", userIds);

          const { data: streaks } = await supabase
            .from("user_streaks")
            .select("user_id, current_streak")
            .in("user_id", userIds);

          const buddiesData: StudyBuddy[] = profiles.map((profile) => {
            const xp = xpData?.find((x) => x.user_id === profile.user_id);
            const streak = streaks?.find((s) => s.user_id === profile.user_id);
            return {
              id: profile.user_id,
              name: profile.full_name || "Usuário",
              avatar_url: profile.avatar_url,
              department: profile.department,
              current_level: xp?.current_level || 1,
              total_xp: xp?.total_xp || 0,
              current_streak: streak?.current_streak || 0,
              isOnline: Math.random() > 0.5,
            };
          });

          setBuddies(buddiesData);
        }
      } catch (error) {
        console.error("Error fetching study buddies:", error);
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
              Complete seu perfil para conectar-se com colegas do seu departamento.
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
                  {/* Avatar with online indicator */}
                  <div className="relative">
                    <Avatar className="h-12 w-12 border-2 border-border/50">
                      <AvatarImage src={buddy.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">
                        {buddy.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {buddy.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-background rounded-full" />
                    )}
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
                      {buddy.current_streak > 0 && (
                        <span className="flex items-center gap-1">
                          <Flame className="h-3 w-3 text-rose-500" />
                          {buddy.current_streak} dias
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Department badge */}
                  {buddy.department && (
                    <Badge variant="outline" className="text-xs capitalize shrink-0">
                      {buddy.department}
                    </Badge>
                  )}
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
