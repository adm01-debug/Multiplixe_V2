import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Search, Award, ArrowLeft } from 'lucide-react';
import { useCertificates } from '@/hooks/useCertificates';

interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  verification_code: string;
  issued_at: string;
  user_name: string;
  course_title: string;
}

export default function VerifyCertificate() {
  const [searchParams] = useSearchParams();
  const codeFromUrl = searchParams.get('code');
  
  const [code, setCode] = useState(codeFromUrl || '');
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { verifyCertificate } = useCertificates();

  const handleVerify = async () => {
    if (!code.trim()) return;
    
    setLoading(true);
    setSearched(true);
    const result = await verifyCertificate(code.trim());
    setCertificate(result);
    setLoading(false);
  };

  useEffect(() => {
    if (codeFromUrl) {
      handleVerify();
    }
  }, []);

  const formattedDate = certificate
    ? new Date(certificate.issued_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao início
        </Link>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Award className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Verificar Certificado</h1>
            <p className="text-muted-foreground">
              Insira o código de verificação para validar a autenticidade do certificado
            </p>
          </div>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Input
                  placeholder="Digite o código de verificação"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="uppercase font-mono text-lg tracking-wider"
                  maxLength={8}
                />
                <Button onClick={handleVerify} disabled={loading || !code.trim()}>
                  <Search className="h-4 w-4 mr-2" />
                  Verificar
                </Button>
              </div>
            </CardContent>
          </Card>

          {searched && !loading && (
            <Card className={certificate ? 'border-green-500/50 bg-green-500/5' : 'border-destructive/50 bg-destructive/5'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  {certificate ? (
                    <>
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                      <span className="text-green-500">Certificado Válido</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6 text-destructive" />
                      <span className="text-destructive">Certificado Não Encontrado</span>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              
              {certificate && (
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nome do Aluno</p>
                      <p className="text-lg font-semibold">{certificate.user_name}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Curso Concluído</p>
                      <p className="text-lg font-semibold">{certificate.course_title}</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Data de Emissão</p>
                        <p className="font-medium">{formattedDate}</p>
                      </div>
                      
                      <Badge variant="secondary" className="font-mono text-sm">
                        {certificate.verification_code}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              )}
              
              {!certificate && (
                <CardContent>
                  <p className="text-muted-foreground">
                    O código informado não corresponde a nenhum certificado em nossa base de dados.
                    Verifique se o código foi digitado corretamente.
                  </p>
                </CardContent>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
