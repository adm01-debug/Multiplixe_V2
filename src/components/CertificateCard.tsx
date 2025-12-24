import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Download, Eye, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCertificates } from '@/hooks/useCertificates';
import { toast } from 'sonner';

interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  verification_code: string;
  issued_at: string;
  user_name: string;
  course_title: string;
}

interface CertificateCardProps {
  certificate: Certificate;
}

export function CertificateCard({ certificate }: CertificateCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const { generateCertificate, downloadCertificate } = useCertificates();

  const formattedDate = new Date(certificate.issued_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const handleDownload = async () => {
    setLoading(true);
    try {
      const result = await generateCertificate(
        certificate.course_id,
        certificate.user_name,
        certificate.course_title
      );

      if (result) {
        downloadCertificate(result.pdfBase64, `certificado-${certificate.verification_code}`);
        toast.success('Certificado baixado com sucesso!');
      } else {
        toast.error('Erro ao baixar certificado');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    setLoading(true);
    try {
      const result = await generateCertificate(
        certificate.course_id,
        certificate.user_name,
        certificate.course_title
      );

      if (result) {
        const decoded = decodeURIComponent(escape(atob(result.pdfBase64)));
        setSvgContent(decoded);
        setShowPreview(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const verificationUrl = `/verificar-certificado?code=${certificate.verification_code}`;

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="h-2 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500" />
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center">
              <Award className="h-6 w-6 text-amber-500" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{certificate.course_title}</h3>
              <p className="text-sm text-muted-foreground">Emitido em {formattedDate}</p>
              
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="font-mono text-xs">
                  {certificate.verification_code}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              disabled={loading}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={loading}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <a href={verificationUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Certificado de Conclusão</DialogTitle>
          </DialogHeader>
          <div className="bg-slate-900 rounded-lg p-4 overflow-auto">
            {svgContent && (
              <div 
                dangerouslySetInnerHTML={{ __html: svgContent }}
                className="w-full"
              />
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Fechar
            </Button>
            <Button onClick={handleDownload} disabled={loading}>
              <Download className="h-4 w-4 mr-2" />
              Baixar Certificado
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
