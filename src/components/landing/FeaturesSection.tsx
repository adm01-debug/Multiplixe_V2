import { useState } from "react";
import { 
  PlayCircle, 
  Trophy, 
  BarChart3, 
  Target,
  Smartphone, 
  Award,
  Clock,
  Sparkles,
  Zap,
  ArrowRight,
  Users,
  Headphones,
  Package,
  TrendingUp,
  Palette,
  Calculator
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const FeaturesSection = () => {
  const [selectedFeature, setSelectedFeature] = useState<typeof features[0] | null>(null);

  const features = [
    {
      icon: PlayCircle,
      title: "Cursos em Vídeo",
      description: "Assista no seu ritmo, pause quando quiser e continue de onde parou.",
      gradient: "from-primary to-accent",
      demo: "Aulas gravadas em alta qualidade, com controle de velocidade (0.5x a 2x), legendas automáticas e sistema de marcadores para revisão rápida.",
      benefits: ["Acesso 24/7", "Velocidade ajustável", "Legendas automáticas", "Marcadores de tempo"],
    },
    {
      icon: Target,
      title: "Trilhas por Área",
      description: "Conteúdos organizados por departamento e função para seu desenvolvimento.",
      gradient: "from-accent to-warning",
      demo: "Trilhas personalizadas para cada departamento: Vendas, SAC, Logística, TI, Marketing, Financeiro e muito mais.",
      benefits: ["Conteúdo relevante", "Progressão clara", "Certificação por trilha", "Recomendações inteligentes"],
    },
    {
      icon: Trophy,
      title: "Gamificação",
      description: "Ganhe XP, conquiste badges e suba no ranking dos colaboradores.",
      gradient: "from-warning to-primary",
      demo: "Sistema completo de XP, níveis, badges exclusivos, desafios diários e ranking entre colaboradores. Compete e evolua!",
      benefits: ["Sistema de XP", "Badges exclusivos", "Ranking semanal", "Desafios diários"],
    },
    {
      icon: BarChart3,
      title: "Acompanhe seu Progresso",
      description: "Dashboard pessoal para visualizar sua evolução e conquistas.",
      gradient: "from-info to-primary",
      demo: "Dashboard completo com gráficos de evolução, histórico de XP, streak de estudos e análise de performance.",
      benefits: ["Gráficos interativos", "Histórico completo", "Streak de estudos", "Metas pessoais"],
    },
    {
      icon: Clock,
      title: "Aprenda no seu Tempo",
      description: "Acesse 24h por dia, de qualquer lugar, no horário que preferir.",
      gradient: "from-primary to-info",
      demo: "Plataforma disponível 24/7. Pause uma aula no computador e continue no celular, exatamente de onde parou.",
      benefits: ["Disponível 24/7", "Cross-device", "Sem limites", "Seu ritmo"],
    },
    {
      icon: Smartphone,
      title: "Acesso pelo Celular",
      description: "Plataforma 100% responsiva, funciona perfeitamente no mobile.",
      gradient: "from-accent to-primary",
      demo: "Interface otimizada para mobile com gestos nativos, modo offline e notificações push para lembretes.",
      benefits: ["100% responsivo", "Gestos nativos", "Modo offline", "Push notifications"],
    },
    {
      icon: Award,
      title: "Certificados",
      description: "Receba certificados ao concluir cursos para seu currículo.",
      gradient: "from-warning to-accent",
      demo: "Certificados digitais com QR Code de verificação, compartilháveis no LinkedIn e aceitos em processos internos.",
      benefits: ["QR Code verificável", "Compartilhável", "Válido em processos", "Design profissional"],
    },
    {
      icon: Sparkles,
      title: "Conteúdo Exclusivo",
      description: "Cursos desenvolvidos especialmente para a realidade da Promo Brindes.",
      gradient: "from-primary to-warning",
      demo: "Conteúdos criados por especialistas internos e externos, focados nos desafios e oportunidades da Promo Brindes.",
      benefits: ["Feito para você", "Casos reais", "Atualizado sempre", "Experts internos"],
    },
  ];

  const departmentFeatures = {
    vendas: {
      icon: TrendingUp,
      title: "Para Vendas",
      description: "Técnicas de negociação, conhecimento de produtos e atendimento ao cliente",
      features: ["Técnicas de vendas", "Catálogo de produtos", "CRM e ferramentas", "Cases de sucesso"],
    },
    sac: {
      icon: Headphones,
      title: "Para SAC",
      description: "Atendimento de excelência, resolução de problemas e empatia",
      features: ["Comunicação efetiva", "Gestão de conflitos", "Processos internos", "Satisfação do cliente"],
    },
    logistica: {
      icon: Package,
      title: "Para Logística",
      description: "Gestão de estoque, processos e otimização de entregas",
      features: ["Gestão de estoque", "Processos logísticos", "Ferramentas e sistemas", "Indicadores KPI"],
    },
    marketing: {
      icon: Palette,
      title: "Para Marketing",
      description: "Design, branding, mídias sociais e estratégias digitais",
      features: ["Design e branding", "Social media", "Copywriting", "Analytics"],
    },
    financeiro: {
      icon: Calculator,
      title: "Para Financeiro",
      description: "Excel avançado, análise de dados e processos financeiros",
      features: ["Excel avançado", "Power BI", "Processos fiscais", "Análise financeira"],
    },
    ti: {
      icon: Zap,
      title: "Para TI",
      description: "Tecnologias, segurança, desenvolvimento e inovação",
      features: ["Novas tecnologias", "Segurança", "Automação", "Suporte técnico"],
    },
  };

  return (
    <section id="recursos" className="py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
      
      {/* Decorative Elements */}
      <div className="absolute top-20 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-20 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[120px]" />

      <div className="container-app relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-6">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 backdrop-blur-sm">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Recursos Poderosos
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight">
            Tudo para o seu{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
              desenvolvimento
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A MULTIPLIXE oferece recursos completos para você evoluir 
            profissionalmente dentro da Promo Brindes.
          </p>
        </div>

        {/* Department Tabs */}
        <Tabs defaultValue="todos" className="mb-16">
          <TabsList className="flex flex-wrap justify-center gap-2 bg-transparent h-auto mb-8">
            <TabsTrigger 
              value="todos" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-6"
            >
              <Users className="w-4 h-4 mr-2" />
              Todos
            </TabsTrigger>
            {Object.entries(departmentFeatures).map(([key, dept]) => (
              <TabsTrigger 
                key={key}
                value={key}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-6"
              >
                <dept.icon className="w-4 h-4 mr-2" />
                {dept.title.replace("Para ", "")}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="todos" className="mt-0">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedFeature(feature)}
                  className="group relative bg-card/50 backdrop-blur-sm rounded-3xl p-7 border border-border/50 hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 cursor-pointer overflow-hidden"
                >
                  {/* Hover Glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  
                  {/* Icon */}
                  <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-display font-bold text-card-foreground mb-3 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {feature.description}
                  </p>

                  {/* Arrow indicator */}
                  <div className="flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
                    <span className="text-sm font-semibold">Ver mais</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {Object.entries(departmentFeatures).map(([key, dept]) => (
            <TabsContent key={key} value={key} className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card/50 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-border/50"
              >
                <div className="flex items-start gap-6 mb-8">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg`}>
                    <dept.icon className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-display font-bold text-card-foreground mb-2">
                      {dept.title}
                    </h3>
                    <p className="text-lg text-muted-foreground">
                      {dept.description}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {dept.features.map((feat, idx) => (
                    <motion.div
                      key={feat}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-background/50 rounded-2xl p-5 border border-border/30 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-semibold text-card-foreground">{feat}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <Button className="mt-8" size="lg">
                  Ver cursos para {dept.title.replace("Para ", "")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Feature Demo Modal */}
      <Dialog open={!!selectedFeature} onOpenChange={() => setSelectedFeature(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-4">
              {selectedFeature && (
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${selectedFeature.gradient} flex items-center justify-center shadow-lg`}>
                  <selectedFeature.icon className="w-7 h-7 text-white" />
                </div>
              )}
              <DialogTitle className="text-2xl font-display">
                {selectedFeature?.title}
              </DialogTitle>
            </div>
            <DialogDescription className="text-base">
              {selectedFeature?.demo}
            </DialogDescription>
          </DialogHeader>
          
          {selectedFeature?.benefits && (
            <div className="grid grid-cols-2 gap-3 mt-4">
              {selectedFeature.benefits.map((benefit, idx) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center gap-2 text-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-primary" />
                  </div>
                  <span>{benefit}</span>
                </motion.div>
              ))}
            </div>
          )}

          <Button className="w-full mt-6" size="lg">
            Experimentar agora
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default FeaturesSection;
