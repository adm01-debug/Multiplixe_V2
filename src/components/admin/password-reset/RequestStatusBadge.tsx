import { Badge } from '@/components/ui/badge';
import { Clock, Check, X } from 'lucide-react';

interface RequestStatusBadgeProps {
  status: string;
}

const RequestStatusBadge = ({ status }: RequestStatusBadgeProps) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="h-3 w-3 mr-1" /> Pendente</Badge>;
    case 'approved':
      return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20"><Check className="h-3 w-3 mr-1" /> Aprovada</Badge>;
    case 'rejected':
      return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20"><X className="h-3 w-3 mr-1" /> Rejeitada</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default RequestStatusBadge;
