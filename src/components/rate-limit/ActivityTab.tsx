import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActivityTabProps {
  topIPs: [string, { count: number; endpoints: Set<string>; lastSeen: string }][];
}

const ActivityTab = ({ topIPs }: ActivityTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top IPs por Atividade</CardTitle>
        <CardDescription>Endereços mais ativos nos últimos 7 dias</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>IP</TableHead>
              <TableHead>Requisições</TableHead>
              <TableHead>Endpoints</TableHead>
              <TableHead>Última Atividade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topIPs.map(([ip, stats]) => (
              <TableRow key={ip}>
                <TableCell className="font-mono">{ip}</TableCell>
                <TableCell>{stats.count}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {Array.from(stats.endpoints).slice(0, 3).map((ep) => (
                      <Badge key={ep} variant="outline" className="text-xs">{ep}</Badge>
                    ))}
                    {stats.endpoints.size > 3 && (
                      <Badge variant="secondary" className="text-xs">+{stats.endpoints.size - 3}</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(stats.lastSeen), { addSuffix: true, locale: ptBR })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ActivityTab;
