import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, Users, Save, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
}

interface RolePermission {
  role: string;
  permission_id: string;
}

const ROLES = [
  { value: 'admin', label: 'Administrador', description: 'Acesso total à plataforma' },
  { value: 'gestor', label: 'Gestor', description: 'Gerencia equipe e relatórios' },
  { value: 'user', label: 'Usuário', description: 'Acesso básico aos cursos' },
] as const;

const RESOURCE_LABELS: Record<string, string> = {
  courses: 'Cursos',
  learning_paths: 'Trilhas de Aprendizado',
  users: 'Usuários',
  reports: 'Relatórios',
  quizzes: 'Quizzes',
  categories: 'Categorias',
  security: 'Segurança',
  settings: 'Configurações',
};

const ACTION_LABELS: Record<string, string> = {
  view: 'Visualizar',
  create: 'Criar',
  edit: 'Editar',
  delete: 'Excluir',
  publish: 'Publicar',
  manage: 'Gerenciar',
  export: 'Exportar',
  roles: 'Papéis',
};

const PermissionsManager = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Map<string, Set<string>>>(new Map());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [permissionsRes, rolePermissionsRes] = await Promise.all([
        supabase.from('permissions').select('*').order('resource', { ascending: true }),
        supabase.from('role_permissions').select('role, permission_id'),
      ]);

      if (permissionsRes.error) throw permissionsRes.error;
      if (rolePermissionsRes.error) throw rolePermissionsRes.error;

      setPermissions(permissionsRes.data || []);
      setRolePermissions(rolePermissionsRes.data || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('Erro ao carregar permissões');
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (role: string, permissionId: string): boolean => {
    const pending = pendingChanges.get(role);
    if (pending?.has(permissionId)) {
      return !rolePermissions.some(rp => rp.role === role && rp.permission_id === permissionId);
    }
    return rolePermissions.some(rp => rp.role === role && rp.permission_id === permissionId);
  };

  const togglePermission = (role: string, permissionId: string) => {
    setPendingChanges(prev => {
      const newMap = new Map(prev);
      const roleSet = new Set(newMap.get(role) || []);
      
      if (roleSet.has(permissionId)) {
        roleSet.delete(permissionId);
      } else {
        roleSet.add(permissionId);
      }
      
      if (roleSet.size === 0) {
        newMap.delete(role);
      } else {
        newMap.set(role, roleSet);
      }
      
      return newMap;
    });
  };

  const saveChanges = async () => {
    if (pendingChanges.size === 0) return;
    
    setSaving(true);
    try {
      for (const [role, permissionIds] of pendingChanges) {
        for (const permissionId of permissionIds) {
          const exists = rolePermissions.some(
            rp => rp.role === role && rp.permission_id === permissionId
          );
          
          if (exists) {
            const { error } = await supabase
              .from('role_permissions')
              .delete()
              .eq('role', role as 'admin' | 'gestor' | 'user')
              .eq('permission_id', permissionId);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from('role_permissions')
              .insert({ role: role as 'admin' | 'gestor' | 'user', permission_id: permissionId });
            if (error) throw error;
          }
        }
      }
      
      toast.success('Permissões atualizadas com sucesso!');
      setPendingChanges(new Map());
      await fetchData();
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast.error('Erro ao salvar permissões');
    } finally {
      setSaving(false);
    }
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = [];
    }
    acc[perm.resource].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasPendingChanges = pendingChanges.size > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Gerenciamento de Permissões</h2>
        </div>
        {hasPendingChanges && (
          <Button onClick={saveChanges} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar Alterações
          </Button>
        )}
      </div>

      <Tabs defaultValue="admin" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {ROLES.map(role => (
            <TabsTrigger key={role.value} value={role.value} className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {role.label}
              {pendingChanges.has(role.value) && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {pendingChanges.get(role.value)?.size}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {ROLES.map(role => (
          <TabsContent key={role.value} value={role.value} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {role.label}
                  <Badge variant={role.value === 'admin' ? 'default' : 'secondary'}>
                    {role.value}
                  </Badge>
                </CardTitle>
                <CardDescription>{role.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(groupedPermissions).map(([resource, perms]) => (
                  <div key={resource} className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      {RESOURCE_LABELS[resource] || resource}
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {perms.map(perm => {
                        const isChecked = hasPermission(role.value, perm.id);
                        const isPending = pendingChanges.get(role.value)?.has(perm.id);
                        
                        return (
                          <label
                            key={perm.id}
                            className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                              isPending ? 'border-primary bg-primary/5' : ''
                            }`}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => togglePermission(role.value, perm.id)}
                              disabled={role.value === 'admin' && perm.name === 'users.roles'}
                            />
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {ACTION_LABELS[perm.action] || perm.action}
                                </span>
                                {isPending && (
                                  <Badge variant="outline" className="h-4 px-1 text-[10px]">
                                    alterado
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {perm.description || perm.name}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Permissions Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo de Permissões</CardTitle>
          <CardDescription>Comparativo entre papéis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">Recurso</th>
                  {ROLES.map(role => (
                    <th key={role.value} className="text-center py-2 px-3 font-medium">
                      {role.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedPermissions).map(([resource, perms]) => (
                  <tr key={resource} className="border-b">
                    <td className="py-2 px-3 font-medium">
                      {RESOURCE_LABELS[resource] || resource}
                    </td>
                    {ROLES.map(role => {
                      const count = perms.filter(p => hasPermission(role.value, p.id)).length;
                      return (
                        <td key={role.value} className="text-center py-2 px-3">
                          <Badge
                            variant={count === perms.length ? 'default' : count > 0 ? 'secondary' : 'outline'}
                            className="min-w-[3rem]"
                          >
                            {count}/{perms.length}
                          </Badge>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionsManager;
