import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, RefreshCw } from 'lucide-react';

interface RateLimitHeaderProps {
  onBack: () => void;
  onRefresh: () => void;
}

const RateLimitHeader = ({ onBack, onRefresh }: RateLimitHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Rate Limiting & Segurança
          </h1>
          <p className="text-muted-foreground">Monitore e gerencie a proteção do sistema</p>
        </div>
      </div>
      <Button variant="outline" onClick={onRefresh}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Atualizar
      </Button>
    </div>
  );
};

export default RateLimitHeader;
