import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface RateLimitConfig {
  id: string;
  endpoint: string;
  max_requests: number | null;
  window_seconds: number | null;
  block_duration_minutes: number | null;
  is_active: boolean | null;
}

interface ConfigTabProps {
  config: RateLimitConfig[];
  onUpdateConfig: (id: string, updates: Record<string, unknown>) => void;
}

const ConfigTab = ({ config, onUpdateConfig }: ConfigTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Rate Limiting</CardTitle>
        <CardDescription>Defina limites por endpoint</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Endpoint</TableHead>
              <TableHead>Max Requisições</TableHead>
              <TableHead>Janela (seg)</TableHead>
              <TableHead>Bloqueio (min)</TableHead>
              <TableHead>Ativo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {config.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono">{c.endpoint}</TableCell>
                <TableCell>{c.max_requests}</TableCell>
                <TableCell>{c.window_seconds}</TableCell>
                <TableCell>{c.block_duration_minutes}</TableCell>
                <TableCell>
                  <Switch
                    checked={!!c.is_active}
                    onCheckedChange={(checked) => onUpdateConfig(c.id, { is_active: checked })}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ConfigTab;
