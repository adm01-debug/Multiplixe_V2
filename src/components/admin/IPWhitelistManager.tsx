import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Shield, ShieldCheck, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WhitelistedIP {
  id: string;
  ip_address: string;
  description: string | null;
  added_by: string | null;
  created_at: string;
}

interface DBWhitelistedIP {
  id: string;
  ip_address: unknown;
  description: string | null;
  added_by: string | null;
  created_at: string;
}

const IPWhitelistManager = () => {
  const [whitelistedIPs, setWhitelistedIPs] = useState<WhitelistedIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedIP, setSelectedIP] = useState<WhitelistedIP | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    ip_address: '',
    description: '',
  });

  useEffect(() => {
    fetchWhitelistedIPs();
  }, []);

  const fetchWhitelistedIPs = async () => {
    try {
      const { data, error } = await supabase
        .from('whitelisted_ips')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const mappedData: WhitelistedIP[] = (data || []).map((item: DBWhitelistedIP) => ({
        ...item,
        ip_address: String(item.ip_address),
      }));
      setWhitelistedIPs(mappedData);
    } catch (error) {
      console.error('Error fetching whitelisted IPs:', error);
      toast.error('Erro ao carregar IPs da whitelist');
    } finally {
      setLoading(false);
    }
  };

  const validateIP = (ip: string): boolean => {
    // IPv4 validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    // IPv6 validation (simplified)
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}(\/\d{1,3})?$/;
    
    if (ipv4Regex.test(ip)) {
      const parts = ip.split('/')[0].split('.');
      return parts.every(part => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255;
      });
    }
    
    return ipv6Regex.test(ip);
  };

  const handleAddIP = async () => {
    if (!formData.ip_address.trim()) {
      toast.error('Informe o endereço IP');
      return;
    }

    if (!validateIP(formData.ip_address.trim())) {
      toast.error('Endereço IP inválido');
      return;
    }

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('whitelisted_ips')
        .insert({
          ip_address: formData.ip_address.trim(),
          description: formData.description.trim() || null,
          added_by: userData.user?.id || null,
        });

      if (error) throw error;

      toast.success('IP adicionado à whitelist');
      setDialogOpen(false);
      setFormData({ ip_address: '', description: '' });
      await fetchWhitelistedIPs();
    } catch (error: any) {
      console.error('Error adding IP:', error);
      if (error.code === '23505') {
        toast.error('Este IP já está na whitelist');
      } else {
        toast.error('Erro ao adicionar IP');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteIP = async () => {
    if (!selectedIP) return;

    try {
      const { error } = await supabase
        .from('whitelisted_ips')
        .delete()
        .eq('id', selectedIP.id);

      if (error) throw error;

      toast.success('IP removido da whitelist');
      setDeleteDialogOpen(false);
      setSelectedIP(null);
      await fetchWhitelistedIPs();
    } catch (error) {
      console.error('Error deleting IP:', error);
      toast.error('Erro ao remover IP');
    }
  };

  const filteredIPs = whitelistedIPs.filter(ip =>
    ip.ip_address.includes(searchQuery) ||
    ip.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <CardTitle>Whitelist de IPs</CardTitle>
                <CardDescription>
                  IPs na whitelist não são afetados por rate limiting
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar IP
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por IP ou descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredIPs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum IP na whitelist</p>
              <p className="text-sm">Adicione IPs confiáveis para ignorar rate limiting</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Endereço IP</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Adicionado em</TableHead>
                    <TableHead className="text-center w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIPs.map((ip) => (
                    <TableRow key={ip.id}>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono">
                          {ip.ip_address}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {ip.description || '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(ip.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            setSelectedIP(ip);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>{whitelistedIPs.length} IP(s) na whitelist</span>
          </div>
        </CardContent>
      </Card>

      {/* Add IP Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar IP à Whitelist</DialogTitle>
            <DialogDescription>
              IPs na whitelist não serão afetados por rate limiting ou bloqueios automáticos.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ip_address">Endereço IP *</Label>
              <Input
                id="ip_address"
                placeholder="Ex: 192.168.1.1 ou 10.0.0.0/24"
                value={formData.ip_address}
                onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Suporta IPv4, IPv6 e notação CIDR
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Ex: Escritório principal, VPN corporativa..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddIP} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover IP da Whitelist</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o IP{' '}
              <span className="font-mono font-medium">{selectedIP?.ip_address}</span> da whitelist?
              Este IP voltará a ser afetado por rate limiting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteIP}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default IPWhitelistManager;
