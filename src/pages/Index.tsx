import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import DynamicStats from "@/components/landing/DynamicStats";
import FeaturedCoursesPreview from "@/components/landing/FeaturedCoursesPreview";
import FeaturesSection from "@/components/landing/FeaturesSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";
import MobileStickyCTA from "@/components/landing/MobileStickyCTA";
import SocialProofCounter from "@/components/landing/SocialProofCounter";
import DynamicSEO from "@/components/seo/DynamicSEO";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <DynamicSEO 
        title="MULTIPLIXE - Plataforma de Desenvolvimento Profissional"
        description="Transforme sua carreira com cursos exclusivos, trilhas de aprendizado e gamificação. Plataforma de treinamento da Promo Brindes."
      />
      <Header />
      <main>
        <HeroSection />
        <SocialProofCounter />
        <DynamicStats />
        <FeaturedCoursesPreview />
        <FeaturesSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
      
      {/* Mobile Sticky CTA - appears after scrolling */}
      <MobileStickyCTA />
    </div>
  );
};

export default Index;