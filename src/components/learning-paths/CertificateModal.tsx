import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { GraduationCap, Trophy, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LearningPathCertificate } from '@/hooks/useLearningPaths';

interface CertificateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificate: LearningPathCertificate | null;
  pathTitle: string;
}

const CertificateModal = ({ open, onOpenChange, certificate, pathTitle }: CertificateModalProps) => {
  const { toast } = useToast();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            Certificado de Conclusão
          </DialogTitle>
          <DialogDescription>
            Parabéns! Você completou a trilha "{pathTitle}".
          </DialogDescription>
        </DialogHeader>

        {certificate && (
          <div className="space-y-4">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-6 text-center">
              <Trophy className="mx-auto mb-4 h-16 w-16 text-yellow-500" />
              <h3 className="mb-2 text-xl font-bold">{certificate.path_title}</h3>
              <p className="mb-4 text-muted-foreground">
                Certificado emitido para <strong>{certificate.user_name}</strong>
              </p>
              <div className="rounded bg-muted px-3 py-2 font-mono text-sm">
                Código: {certificate.verification_code}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/verificar-certificado?code=${certificate.verification_code}`
                  );
                  toast({ title: 'Link copiado!' });
                }}
              >
                Copiar Link
              </Button>
              <Button className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Baixar PDF
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CertificateModal;
