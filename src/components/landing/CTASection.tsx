import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Rocket, Heart, TrendingUp, Sparkles, Zap, Star, Shield, Lock, Calendar, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

// Countdown target date (can be customized)
const getCountdownTarget = () => {
  const target = new Date();
  target.setDate(target.getDate() + 7); // 7 days from now
  target.setHours(23, 59, 59, 999);
  return target;
};

const CTASection = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = getCountdownTarget();
    const interval = setInterval(() => {
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const benefits = [
    { icon: Heart, text: "Investimento da empresa no seu futuro" },
    { icon: TrendingUp, text: "Oportunidade de crescimento interno" },
    { icon: Rocket, text: "Desenvolvimento contínuo" },
  ];

  const trustBadges = [
    { icon: Shield, text: "Dados Protegidos" },
    { icon: Lock, text: "Conexão Segura" },
  ];

  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent" />
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
        backgroundSize: '32px 32px'
      }} />
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/30 rounded-full blur-[150px]" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-20 animate-float opacity-40">
        <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
          <Star className="w-8 h-8 text-white" />
        </div>
      </div>
      <div className="absolute bottom-20 right-20 animate-float opacity-40" style={{ animationDelay: "0.5s" }}>
        <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
          <Zap className="w-7 h-7 text-white" />
        </div>
      </div>

      <div className="container-app relative">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
            <Rocket className="w-4 h-4 text-white" />
            <span className="text-sm font-semibold text-white">Transforme sua carreira hoje</span>
          </div>

          {/* Countdown Timer */}
          <motion.div 
            className="flex justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {[
              { value: timeLeft.days, label: "Dias" },
              { value: timeLeft.hours, label: "Horas" },
              { value: timeLeft.minutes, label: "Min" },
              { value: timeLeft.seconds, label: "Seg" },
            ].map((item, i) => (
              <div key={item.label} className="flex flex-col items-center">
                <motion.div 
                  className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center"
                  animate={{ scale: item.label === "Seg" ? [1, 1.05, 1] : 1 }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <span className="text-2xl md:text-3xl font-bold text-white">
                    {String(item.value).padStart(2, '0')}
                  </span>
                </motion.div>
                <span className="text-xs text-white/60 mt-2 font-medium">{item.label}</span>
              </div>
            ))}
          </motion.div>

          {/* Heading */}
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white leading-[1.1]">
            Sua evolução{" "}
            <span className="relative">
              começa agora!
              <Sparkles className="absolute -top-3 -right-8 w-8 h-8 text-warning animate-pulse" />
            </span>
          </h2>

          <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            A Promo Brindes acredita em você. Aproveite esta oportunidade 
            para desenvolver novas habilidades e crescer na sua carreira.
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-6 py-8">
            {benefits.map((benefit) => (
              <div 
                key={benefit.text}
                className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <benefit.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-white font-medium">{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* Multi-CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link to="/auth">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 text-xl px-12 h-16 font-bold shadow-2xl shadow-black/20 hover:shadow-3xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <Sparkles className="mr-3 w-6 h-6 group-hover:rotate-12 transition-transform" />
                Acessar Plataforma
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/catalogo">
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-white/30 text-white hover:bg-white/10 text-lg px-8 h-16 font-semibold transition-all duration-300 hover:-translate-y-1 group bg-transparent"
              >
                <Calendar className="mr-2 w-5 h-5" />
                Ver Catálogo
              </Button>
            </Link>
            <a href="mailto:rh@promobrindes.com.br">
              <Button 
                size="lg" 
                variant="ghost"
                className="text-white/80 hover:text-white hover:bg-white/10 text-lg px-6 h-16 font-medium transition-all duration-300 group"
              >
                <MessageCircle className="mr-2 w-5 h-5" />
                Falar com RH
              </Button>
            </a>
          </div>

          {/* Trust Badges */}
          <div className="flex items-center justify-center gap-6 pt-8">
            {trustBadges.map((badge) => (
              <div key={badge.text} className="flex items-center gap-2 text-white/60">
                <badge.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{badge.text}</span>
              </div>
            ))}
          </div>

          {/* Note */}
          <p className="text-white/50 text-sm pt-4 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white/30" />
            Acesso exclusivo para colaboradores com email @promobrindes.com.br
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;