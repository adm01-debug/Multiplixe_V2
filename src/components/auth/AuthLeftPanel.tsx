import { Link } from 'react-router-dom';
import { GraduationCap, Star, Zap, Rocket, BookOpen, Trophy } from 'lucide-react';

const features = [
  { icon: BookOpen, label: "Cursos exclusivos" },
  { icon: Trophy, label: "Certificados" },
  { icon: Rocket, label: "Evolua na carreira" },
];

const AuthLeftPanel = () => (
  <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent" />
    <div className="absolute inset-0" style={{ backgroundImage: 'var(--gradient-mesh)', opacity: 0.3 }} />
    <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
    <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
    <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/5 rounded-full blur-2xl" />

    <div className="absolute top-24 right-24 w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-bounce-subtle" aria-hidden="true">
      <Star className="h-7 w-7 text-white" />
    </div>
    <div className="absolute top-40 left-32 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center animate-bounce-subtle" style={{ animationDelay: '0.3s' }} aria-hidden="true">
      <Zap className="h-6 w-6 text-white" />
    </div>
    <div className="absolute bottom-40 left-24 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-bounce-subtle" style={{ animationDelay: '0.6s' }} aria-hidden="true">
      <Rocket className="h-8 w-8 text-white" />
    </div>

    <div className="relative z-10 flex flex-col justify-center p-12 xl:p-20">
      <Link to="/" className="flex items-center gap-3 mb-12">
        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
          <GraduationCap className="h-10 w-10 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-white">MULTIPLIXE</h1>
          <p className="text-sm text-white/70">by Promo Brindes</p>
        </div>
      </Link>

      <h2 className="text-4xl xl:text-5xl font-display font-bold text-white mb-6 leading-tight">
        Desenvolva suas <br />
        <span className="text-white/90">habilidades</span> e <br />
        <span className="relative">
          cresça conosco
          <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
            <path d="M2 10C50 4 150 4 198 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-white/40" />
          </svg>
        </span>
      </h2>
      <p className="text-lg text-white/80 mb-10 max-w-md leading-relaxed">
        Plataforma exclusiva de treinamento para colaboradores Promo Brindes. Aprenda, evolua e alcance novos patamares.
      </p>
      <div className="flex flex-wrap gap-3">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm rounded-full">
            <feature.icon className="h-5 w-5 text-white" />
            <span className="text-sm font-medium text-white">{feature.label}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default AuthLeftPanel;
