import { useState } from 'react';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Zap } from 'lucide-react';

export interface UserStat {
  user_id: string;
  email: string;
  full_name: string;
  total_xp: number;
  current_level: number;
  lessons_completed: number;
  courses_completed: number;
  created_at: string;
}

interface Props {
  users: UserStat[];
  loadingData: boolean;
}

const AdminUsersTab = ({ users, loadingData }: Props) => {
  const [searchUsers, setSearchUsers] = useState('');
  const filteredUsers = useFuzzySearch(users, ["full_name"], searchUsers);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar usuários..." value={searchUsers} onChange={(e) => setSearchUsers(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead className="text-center">Nível</TableHead>
              <TableHead className="text-center">XP Total</TableHead>
              <TableHead className="text-center">Aulas</TableHead>
              <TableHead className="text-center">Cursos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingData ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado</TableCell></TableRow>
            ) : (
              filteredUsers.map((userStat, index) => (
                <TableRow key={userStat.user_id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold">
                        {userStat.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{userStat.full_name}</p>
                        <p className="text-xs text-muted-foreground">#{index + 1} no ranking</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-gradient-to-r from-primary to-accent text-white">Nível {userStat.current_level}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Zap className="h-4 w-4 text-emerald-500" />
                      <span className="font-bold text-emerald-500">{userStat.total_xp.toLocaleString()}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{userStat.lessons_completed}</TableCell>
                  <TableCell className="text-center">{userStat.courses_completed}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminUsersTab;
