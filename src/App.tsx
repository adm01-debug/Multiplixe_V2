import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "next-themes";
import CommandPalette from "@/components/CommandPalette";
import FloatingPomodoroButton from "@/components/pomodoro/FloatingPomodoroButton";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Catalog from "./pages/Catalog";
import CourseDetail from "./pages/CourseDetail";
import LessonPlayer from "./pages/LessonPlayer";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import Admin from "./pages/Admin";
import VerifyCertificate from "./pages/VerifyCertificate";
import LearningPaths from "./pages/LearningPaths";
import LearningPathDetail from "./pages/LearningPathDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component that conditionally shows the Pomodoro button
const ConditionalPomodoroButton = () => {
  const { user } = useAuth();
  if (!user) return null;
  return <FloatingPomodoroButton />;
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <TooltipProvider>
          <AuthProvider>
          <Toaster />
          <Sonner />
          <CommandPalette />
          <ConditionalPomodoroButton />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/catalogo" element={<Catalog />} />
              <Route path="/curso/:slug" element={<CourseDetail />} />
              <Route path="/curso/:slug/aula/:lessonId" element={<LessonPlayer />} />
              <Route path="/perfil" element={<Profile />} />
              <Route path="/ranking" element={<Leaderboard />} />
              <Route path="/trilhas" element={<LearningPaths />} />
              <Route path="/trilha/:slug" element={<LearningPathDetail />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/verificar-certificado" element={<VerifyCertificate />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
