import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "next-themes";
import { queryClient } from "@/lib/queryClient";
import { setupCachePersistence } from "@/lib/queryPersister";
import CommandPalette from "@/components/CommandPalette";
import FloatingPomodoroButton from "@/components/pomodoro/FloatingPomodoroButton";
import MobileBottomNav from "@/components/navigation/MobileBottomNav";
import NavigationProgress from "@/components/navigation/NavigationProgress";
import PageTransition from "@/components/navigation/PageTransition";
import ScrollRestoration from "@/components/navigation/ScrollRestoration";
import PWAInstallPrompt from "@/components/pwa/PWAInstallPrompt";
import NotificationPermissionBanner from "@/components/security/NotificationPermissionBanner";
import ProtectedRoute from "@/components/ProtectedRoute";
import PageLoader from "@/components/PageLoader";

// Setup cache persistence
const cleanupPersistence = setupCachePersistence(queryClient);

// Lazy loaded pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Catalog = lazy(() => import("./pages/Catalog"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const LessonPlayer = lazy(() => import("./pages/LessonPlayer"));
const Profile = lazy(() => import("./pages/Profile"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Admin = lazy(() => import("./pages/Admin"));
const VerifyCertificate = lazy(() => import("./pages/VerifyCertificate"));
const LearningPaths = lazy(() => import("./pages/LearningPaths"));
const LearningPathDetail = lazy(() => import("./pages/LearningPathDetail"));
const RateLimitDashboard = lazy(() => import("./pages/RateLimitDashboard"));
const SecurityDashboard = lazy(() => import("./pages/SecurityDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Component that conditionally shows the Pomodoro button
const ConditionalPomodoroButton = () => {
  const { user } = useAuth();
  if (!user) return null;
  return <FloatingPomodoroButton />;
};

// Component that conditionally shows the Mobile Bottom Nav
const ConditionalMobileNav = () => {
  const { user } = useAuth();
  if (!user) return null;
  return <MobileBottomNav />;
};

// Component that conditionally shows the Notification Permission Banner
const ConditionalNotificationBanner = () => {
  const { user } = useAuth();
  if (!user) return null;
  return <NotificationPermissionBanner />;
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <NavigationProgress />
              <ScrollRestoration />
              <CommandPalette />
              <ConditionalPomodoroButton />
              <ConditionalMobileNav />
              <ConditionalNotificationBanner />
              <PWAInstallPrompt />
              <Suspense fallback={<PageLoader />}>
                <PageTransition>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/catalogo" element={<ProtectedRoute><Catalog /></ProtectedRoute>} />
                    <Route path="/curso/:slug" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
                    <Route path="/curso/:slug/aula/:lessonId" element={<ProtectedRoute><LessonPlayer /></ProtectedRoute>} />
                    <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/ranking" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
                    <Route path="/trilhas" element={<ProtectedRoute><LearningPaths /></ProtectedRoute>} />
                    <Route path="/trilha/:slug" element={<ProtectedRoute><LearningPathDetail /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
                    <Route path="/admin/security" element={<ProtectedRoute requireAdmin><RateLimitDashboard /></ProtectedRoute>} />
                    <Route path="/seguranca" element={<ProtectedRoute><SecurityDashboard /></ProtectedRoute>} />
                    <Route path="/verificar-certificado" element={<VerifyCertificate />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </PageTransition>
              </Suspense>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
