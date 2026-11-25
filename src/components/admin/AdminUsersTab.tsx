import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Search, Loader2, Zap } from 'lucide-react';
import UserActionsMenu from './admin-users/UserActionsMenu';
import type { UserStat } from './admin-users/types';

export type { UserStat };

interface Props {
  users: UserStat[];
  loadingData: boolean;
  onRefresh: () => void | Promise<void>;
}

type RoleFilter = 'all' | 'admin' | 'gestor' | 'user' | 'none';
type StatusFilter = 'all' | 'active' | 'inactive';

const roleLabel = (role: string) => (role === 'admin' ? 'Admin' : role === 'gestor' ? 'Gestor' : 'Aluno');

const AdminUsersTab = ({ users, loadingData, onRefresh }: Props) => {
  const { user: currentUser } = useAuth();
  const [searchUsers, setSearchUsers] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const searched = useFuzzySearch(users, ['full_name', 'email'], searchUsers);

  const filteredUsers = useMemo(() => {
    return searched.filter((stat) => {
      if (statusFilter === 'active' && !stat.is_active) return false;
      if (statusFilter === 'inactive' && stat.is_active) return false;
      if (roleFilter === 'none') return stat.roles.length === 0;
      if (roleFilter !== 'all') return stat.roles.includes(roleFilter);
      return true;
    });
  }, [searched, roleFilter, statusFilter]);

  const adminCount = useMemo(() => users.filter((stat) => stat.roles.includes('admin')).length, [users]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={searchUsers}
            onChange={(e) => setSearchUsers(e.target.value)}
            className="pl-10"
            aria-label="Buscar usuários por nome ou e-mail"
          />
        </div>
        <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as RoleFilter)}>
          <SelectTrigger className="w-full sm:w-40" aria-label="Filtrar por papel">
            <SelectValue placeholder="Papel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os papéis</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="gestor">Gestor</SelectItem>
            <SelectItem value="user">Aluno</SelectItem>
            <SelectItem value="none">Sem papel</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-36" aria-label="Filtrar por status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Desativados</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground sm:ml-auto">
          {filteredUsers.length} de {users.length} usuário(s)
        </p>
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead className="text-center">Papel</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Nível</TableHead>
              <TableHead className="text-center">XP Total</TableHead>
              <TableHead className="text-center">Aulas</TableHead>
              <TableHead className="text-center">Cursos</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingData ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado</TableCell></TableRow>
            ) : (
              filteredUsers.map((userStat) => (
                <TableRow key={userStat.user_id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold">
                        {userStat.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{userStat.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{userStat.email || 'sem e-mail'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {userStat.roles.length === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-wrap justify-center gap-1">
                        {userStat.roles.map((role) => (
                          <Badge key={role} variant={role === 'admin' ? 'default' : 'secondary'}>
                            {roleLabel(role)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={userStat.is_active ? 'outline' : 'destructive'}>
                      {userStat.is_active ? 'Ativo' : 'Desativado'}
                    </Badge>
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
                  <TableCell className="text-right">
                    <UserActionsMenu
                      user={userStat}
                      currentUserId={currentUser?.id}
                      isLastAdmin={adminCount === 1}
                      onChanged={onRefresh}
                    />
                  </TableCell>
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