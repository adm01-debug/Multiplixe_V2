import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Ban } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BlockedIP {
  id: string;
  ip_address: unknown;
  reason: string | null;
  is_permanent: boolean | null;
  expires_at: string | null;
}

interface BlockedIPsTabProps {
  blockedIPs: BlockedIP[];
  onBlockIP: (ip: string, reason: string, isPermanent: boolean, duration: number) => Promise<boolean>;
  onUnblockIP: (id: string) => void;
}

const BlockedIPsTab = ({ blockedIPs, onBlockIP, onUnblockIP }: BlockedIPsTabProps) => {
  const [blockIPModal, setBlockIPModal] = useState(false);
  const [newIP, setNewIP] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockDuration, setBlockDuration] = useState('60');
  const [isPermanent, setIsPermanent] = useState(false);

  const handleBlockIP = async () => {
    if (!newIP) return;
    await onBlockIP(newIP, blockReason, isPermanent, parseInt(blockDuration));
    setBlockIPModal(false);
    setNewIP('');
    setBlockReason('');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>IPs Bloqueados</CardTitle>
          <CardDescription>Endereços IP temporária ou permanentemente bloqueados</CardDescription>
        </div>
        <Dialog open={blockIPModal} onOpenChange={setBlockIPModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Bloquear IP
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bloquear Endereço IP</DialogTitle>
              <DialogDescription>O IP será impedido de acessar o sistema</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Endereço IP</Label>
                <Input placeholder="192.168.1.1" value={newIP} onChange={(e) => setNewIP(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Motivo</Label>
                <Input placeholder="Ex: Tentativas de força bruta" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Bloqueio Permanente</Label>
                <Switch checked={isPermanent} onCheckedChange={setIsPermanent} />
              </div>
              {!isPermanent && (
                <div className="space-y-2">
                  <Label>Duração (minutos)</Label>
                  <Select value={blockDuration} onValueChange={setBlockDuration}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="360">6 horas</SelectItem>
                      <SelectItem value="1440">24 horas</SelectItem>
                      <SelectItem value="10080">7 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBlockIPModal(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleBlockIP}>Bloquear</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IP</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blockedIPs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum IP bloqueado</TableCell>
                </TableRow>
              ) : (
                blockedIPs.map((ip) => (
                  <TableRow key={ip.id}>
                    <TableCell className="font-mono">{String(ip.ip_address)}</TableCell>
                    <TableCell>{ip.reason || '-'}</TableCell>
                    <TableCell>
                      {ip.is_permanent ? (
                        <Badge variant="destructive">Permanente</Badge>
                      ) : ip.expires_at ? (
                        <span className="text-sm">{formatDistanceToNow(new Date(ip.expires_at), { addSuffix: true, locale: ptBR })}</span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ip.is_permanent ? 'destructive' : 'secondary'}>
                        {ip.is_permanent ? 'Permanente' : 'Temporário'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => onUnblockIP(ip.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default BlockedIPsTab;
