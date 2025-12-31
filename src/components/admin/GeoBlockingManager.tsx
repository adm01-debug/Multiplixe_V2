import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Globe, MapPin, Search, Shield, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GeoCountry {
  id: string;
  country_code: string;
  country_name: string;
  reason: string | null;
  blocked_by: string | null;
  created_at: string;
  is_active: boolean;
  list_type: string | null;
}

interface GeoConfig {
  id: string;
  mode: 'whitelist' | 'blacklist';
  is_enabled: boolean;
}

// Common countries list
const COUNTRIES = [
  { code: 'AF', name: 'Afeganistão' },
  { code: 'AL', name: 'Albânia' },
  { code: 'DZ', name: 'Argélia' },
  { code: 'AR', name: 'Argentina' },
  { code: 'AU', name: 'Austrália' },
  { code: 'AT', name: 'Áustria' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'BY', name: 'Bielorrússia' },
  { code: 'BE', name: 'Bélgica' },
  { code: 'BO', name: 'Bolívia' },
  { code: 'BR', name: 'Brasil' },
  { code: 'BG', name: 'Bulgária' },
  { code: 'CA', name: 'Canadá' },
  { code: 'CL', name: 'Chile' },
  { code: 'CN', name: 'China' },
  { code: 'CO', name: 'Colômbia' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'HR', name: 'Croácia' },
  { code: 'CU', name: 'Cuba' },
  { code: 'CZ', name: 'República Tcheca' },
  { code: 'DK', name: 'Dinamarca' },
  { code: 'EC', name: 'Equador' },
  { code: 'EG', name: 'Egito' },
  { code: 'FI', name: 'Finlândia' },
  { code: 'FR', name: 'França' },
  { code: 'DE', name: 'Alemanha' },
  { code: 'GR', name: 'Grécia' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'HU', name: 'Hungria' },
  { code: 'IN', name: 'Índia' },
  { code: 'ID', name: 'Indonésia' },
  { code: 'IR', name: 'Irã' },
  { code: 'IQ', name: 'Iraque' },
  { code: 'IE', name: 'Irlanda' },
  { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Itália' },
  { code: 'JP', name: 'Japão' },
  { code: 'KZ', name: 'Cazaquistão' },
  { code: 'KE', name: 'Quênia' },
  { code: 'KP', name: 'Coreia do Norte' },
  { code: 'KR', name: 'Coreia do Sul' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'MY', name: 'Malásia' },
  { code: 'MX', name: 'México' },
  { code: 'MA', name: 'Marrocos' },
  { code: 'NL', name: 'Países Baixos' },
  { code: 'NZ', name: 'Nova Zelândia' },
  { code: 'NG', name: 'Nigéria' },
  { code: 'NO', name: 'Noruega' },
  { code: 'PK', name: 'Paquistão' },
  { code: 'PA', name: 'Panamá' },
  { code: 'PY', name: 'Paraguai' },
  { code: 'PE', name: 'Peru' },
  { code: 'PH', name: 'Filipinas' },
  { code: 'PL', name: 'Polônia' },
  { code: 'PT', name: 'Portugal' },
  { code: 'QA', name: 'Catar' },
  { code: 'RO', name: 'Romênia' },
  { code: 'RU', name: 'Rússia' },
  { code: 'SA', name: 'Arábia Saudita' },
  { code: 'SG', name: 'Singapura' },
  { code: 'ZA', name: 'África do Sul' },
  { code: 'ES', name: 'Espanha' },
  { code: 'SE', name: 'Suécia' },
  { code: 'CH', name: 'Suíça' },
  { code: 'SY', name: 'Síria' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'TH', name: 'Tailândia' },
  { code: 'TR', name: 'Turquia' },
  { code: 'UA', name: 'Ucrânia' },
  { code: 'AE', name: 'Emirados Árabes Unidos' },
  { code: 'GB', name: 'Reino Unido' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'UY', name: 'Uruguai' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'VN', name: 'Vietnã' },
].sort((a, b) => a.name.localeCompare(b.name));

const GeoBlockingManager = () => {
  const [countries, setCountries] = useState<GeoCountry[]>([]);
  const [config, setConfig] = useState<GeoConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<GeoCountry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    country_code: '',
    reason: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [countriesRes, configRes] = await Promise.all([
        supabase
          .from('geo_countries')
          .select('*')
          .order('country_name', { ascending: true }),
        supabase
          .from('geo_blocking_config')
          .select('*')
          .maybeSingle(),
      ]);

      if (countriesRes.error) throw countriesRes.error;
      if (configRes.error) throw configRes.error;

      setCountries(countriesRes.data || []);
      if (configRes.data) {
        setConfig({
          id: configRes.data.id,
          mode: configRes.data.mode as 'whitelist' | 'blacklist',
          is_enabled: configRes.data.is_enabled,
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async () => {
    if (!config) return;
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('geo_blocking_config')
        .update({ 
          is_enabled: !config.is_enabled,
          updated_at: new Date().toISOString(),
          updated_by: userData.user?.id,
        })
        .eq('id', config.id);

      if (error) throw error;

      setConfig({ ...config, is_enabled: !config.is_enabled } as GeoConfig);
      toast.success(config.is_enabled ? 'Bloqueio geográfico desativado' : 'Bloqueio geográfico ativado');
    } catch (error) {
      console.error('Error toggling geo blocking:', error);
      toast.error('Erro ao atualizar configuração');
    }
  };

  const handleAddCountry = async () => {
    if (!formData.country_code) {
      toast.error('Selecione um país');
      return;
    }

    const country = COUNTRIES.find(c => c.code === formData.country_code);
    if (!country) {
      toast.error('País inválido');
      return;
    }

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('geo_countries')
        .insert({
          country_code: formData.country_code,
          country_name: country.name,
          reason: formData.reason.trim() || null,
          blocked_by: userData.user?.id || null,
          list_type: 'allowed',
        });

      if (error) throw error;

      toast.success(`${country.name} adicionado à lista de países permitidos`);
      setDialogOpen(false);
      setFormData({ country_code: '', reason: '' });
      await fetchData();
    } catch (error: any) {
      console.error('Error adding country:', error);
      if (error.code === '23505') {
        toast.error('Este país já está na lista');
      } else {
        toast.error('Erro ao adicionar país');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (country: GeoCountry) => {
    try {
      const { error } = await supabase
        .from('geo_countries')
        .update({ is_active: !country.is_active })
        .eq('id', country.id);

      if (error) throw error;

      toast.success(
        country.is_active 
          ? `${country.country_name} desativado` 
          : `${country.country_name} ativado`
      );
      await fetchData();
    } catch (error) {
      console.error('Error toggling country status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleDeleteCountry = async () => {
    if (!selectedCountry) return;

    try {
      const { error } = await supabase
        .from('geo_countries')
        .delete()
        .eq('id', selectedCountry.id);

      if (error) throw error;

      toast.success(`${selectedCountry.country_name} removido da lista`);
      setDeleteDialogOpen(false);
      setSelectedCountry(null);
      await fetchData();
    } catch (error) {
      console.error('Error deleting country:', error);
      toast.error('Erro ao remover país');
    }
  };

  const filteredCountries = countries.filter(country =>
    country.country_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.country_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableCountries = COUNTRIES.filter(
    c => !countries.some(gc => gc.country_code === c.code)
  );

  const activeCount = countries.filter(c => c.is_active).length;

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
                <Globe className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <CardTitle>Bloqueio Geográfico</CardTitle>
                <CardDescription>
                  Modo Whitelist: apenas países na lista podem acessar
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {config?.is_enabled ? 'Ativo' : 'Inativo'}
                </span>
                <Switch
                  checked={config?.is_enabled || false}
                  onCheckedChange={handleToggleEnabled}
                />
              </div>
              <Button onClick={() => setDialogOpen(true)} disabled={availableCountries.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar País
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Banner */}
          <div className={`p-4 rounded-lg border ${config?.is_enabled ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-muted/50 border-border'}`}>
            <div className="flex items-center gap-3">
              {config?.is_enabled ? (
                <Check className="h-5 w-5 text-emerald-500" />
              ) : (
                <X className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">
                  {config?.is_enabled 
                    ? 'Bloqueio Geográfico Ativo' 
                    : 'Bloqueio Geográfico Desativado'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {config?.is_enabled 
                    ? `Apenas usuários dos ${activeCount} países na lista podem acessar a plataforma.`
                    : 'Todos os países podem acessar a plataforma.'}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Shield className="h-4 w-4" />
                <span className="text-sm">Países na Lista</span>
              </div>
              <p className="text-2xl font-bold">{countries.length}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">Países Ativos</span>
              </div>
              <p className="text-2xl font-bold text-emerald-500">{activeCount}</p>
            </div>
          </div>

          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar país..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredCountries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum país na whitelist</p>
              <p className="text-sm">Adicione países para permitir acesso geográfico</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>País</TableHead>
                    <TableHead>Observação</TableHead>
                    <TableHead>Adicionado em</TableHead>
                    <TableHead className="text-center">Ativo</TableHead>
                    <TableHead className="text-center w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCountries.map((country) => (
                    <TableRow key={country.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getFlagEmoji(country.country_code)}</span>
                          <div>
                            <p className="font-medium">{country.country_name}</p>
                            <p className="text-xs text-muted-foreground">{country.country_code}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {country.reason || '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(country.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={country.is_active}
                          onCheckedChange={() => handleToggleActive(country)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            setSelectedCountry(country);
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

          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-sm text-amber-600 dark:text-amber-400">
              <strong>⚠️ Modo Whitelist:</strong> Quando ativado, apenas usuários dos países listados poderão acessar. 
              Certifique-se de incluir o Brasil antes de ativar.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Add Country Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar País Permitido</DialogTitle>
            <DialogDescription>
              Usuários deste país poderão acessar a plataforma quando o bloqueio estiver ativo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="country">País *</Label>
              <Select
                value={formData.country_code}
                onValueChange={(value) => setFormData({ ...formData, country_code: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um país" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {availableCountries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      <span className="flex items-center gap-2">
                        <span>{getFlagEmoji(country.code)}</span>
                        <span>{country.name}</span>
                        <span className="text-muted-foreground">({country.code})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Observação (opcional)</Label>
              <Textarea
                id="reason"
                placeholder="Ex: Sede da empresa, filial..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddCountry} disabled={saving}>
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
            <AlertDialogTitle>Remover País</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover{' '}
              <span className="font-medium">{selectedCountry?.country_name}</span> da whitelist?
              Usuários deste país não poderão mais acessar a plataforma quando o bloqueio estiver ativo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCountry}
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

// Helper function to get flag emoji from country code
function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export default GeoBlockingManager;
