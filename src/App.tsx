import { Suspense, lazy } from "react";
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
import FloatingPomodoroButton from "@/components/pomodoro/FloatingPomodoroButton";
import MobileBottomNav from "@/components/navigation/MobileBottomNav";
import NavigationProgress from "@/components/navigation/NavigationProgress";
import PageTransition from "@/components/navigation/PageTransition";
import ScrollRestoration from "@/components/navigation/ScrollRestoration";

// Lazy load non-critical overlays to reduce initial bundle
const CommandPalette = lazy(() => import("@/components/CommandPalette"));
const KeyboardShortcutsModal = lazy(() => import("@/components/KeyboardShortcutsModal"));
const PWAInstallPrompt = lazy(() => import("@/components/pwa/PWAInstallPrompt"));
const NotificationPermissionBanner = lazy(() => import("@/components/security/NotificationPermissionBanner"));
import SkipLinks from "@/components/accessibility/SkipLinks";
import AccessibilityWidget from "@/components/accessibility/AccessibilityWidget";
import ScrollToTop from "@/components/navigation/ScrollToTop";
import ProtectedRoute from "@/components/ProtectedRoute";
import PageLoader from "@/components/PageLoader";
import ErrorBoundary from "@/components/ErrorBoundary";
import RouteErrorBoundary from "@/components/RouteErrorBoundary";

// Setup cache persistence
setupCachePersistence(queryClient);

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
const Flashcards = lazy(() => import("./pages/Flashcards"));
const Store = lazy(() => import("./pages/Store"));
const Admin = lazy(() => import("./pages/Admin"));
const VerifyCertificate = lazy(() => import("./pages/VerifyCertificate"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const LearningPaths = lazy(() => import("./pages/LearningPaths"));
const LearningPathDetail = lazy(() => import("./pages/LearningPathDetail"));
const RateLimitDashboard = lazy(() => import("./pages/RateLimitDashboard"));
const SecurityDashboard = lazy(() => import("./pages/SecurityDashboard"));
const Playbooks = lazy(() => import("./pages/Playbooks"));
const PlaybookDetail = lazy(() => import("./pages/PlaybookDetail"));
const VideoLibrary = lazy(() => import("./pages/VideoLibrary"));
const SalesOnboarding = lazy(() => import("./pages/SalesOnboarding"));
const SkillAssessments = lazy(() => import("./pages/SkillAssessments"));
const AssessmentRunner = lazy(() => import("./pages/AssessmentRunner"));
const OnboardingRuntime = lazy(() => import("./pages/OnboardingRuntime"));
const NotFound = lazy(() => import("./pages/NotFound"));

import { useSessionRotation } from "@/hooks/useSessionRotation";

// Activates auto-rotation of session tokens for authenticated users
const SessionRotationGuard = () => {
  useSessionRotation();
  return null;
};

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
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
              <SkipLinks />
              <NavigationProgress />
              <ScrollRestoration />
              <Suspense fallback={null}>
                <CommandPalette />
                <KeyboardShortcutsModal />
              </Suspense>
              <SessionRotationGuard />
              <ConditionalPomodoroButton />
              <ConditionalMobileNav />
              <AccessibilityWidget />
              <Suspense fallback={null}>
                <ConditionalNotificationBanner />
                <PWAInstallPrompt />
              </Suspense>
              <ScrollToTop />
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <PageTransition>
                    <Routes>
                    <Route path="/" element={<RouteErrorBoundary routeName="Home"><Index /></RouteErrorBoundary>} />
                    <Route path="/auth" element={<RouteErrorBoundary routeName="Login"><Auth /></RouteErrorBoundary>} />
                    <Route path="/forgot-password" element={<RouteErrorBoundary routeName="Esqueci a senha"><ForgotPassword /></RouteErrorBoundary>} />
                    <Route path="/reset-password" element={<RouteErrorBoundary routeName="Redefinir senha"><ResetPassword /></RouteErrorBoundary>} />
                    <Route path="/dashboard" element={<RouteErrorBoundary routeName="Dashboard"><ProtectedRoute><Dashboard /></ProtectedRoute></RouteErrorBoundary>} />
                    <Route path="/catalogo" element={<RouteErrorBoundary routeName="Catálogo"><ProtectedRoute><Catalog /></ProtectedRoute></RouteErrorBoundary>} />
                    <Route path="/curso/:slug" element={<RouteErrorBoundary routeName="Curso"><ProtectedRoute><CourseDetail /></ProtectedRoute></RouteErrorBoundary>} />
                    <Route path="/curso/:slug/aula/:lessonId" element={<RouteErrorBoundary routeName="Aula"><ProtectedRoute><LessonPlayer /></ProtectedRoute></RouteErrorBoundary>} />
                    <Route path="/perfil" element={<RouteErrorBoundary routeName="Perfil"><ProtectedRoute><Profile /></ProtectedRoute></RouteErrorBoundary>} />
                    <Route path="/ranking" element={<RouteErrorBoundary routeName="Ranking"><ProtectedRoute><Leaderboard /></ProtectedRoute></RouteErrorBoundary>} />
                    <Route path="/flashcards" element={<RouteErrorBoundary routeName="Flashcards"><ProtectedRoute><Flashcards /></ProtectedRoute></RouteErrorBoundary>} />
                    <Route path="/loja" element={<RouteErrorBoundary routeName="Loja"><ProtectedRoute><Store /></ProtectedRoute></RouteErrorBoundary>} />
                    <Route path="/trilhas" element={<RouteErrorBoundary routeName="Trilhas"><ProtectedRoute><LearningPaths /></ProtectedRoute></RouteErrorBoundary>} />
                    <Route path="/trilha/:slug" element={<RouteErrorBoundary routeName="Trilha"><ProtectedRoute><LearningPathDetail /></ProtectedRoute></RouteErrorBoundary>} />
                    <Route path="/admin" element={<RouteErrorBoundary routeName="Admin"><ProtectedRoute requireAdmin><Admin /></ProtectedRoute></RouteErrorBoundary>} />
                    <Route path="/admin/security" element={<RouteErrorBoundary routeName="Segurança Admin"><ProtectedRoute requireAdmin><RateLimitDashboard /></ProtectedRoute></RouteErrorBoundary>} />
                    <Route path="/seguranca" element={<RouteErrorBoundary routeName="Segurança"><ProtectedRoute><SecurityDashboard /></ProtectedRoute></RouteErrorBoundary>} />
                    <Route path="/verificar-certificado" element={<RouteErrorBoundary routeName="Verificar Certificado"><VerifyCertificate /></RouteErrorBoundary>} />
                    <Route path="/usuario/:id" element={<RouteErrorBoundary routeName="Perfil Público"><PublicProfile /></RouteErrorBoundary>} />
                    <Route path="/playbooks" element={<RouteErrorBoundary routeName="Playbooks"><ProtectedRoute><Playbooks /></ProtectedRoute></RouteErrorBoundary>} />
                    <Route path="/playbook/:slug" element={<RouteErrorBoundary routeName="Playbook"><ProtectedRoute><PlaybookDetail /></ProtectedRoute></RouteErrorBoundary>} />
                    <Route path="/biblioteca-videos" element={<RouteErrorBoundary routeName="Biblioteca de Vídeos"><ProtectedRoute><VideoLibrary /></ProtectedRoute></RouteErrorBoundary>} />
                    <Route path="/onboarding" element={<RouteErrorBoundary routeName="Onboarding"><ProtectedRoute><SalesOnboarding /></ProtectedRoute></RouteErrorBoundary>} />
                    <Route path="/onboarding/executar" element={<RouteErrorBoundary routeName="Onboarding Runtime"><ProtectedRoute><OnboardingRuntime /></ProtectedRoute></RouteErrorBoundary>} />
                    <Route path="/avaliacoes" element={<RouteErrorBoundary routeName="Avaliações"><ProtectedRoute><SkillAssessments /></ProtectedRoute></RouteErrorBoundary>} />
                    <Route path="/avaliacao/:id" element={<RouteErrorBoundary routeName="Avaliação"><ProtectedRoute><AssessmentRunner /></ProtectedRoute></RouteErrorBoundary>} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                    </Routes>
                  </PageTransition>
                </Suspense>
              </ErrorBoundary>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
