import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  X,
  Send,
  Smile,
  Meh,
  Frown,
  Bug,
  Lightbulb,
  HelpCircle,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

type FeedbackType = "bug" | "idea" | "question" | "general";
type Rating = "happy" | "neutral" | "sad";

const feedbackTypes = [
  { id: "bug" as FeedbackType, label: "Bug", icon: Bug, color: "text-rose-500" },
  { id: "idea" as FeedbackType, label: "Sugestão", icon: Lightbulb, color: "text-amber-500" },
  { id: "question" as FeedbackType, label: "Dúvida", icon: HelpCircle, color: "text-blue-500" },
  { id: "general" as FeedbackType, label: "Geral", icon: MessageSquare, color: "text-primary" },
];

const ratings = [
  { id: "happy" as Rating, icon: Smile, label: "Satisfeito", color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  { id: "neutral" as Rating, icon: Meh, label: "Neutro", color: "text-amber-500", bgColor: "bg-amber-500/10" },
  { id: "sad" as Rating, icon: Frown, label: "Insatisfeito", color: "text-rose-500", bgColor: "bg-rose-500/10" },
];

const FeedbackWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"type" | "rating" | "message" | "success">("type");
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
  const [selectedRating, setSelectedRating] = useState<Rating | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Por favor, escreva sua mensagem");
      return;
    }

    setIsSubmitting(true);

    try {
      // In a real app, you'd save this to a feedback table
      // For now, we'll just simulate success
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Feedback submitted successfully
      setStep("success");
      toast.success("Feedback enviado! Obrigado!");

      // Reset after delay
      setTimeout(() => {
        setIsOpen(false);
        setTimeout(() => {
          setStep("type");
          setSelectedType(null);
          setSelectedRating(null);
          setMessage("");
        }, 300);
      }, 2000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Erro ao enviar feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTypeSelect = (type: FeedbackType) => {
    setSelectedType(type);
    setStep("rating");
  };

  const handleRatingSelect = (rating: Rating) => {
    setSelectedRating(rating);
    setStep("message");
  };

  return (
    <>
      {/* Trigger button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-40 md:bottom-6 md:right-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/30 flex items-center justify-center hover:shadow-xl hover:shadow-primary/40 transition-shadow"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <MessageSquare className="h-6 w-6" />
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />

            {/* Widget */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm md:bottom-6 md:right-6"
            >
              <div className="bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-accent/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Feedback</h3>
                      <p className="text-xs text-muted-foreground">
                        Nos ajude a melhorar
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 rounded-xl"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Content */}
                <div className="p-4">
                  <AnimatePresence mode="wait">
                    {step === "type" && (
                      <motion.div
                        key="type"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-3"
                      >
                        <p className="text-sm text-muted-foreground mb-4">
                          Qual tipo de feedback você quer enviar?
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {feedbackTypes.map((type) => {
                            const Icon = type.icon;
                            return (
                              <button
                                key={type.id}
                                onClick={() => handleTypeSelect(type.id)}
                                className="p-4 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all text-center group"
                              >
                                <Icon
                                  className={`h-6 w-6 mx-auto mb-2 ${type.color} group-hover:scale-110 transition-transform`}
                                />
                                <span className="text-sm font-medium text-foreground">
                                  {type.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {step === "rating" && (
                      <motion.div
                        key="rating"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-4"
                      >
                        <p className="text-sm text-muted-foreground">
                          Como você está se sentindo?
                        </p>
                        <div className="flex justify-center gap-4">
                          {ratings.map((rating) => {
                            const Icon = rating.icon;
                            return (
                              <button
                                key={rating.id}
                                onClick={() => handleRatingSelect(rating.id)}
                                className={`p-4 rounded-2xl border border-border/50 hover:border-primary/50 transition-all group ${
                                  selectedRating === rating.id ? rating.bgColor : ""
                                }`}
                              >
                                <Icon
                                  className={`h-10 w-10 ${rating.color} group-hover:scale-110 transition-transform`}
                                />
                                <span className="text-xs text-muted-foreground mt-2 block">
                                  {rating.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setStep("type")}
                          className="w-full mt-2"
                        >
                          Voltar
                        </Button>
                      </motion.div>
                    )}

                    {step === "message" && (
                      <motion.div
                        key="message"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-4"
                      >
                        <p className="text-sm text-muted-foreground">
                          Conte-nos mais detalhes
                        </p>
                        <Textarea
                          placeholder="Escreva sua mensagem..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={4}
                          className="resize-none"
                        />
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            onClick={() => setStep("rating")}
                            className="flex-1"
                          >
                            Voltar
                          </Button>
                          <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !message.trim()}
                            className="flex-1 gap-2"
                          >
                            {isSubmitting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                            Enviar
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {step === "success" && (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="text-center py-8"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", delay: 0.1 }}
                          className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4"
                        >
                          <Check className="h-8 w-8 text-emerald-500" />
                        </motion.div>
                        <h4 className="font-semibold text-foreground mb-2">
                          Obrigado! 💜
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Seu feedback é muito importante para nós.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default FeedbackWidget;
