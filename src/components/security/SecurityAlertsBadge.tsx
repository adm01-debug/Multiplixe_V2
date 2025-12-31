import { useSecurityAlerts } from '@/hooks/useSecurityAlerts';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const SecurityAlertsBadge = () => {
  const { unreadCount, loading } = useSecurityAlerts();

  if (loading || unreadCount === 0) return null;

  return (
    <Link to="/admin/security" className="relative">
      <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 transition-colors">
        <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
        <span className="text-sm font-medium text-destructive">
          {unreadCount} alerta{unreadCount > 1 ? 's' : ''} de segurança
        </span>
      </div>
    </Link>
  );
};

export default SecurityAlertsBadge;
