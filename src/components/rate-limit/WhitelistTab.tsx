import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WhitelistedIP {
  id: string;
  ip_address: unknown;
  description?: string | null;
  created_at: string;
}

interface WhitelistTabProps {
  whitelistedIPs: WhitelistedIP[];
  onWhitelistIP: (ip: string, description: string) => Promise<boolean>;
  onRemoveFromWhitelist: (id: string) => void;
}

const WhitelistTab = ({ whitelistedIPs, onWhitelistIP, onRemoveFromWhitelist }: WhitelistTabProps) => {
  const [whitelistModal, setWhitelistModal] = useState(false);
  const [newIP, setNewIP] = useState('');
  const [whitelistDescription, setWhitelistDescription] = useState('');

  const handleWhitelistIP = async () => {
    if (!newIP) return;
    await onWhitelistIP(newIP, whitelistDescription);
    setWhitelistModal(false);
    setNewIP('');
    setWhitelistDescription('');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>IPs na Whitelist</CardTitle>
          <CardDescription>Endereços IP que ignoram rate limiting</CardDescription>
        </div>
        <Dialog open={whitelistModal} onOpenChange={setWhitelistModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar IP
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar à Whitelist</DialogTitle>
              <DialogDescription>Este IP não será afetado pelo rate limiting</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Endereço IP</Label>
                <Input placeholder="192.168.1.1" value={newIP} onChange={(e) => setNewIP(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input placeholder="Ex: Servidor de monitoramento" value={whitelistDescription} onChange={(e) => setWhitelistDescription(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setWhitelistModal(false)}>Cancelar</Button>
              <Button onClick={handleWhitelistIP}>Adicionar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>IP</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Adicionado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {whitelistedIPs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum IP na whitelist</TableCell>
              </TableRow>
            ) : (
              whitelistedIPs.map((ip) => (
                <TableRow key={ip.id}>
                  <TableCell className="font-mono">{String(ip.ip_address)}</TableCell>
                  <TableCell>{ip.description || '-'}</TableCell>
                  <TableCell>{format(new Date(ip.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => onRemoveFromWhitelist(ip.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default WhitelistTab;
